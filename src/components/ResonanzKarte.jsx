import React, { useRef } from "react";
import { T } from "../config/theme.js";
import { calcNumerology, LIFE_PATH_DESC, PERSONAL_YEAR_DESC } from "./Numerology.jsx";
import { HD_TYPE_DESC, HD_AUTHORITY_DESC } from "./HumanDesign.jsx";

// ─── PRINT STYLES ──────────────────────────────────────────────────────────
const printCSS = `
@media print {
  body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rk-no-print { display: none !important; }
  .rk-page { page-break-after: always; break-after: page; }
  .rk-page:last-child { page-break-after: avoid; break-after: avoid; }
}
@page { size: A4; margin: 0; }
`;

// ─── RESONANZ-KARTE COMPONENT ──────────────────────────────────────────────
function ResonanzKarte({ client, onClose }) {
  const printRef = useRef();

  const nums = client.birthDate ? calcNumerology(client.birthDate, client.birthName) : null;
  const hasHD = !!client.hdType;
  const hasNums = !!nums;
  const lp = hasNums ? LIFE_PATH_DESC[nums.lifePath] : null;
  const hdInfo = hasHD ? HD_TYPE_DESC[client.hdType] : null;
  const authInfo = client.hdAuthority ? HD_AUTHORITY_DESC[client.hdAuthority] : null;
  const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

  const handlePrint = () => {
    const content = printRef.current;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Resonanzkarte — ${client.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>${printCSS}
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Raleway', sans-serif; background: #0D0D0A; color: #F5F0E8; }
      </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 600);
  };

  // Synthesis text
  const getSynthesis = () => {
    if (!hasHD || !hasNums) return null;
    const HD_NUM = {
      'Manifestor': { 22: 'Der Meister-Manifestor — Du manifestierst Visionen die die Welt verändern.' },
      'Generator': { 4: 'Der ausdauernde Erbauer — Deine Sakralkraft erschafft Werke für die Ewigkeit.' },
      'Projektor': { 7: 'Der weise Beobachter — Deine Weisheit ist dein Schlüssel zur Einladung.' },
    };
    return HD_NUM[client.hdType]?.[nums.lifePath] ||
      `${client.hdType} mit Lebenszahl ${nums.lifePath} — eine einzigartige Kombination aus ${hdInfo?.strategy || 'innerer Führung'} und ${lp?.essence || 'numerologischer Kraft'}.`;
  };

  // Ornament line
  const Ornament = () => (
    <div style={{ textAlign: 'center', margin: '16px 0', color: '#C9A84C', fontSize: '14px', letterSpacing: '8px', opacity: 0.5 }}>✦ ✦ ✦</div>
  );

  // Section divider
  const SectionTitle = ({ children }) => (
    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '11px', fontWeight: 700, color: '#C9A84C', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: '6px' }}>{children}</div>
  );

  // Number circle for the card
  const NumCircle = ({ n, label, master }) => (
    <div style={{ textAlign: 'center', width: '60px' }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%', margin: '0 auto 4px',
        border: `2px solid ${master ? '#C9A84C' : 'rgba(201,168,76,0.3)'}`,
        background: master ? 'rgba(201,168,76,0.15)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 700,
        color: master ? '#C9A84C' : '#F5F0E8',
      }}>{n}</div>
      <div style={{ fontFamily: 'Raleway', fontSize: '7px', fontWeight: 700, color: 'rgba(245,240,232,0.5)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: T.bgCard, borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Toolbar */}
        <div className="rk-no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: 'Cinzel', fontSize: '16px', color: T.text, fontWeight: 700 }}>✦ Resonanzkarte</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handlePrint} style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '12px', padding: '8px 18px', borderRadius: '10px', border: 'none', background: T.gold, color: '#1A1200', cursor: 'pointer' }}>🖨 Drucken / PDF</button>
            <button onClick={onClose} style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '12px', padding: '8px 14px', borderRadius: '10px', border: `1.5px solid ${T.border}`, background: T.bgSoft, color: T.textMid, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef}>

          {/* ═══ PAGE 1: Seelenlandkarte ═══ */}
          <div className="rk-page" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '32mm 24mm 20mm', background: '#0D0D0A', color: '#F5F0E8', position: 'relative', overflow: 'hidden' }}>

            {/* Background ornament */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.06)', opacity: 0.5 }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.04)', opacity: 0.5 }} />

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 700, letterSpacing: '4px', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '8px' }}>Human Resonanz Akademie</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 700, color: '#C9A84C', marginBottom: '4px' }}>Resonanzkarte</div>
              <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: 'rgba(245,240,232,0.4)', letterSpacing: '2px' }}>Seelenlandkarte · Erstellt {today}</div>
            </div>

            <Ornament />

            {/* Client Name */}
            <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 700, color: '#F5F0E8' }}>{client.name}</div>
              {client.birthDate && <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.4)', marginTop: '4px' }}>✦ {new Date(client.birthDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
            </div>

            {/* Two Column: HD + Numerologie */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>

              {/* Left: Human Design */}
              {hasHD && (
                <div style={{ flex: 1, background: 'rgba(201,168,76,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(201,168,76,0.12)' }}>
                  <SectionTitle>⚙ Human Design</SectionTitle>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: '#F5F0E8', marginBottom: '4px' }}>{client.hdType}</div>
                  {client.hdProfile && <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.6)', marginBottom: '2px' }}>Profil {client.hdProfile}</div>}
                  {client.hdAuthority && <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.6)', marginBottom: '10px' }}>Autorität: {client.hdAuthority}</div>}
                  {hdInfo && (
                    <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div><div style={{ fontFamily: 'Raleway', fontSize: '8px', fontWeight: 700, color: '#C9A84C', letterSpacing: '1px', textTransform: 'uppercase' }}>Strategie</div><div style={{ fontFamily: 'Raleway', fontSize: '11px', color: '#F5F0E8', fontWeight: 600 }}>{hdInfo.strategy}</div></div>
                        <div style={{ textAlign: 'right' }}><div style={{ fontFamily: 'Raleway', fontSize: '8px', fontWeight: 700, color: '#C9A84C', letterSpacing: '1px', textTransform: 'uppercase' }}>Signatur</div><div style={{ fontFamily: 'Raleway', fontSize: '11px', color: '#F5F0E8', fontWeight: 600 }}>{hdInfo.signature}</div></div>
                      </div>
                      <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: 'rgba(245,240,232,0.5)', lineHeight: '1.5', marginTop: '6px' }}>{hdInfo.desc}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Right: Numerologie */}
              {hasNums && (
                <div style={{ flex: 1, background: 'rgba(201,168,76,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(201,168,76,0.12)' }}>
                  <SectionTitle>🔢 Numerologie</SectionTitle>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '50%',
                      border: `2.5px solid #C9A84C`,
                      background: nums.isMaster ? 'rgba(201,168,76,0.15)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: '#C9A84C',
                      boxShadow: nums.isMaster ? '0 0 16px rgba(201,168,76,0.2)' : 'none',
                    }}>{nums.lifePath}</div>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 700, color: '#F5F0E8' }}>{lp?.title}</div>
                      <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: 'rgba(245,240,232,0.5)' }}>{lp?.essence}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: 'rgba(245,240,232,0.5)', lineHeight: '1.5', marginBottom: '12px' }}>{lp?.desc}</div>
                  {/* Number row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                    <NumCircle n={nums.lifePath} label="Leben" master={nums.isMaster} />
                    {nums.expression !== null && <NumCircle n={nums.expression} label="Ausdruck" />}
                    {nums.heartDesire !== null && <NumCircle n={nums.heartDesire} label="Herz" />}
                    {nums.personality !== null && <NumCircle n={nums.personality} label="Person." />}
                    <NumCircle n={nums.birthDay} label="Geburt" />
                  </div>
                </div>
              )}
            </div>

            {/* Resonanz-Synthese */}
            {hasHD && hasNums && (
              <div style={{ background: 'rgba(201,168,76,0.06)', borderRadius: '12px', padding: '18px', border: '1.5px solid rgba(201,168,76,0.2)', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                <SectionTitle>⚙ × 🔢 Resonanz-Synthese</SectionTitle>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 700, color: '#C9A84C', marginBottom: '8px' }}>{getSynthesis()?.split('—')[0] || 'Einzigartige Verbindung'}</div>
                <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.7)', lineHeight: '1.7', fontStyle: 'italic' }}>{getSynthesis()}</div>
              </div>
            )}

            {/* Aktuelle Zeitqualität */}
            {hasNums && (
              <div style={{ position: 'relative', zIndex: 1 }}>
                <SectionTitle>✦ Aktuelle Zeitqualität</SectionTitle>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  {[
                    { n: nums.personalYear, label: 'Persönliches Jahr' },
                    { n: nums.personalMonth, label: 'Persönlicher Monat' },
                    { n: nums.personalDay, label: 'Persönlicher Tag' },
                  ].map(({ n, label }) => (
                    <div key={label} style={{ flex: 1, background: 'rgba(201,168,76,0.04)', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid rgba(201,168,76,0.1)' }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 700, color: '#C9A84C' }}>{n}</div>
                      <div style={{ fontFamily: 'Raleway', fontSize: '8px', fontWeight: 700, color: 'rgba(245,240,232,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</div>
                    </div>
                  ))}
                </div>
                {PERSONAL_YEAR_DESC[nums.personalYear] && (
                  <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.6)', lineHeight: '1.6', padding: '10px', background: 'rgba(201,168,76,0.04)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.08)' }}>
                    <span style={{ fontWeight: 700, color: '#C9A84C' }}>Jahr {nums.personalYear}: </span>
                    {PERSONAL_YEAR_DESC[nums.personalYear]}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: '16mm', left: '24mm', right: '24mm', textAlign: 'center' }}>
              <Ornament />
              <div style={{ fontFamily: 'Raleway', fontSize: '8px', color: 'rgba(245,240,232,0.3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Lichtkern · powered by Human Resonanz</div>
              <div style={{ fontFamily: 'Raleway', fontSize: '7px', color: 'rgba(245,240,232,0.2)', marginTop: '4px' }}>Diese Karte dient der Selbsterkenntnis und ersetzt keine medizinische Behandlung</div>
            </div>
          </div>

          {/* ═══ PAGE 2: Impulse & Autorität ═══ */}
          {(hasHD || hasNums) && (
            <div className="rk-page" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '28mm 24mm 20mm', background: '#0D0D0A', color: '#F5F0E8', position: 'relative' }}>

              {/* Autorität */}
              {authInfo && (
                <div style={{ marginBottom: '24px' }}>
                  <SectionTitle>✦ Deine Autorität: {client.hdAuthority}</SectionTitle>
                  <div style={{ fontFamily: 'Raleway', fontSize: '12px', color: 'rgba(245,240,232,0.7)', lineHeight: '1.7', marginBottom: '8px' }}>{authInfo}</div>
                </div>
              )}

              <Ornament />

              {/* Karmische Schuldzahlen */}
              {hasNums && nums.karmicDebts.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <SectionTitle>✦ Karmische Themen</SectionTitle>
                  {nums.karmicDebts.map(k => (
                    <div key={k} style={{ marginBottom: '10px', padding: '12px', background: 'rgba(220,38,38,0.04)', borderRadius: '10px', border: '1px solid rgba(220,38,38,0.12)' }}>
                      <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '12px', color: '#ff6b6b', marginBottom: '4px' }}>Karmische Schuld {k}</div>
                      <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.6)', lineHeight: '1.5' }}>
                        {k === 13 && 'Lektion der Disziplin — Heilung durch konsequente Arbeit und Ausdauer.'}
                        {k === 14 && 'Lektion der Mäßigung — Heilung durch Verantwortung und Balance.'}
                        {k === 16 && 'Lektion der Demut — Heilung durch spirituelles Erwachen und Loslassen.'}
                        {k === 19 && 'Lektion der Eigenständigkeit — Heilung durch dienende Führung und Mitgefühl.'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Alle Zahlen im Detail */}
              {hasNums && (
                <div style={{ marginBottom: '24px' }}>
                  <SectionTitle>✦ Dein Zahlenprofil im Detail</SectionTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { n: nums.lifePath, label: 'Lebenszahl', desc: lp?.essence },
                      { n: nums.birthDay, label: 'Geburtszahl', desc: 'Deine natürliche Gabe' },
                      { n: nums.attitude, label: 'Einstellungszahl', desc: 'Dein erster Impuls' },
                      { n: nums.generation, label: 'Generationszahl', desc: 'Kollektive Jahrgangs-Energie' },
                      nums.expression !== null ? { n: nums.expression, label: 'Ausdruckszahl', desc: 'Dein natürliches Talent' } : null,
                      nums.heartDesire !== null ? { n: nums.heartDesire, label: 'Herzzahl', desc: 'Was deine Seele will' } : null,
                      nums.personality !== null ? { n: nums.personality, label: 'Persönlichkeitszahl', desc: 'Wie andere dich sehen' } : null,
                      nums.maturity !== null ? { n: nums.maturity, label: 'Reifezahl', desc: 'Dein Wachstumsziel' } : null,
                      nums.spiritual !== null ? { n: nums.spiritual, label: 'Spirituelle Zahl', desc: 'Verborgene Talente' } : null,
                    ].filter(Boolean).map(({ n, label, desc }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(201,168,76,0.03)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.08)' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                          border: `1.5px solid ${[11, 22, 33].includes(n) ? '#C9A84C' : 'rgba(201,168,76,0.2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 700,
                          color: [11, 22, 33].includes(n) ? '#C9A84C' : '#F5F0E8',
                        }}>{n}</div>
                        <div>
                          <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 700, color: '#C9A84C', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</div>
                          <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: 'rgba(245,240,232,0.5)' }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Persönliche Impulse */}
              <div style={{ marginBottom: '24px' }}>
                <SectionTitle>✦ Drei Impulse für deinen Weg</SectionTitle>
                {[
                  hasHD && hdInfo ? `Folge deiner Strategie: ${hdInfo.strategy}. Wenn du dies lebst, findest du ${hdInfo.signature}.` : null,
                  hasNums && lp ? `Deine Lebenszahl ${nums.lifePath} sagt dir: ${lp.desc?.split('.')[0]}.` : null,
                  hasNums ? `Du befindest dich im Persönlichen Jahr ${nums.personalYear}. ${PERSONAL_YEAR_DESC[nums.personalYear] || 'Achte auf die Energie dieses Jahres.'}` : null,
                ].filter(Boolean).map((text, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(201,168,76,0.1)', border: '1.5px solid rgba(201,168,76,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontWeight: 700, color: '#C9A84C',
                    }}>{i + 1}</div>
                    <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.7)', lineHeight: '1.7' }}>{text}</div>
                  </div>
                ))}
              </div>

              {/* Footer Page 2 */}
              <div style={{ position: 'absolute', bottom: '16mm', left: '24mm', right: '24mm', textAlign: 'center' }}>
                <Ornament />
                <div style={{ fontFamily: 'Raleway', fontSize: '8px', color: 'rgba(245,240,232,0.3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Lichtkern · powered by Human Resonanz</div>
                <div style={{ fontFamily: 'Raleway', fontSize: '7px', color: 'rgba(245,240,232,0.2)', marginTop: '4px' }}>www.human-resonanz.de</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export { ResonanzKarte };
