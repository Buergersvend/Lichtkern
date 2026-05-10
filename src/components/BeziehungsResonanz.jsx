import React, { useState, useEffect, useCallback } from "react";
import { T } from "../config/theme.js";
import { Flower } from "../components/Decorations";
import { Card, Btn, TI, SL } from "../components/UI.jsx";
import { BodygraphSVG, HD_CHANNELS, HD_CENTER_CFG, HD_GATE_CENTER } from "../components/HumanDesign.jsx";
import { calcNumerology, LIFE_PATH_DESC } from "../components/Numerology.jsx";
import { groqFetch } from "../config/groq.js";
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

/* ─── SVG Watermarks (inline, matching ResonanzKarte V3) ──────────────── */

const FlowerOfLifeSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <g stroke="#B8A060" stroke-width="0.8" fill="none" opacity="0.25">
    <circle cx="200" cy="200" r="60"/>
    <circle cx="260" cy="200" r="60"/><circle cx="140" cy="200" r="60"/>
    <circle cx="230" cy="148" r="60"/><circle cx="170" cy="148" r="60"/>
    <circle cx="230" cy="252" r="60"/><circle cx="170" cy="252" r="60"/>
    <circle cx="200" cy="96" r="60"/><circle cx="290" cy="148" r="60"/>
    <circle cx="290" cy="252" r="60"/><circle cx="200" cy="304" r="60"/>
    <circle cx="110" cy="252" r="60"/><circle cx="110" cy="148" r="60"/>
    <circle cx="260" cy="96" r="60"/><circle cx="140" cy="96" r="60"/>
    <circle cx="320" cy="200" r="60"/><circle cx="80" cy="200" r="60"/>
    <circle cx="260" cy="304" r="60"/><circle cx="140" cy="304" r="60"/>
  </g>
</svg>`;

const LotusSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <g fill="none" stroke="#B8A060" stroke-width="0.7" opacity="0.2">
    <g transform="translate(200,200)">
      ${[0,60,120,180,240,300].map(r=>`<ellipse cx="0" cy="-40" rx="25" ry="50" transform="rotate(${r})"/>`).join('')}
      ${[0,60,120,180,240,300].map(r=>`<ellipse cx="0" cy="-55" rx="20" ry="65" transform="rotate(${r+30})"/>`).join('')}
      ${[0,60,120,180,240,300].map(r=>`<ellipse cx="0" cy="-70" rx="15" ry="80" transform="rotate(${r+15})"/>`).join('')}
    </g>
  </g>
</svg>`;

/* ─── Print Function ──────────────────────────────────────────────────── */

function openPrintView(client, refPerson, sections, syn, clientNum, refNum) {
  const gClient = getGates(client);
  const gRef = getGates(refPerson);
  const defClient = calcDefinedCenters(gClient.all);
  const defRef = calcDefinedCenters(gRef.all);

  const sectionIcons = { "RESONANZFELD": "💫", "WACHSTUMSIMPULSE": "🌱", "SPANNUNGSFELDER": "⚡", "SEELENVERTRAG": "🔮", "PRAXISIMPULS": "✦" };

  // Corner ornament SVG
  const cornerSVG = `<svg viewBox="0 0 80 80" width="60" height="60" xmlns="http://www.w3.org/2000/svg">
    <path d="M5,75 Q5,5 75,5" fill="none" stroke="#B8A060" stroke-width="1.8" opacity="0.35"/>
    <path d="M15,75 Q15,15 75,15" fill="none" stroke="#B8A060" stroke-width="1" opacity="0.2"/>
    <circle cx="8" cy="72" r="2.5" fill="#B8A060" opacity="0.3"/>
    <circle cx="72" cy="8" r="2.5" fill="#B8A060" opacity="0.3"/>
  </svg>`;

  const dividerSVG = `<svg viewBox="0 0 200 12" width="200" height="12" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="6" x2="85" y2="6" stroke="#B8A060" stroke-width="0.8" opacity="0.35"/>
    <polygon points="100,2 104,6 100,10 96,6" fill="#B8A060" opacity="0.35"/>
    <line x1="115" y1="6" x2="200" y2="6" stroke="#B8A060" stroke-width="0.8" opacity="0.35"/>
  </svg>`;

  // Build sections HTML — larger fonts, more spacing, no mid-section page breaks
  const sectionsHTML = sections.map((sec, i) => {
    const firstChar = sec.content.charAt(0);
    const rest = sec.content.slice(1);
    return `
      <div style="margin-bottom:28px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:18px;">${sectionIcons[sec.title] || '✦'}</span>
          <span style="font-family:'Cinzel',serif;font-size:13px;color:#B8A060;letter-spacing:2.5px;font-weight:700;">${sec.title}</span>
          <div style="flex:1;height:1px;background:linear-gradient(90deg,rgba(184,160,96,0.35),transparent);margin-left:6px;"></div>
        </div>
        <div style="font-family:'Raleway',sans-serif;font-size:13.5px;color:#2A2215;line-height:1.85;text-align:justify;">
          <span style="font-family:'Cinzel',serif;font-size:42px;color:#B8A060;float:left;line-height:0.85;margin-right:8px;margin-top:4px;">${firstChar}</span>${rest}
        </div>
      </div>`;
  }).join('');

  // Numerology comparison — bigger fonts
  let numHTML = '';
  if (clientNum && refNum) {
    const rows = [["Lebenszahl","lifePath"],["Ausdruckszahl","expression"],["Herzenszahl","soulUrge"],["Persönlichkeitszahl","personality"],["Reifezahl","maturity"]];
    const rowsHTML = rows.filter(([,k]) => clientNum[k] != null && refNum[k] != null).map(([label, k]) => {
      const match = clientNum[k] === refNum[k];
      return `<tr>
        <td style="font-family:'Raleway',sans-serif;font-size:13px;color:#5A4D3A;padding:8px 12px;border-bottom:1px solid rgba(184,160,96,0.15);">${label}</td>
        <td style="font-family:'Cinzel',serif;font-size:18px;color:#B8A060;font-weight:700;text-align:center;padding:8px 12px;border-bottom:1px solid rgba(184,160,96,0.15);">${clientNum[k]}</td>
        <td style="font-family:'Cinzel',serif;font-size:18px;color:#2A2215;font-weight:700;text-align:center;padding:8px 12px;border-bottom:1px solid rgba(184,160,96,0.15);">${refNum[k]}</td>
        <td style="text-align:center;padding:8px;border-bottom:1px solid rgba(184,160,96,0.15);">${match ? '<span style="font-size:14px;color:#B8A060;">✦</span>' : ''}</td>
      </tr>`;
    }).join('');

    numHTML = `
      <div style="margin-top:28px;">
        <div style="font-family:'Cinzel',serif;font-size:13px;color:#B8A060;letter-spacing:2.5px;margin-bottom:12px;">🔢 NUMEROLOGIE-VERGLEICH</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <th style="font-family:'Raleway',sans-serif;font-size:11px;color:#8A7D6B;font-weight:700;text-align:left;padding:8px 12px;border-bottom:1.5px solid rgba(184,160,96,0.3);"></th>
            <th style="font-family:'Raleway',sans-serif;font-size:11px;color:#B8A060;font-weight:700;text-align:center;padding:8px 12px;border-bottom:1.5px solid rgba(184,160,96,0.3);">${client.name.split(' ')[0]}</th>
            <th style="font-family:'Raleway',sans-serif;font-size:11px;color:#2A2215;font-weight:700;text-align:center;padding:8px 12px;border-bottom:1.5px solid rgba(184,160,96,0.3);">${refPerson.name.split(' ')[0]}</th>
            <th style="padding:8px;border-bottom:1.5px solid rgba(184,160,96,0.3);"></th>
          </tr>
          ${rowsHTML}
        </table>
      </div>`;
  }

  // Electromagnetic connections — bigger fonts
  let emHTML = '';
  if (syn.electromagnetic.length > 0) {
    emHTML = `
      <div style="margin-top:28px;">
        <div style="font-family:'Cinzel',serif;font-size:13px;color:#B8A060;letter-spacing:2.5px;margin-bottom:12px;">⚡ ELEKTROMAGNETISCHE VERBINDUNGEN</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${syn.electromagnetic.map(e => `
          <div style="padding:6px 14px;border-radius:10px;border:1px solid rgba(184,160,96,0.3);font-family:'Cinzel',serif;font-size:12px;color:#B8A060;background:rgba(184,160,96,0.04);">
            Tor ${e.gate1}–${e.gate2} · ${HD_CENTER_CFG[e.center1]?.label || ''} ↔ ${HD_CENTER_CFG[e.center2]?.label || ''}
          </div>
        `).join('')}
        </div>
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Beziehungs-Resonanzkarte · ${client.name} ⇄ ${refPerson.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  @page { size: A4 portrait; margin: 18mm 0 15mm 0; }
  @page:first { margin: 0; }
  @media print {
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
  }
  body { margin:0; padding:0; background:#FFF; font-family:'Raleway',sans-serif; }
  .page {
    width:210mm; min-height:297mm; margin:0 auto; padding:22mm 22mm 20mm;
    position:relative; box-sizing:border-box; page-break-after:always;
    background:#FFFDF7;
  }
  .page:last-child { page-break-after: auto; }
  .page-flow {
    width:210mm; margin:0 auto; padding:22mm 22mm 24mm;
    position:relative; box-sizing:border-box;
    background:#FFFDF7;
  }
  .outer-border {
    position:absolute; inset:10mm;
    border:1.2px solid rgba(184,160,96,0.3);
    pointer-events:none;
  }
  .inner-border {
    position:absolute; inset:12mm;
    border:0.5px solid rgba(184,160,96,0.15);
    pointer-events:none;
  }
  .watermark {
    position:absolute; pointer-events:none;
  }
  .corner { position:absolute; pointer-events:none; }
  .corner-tl { top:7mm; left:7mm; }
  .corner-tr { top:7mm; right:7mm; transform:scaleX(-1); }
  .corner-bl { bottom:7mm; left:7mm; transform:scaleY(-1); }
  .corner-br { bottom:7mm; right:7mm; transform:scale(-1,-1); }
</style>
</head><body>

<!-- Print Button -->
<div class="no-print" style="position:fixed;top:20px;right:20px;z-index:100;display:flex;gap:10px;">
  <button onclick="window.print()" style="padding:14px 28px;border-radius:12px;background:#B8A060;color:#1A1200;border:none;font-family:'Raleway',sans-serif;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1);">🖨 Drucken / PDF</button>
  <button onclick="window.close()" style="padding:14px 20px;border-radius:12px;background:#f5f0e8;color:#5A4D3A;border:1px solid #d4c9a8;font-family:'Raleway',sans-serif;font-weight:600;font-size:14px;cursor:pointer;">✕ Schließen</button>
</div>

<!-- PAGE 1: Header + Datenblatt -->
<div class="page">
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="corner corner-tl">${cornerSVG}</div>
  <div class="corner corner-tr">${cornerSVG}</div>
  <div class="corner corner-bl">${cornerSVG}</div>
  <div class="corner corner-br">${cornerSVG}</div>
  <div class="watermark" style="bottom:15%;left:50%;transform:translateX(-50%);">${FlowerOfLifeSVG}</div>

  <!-- Title -->
  <div style="text-align:center;margin-bottom:10px;position:relative;z-index:1;">
    <div style="font-family:'Cinzel',serif;font-size:12px;color:#B8A060;letter-spacing:5px;margin-bottom:6px;">HUMAN RESONANZ</div>
    <div style="font-family:'Cinzel',serif;font-size:32px;color:#2A2215;font-weight:700;letter-spacing:1.5px;">Beziehungs-Resonanzkarte</div>
    <div style="text-align:center;margin:12px 0;">${dividerSVG}</div>
  </div>

  <!-- Names -->
  <div style="text-align:center;margin-bottom:28px;position:relative;z-index:1;">
    <div style="font-family:'Cinzel',serif;font-size:24px;color:#B8A060;font-weight:700;">${client.name}</div>
    <div style="font-family:'Raleway',sans-serif;font-size:16px;color:#8A7D6B;margin:6px 0;">⇄</div>
    <div style="font-family:'Cinzel',serif;font-size:24px;color:#2A2215;font-weight:700;">${refPerson.name}</div>
  </div>

  <!-- Typ-Dynamik -->
  <div style="display:flex;gap:20px;margin-bottom:24px;position:relative;z-index:1;">
    ${[client, refPerson].map((p, i) => `
      <div style="flex:1;background:rgba(184,160,96,0.05);border-radius:12px;padding:18px 20px;border:1px solid rgba(184,160,96,0.2);">
        <div style="font-family:'Cinzel',serif;font-size:13px;color:${i === 0 ? '#B8A060' : '#2A2215'};font-weight:700;margin-bottom:6px;">${p.name}</div>
        <div style="font-family:'Raleway',sans-serif;font-size:18px;color:#2A2215;font-weight:800;">${p.hdType || '—'}</div>
        ${p.hdProfile ? `<div style="font-family:'Raleway',sans-serif;font-size:13px;color:#5A4D3A;margin-top:4px;">Profil ${p.hdProfile} · ${p.hdAuthority || ''}</div>` : ''}
        ${i === 0 && defClient.size > 0 ? `<div style="font-family:'Raleway',sans-serif;font-size:11px;color:#8A7D6B;margin-top:6px;">Zentren: ${[...defClient].map(c => HD_CENTER_CFG[c]?.label).join(', ')}</div>` : ''}
        ${i === 1 && defRef.size > 0 ? `<div style="font-family:'Raleway',sans-serif;font-size:11px;color:#8A7D6B;margin-top:6px;">Zentren: ${[...defRef].map(c => HD_CENTER_CFG[c]?.label).join(', ')}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <!-- Electromagnetic + Numerologie -->
  <div style="position:relative;z-index:1;">
    ${emHTML}
    ${numHTML}
  </div>

  <!-- Footer Page 1 -->
  <div style="position:absolute;bottom:13mm;left:0;right:0;text-align:center;">
    <div style="font-family:'Raleway',sans-serif;font-size:8px;color:rgba(138,125,107,0.4);letter-spacing:1.5px;">HUMAN RESONANZ · BEZIEHUNGS-RESONANZKARTE · SEITE 1</div>
  </div>
</div>

<!-- PAGE 2: Analyse-Sektionen 1-3 -->
<div class="page">
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="corner corner-tl">${cornerSVG}</div>
  <div class="corner corner-tr">${cornerSVG}</div>
  <div class="corner corner-bl">${cornerSVG}</div>
  <div class="corner corner-br">${cornerSVG}</div>
  <div class="watermark" style="top:50%;left:50%;transform:translate(-50%,-50%);">${LotusSVG}</div>

  <div style="text-align:center;margin-bottom:24px;position:relative;z-index:1;">
    <div style="font-family:'Cinzel',serif;font-size:15px;color:#B8A060;letter-spacing:3.5px;font-weight:700;">✦ BEZIEHUNGS-RESONANZANALYSE</div>
    <div style="font-family:'Raleway',sans-serif;font-size:12px;color:#8A7D6B;margin-top:6px;">${client.name} ⇄ ${refPerson.name}</div>
    <div style="text-align:center;margin:14px 0;">${dividerSVG}</div>
  </div>

  <div style="position:relative;z-index:1;">
    ${sections.slice(0, 3).map((sec) => {
      const firstChar = sec.content.charAt(0);
      const rest = sec.content.slice(1);
      return `
        <div style="margin-bottom:28px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="font-size:18px;">${sec.icon}</span>
            <span style="font-family:'Cinzel',serif;font-size:13px;color:#B8A060;letter-spacing:2.5px;font-weight:700;">${sec.title}</span>
            <div style="flex:1;height:1px;background:linear-gradient(90deg,rgba(184,160,96,0.35),transparent);margin-left:6px;"></div>
          </div>
          <div style="font-family:'Raleway',sans-serif;font-size:13.5px;color:#2A2215;line-height:1.85;text-align:justify;">
            <span style="font-family:'Cinzel',serif;font-size:42px;color:#B8A060;float:left;line-height:0.85;margin-right:8px;margin-top:4px;">${firstChar}</span>${rest}
          </div>
        </div>`;
    }).join('')}
  </div>

  <div style="position:absolute;bottom:13mm;left:0;right:0;text-align:center;">
    <div style="font-family:'Raleway',sans-serif;font-size:8px;color:rgba(138,125,107,0.4);letter-spacing:1.5px;">HUMAN RESONANZ · BEZIEHUNGS-RESONANZKARTE · SEITE 2</div>
  </div>
</div>

<!-- PAGE 3: Analyse-Sektionen 4-5 + Footer -->
<div class="page">
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="corner corner-tl">${cornerSVG}</div>
  <div class="corner corner-tr">${cornerSVG}</div>
  <div class="corner corner-bl">${cornerSVG}</div>
  <div class="corner corner-br">${cornerSVG}</div>
  <div class="watermark" style="top:50%;left:50%;transform:translate(-50%,-50%);">${FlowerOfLifeSVG}</div>

  <div style="position:relative;z-index:1;">
    ${sections.slice(3).map((sec) => {
      const firstChar = sec.content.charAt(0);
      const rest = sec.content.slice(1);
      return `
        <div style="margin-bottom:28px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="font-size:18px;">${sec.icon}</span>
            <span style="font-family:'Cinzel',serif;font-size:13px;color:#B8A060;letter-spacing:2.5px;font-weight:700;">${sec.title}</span>
            <div style="flex:1;height:1px;background:linear-gradient(90deg,rgba(184,160,96,0.35),transparent);margin-left:6px;"></div>
          </div>
          <div style="font-family:'Raleway',sans-serif;font-size:13.5px;color:#2A2215;line-height:1.85;text-align:justify;">
            <span style="font-family:'Cinzel',serif;font-size:42px;color:#B8A060;float:left;line-height:0.85;margin-right:8px;margin-top:4px;">${firstChar}</span>${rest}
          </div>
        </div>`;
    }).join('')}
  </div>

  <!-- Datum + Signatur -->
  <div style="position:relative;z-index:1;margin-top:40px;">
    <div style="text-align:center;margin-bottom:16px;">${dividerSVG}</div>
    <div style="text-align:center;">
      <div style="font-family:'Raleway',sans-serif;font-size:11px;color:#8A7D6B;letter-spacing:1px;">
        Erstellt am ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
      <div style="font-family:'Cinzel',serif;font-size:12px;color:#B8A060;letter-spacing:3px;margin-top:6px;">HUMAN RESONANZ</div>
    </div>
  </div>

  <div style="position:absolute;bottom:13mm;left:0;right:0;text-align:center;">
    <div style="font-family:'Raleway',sans-serif;font-size:8px;color:rgba(138,125,107,0.4);letter-spacing:1.5px;">HUMAN RESONANZ · BEZIEHUNGS-RESONANZKARTE · SEITE 3</div>
  </div>
</div>

</body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

/* ─── Empty State ─────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: "44px", marginBottom: "12px", opacity: 0.35 }}>💞</div>
      <div style={{ fontFamily: "Cinzel", fontSize: "15px", color: T.textMid, fontWeight: 700, marginBottom: "6px" }}>Beziehungs-Resonanz</div>
      <div style={{ fontFamily: "Raleway", fontSize: "12px", color: T.textSoft, lineHeight: "1.6", maxWidth: "280px", margin: "0 auto" }}>
        Vergleiche Human Design & Numerologie mit einer Referenzperson — Partner, Kind, Klient, Kollege.
      </div>
    </div>
  );
}

/* ─── Referenzperson Formular ─────────────────────────────────────────── */

const EMPTY_REF = { name: "", birthDate: "", birthName: "", birthTime: "", birthPlace: "", hdType: "", hdProfile: "", hdAuthority: "", hdPGates: "", hdDGates: "" };

function RefPersonForm({ initial, onSave, onCancel, clients, clientId }) {
  const [mode, setMode] = useState("manual");
  const [form, setForm] = useState(initial || { ...EMPTY_REF });
  const [selectedClientId, setSelectedClientId] = useState("");
  const [hdLoading, setHdLoading] = useState(false);
  const availableClients = (clients || []).filter(c => c.id !== clientId);

  const handleClientSelect = async (cId) => {
    setSelectedClientId(cId);
    const c = availableClients.find(cl => cl.id === cId);
    if (c) {
      const base = { name: c.name || "", birthDate: c.birthDate || "", birthName: c.birthName || "", birthTime: c.birthTime || "", birthPlace: c.birthPlace || "", hdType: c.hdType || "", hdProfile: c.hdProfile || "", hdAuthority: c.hdAuthority || "", hdPGates: c.hdPGates || "", hdDGates: c.hdDGates || "", sourceClientId: c.id };
      try {
        setHdLoading(true);
        const snap = await getDoc(doc(db, "clients", c.id, "humanDesign", "latest"));
        if (snap.exists()) { const d = snap.data(); base.hdType = d.typ || base.hdType; base.hdProfile = d.profil || base.hdProfile; base.hdAuthority = d.autoritaet || base.hdAuthority; base.hdPGates = (d.tore_bewusst || []).join(",") || base.hdPGates; base.hdDGates = (d.tore_unbewusst || []).join(",") || base.hdDGates; }
      } catch (e) { console.log("HD Firebase read for ref:", e); }
      setHdLoading(false);
      setForm(base);
    }
  };

  const handleSave = () => { if (!form.name.trim()) return; onSave({ ...form, id: initial?.id || uid(), createdAt: initial?.createdAt || new Date().toISOString() }); };

  const inputStyle = { width: "100%", padding: "9px 10px", borderRadius: "10px", border: `1.5px solid ${T.border}`, fontFamily: "Raleway", fontSize: "12px", color: T.text, background: T.bgCard, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: "Raleway", fontSize: "10px", color: T.textMid, marginBottom: "4px", fontWeight: 600 };

  return (
    <Card style={{ background: T.bgSoft, border: `1.5px solid ${T.borderMid}`, marginBottom: "16px" }}>
      <SL color={T.goldD}>✦ Referenzperson {initial ? "bearbeiten" : "hinzufügen"}</SL>
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {[["manual", "✍ Manuell"], ["klient", "👤 Klient wählen"]].map(([v, l]) => (
          <button key={v} onClick={() => setMode(v)} style={{ flex: 1, padding: "8px", borderRadius: "10px", border: `1.5px solid ${mode === v ? T.gold : T.border}`, background: mode === v ? T.gold : T.bgCard, fontFamily: "Raleway", fontSize: "11px", fontWeight: 700, color: mode === v ? "#1A1200" : T.textMid, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {mode === "klient" && (
        <div style={{ marginBottom: "14px" }}>
          <div style={labelStyle}>Klient auswählen</div>
          <select value={selectedClientId} onChange={e => handleClientSelect(e.target.value)} style={inputStyle}>
            <option value="">— Klient wählen</option>
            {availableClients.map(c => <option key={c.id} value={c.id}>{c.name}{c.hdType ? ` (${c.hdType})` : ""}{c.birthDate ? ` · ${c.birthDate}` : ""}</option>)}
          </select>
          {hdLoading && <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.goldD, marginTop: "6px" }}>⏳ HD-Daten werden geladen…</div>}
          {availableClients.length === 0 && <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textSoft, marginTop: "6px", fontStyle: "italic" }}>Keine anderen Klienten vorhanden.</div>}
        </div>
      )}
      <div style={{ marginBottom: "10px" }}><div style={labelStyle}>Name *</div><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name der Referenzperson" style={inputStyle} /></div>
      <div style={{ marginTop: "6px", paddingTop: "12px", borderTop: `1px dashed ${T.border}` }}>
        <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.goldD, letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>🔢 Numerologie</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div><div style={labelStyle}>Geburtsdatum</div><input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} style={inputStyle} /></div>
          <div><div style={labelStyle}>Geburtsname</div><input type="text" value={form.birthName} onChange={e => setForm({ ...form, birthName: e.target.value })} placeholder="Vor- + Nachname" style={inputStyle} /></div>
        </div>
      </div>
      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px dashed ${T.border}` }}>
        <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.goldD, letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>⚙ Human Design</div>
        {form.hdType && (
          <div style={{ background: T.bgCard, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${T.borderMid}`, marginBottom: "10px" }}>
            <div style={{ fontFamily: "Raleway", fontWeight: 800, fontSize: "13px", color: T.gold }}>✅ {form.hdType}</div>
            <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid, marginTop: "2px" }}>{form.hdProfile ? `Profil ${form.hdProfile}` : ""}{form.hdAuthority ? ` · ${form.hdAuthority}` : ""}</div>
            {(form.hdPGates || form.hdDGates) && <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft, marginTop: "4px" }}>P: {form.hdPGates || "—"} · D: {form.hdDGates || "—"}</div>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div><div style={labelStyle}>Typ</div><select value={form.hdType} onChange={e => setForm({ ...form, hdType: e.target.value })} style={inputStyle}><option value="">—</option>{["Manifestor", "Generator", "Manifesting Generator", "Projektor", "Reflektor"].map(t => <option key={t} value={t}>{t === "Manifesting Generator" ? "Man. Generator" : t}</option>)}</select></div>
          <div><div style={labelStyle}>Profil</div><select value={form.hdProfile} onChange={e => setForm({ ...form, hdProfile: e.target.value })} style={inputStyle}><option value="">—</option>{["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3"].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><div style={labelStyle}>Autorität</div><select value={form.hdAuthority} onChange={e => setForm({ ...form, hdAuthority: e.target.value })} style={inputStyle}><option value="">—</option>{["Emotional", "Sakral", "Milz", "Ego", "Selbst", "Mental", "Lunar"].map(a => <option key={a} value={a}>{a}</option>)}</select></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
          <div><div style={labelStyle}>Persönlichkeits-Tore (P)</div><input type="text" value={form.hdPGates} onChange={e => setForm({ ...form, hdPGates: e.target.value })} placeholder="z.B. 1,13,25,46" style={inputStyle} /></div>
          <div><div style={labelStyle}>Design-Tore (D)</div><input type="text" value={form.hdDGates} onChange={e => setForm({ ...form, hdDGates: e.target.value })} placeholder="z.B. 2,14,29,42" style={inputStyle} /></div>
        </div>
        {mode === "manual" && (
          <a href={`https://hd-kalkulator.vercel.app?clientId=${clientId}_ref_${initial?.id || 'new'}&name=${encodeURIComponent(form.name || 'Referenzperson')}&returnUrl=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer"
            style={{ display: "block", background: "rgba(201,168,76,0.1)", borderRadius: "12px", padding: "12px", marginTop: "10px", border: "1.5px solid rgba(201,168,76,0.3)", textDecoration: "none", textAlign: "center" }}>
            <div style={{ fontFamily: "Raleway", fontWeight: 800, fontSize: "13px", color: T.goldD }}>🔮 HD berechnen →</div>
            <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textMid, marginTop: "3px" }}>Öffnet den HD Kalkulator</div>
          </a>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <Btn onClick={handleSave} style={{ flex: 1 }}>💞 Speichern</Btn>
        <Btn variant="soft" onClick={onCancel} style={{ flex: 1 }}>Abbrechen</Btn>
      </div>
    </Card>
  );
}

/* ─── RefPersonCard ───────────────────────────────────────────────────── */

function RefPersonCard({ ref_person, client, onSelect, onDelete }) {
  const refNum = ref_person.birthDate ? calcNumerology(ref_person.birthDate, ref_person.birthName) : null;
  const syn = calcElectromagnetic(client, ref_person);
  return (
    <div onClick={() => onSelect(ref_person)} style={{ background: T.bgCard, borderRadius: "14px", padding: "14px 16px", border: `1.5px solid ${T.border}`, cursor: "pointer", marginBottom: "10px", position: "relative", overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.gold} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
      <div style={{ position: "absolute", top: "-20px", right: "-20px", opacity: 0.04, fontSize: "100px", pointerEvents: "none" }}>💞</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: "14px", color: T.text }}>{ref_person.name}</div>
          <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid, marginTop: "3px" }}>{client.name} ⇄ {ref_person.name}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
            {ref_person.hdType && <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "10px", background: "rgba(201,168,76,0.12)", color: T.goldD, fontFamily: "Raleway", fontWeight: 700, border: `1px solid ${T.borderMid}` }}>⚙ {ref_person.hdType}</span>}
            {refNum && <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "10px", background: "rgba(201,168,76,0.12)", color: T.goldD, fontFamily: "Raleway", fontWeight: 700, border: `1px solid ${T.borderMid}` }}>🔢 {refNum.lifePath}</span>}
            {syn.electromagnetic.length > 0 && <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "10px", background: "rgba(201,168,76,0.18)", color: T.gold, fontFamily: "Raleway", fontWeight: 700, border: `1px solid ${T.borderMid}` }}>⚡ {syn.electromagnetic.length} Kanal{syn.electromagnetic.length !== 1 ? "e" : ""}</span>}
            {ref_person.aiText && <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "10px", background: "rgba(201,168,76,0.12)", color: T.goldD, fontFamily: "Raleway", fontWeight: 700, border: `1px solid ${T.borderMid}` }}>✦ Analyse</span>}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); if (window.confirm(`${ref_person.name} wirklich entfernen?`)) onDelete(ref_person.id); }}
          style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(220,38,38,0.3)", background: "transparent", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626", flexShrink: 0, marginLeft: "10px" }}>✕</button>
      </div>
      <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft, marginTop: "8px" }}>Erstellt: {new Date(ref_person.createdAt).toLocaleDateString("de-DE")}{ref_person.sourceClientId && " · aus Klienten-Daten"}</div>
    </div>
  );
}

/* ─── Prompt Builder ──────────────────────────────────────────────────── */

function buildBeziehungsPrompt(client, refPerson, syn, clientNum, refNum) {
  const gClient = getGates(client); const gRef = getGates(refPerson);
  const defClient = calcDefinedCenters(gClient.all); const defRef = calcDefinedCenters(gRef.all);
  let prompt = `Du bist ein erfahrener Human Design & Numerologie Beziehungsanalytiker in einer ganzheitlichen Heilpraxis.\n\nAnalysiere die Beziehungsdynamik zwischen diesen zwei Menschen. Verbinde Human Design UND Numerologie zu einer ganzheitlichen Synthese.\n\nPERSON A: ${client.name}`;
  if (client.hdType) { prompt += `\nHD-Typ: ${client.hdType}\nProfil: ${client.hdProfile || '—'}\nAutorität: ${client.hdAuthority || '—'}\nDefinierte Zentren: ${[...defClient].map(c => HD_CENTER_CFG[c]?.label || c).join(', ') || '—'}\nBewusste Tore: ${gClient.p.join(', ') || 'keine'}\nUnbewusste Tore: ${gClient.d.join(', ') || 'keine'}`; }
  if (clientNum) { prompt += `\nLebenszahl: ${clientNum.lifePath}${clientNum.isMaster ? ' (Meisterzahl)' : ''}\nAusdruckszahl: ${clientNum.expression || '—'}\nHerzenszahl: ${clientNum.soulUrge || '—'}\nPersönlichkeitszahl: ${clientNum.personality || '—'}\nReifezahl: ${clientNum.maturity || '—'}`; if (clientNum.masterNumbers?.length > 0) prompt += `\nMeisterzahlen: ${clientNum.masterNumbers.join(', ')}`; if (clientNum.karmicDebts?.length > 0) prompt += `\nKarmische Schuldzahlen: ${clientNum.karmicDebts.join(', ')}`; }
  prompt += `\n\nPERSON B: ${refPerson.name}`;
  if (refPerson.hdType) { prompt += `\nHD-Typ: ${refPerson.hdType}\nProfil: ${refPerson.hdProfile || '—'}\nAutorität: ${refPerson.hdAuthority || '—'}\nDefinierte Zentren: ${[...defRef].map(c => HD_CENTER_CFG[c]?.label || c).join(', ') || '—'}\nBewusste Tore: ${gRef.p.join(', ') || 'keine'}\nUnbewusste Tore: ${gRef.d.join(', ') || 'keine'}`; }
  if (refNum) { prompt += `\nLebenszahl: ${refNum.lifePath}${refNum.isMaster ? ' (Meisterzahl)' : ''}\nAusdruckszahl: ${refNum.expression || '—'}\nHerzenszahl: ${refNum.soulUrge || '—'}\nPersönlichkeitszahl: ${refNum.personality || '—'}\nReifezahl: ${refNum.maturity || '—'}`; if (refNum.masterNumbers?.length > 0) prompt += `\nMeisterzahlen: ${refNum.masterNumbers.join(', ')}`; if (refNum.karmicDebts?.length > 0) prompt += `\nKarmische Schuldzahlen: ${refNum.karmicDebts.join(', ')}`; }
  prompt += `\n\nBEZIEHUNGSDATEN\nElektromagnetische Kanäle: ${syn.electromagnetic.length}`;
  if (syn.electromagnetic.length > 0) { prompt += `\n${syn.electromagnetic.map(e => `Kanal ${e.gate1}-${e.gate2} (${HD_CENTER_CFG[e.center1]?.label || e.center1} ↔ ${HD_CENTER_CFG[e.center2]?.label || e.center2})`).join('\n')}`; }
  if (syn.shared.length > 0) { prompt += `\nGemeinsame Tore: ${syn.shared.join(', ')}`; }
  if (clientNum && refNum) { const m = []; if (clientNum.lifePath === refNum.lifePath) m.push(`Lebenszahl ${clientNum.lifePath}`); if (clientNum.expression === refNum.expression) m.push(`Ausdruckszahl ${clientNum.expression}`); if (clientNum.soulUrge === refNum.soulUrge) m.push(`Herzenszahl ${clientNum.soulUrge}`); if (m.length > 0) prompt += `\nIdentische Numerologie-Werte: ${m.join(', ')}`; }
  prompt += `\n\nWICHTIG: Verwende EXAKT diese fünf Abschnittstitel in GROSSBUCHSTABEN. Schreibe 5-7 Sätze pro Abschnitt — gehe in die Tiefe, sei spezifisch, benenne konkrete Tore, Kanäle und Zahlen. Kein Markdown, keine Nummerierungen, keine Aufzählungszeichen, keine Sternchen.\n\nRESONANZFELD\nWas diese zwei Menschen energetisch verbindet — die tiefste gemeinsame Schwingung. Verbinde HD-Kanäle mit numerologischen Übereinstimmungen zu einem ganzheitlichen Bild. Beschreibe, wie sich die elektromagnetischen Verbindungen im Alltag anfühlen könnten. Gehe auf die Qualität der Verbindung ein — ist sie aktivierend, beruhigend, herausfordernd?\n\nWACHSTUMSIMPULSE\nWas aktiviert A bei B und umgekehrt? Welche offenen Zentren werden konditioniert und was bedeutet das emotional und energetisch? Wie spiegeln sich die Numerologie-Zahlen gegenseitig — welche Lernaufgaben ergeben sich daraus? Beschreibe die Wachstumsdynamik konkret und lebensnah.\n\nSPANNUNGSFELDER\nWo entstehen Reibung und Herausforderung? Welche HD-Typen-Dynamiken (Strategie, Autorität, Profil) können kollidieren? Welche numerologischen Gegensätze wirken? Beschreibe, wie sich Spannungen im Alltag zeigen könnten und welche Missverständnisse typisch wären. Ehrlich, konstruktiv, ohne zu beschönigen.\n\nSEELENVERTRAG\nWas ist der tiefere Sinn dieser Begegnung? Was wollen diese zwei Seelen miteinander lernen und erfahren? Welche karmischen Themen (Schuldzahlen, Meisterzahlen) spielen hier hinein? Beschreibe die spirituelle Dimension dieser Verbindung — poetisch, aber geerdet und konkret.\n\nPRAXISIMPULS\nKonkrete Ansätze für die therapeutische Begleitung dieser Beziehung. Was kann der Praktiker in Einzel- und Paarsitzungen nutzen? Welche Übungen, Reflexionsfragen oder Rituale passen zu dieser spezifischen Konstellation? Gib mindestens zwei bis drei umsetzbare Impulse.\n\nWarmherzig, tiefgründig, ganzheitlich. Ohne Heilversprechen. Duze die Personen.`;
  return prompt;
}

/* ─── Section Parser ──────────────────────────────────────────────────── */

function parseSections(text) {
  if (!text) return [];
  const sectionNames = ["RESONANZFELD", "WACHSTUMSIMPULSE", "SPANNUNGSFELDER", "SEELENVERTRAG", "PRAXISIMPULS"];
  const sectionIcons = { "RESONANZFELD": "💫", "WACHSTUMSIMPULSE": "🌱", "SPANNUNGSFELDER": "⚡", "SEELENVERTRAG": "🔮", "PRAXISIMPULS": "✦" };
  const sections = []; const lines = text.split("\n"); let current = null;
  const seenTitles = new Set();
  for (const line of lines) {
    const trimmed = line.trim();
    const matchedSection = sectionNames.find(s => trimmed.toUpperCase().includes(s));
    if (matchedSection) {
      // Wenn derselbe Titel direkt nochmal kommt (ohne Content dazwischen), ignorieren
      if (current && current.title === matchedSection && !current.content.trim()) continue;
      if (current && current.content.trim()) sections.push(current);
      current = { title: matchedSection, icon: sectionIcons[matchedSection] || "✦", content: "" };
    }
    else if (current && trimmed) { current.content += (current.content ? "\n" : "") + trimmed; }
  }
  if (current && current.content.trim()) sections.push(current);
  if (sections.length === 0 && text.trim()) { sections.push({ title: "BEZIEHUNGSANALYSE", icon: "✦", content: text.trim() }); }
  // Deduplizieren: wenn zwei Sektionen denselben Titel haben, nur die mit Content behalten
  const deduped = [];
  const usedTitles = new Set();
  for (const sec of sections) {
    if (!usedTitles.has(sec.title)) { deduped.push(sec); usedTitles.add(sec.title); }
  }
  return deduped;
}

/* ─── ComparisonView ──────────────────────────────────────────────────── */

function ComparisonView({ client, refPerson, onBack, clients, onSave }) {
  const [refData, setRefData] = useState(refPerson);
  const [aiText, setAiText] = useState(refPerson.aiText || "");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!refPerson.sourceClientId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "clients", refPerson.sourceClientId, "humanDesign", "latest"));
        if (!snap.exists()) return; const d = snap.data();
        const updated = { ...refPerson, hdType: d.typ || refPerson.hdType, hdProfile: d.profil || refPerson.hdProfile, hdAuthority: d.autoritaet || refPerson.hdAuthority, hdPGates: (d.tore_bewusst || []).join(",") || refPerson.hdPGates, hdDGates: (d.tore_unbewusst || []).join(",") || refPerson.hdDGates };
        setRefData(updated);
        if (updated.hdType !== refPerson.hdType || updated.hdPGates !== refPerson.hdPGates || updated.hdDGates !== refPerson.hdDGates) { onSave({ ...client, beziehungen: (client.beziehungen || []).map(b => b.id === refPerson.id ? updated : b) }); }
      } catch (e) { console.log("HD sync for ref:", e); }
    })();
  }, [refPerson.sourceClientId]);

  const clientNum = client.birthDate ? calcNumerology(client.birthDate, client.birthName) : null;
  const refNum = refData.birthDate ? calcNumerology(refData.birthDate, refData.birthName) : null;
  const syn = calcElectromagnetic(client, refData);
  const gClient = getGates(client); const gRef = getGates(refData);
  const hasData = (client.hdType || gClient.all.length > 0 || clientNum) && (refData.hdType || gRef.all.length > 0 || refNum);

  const genAI = async () => {
    if (!hasData) return; setAiLoading(true);
    try {
      const prompt = buildBeziehungsPrompt(client, refData, syn, clientNum, refNum);
      let raw = await groqFetch(prompt, 2500);
      raw = raw.replace(/\*\*/g, "").replace(/^#+\s*/gm, "").replace(/^\d+\.\s+/gm, "").replace(/^[-•]\s+/gm, "");
      setAiText(raw);
      const updatedRef = { ...refData, aiText: raw, aiGeneratedAt: new Date().toISOString() };
      setRefData(updatedRef);
      onSave({ ...client, beziehungen: (client.beziehungen || []).map(b => b.id === refPerson.id ? updatedRef : b) });
    } catch { setAiText("Netzwerkfehler bei der Analyse."); }
    setAiLoading(false);
  };

  const numRows = [];
  if (clientNum && refNum) {
    [["lifePath", "Lebenszahl"], ["expression", "Ausdruckszahl"], ["soulUrge", "Herzenszahl"], ["personality", "Persönlichkeitszahl"], ["birthday", "Geburtstagszahl"], ["maturity", "Reifezahl"]].forEach(([k, label]) => {
      if (clientNum[k] != null && refNum[k] != null) numRows.push({ label, a: clientNum[k], b: refNum[k], match: clientNum[k] === refNum[k] });
    });
  }

  const sections = parseSections(aiText);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <button onClick={onBack} style={{ background: T.bgSoft, border: `1.5px solid ${T.border}`, borderRadius: "10px", padding: "6px 12px", fontFamily: "Raleway", fontWeight: 700, fontSize: "11px", color: T.textMid, cursor: "pointer" }}>←</button>
        <div>
          <div style={{ fontFamily: "Cinzel", fontSize: "14px", color: T.text, fontWeight: 700 }}>{client.name} ⇄ {refData.name}</div>
          <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft }}>Beziehungs-Resonanz Vergleich</div>
        </div>
      </div>

      {/* HD Typ-Dynamik */}
      {(client.hdType || refData.hdType) && (
        <Card style={{ marginBottom: "12px" }}>
          <SL>⚙ Typ-Dynamik</SL>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[client, refData].map((p, i) => (
              <div key={i} style={{ background: T.bgSoft, borderRadius: "12px", padding: "12px", border: `1px solid ${T.border}` }}>
                <div style={{ fontFamily: "Raleway", fontWeight: 800, fontSize: "12px", color: i === 0 ? T.goldD : T.text, marginBottom: "4px" }}>{p.name}</div>
                <div style={{ fontFamily: "Raleway", fontSize: "12px", color: T.gold, fontWeight: 600 }}>{p.hdType || "Typ unbekannt"}</div>
                {p.hdProfile && <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid }}>Profil {p.hdProfile}</div>}
                {p.hdAuthority && <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid }}>Auth: {p.hdAuthority}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bodygraphs */}
      {(gClient.all.length > 0 || gRef.all.length > 0) && (
        <Card style={{ marginBottom: "12px" }}>
          <SL>Bodygraphs</SL>
          <div style={{ display: "flex", gap: "8px", justifyContent: "space-around" }}>
            {[[client, gClient], [refData, gRef]].map(([p, g], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Raleway", fontSize: "11px", fontWeight: 700, color: i === 0 ? T.goldD : T.text, marginBottom: "6px" }}>{p.name}</div>
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
          {syn.electromagnetic.length === 0 ? <div style={{ fontFamily: "Raleway", fontSize: "12px", color: T.textSoft, fontStyle: "italic", padding: "6px 0" }}>Keine direkten elektromagnetischen Verbindungen gefunden.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {syn.electromagnetic.map((e, i) => (
                <div key={i} style={{ background: T.bgCard, borderRadius: "10px", padding: "9px 12px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontFamily: "Cinzel", fontSize: "12px", color: T.goldD, fontWeight: 700 }}>Tor {e.gate1}–{e.gate2}</span>
                  <span style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid }}>{HD_CENTER_CFG[e.center1]?.label || e.center1} ↔ {HD_CENTER_CFG[e.center2]?.label || e.center2}</span>
                </div>
              ))}
            </div>
          )}
          {syn.shared.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textMid, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>🔗 Gemeinsame Tore ({syn.shared.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>{syn.shared.map(g => <span key={g} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "10px", background: "rgba(201,168,76,0.12)", color: T.goldD, fontFamily: "Raleway", fontWeight: 700, border: `1px solid ${T.borderMid}` }}>Tor {g}</span>)}</div>
            </div>
          )}
        </Card>
      )}

      {/* Numerologie-Vergleich */}
      {numRows.length > 0 && (
        <Card style={{ marginBottom: "12px" }}>
          <SL>🔢 Numerologie-Vergleich</SL>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "0", alignItems: "center" }}>
            <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft, fontWeight: 700, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}></div>
            <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.goldD, fontWeight: 700, padding: "6px 8px", borderBottom: `1px solid ${T.border}`, textAlign: "center", minWidth: "50px" }}>{client.name.split(" ")[0]}</div>
            <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.text, fontWeight: 700, padding: "6px 8px", borderBottom: `1px solid ${T.border}`, textAlign: "center", minWidth: "50px" }}>{refData.name.split(" ")[0]}</div>
            <div style={{ padding: "6px 4px", borderBottom: `1px solid ${T.border}` }}></div>
            {numRows.map((row, i) => (
              <React.Fragment key={row.label}>
                <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textMid, fontWeight: 600, padding: "8px 0", borderBottom: i < numRows.length - 1 ? `1px solid ${T.border}` : "none" }}>{row.label}</div>
                <div style={{ fontFamily: "Cinzel", fontSize: "14px", color: T.goldD, fontWeight: 700, textAlign: "center", padding: "8px", borderBottom: i < numRows.length - 1 ? `1px solid ${T.border}` : "none" }}>{row.a}</div>
                <div style={{ fontFamily: "Cinzel", fontSize: "14px", color: T.text, fontWeight: 700, textAlign: "center", padding: "8px", borderBottom: i < numRows.length - 1 ? `1px solid ${T.border}` : "none" }}>{row.b}</div>
                <div style={{ textAlign: "center", padding: "8px 4px", borderBottom: i < numRows.length - 1 ? `1px solid ${T.border}` : "none" }}>{row.match && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "8px", background: "rgba(201,168,76,0.2)", color: T.gold, fontFamily: "Raleway", fontWeight: 700 }}>✦</span>}</div>
              </React.Fragment>
            ))}
          </div>
          {clientNum && refNum && (clientNum.masterNumbers?.length > 0 || refNum.masterNumbers?.length > 0 || clientNum.karmicDebts?.length > 0 || refNum.karmicDebts?.length > 0) && (
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px dashed ${T.border}` }}>
              {[["Meisterzahlen", "masterNumbers"], ["Karmische Schuldzahlen", "karmicDebts"]].map(([label, key]) => {
                const cVals = clientNum[key] || []; const rVals = refNum[key] || [];
                if (cVals.length === 0 && rVals.length === 0) return null;
                return (<div key={key} style={{ marginBottom: "8px" }}><div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div><div style={{ display: "flex", gap: "16px" }}><div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.goldD }}>{client.name.split(" ")[0]}: {cVals.length > 0 ? cVals.join(", ") : "—"}</div><div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.text }}>{refData.name.split(" ")[0]}: {rVals.length > 0 ? rVals.join(", ") : "—"}</div></div></div>);
              })}
            </div>
          )}
        </Card>
      )}

      {/* ═══ BEZIEHUNGS-RESONANZANALYSE ═══ */}
      <Card style={{ marginBottom: "12px", background: T.bgSoft, border: `1.5px solid ${T.borderMid}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <SL color={T.goldD}>✦ Beziehungs-Resonanzanalyse</SL>
          <div style={{ display: "flex", gap: "6px" }}>
            {aiText && (
              <button onClick={() => { setAiText(""); const ur = { ...refData, aiText: "", aiGeneratedAt: "" }; setRefData(ur); onSave({ ...client, beziehungen: (client.beziehungen || []).map(b => b.id === refPerson.id ? ur : b) }); }}
                style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${T.border}`, background: "transparent", fontFamily: "Raleway", fontSize: "10px", fontWeight: 700, color: T.textMid, cursor: "pointer" }}>↻ Neu</button>
            )}
            <Btn onClick={genAI} disabled={!hasData || aiLoading} style={{ padding: "6px 14px", fontSize: "11px", opacity: (!hasData || aiLoading) ? 0.5 : 1 }}>
              {aiLoading ? "⏳ Analysiert…" : "✦ Analysieren"}
            </Btn>
          </div>
        </div>
        {!hasData && <div style={{ fontFamily: "Raleway", fontSize: "12px", color: T.textSoft, fontStyle: "italic", padding: "12px 0" }}>Für eine Analyse werden HD- oder Numerologie-Daten beider Personen benötigt.</div>}
        {aiLoading && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>✦</div>
            <div style={{ fontFamily: "Raleway", fontSize: "12px", color: T.goldD, fontWeight: 600 }}>Beziehungs-Resonanz wird analysiert…</div>
            <div style={{ fontFamily: "Raleway", fontSize: "10px", color: T.textSoft, marginTop: "4px" }}>Human Design × Numerologie Synthese</div>
          </div>
        )}
        {!aiLoading && sections.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sections.map((sec, i) => (
              <div key={i} style={{ background: T.bgCard, borderRadius: "12px", padding: "14px 16px", border: `1px solid ${T.border}` }}>
                <div style={{ fontFamily: "Cinzel", fontSize: "11px", color: T.goldD, fontWeight: 700, letterSpacing: "1.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px" }}>{sec.icon}</span>{sec.title}
                </div>
                <div style={{ fontFamily: "Raleway", fontSize: "12.5px", color: T.text, lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{sec.content}</div>
              </div>
            ))}
            {refData.aiGeneratedAt && <div style={{ fontFamily: "Raleway", fontSize: "9px", color: T.textSoft, textAlign: "right" }}>Generiert: {new Date(refData.aiGeneratedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</div>}
          </div>
        )}
      </Card>

      {/* Drucken / PDF Button */}
      {sections.length > 0 && (
        <button onClick={() => openPrintView(client, refData, sections, syn, clientNum, refNum)}
          style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "rgba(201,168,76,0.1)", border: `1.5px solid rgba(201,168,76,0.3)`, fontFamily: "Raleway", fontWeight: 800, fontSize: "13px", color: T.goldD, cursor: "pointer", marginBottom: "12px" }}>
          🖨 Beziehungs-Resonanzkarte drucken / PDF
        </button>
      )}
    </div>
  );
}

/* ─── Haupt-Tab ───────────────────────────────────────────────────────── */

function BeziehungsTab({ client, clients, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [editRef, setEditRef] = useState(null);
  const [selectedRef, setSelectedRef] = useState(null);
  const beziehungen = client.beziehungen || [];

  const handleSaveRef = (refPerson) => {
    let updated; if (beziehungen.find(b => b.id === refPerson.id)) { updated = { ...client, beziehungen: beziehungen.map(b => b.id === refPerson.id ? refPerson : b) }; } else { updated = { ...client, beziehungen: [...beziehungen, refPerson] }; }
    onSave(updated); setShowForm(false); setEditRef(null);
  };
  const handleDeleteRef = (refId) => { onSave({ ...client, beziehungen: beziehungen.filter(b => b.id !== refId) }); if (selectedRef?.id === refId) setSelectedRef(null); };

  if (selectedRef) { const currentRef = beziehungen.find(b => b.id === selectedRef.id) || selectedRef; return <ComparisonView client={client} refPerson={currentRef} onBack={() => setSelectedRef(null)} clients={clients} onSave={onSave} />; }
  if (showForm || editRef) { return <RefPersonForm initial={editRef} clients={clients} clientId={client.id} onSave={handleSaveRef} onCancel={() => { setShowForm(false); setEditRef(null); }} />; }

  return (
    <div>
      <div style={{ background: T.bgSoft, borderRadius: "14px", padding: "14px 16px", marginBottom: "16px", border: `1.5px solid ${T.border}`, position: "relative", overflow: "hidden" }}>
        <Flower size={120} opacity={0.08} color={T.gold} />
        <div style={{ position: "relative", zIndex: 1, fontFamily: "Raleway", fontSize: "12px", color: T.textMid, lineHeight: "1.6" }}>Vergleiche {client.name}s Human Design & Numerologie mit Partnern, Familie oder anderen Klienten. Entdecke Resonanzfelder, elektromagnetische Verbindungen und numerologische Spiegelungen.</div>
      </div>
      <Btn onClick={() => setShowForm(true)} style={{ width: "100%", marginBottom: "16px", padding: "11px" }}>+ Referenzperson hinzufügen</Btn>
      {beziehungen.length === 0 ? <EmptyState /> : beziehungen.map(ref_p => <RefPersonCard key={ref_p.id} ref_person={ref_p} client={client} onSelect={setSelectedRef} onDelete={handleDeleteRef} />)}
    </div>
  );
}

export { BeziehungsTab, calcElectromagnetic, getGates };
