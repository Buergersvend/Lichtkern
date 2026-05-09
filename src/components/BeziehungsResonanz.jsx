import React, { useState, useEffect, useCallback } from "react";
import { T } from "../config/theme.js";
import { Flower } from "../components/Decorations";
import { Card, Btn, TI, SL } from "../components/UI.jsx";
import { BodygraphSVG, HD_CHANNELS, HD_CENTER_CFG, HD_GATE_CENTER } from "../components/HumanDesign.jsx";
import { calcNumerology, LIFE_PATH_DESC } from "../components/Numerology.jsx";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const getGates = (person) => {
  const p = (person?.hdPGates || "").split(",").map(s => s.trim()).filter(Boolean).map(Number).filter(n => n >= 1 && n <= 64);
  const d = (person?.hdDGates || "").split(",").map(s => s.trim()).filter(Boolean).map(Number).filter(n => n >= 1 && n <= 64);
  return { p, d, all: [...p, ...d] };
};

const calcDefinedCenters = (allGates) => {
  const s = new Set(allGates.map(Number));
  const def = new Set();
  HD_CHANNELS.forEach(([a, b]) => {
    if (s.has(a) && s.has(b)) { def.add(HD_GATE_CENTER[a]); def.add(HD_GATE_CENTER[b]); }
  });
  return def;
};

const calcElectromagnetic = (personA, personB) => {
  const gA = getGates(personA);
  const gB = getGates(personB);
  const setA = new Set(gA.all);
  const setB = new Set(gB.all);
  const shared = [...setA].filter(g => setB.has(g));
  const electromagnetic = HD_CHANNELS.filter(([a, b]) =>
    (setA.has(a) && setB.has(b)) || (setA.has(b) && setB.has(a))
  ).map(([a, b]) => ({
    gate1: setA.has(a) ? a : b,
    gate2: setA.has(a) ? b : a,
    center1: HD_GATE_CENTER[setA.has(a) ? a : b],
    center2: HD_GATE_CENTER[setA.has(a) ? b : a],
  }));
  return { shared, electromagnetic };
};

/* ─── Empty State ─────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: "44px", marginBottom: "12px", opacity: 0.35 }}>💞</div>
      <div style={{ fontFamily: "Cinzel", fontSize: "15px", color: T.textMid, fontWeight: 700, marginBottom: "6px" }}>
        Beziehungs-Resonanz
      </div>
      <div style={{ fontFamily: "Raleway", fontSize: "12px", color: T.textSoft, lineHeight: "1.6", maxWidth: "280px", margin: "0 auto" }}>
        Vergleiche Human Design & Numerologie mit einer Referenzperson — Partner, Kind, Klient, Kollege.
      </div>
    </div>
  );
}

/* ─── Referenzperson Formular ─────────────────────────────────────────── */

const EMPTY_REF = {
  name: "", birthDate: "", birthName: "", birthTime: "", birthPlace: "",
  hdType: "", hdProfile: "", hdAuthority: "", hdPGates: "", hdDGates: "",
};

function RefPersonForm({ initial, onSave, onCancel, clients, clientId }) {
  const [mode, setMode] = useState("manual"); // "manual" | "klient"
  const [form, setForm] = useState(initial || { ...EMPTY_REF });
  const [selectedClientId, setSelectedClientId] = useState("");
  const [hdLoading, setHdLoading] = useState(false);

  // Klienten ohne den aktuellen
  const availableClients = (clients || []).filter(c => c.id !== clientId);

  const handleClientSelect = async (cId) => {
    setSelectedClientId(cId);
    const c = availableClients.find(cl => cl.id === cId);
    if (c) {
      const base = {
        name: c.name || "",
        birthDate: c.birthDate || "",
        birthName: c.birthName || "",
        birthTime: c.birthTime || "",
        birthPlace: c.birthPlace || "",
        hdType: c.hdType || "",
        hdProfile: c.hdProfile || "",
        hdAuthority: c.hdAuthority || "",
        hdPGates: c.hdPGates || "",
        hdDGates: c.hdDGates || "",
        sourceClientId: c.id,
      };

      // HD-Daten aus Firebase laden (gleiche Logik wie HDTab)
      try {
        setHdLoading(true);
        const snap = await getDoc(doc(db, "clients", c.id, "humanDesign", "latest"));
        if (snap.exists()) {
          const d = snap.data();
          base.hdType = d.typ || base.hdType;
          base.hdProfile = d.profil || base.hdProfile;
          base.hdAuthority = d.autoritaet || base.hdAuthority;
          base.hdPGates = (d.tore_bewusst || []).join(",") || base.hdPGates;
          base.hdDGates = (d.tore_unbewusst || []).join(",") || base.hdDGates;
        }
      } catch (e) { console.log("HD Firebase read for ref:", e); }
      setHdLoading(false);

      setForm(base);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      id: initial?.id || uid(),
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  const inputStyle = {
    width: "100%", padding: "9px 10px", borderRadius: "10px",
    border: `1.5px solid ${T.border}`, fontFamily: "Raleway", fontSize: "12px",
    color: T.text, background: T.bgCard, outline: "none", boxSizing: "border-box",
  };

  const labelStyle = {
    fontFamily: "Raleway", fontSize: "10px", color: T.textMid,
    marginBottom: "4px", fontWeight: 600,
  };

  return (
    <Card style={{ background: T.bgSoft, border: `1.5px solid ${T.borderMid}`, marginBottom: "16px" }}>
      <SL color={T.goldD}>✦ Referenzperson {initial ? "bearbeiten" : "hinzufügen"}</SL>

      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {[["manual", "✍ Manuell"], ["klient", "👤 Klient wählen"]].map(([v, l]) => (
          <button key={v} onClick={() => setMode(v)} style={{
            flex: 1, padding: "8px", borderRadius: "10px",
            border: `1.5px solid ${mode === v ? T.gold : T.border}`,
            background: mode === v ? T.gold : T.bgCard,
            fontFamily: "Raleway", fontSize: "11px", fontWeight: 700,
            color: mode === v ? "#1A1200" : T.textMid, cursor: "pointer",
          }}>{l}</button>
        ))}
      </div>

      {/* Klient-Auswahl */}
      {mode === "klient" && (
        <div style={{ marginBottom: "14px" }}>
          <div style={labelStyle}>Klient auswählen</div>
          <select
            value={selectedClientId}
            onChange={e => handleClientSelect(e.target.value)}
            style={{ ...inputStyle }}
          >
            <option value="">— Klient wählen</option>
            {availableClients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.hdType ? ` (${c.hdType})` : ""}{c.birthDate ? ` · ${c.birthDate}` : ""}
              </option>
            ))}
          </select>
          {hdLoading && (
            <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.goldD, marginTop: "6px" }}>
              ⏳ HD-Daten werden geladen…
            </div>
          )}
          {availableClients.length === 0 && (
            <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textSoft, marginTop: "6px", fontStyle: "italic" }}>
              Keine anderen Klienten vorhanden.
            </div>
          )}
        </div>
      )}

      {/* Name (immer sichtbar) */}
      <div style={{ marginBottom: "10px" }}>
        <div style={labelStyle}>Name *</div>
        <input
          type="text" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Name der Referenzperson"
          style={inputStyle}
        />
      </div>

      {/* Geburtsdaten */}
      <div style={{
        marginTop: "6px", paddingTop: "12px",
        borderTop: `1px dashed ${T.border}`,
      }}>
        <div style={{
          fontFamily: "Raleway", fontSize: "10px", color: T.goldD,
          letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px",
        }}>🔢 Numerologie</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div>
            <div style={labelStyle}>Geburtsdatum</div>
            <input type="date" value={form.birthDate}
              onChange={e => setForm({ ...form, birthDate: e.target.value })}
              style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>Geburtsname</div>
            <input type="text" value={form.birthName}
              onChange={e => setForm({ ...form, birthName: e.target.value })}
              placeholder="Vor- + Nachname"
              style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Human Design */}
      <div style={{
        marginTop: "12px", paddingTop: "12px",
        borderTop: `1px dashed ${T.border}`,
      }}>
        <div style={{
          fontFamily: "Raleway", fontSize: "10px", color: T.goldD,
          letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px",
        }}>⚙ Human Design</div>

        {/* HD-Daten Vorschau wenn vorhanden */}
        {form.hdType && (
          <div style={{
            background: T.bgCard, borderRadius: "10px", padding: "10px 12px",
            border: `1px solid ${T.borderMid}`, marginBottom: "10px",
          }}>
            <div style={{ fontFamily: "Raleway", fontWeight: 800, fontSize: "13px", color: T.gold }}>
              ✅ {form.hdType}
            </div>
            <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid, marginTop: "2px" }}>
              {form.hdProfile ? `Profil ${form.hdProfile}` : ""}{form.hdAuthority ? ` · ${form.hdAuthority}` : ""}
            </div>
            {(form.hdPGates || form.hdDGates) && (
              <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft, marginTop: "4px" }}>
                P: {form.hdPGates || "—"} · D: {form.hdDGates || "—"}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div>
            <div style={labelStyle}>Typ</div>
            <select value={form.hdType} onChange={e => setForm({ ...form, hdType: e.target.value })} style={inputStyle}>
              <option value="">—</option>
              <option value="Manifestor">Manifestor</option>
              <option value="Generator">Generator</option>
              <option value="Manifesting Generator">Man. Generator</option>
              <option value="Projektor">Projektor</option>
              <option value="Reflektor">Reflektor</option>
            </select>
          </div>
          <div>
            <div style={labelStyle}>Profil</div>
            <select value={form.hdProfile} onChange={e => setForm({ ...form, hdProfile: e.target.value })} style={inputStyle}>
              <option value="">—</option>
              {["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3"].map(p =>
                <option key={p} value={p}>{p}</option>
              )}
            </select>
          </div>
          <div>
            <div style={labelStyle}>Autorität</div>
            <select value={form.hdAuthority} onChange={e => setForm({ ...form, hdAuthority: e.target.value })} style={inputStyle}>
              <option value="">—</option>
              <option value="Emotional">Emotional</option>
              <option value="Sakral">Sakral</option>
              <option value="Milz">Milz</option>
              <option value="Ego">Ego</option>
              <option value="Selbst">Selbst</option>
              <option value="Mental">Mental</option>
              <option value="Lunar">Lunar</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
          <div>
            <div style={labelStyle}>Persönlichkeits-Tore (P)</div>
            <input type="text" value={form.hdPGates}
              onChange={e => setForm({ ...form, hdPGates: e.target.value })}
              placeholder="z.B. 1,13,25,46"
              style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>Design-Tore (D)</div>
            <input type="text" value={form.hdDGates}
              onChange={e => setForm({ ...form, hdDGates: e.target.value })}
              placeholder="z.B. 2,14,29,42"
              style={inputStyle} />
          </div>
        </div>

        {/* HD Kalkulator Button — gleicher Stil wie HDTab */}
        {mode === "manual" && (
          <a
            href={`https://hd-kalkulator.vercel.app?clientId=${clientId}_ref_${initial?.id || 'new'}&name=${encodeURIComponent(form.name || 'Referenzperson')}&returnUrl=${encodeURIComponent(window.location.href)}`}
            target="_blank" rel="noreferrer"
            style={{
              display: "block", background: "rgba(201,168,76,0.1)", borderRadius: "12px",
              padding: "12px", marginTop: "10px", border: "1.5px solid rgba(201,168,76,0.3)",
              textDecoration: "none", textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "Raleway", fontWeight: 800, fontSize: "13px", color: T.goldD }}>🔮 HD berechnen →</div>
            <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textMid, marginTop: "3px" }}>Öffnet den HD Kalkulator</div>
          </a>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <Btn onClick={handleSave} style={{ flex: 1 }}>💞 Speichern</Btn>
        <Btn variant="soft" onClick={onCancel} style={{ flex: 1 }}>Abbrechen</Btn>
      </div>
    </Card>
  );
}

/* ─── Gespeicherte Referenzperson Karte ───────────────────────────────── */

function RefPersonCard({ ref_person, client, onSelect, onDelete }) {
  const refNum = ref_person.birthDate ? calcNumerology(ref_person.birthDate, ref_person.birthName) : null;
  const syn = calcElectromagnetic(client, ref_person);

  return (
    <div
      onClick={() => onSelect(ref_person)}
      style={{
        background: T.bgCard, borderRadius: "14px", padding: "14px 16px",
        border: `1.5px solid ${T.border}`, cursor: "pointer",
        marginBottom: "10px", position: "relative", overflow: "hidden",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      <div style={{ position: "absolute", top: "-20px", right: "-20px", opacity: 0.04, fontSize: "100px", pointerEvents: "none" }}>💞</div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: "14px", color: T.text }}>
            {ref_person.name}
          </div>
          <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid, marginTop: "3px" }}>
            {client.name} ⇄ {ref_person.name}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
            {ref_person.hdType && (
              <span style={{
                fontSize: "10px", padding: "3px 10px", borderRadius: "10px",
                background: "rgba(201,168,76,0.12)", color: T.goldD,
                fontFamily: "Raleway", fontWeight: 700, border: `1px solid ${T.borderMid}`,
              }}>⚙ {ref_person.hdType}</span>
            )}
            {refNum && (
              <span style={{
                fontSize: "10px", padding: "3px 10px", borderRadius: "10px",
                background: "rgba(201,168,76,0.12)", color: T.goldD,
                fontFamily: "Raleway", fontWeight: 700, border: `1px solid ${T.borderMid}`,
              }}>🔢 {refNum.lifePath}</span>
            )}
            {syn.electromagnetic.length > 0 && (
              <span style={{
                fontSize: "10px", padding: "3px 10px", borderRadius: "10px",
                background: "rgba(201,168,76,0.18)", color: T.gold,
                fontFamily: "Raleway", fontWeight: 700, border: `1px solid ${T.borderMid}`,
              }}>⚡ {syn.electromagnetic.length} Kanal{syn.electromagnetic.length !== 1 ? "e" : ""}</span>
            )}
            {syn.shared.length > 0 && (
              <span style={{
                fontSize: "10px", padding: "3px 10px", borderRadius: "10px",
                background: "rgba(201,168,76,0.08)", color: T.textMid,
                fontFamily: "Raleway", fontWeight: 700, border: `1px solid ${T.border}`,
              }}>🔗 {syn.shared.length} gemeinsam</span>
            )}
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); if (window.confirm(`${ref_person.name} wirklich entfernen?`)) onDelete(ref_person.id); }}
          style={{
            width: "28px", height: "28px", borderRadius: "50%",
            border: `1px solid rgba(220,38,38,0.3)`, background: "transparent",
            cursor: "pointer", fontSize: "12px", display: "flex",
            alignItems: "center", justifyContent: "center", color: "#DC2626",
            flexShrink: 0, marginLeft: "10px",
          }}
        >✕</button>
      </div>

      <div style={{
        fontFamily: "Raleway", fontSize: "10px", color: T.textSoft, marginTop: "8px",
      }}>
        Erstellt: {new Date(ref_person.createdAt).toLocaleDateString("de-DE")}
        {ref_person.sourceClientId && " · aus Klienten-Daten"}
      </div>
    </div>
  );
}

/* ─── Vergleichs-Übersicht (nach Auswahl einer Referenzperson) ────────── */

function ComparisonView({ client, refPerson, onBack, clients, onSave }) {
  const [refData, setRefData] = useState(refPerson);

  // Wenn Referenzperson aus Klient kommt: HD-Daten aus Firebase aktualisieren
  useEffect(() => {
    if (!refPerson.sourceClientId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "clients", refPerson.sourceClientId, "humanDesign", "latest"));
        if (!snap.exists()) return;
        const d = snap.data();
        const updated = {
          ...refPerson,
          hdType: d.typ || refPerson.hdType,
          hdProfile: d.profil || refPerson.hdProfile,
          hdAuthority: d.autoritaet || refPerson.hdAuthority,
          hdPGates: (d.tore_bewusst || []).join(",") || refPerson.hdPGates,
          hdDGates: (d.tore_unbewusst || []).join(",") || refPerson.hdDGates,
        };
        setRefData(updated);
        // Auch im Client-Objekt aktualisieren wenn sich Daten geändert haben
        if (updated.hdType !== refPerson.hdType || updated.hdPGates !== refPerson.hdPGates || updated.hdDGates !== refPerson.hdDGates) {
          const updatedClient = {
            ...client,
            beziehungen: (client.beziehungen || []).map(b => b.id === refPerson.id ? updated : b),
          };
          onSave(updatedClient);
        }
      } catch (e) { console.log("HD sync for ref:", e); }
    })();
  }, [refPerson.sourceClientId]);

  const clientNum = client.birthDate ? calcNumerology(client.birthDate, client.birthName) : null;
  const refNum = refData.birthDate ? calcNumerology(refData.birthDate, refData.birthName) : null;
  const syn = calcElectromagnetic(client, refData);
  const gClient = getGates(client);
  const gRef = getGates(refData);

  // Numerologie Vergleichs-Zeilen
  const numRows = [];
  if (clientNum && refNum) {
    const keys = [
      ["lifePath", "Lebenszahl"],
      ["expression", "Ausdruckszahl"],
      ["soulUrge", "Herzenszahl"],
      ["personality", "Persönlichkeitszahl"],
      ["birthday", "Geburtstagszahl"],
      ["maturity", "Reifezahl"],
    ];
    keys.forEach(([k, label]) => {
      if (clientNum[k] != null && refNum[k] != null) {
        numRows.push({ label, a: clientNum[k], b: refNum[k], match: clientNum[k] === refNum[k] });
      }
    });
  }

  return (
    <div>
      {/* Back + Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <button onClick={onBack} style={{
          background: T.bgSoft, border: `1.5px solid ${T.border}`, borderRadius: "10px",
          padding: "6px 12px", fontFamily: "Raleway", fontWeight: 700, fontSize: "11px",
          color: T.textMid, cursor: "pointer",
        }}>←</button>
        <div>
          <div style={{ fontFamily: "Cinzel", fontSize: "14px", color: T.text, fontWeight: 700 }}>
            {client.name} ⇄ {refData.name}
          </div>
          <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft }}>
            Beziehungs-Resonanz Vergleich
          </div>
        </div>
      </div>

      {/* HD Typ-Dynamik */}
      {(client.hdType || refData.hdType) && (
        <Card style={{ marginBottom: "12px" }}>
          <SL>⚙ Typ-Dynamik</SL>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[client, refData].map((p, i) => (
              <div key={i} style={{
                background: T.bgSoft, borderRadius: "12px", padding: "12px",
                border: `1px solid ${T.border}`,
              }}>
                <div style={{ fontFamily: "Raleway", fontWeight: 800, fontSize: "12px", color: i === 0 ? T.goldD : T.text, marginBottom: "4px" }}>
                  {p.name}
                </div>
                <div style={{ fontFamily: "Raleway", fontSize: "12px", color: T.gold, fontWeight: 600 }}>
                  {p.hdType || "Typ unbekannt"}
                </div>
                {p.hdProfile && <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid }}>Profil {p.hdProfile}</div>}
                {p.hdAuthority && <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid }}>Auth: {p.hdAuthority}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bodygraphs nebeneinander */}
      {(gClient.all.length > 0 || gRef.all.length > 0) && (
        <Card style={{ marginBottom: "12px" }}>
          <SL>Bodygraphs</SL>
          <div style={{ display: "flex", gap: "8px", justifyContent: "space-around" }}>
            {[[client, gClient], [refData, gRef]].map(([p, g], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "Raleway", fontSize: "11px", fontWeight: 700,
                  color: i === 0 ? T.goldD : T.text, marginBottom: "6px",
                }}>{p.name}</div>
                <BodygraphSVG pgates={g.p} dgates={g.d} size={110} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Elektromagnetische Verbindungen */}
      {(gClient.all.length > 0 && gRef.all.length > 0) && (
        <Card style={{ marginBottom: "12px", background: T.bgSoft, border: `1.5px solid ${T.borderMid}` }}>
          <SL color={T.goldD}>⚡ Elektromagnetische Verbindungen</SL>
          {syn.electromagnetic.length === 0 ? (
            <div style={{ fontFamily: "Raleway", fontSize: "12px", color: T.textSoft, fontStyle: "italic", padding: "6px 0" }}>
              Keine direkten elektromagnetischen Verbindungen gefunden.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {syn.electromagnetic.map((e, i) => (
                <div key={i} style={{
                  background: T.bgCard, borderRadius: "10px", padding: "9px 12px",
                  border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "10px",
                }}>
                  <span style={{ fontFamily: "Cinzel", fontSize: "12px", color: T.goldD, fontWeight: 700 }}>
                    Tor {e.gate1}–{e.gate2}
                  </span>
                  <span style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid }}>
                    {HD_CENTER_CFG[e.center1]?.label || e.center1} ↔ {HD_CENTER_CFG[e.center2]?.label || e.center2}
                  </span>
                </div>
              ))}
            </div>
          )}
          {syn.shared.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textMid, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                🔗 Gemeinsame Tore ({syn.shared.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {syn.shared.map(g => (
                  <span key={g} style={{
                    fontSize: "11px", padding: "3px 10px", borderRadius: "10px",
                    background: "rgba(201,168,76,0.12)", color: T.goldD,
                    fontFamily: "Raleway", fontWeight: 700, border: `1px solid ${T.borderMid}`,
                  }}>Tor {g}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Numerologie-Vergleich */}
      {numRows.length > 0 && (
        <Card style={{ marginBottom: "12px" }}>
          <SL>🔢 Numerologie-Vergleich</SL>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "0", alignItems: "center" }}>
            {/* Header */}
            <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft, fontWeight: 700, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}></div>
            <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.goldD, fontWeight: 700, padding: "6px 8px", borderBottom: `1px solid ${T.border}`, textAlign: "center", minWidth: "50px" }}>
              {client.name.split(" ")[0]}
            </div>
            <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.text, fontWeight: 700, padding: "6px 8px", borderBottom: `1px solid ${T.border}`, textAlign: "center", minWidth: "50px" }}>
              {refData.name.split(" ")[0]}
            </div>
            <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft, fontWeight: 700, padding: "6px 4px", borderBottom: `1px solid ${T.border}`, textAlign: "center" }}></div>

            {/* Rows */}
            {numRows.map((row, i) => (
              <React.Fragment key={row.label}>
                <div style={{
                  fontFamily: "Raleway", fontSize: "11px", color: T.textMid, fontWeight: 600,
                  padding: "8px 0", borderBottom: i < numRows.length - 1 ? `1px solid ${T.border}` : "none",
                }}>{row.label}</div>
                <div style={{
                  fontFamily: "Cinzel", fontSize: "14px", color: T.goldD, fontWeight: 700,
                  textAlign: "center", padding: "8px",
                  borderBottom: i < numRows.length - 1 ? `1px solid ${T.border}` : "none",
                }}>{row.a}</div>
                <div style={{
                  fontFamily: "Cinzel", fontSize: "14px", color: T.text, fontWeight: 700,
                  textAlign: "center", padding: "8px",
                  borderBottom: i < numRows.length - 1 ? `1px solid ${T.border}` : "none",
                }}>{row.b}</div>
                <div style={{
                  textAlign: "center", padding: "8px 4px",
                  borderBottom: i < numRows.length - 1 ? `1px solid ${T.border}` : "none",
                }}>
                  {row.match && <span style={{
                    fontSize: "10px", padding: "2px 8px", borderRadius: "8px",
                    background: "rgba(201,168,76,0.2)", color: T.gold,
                    fontFamily: "Raleway", fontWeight: 700,
                  }}>✦</span>}
                </div>
              </React.Fragment>
            ))}
          </div>
          {/* Meisterzahlen & Karmische */}
          {clientNum && refNum && (clientNum.masterNumbers?.length > 0 || refNum.masterNumbers?.length > 0 ||
            clientNum.karmicDebts?.length > 0 || refNum.karmicDebts?.length > 0) && (
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px dashed ${T.border}` }}>
              {[
                ["Meisterzahlen", "masterNumbers"],
                ["Karmische Schuldzahlen", "karmicDebts"],
              ].map(([label, key]) => {
                const cVals = clientNum[key] || [];
                const rVals = refNum[key] || [];
                if (cVals.length === 0 && rVals.length === 0) return null;
                return (
                  <div key={key} style={{ marginBottom: "8px" }}>
                    <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
                      {label}
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.goldD }}>
                        {client.name.split(" ")[0]}: {cVals.length > 0 ? cVals.join(", ") : "—"}
                      </div>
                      <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.text }}>
                        {refData.name.split(" ")[0]}: {rVals.length > 0 ? rVals.join(", ") : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Platzhalter für Block 2: KI-Synthese */}
      <Card style={{
        marginBottom: "12px", background: T.bgSoft,
        border: `1.5px dashed ${T.borderMid}`, textAlign: "center", padding: "24px 16px",
      }}>
        <div style={{ fontSize: "28px", marginBottom: "8px", opacity: 0.4 }}>✦</div>
        <div style={{ fontFamily: "Cinzel", fontSize: "13px", color: T.textMid, fontWeight: 700, marginBottom: "4px" }}>
          KI-Beziehungsanalyse
        </div>
        <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textSoft, lineHeight: "1.5" }}>
          Kommt in Block 2 — KI-generierte Resonanzanalyse mit Groq
        </div>
      </Card>
    </div>
  );
}

/* ─── Haupt-Tab Komponente ────────────────────────────────────────────── */

function BeziehungsTab({ client, clients, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [editRef, setEditRef] = useState(null);
  const [selectedRef, setSelectedRef] = useState(null);

  const beziehungen = client.beziehungen || [];

  const handleSaveRef = (refPerson) => {
    let updated;
    if (beziehungen.find(b => b.id === refPerson.id)) {
      updated = { ...client, beziehungen: beziehungen.map(b => b.id === refPerson.id ? refPerson : b) };
    } else {
      updated = { ...client, beziehungen: [...beziehungen, refPerson] };
    }
    onSave(updated);
    setShowForm(false);
    setEditRef(null);
  };

  const handleDeleteRef = (refId) => {
    const updated = { ...client, beziehungen: beziehungen.filter(b => b.id !== refId) };
    onSave(updated);
    if (selectedRef?.id === refId) setSelectedRef(null);
  };

  // Detailansicht einer Referenzperson
  if (selectedRef) {
    const currentRef = beziehungen.find(b => b.id === selectedRef.id) || selectedRef;
    return (
      <ComparisonView
        client={client}
        refPerson={currentRef}
        onBack={() => setSelectedRef(null)}
        clients={clients}
        onSave={onSave}
      />
    );
  }

  // Bearbeitungsmodus
  if (showForm || editRef) {
    return (
      <RefPersonForm
        initial={editRef}
        clients={clients}
        clientId={client.id}
        onSave={handleSaveRef}
        onCancel={() => { setShowForm(false); setEditRef(null); }}
      />
    );
  }

  // Hauptansicht: Liste + Hinzufügen
  return (
    <div>
      {/* Intro */}
      <div style={{
        background: T.bgSoft, borderRadius: "14px", padding: "14px 16px",
        marginBottom: "16px", border: `1.5px solid ${T.border}`,
        position: "relative", overflow: "hidden",
      }}>
        <Flower size={120} opacity={0.08} color={T.gold} />
        <div style={{
          position: "relative", zIndex: 1,
          fontFamily: "Raleway", fontSize: "12px", color: T.textMid, lineHeight: "1.6",
        }}>
          Vergleiche {client.name}s Human Design & Numerologie mit Partnern, Familie oder anderen Klienten.
          Entdecke Resonanzfelder, elektromagnetische Verbindungen und numerologische Spiegelungen.
        </div>
      </div>

      {/* Add Button */}
      <Btn onClick={() => setShowForm(true)} style={{ width: "100%", marginBottom: "16px", padding: "11px" }}>
        + Referenzperson hinzufügen
      </Btn>

      {/* Liste */}
      {beziehungen.length === 0 ? (
        <EmptyState />
      ) : (
        beziehungen.map(ref_p => (
          <RefPersonCard
            key={ref_p.id}
            ref_person={ref_p}
            client={client}
            onSelect={setSelectedRef}
            onDelete={handleDeleteRef}
          />
        ))
      )}
    </div>
  );
}

export { BeziehungsTab, calcElectromagnetic, getGates };
