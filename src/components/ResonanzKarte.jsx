import React, { useRef, useState } from "react";
import { T } from "../config/theme.js";
import { calcNumerology, LIFE_PATH_DESC, PERSONAL_YEAR_DESC } from "./Numerology.jsx";
import { HD_TYPE_DESC, HD_AUTHORITY_DESC } from "./HumanDesign.jsx";
import { groqFetch } from "../config/groq.js";

const printCSS = `
@media print {
  body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #FFFDF8 !important; color: #1A1200 !important; }
  .rk-no-print { display: none !important; }
  .rk-page { page-break-after: always; break-after: page; width: 210mm !important; min-height: 297mm !important; padding: 20mm 24mm 16mm !important; background: #FFFDF8 !important; color: #1A1200 !important; }
  .rk-page:last-child { page-break-after: avoid; break-after: avoid; }
  .rk-page * { color: #1A1200 !important; }
  .rk-page [data-gold] { color: #8B7332 !important; }
}
@page { size: A4; margin: 0; }
`;

const Ornament = () => (
  <div style={{ textAlign: 'center', margin: '16px 0', color: '#C9A84C', fontSize: '14px', letterSpacing: '8px', opacity: 0.4 }}>✦ ✦ ✦</div>
);

const Prose = ({ children }) => (
  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15.5px', color: 'rgba(245,240,232,0.8)', lineHeight: '1.85', fontWeight: 400, wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</div>
);

function ResonanzKarte({ client, aiText: existingAiText, onClose }) {
  const printRef = useRef();
  const [karteText, setKarteText] = useState(existingAiText || '');
  const [loading, setLoading] = useState(false);

  const nums = client.birthDate ? calcNumerology(client.birthDate, client.birthName) : null;
  const hasHD = !!client.hdType;
  const hasNums = !!nums;
  const lp = hasNums ? LIFE_PATH_DESC[nums.lifePath] : null;
  const hdInfo = hasHD ? HD_TYPE_DESC[client.hdType] : null;
  const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

  const generateKarteText = async () => {
    setLoading(true);
    try {
      const prompt = `Du bist ein warmherziger, weiser Berater der eine persönliche "Seelenlandkarte" für einen Klienten schreibt. Schreibe in der Du-Form, poetisch aber klar, wie ein Brief von einem weisen Mentor.

KLIENT: ${client.name}
${hasHD ? `HUMAN DESIGN: ${client.hdType}, Profil ${client.hdProfile || '—'}, Autorität: ${client.hdAuthority || '—'}
Strategie: ${hdInfo?.strategy || '—'}, Signatur: ${hdInfo?.signature || '—'}` : ''}
${hasNums ? `NUMEROLOGIE: Lebenszahl ${nums.lifePath}${nums.isMaster ? ' (Meisterzahl!)' : ''} — ${lp?.title || ''}
Geburtszahl: ${nums.birthDay}, Einstellung: ${nums.attitude}, Generation: ${nums.generation}
${nums.expression !== null ? `Ausdruckszahl: ${nums.expression}, Herzzahl: ${nums.heartDesire}, Persönlichkeit: ${nums.personality}` : ''}
${nums.maturity !== null ? `Reifezahl: ${nums.maturity}` : ''}
Persönliches Jahr: ${nums.personalYear}, Monat: ${nums.personalMonth}
${nums.karmicDebts.length > 0 ? `Karmische Schuldzahlen: ${nums.karmicDebts.join(', ')}` : ''}` : ''}

Schreibe folgende Abschnitte (jeweils 3-5 Sätze, warmherzig und tiefgründig):

DEIN WESEN
Beschreibe wer dieser Mensch im Kern ist — basierend auf der Kombination von HD-Typ und Lebenszahl. Was macht diese Kombination einzigartig?

DEINE INNERE LANDSCHAFT
Was bewegt diesen Menschen innerlich? Herzzahl, Autorität und Persönlichkeitszahl erzählen eine Geschichte über innere Sehnsucht und äußere Wirkung.

DEIN WEG
Basierend auf Strategie, Lebenszahl und Profil: Wie navigiert dieser Mensch am besten durchs Leben? Konkrete, praktische Weisheit.

DEINE AKTUELLE PHASE
Persönliches Jahr ${hasNums ? nums.personalYear : '?'} und was das für die nächsten Monate bedeutet. Verbinde es mit der HD-Strategie.

DREI GESCHENKE FÜR DEINEN WEG
Drei konkrete, warmherzige Impulse die dieser Mensch mitnehmen kann. Als drei kurze Absätze, jeder beginnt mit einem kraftvollen Satz.

${nums?.karmicDebts?.length > 0 ? `DEINE KARMISCHE EINLADUNG
Was die Schuldzahl(en) ${nums.karmicDebts.join(', ')} als Einladung zur Heilung bedeuten.` : ''}

Schreibe OHNE Markdown-Formatierung (keine **, keine #, keine Aufzählungszeichen). Nutze nur Fließtext und Absätze. Trenne die Abschnitte durch deren Titel in Großbuchstaben auf einer eigenen Zeile. Ohne Heilversprechen.`;

      const text = await groqFetch(prompt);
      setKarteText(text);
    } catch { setKarteText('Der Text konnte nicht generiert werden.'); }
    setLoading(false);
  };

  const handlePrint = () => {
    const content = printRef.current;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Resonanzkarte — ${client.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>${printCSS}
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Cormorant Garamond', serif; background: #FFFDF8; color: #1A1200; }
        .rk-page { background: #FFFDF8 !important; color: #1A1200 !important; }
        .rk-page * { color: #1A1200 !important; }
        .rk-gold { color: #8B7332 !important; }
        .rk-soft { color: #6B6355 !important; }
        .rk-border { border-color: rgba(139,115,50,0.2) !important; }
        .rk-bg-soft { background: rgba(139,115,50,0.04) !important; }
        .rk-circle { border-color: rgba(139,115,50,0.3) !important; }
        .rk-circle-master { border-color: #8B7332 !important; background: rgba(139,115,50,0.08) !important; }
        .rk-ornament { color: #8B7332 !important; }
      </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 600);
  };

  const parseSections = (text) => {
    if (!text) return [];
    const sectionTitles = ['DEIN WESEN', 'DEINE INNERE LANDSCHAFT', 'DEIN WEG', 'DEINE AKTUELLE PHASE', 'DREI GESCHENKE', 'DEINE KARMISCHE EINLADUNG'];
    const lines = text.split('\n').filter(l => l.trim());
    const sections = [];
    let current = { title: '', body: '' };

    for (const line of lines) {
      const cleaned = line.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '').trim();
      const isTitle = sectionTitles.some(t => cleaned.toUpperCase().includes(t));
      if (isTitle) {
        if (current.body.trim()) sections.push({ ...current });
        current = { title: cleaned.replace(/\*/g, ''), body: '' };
      } else {
        current.body += (current.body ? '\n\n' : '') + cleaned;
      }
    }
    if (current.body.trim()) sections.push({ ...current });
    return sections;
  };

  const sections = parseSections(karteText);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        position: 'relative',
        background: T.bgCard,
        borderRadius: '20px',
        border: `1px solid ${T.border}`,
        width: '100%',
        maxWidth: '780px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Toolbar — fixed at top */}
        <div className="rk-no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 24px',
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
          background: T.bgCard
        }}>
          <div style={{ fontFamily: 'Cinzel', fontSize: '16px', color: T.text, fontWeight: 700 }}>✦ Resonanzkarte</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!karteText && (
              <button onClick={generateKarteText} disabled={loading} style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '12px', padding: '8px 18px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${T.gold}, ${T.goldD})`, color: '#1A1200', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? '⏳ Generiert…' : '✦ Generieren'}
              </button>
            )}
            {karteText && (
              <>
                <button onClick={generateKarteText} disabled={loading} style={{ fontFamily: 'Raleway', fontWeight: 600, fontSize: '11px', padding: '8px 14px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bgSoft, color: T.textMid, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                  {loading ? '⏳…' : '↻ Neu'}
                </button>
                <button onClick={handlePrint} style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '12px', padding: '8px 18px', borderRadius: '10px', border: 'none', background: T.gold, color: '#1A1200', cursor: 'pointer' }}>🖨 Drucken</button>
              </>
            )}
            <button onClick={onClose} style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '14px', padding: '8px 14px', borderRadius: '10px', border: `1.5px solid ${T.border}`, background: T.bgSoft, color: T.textMid, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>

          {/* Empty State */}
          {!karteText && !loading && (
            <div style={{ padding: '60px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>✦</div>
              <div style={{ fontFamily: 'Cinzel', fontSize: '18px', color: T.text, fontWeight: 700, marginBottom: '8px' }}>Seelenlandkarte</div>
              <div style={{ fontFamily: 'Raleway', fontSize: '13px', color: T.textMid, lineHeight: '1.7', maxWidth: '420px', margin: '0 auto 24px' }}>
                Eine persönliche Seelenlandkarte für {client.name} — eine warmherzige Synthese aus Human Design und Numerologie, die du ausdrucken und deinem Klienten mitgeben kannst.
              </div>
              <button onClick={generateKarteText} style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '14px', padding: '14px 32px', borderRadius: '14px', border: 'none', background: `linear-gradient(135deg, ${T.gold}, ${T.goldD})`, color: '#1A1200', cursor: 'pointer', boxShadow: '0 4px 16px rgba(201,168,76,0.2)' }}>
                ✦ Karte generieren
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ padding: '80px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px', animation: 'pulse 2s ease-in-out infinite' }}>✦</div>
              <div style={{ fontFamily: 'Raleway', fontSize: '14px', color: T.goldD, fontWeight: 600 }}>Seelenlandkarte wird geschrieben…</div>
              <div style={{ fontFamily: 'Raleway', fontSize: '12px', color: T.textSoft, marginTop: '6px' }}>Human Design und Numerologie werden zu einem persönlichen Brief verwoben.</div>
              <style>{`@keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
            </div>
          )}

          {/* ═══ PRINTABLE CONTENT ═══ */}
          {karteText && !loading && (
            <div ref={printRef}>

              {/* PAGE 1 */}
              <div className="rk-page" style={{
                width: '100%',
                padding: '40px 48px 32px',
                background: '#0D0D0A',
                color: '#F5F0E8',
                boxSizing: 'border-box'
              }}>

                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontFamily: 'Raleway', fontSize: '10px', fontWeight: 700, letterSpacing: '4px', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>Human Resonanz</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 600, color: '#C9A84C', letterSpacing: '2px' }}>Resonanzkarte</div>
                </div>
                <Ornament />
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 700, color: '#F5F0E8', marginBottom: '4px' }}>{client.name}</div>
                  <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.4)', letterSpacing: '1px' }}>
                    {[
                      client.birthDate && new Date(client.birthDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
                      hasHD && `${client.hdType} · ${client.hdProfile || ''}`,
                      hasNums && `Lebenszahl ${nums.lifePath}`,
                    ].filter(Boolean).join('  ·  ')}
                  </div>
                </div>
                <Ornament />

                {sections.slice(0, 3).map((sec, i) => (
                  <div key={i} style={{ marginBottom: '22px' }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', fontWeight: 700, color: '#C9A84C', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{sec.title}</div>
                    <Prose>{sec.body}</Prose>
                  </div>
                ))}

                <div style={{ marginTop: '24px', padding: '16px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Raleway', fontSize: '8px', color: 'rgba(245,240,232,0.2)', letterSpacing: '2px', textTransform: 'uppercase' }}>Lichtkern · Human Resonanz · {today}</div>
                </div>
              </div>

              {/* PAGE 2 */}
              <div className="rk-page" style={{
                width: '100%',
                padding: '40px 48px 32px',
                background: '#0D0D0A',
                color: '#F5F0E8',
                boxSizing: 'border-box'
              }}>

                {sections.slice(3).map((sec, i) => (
                  <div key={i} style={{ marginBottom: '22px' }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', fontWeight: 700, color: '#C9A84C', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{sec.title}</div>
                    <Prose>{sec.body}</Prose>
                  </div>
                ))}

                <Ornament />

                {/* Compact reference block */}
                <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                  {hasHD && (
                    <div style={{ flex: 1, padding: '14px', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '10px' }}>
                      <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 800, color: '#C9A84C', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Human Design</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 700, color: '#F5F0E8' }}>{client.hdType}</div>
                      <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.4)', marginTop: '2px' }}>{client.hdProfile && `Profil ${client.hdProfile}`}{client.hdAuthority && ` · ${client.hdAuthority}`}</div>
                      <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.35)', marginTop: '4px' }}>Strategie: {hdInfo?.strategy} · Signatur: {hdInfo?.signature}</div>
                    </div>
                  )}
                  {hasNums && (
                    <div style={{ flex: 1, padding: '14px', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '10px' }}>
                      <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 800, color: '#C9A84C', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Numerologie</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {[
                          { n: nums.lifePath, l: 'Leben' }, { n: nums.expression, l: 'Ausdruck' }, { n: nums.heartDesire, l: 'Herz' },
                          { n: nums.personality, l: 'Person.' }, { n: nums.birthDay, l: 'Geburt' }, { n: nums.attitude, l: 'Einstell.' },
                          { n: nums.maturity, l: 'Reife' }, { n: nums.generation, l: 'Gener.' },
                        ].filter(x => x.n !== null && x.n !== undefined).map(({ n, l }) => (
                          <div key={l} style={{ textAlign: 'center', width: '44px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 2px', border: `1.5px solid ${[11,22,33].includes(n)?'#C9A84C':'rgba(201,168,76,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontWeight: 700, color: [11,22,33].includes(n)?'#C9A84C':'#F5F0E8' }}>{n}</div>
                            <div style={{ fontFamily: 'Raleway', fontSize: '7px', fontWeight: 700, color: 'rgba(245,240,232,0.3)', textTransform: 'uppercase' }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {hasNums && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    {[{ n: nums.personalYear, l: 'Pers. Jahr', d: PERSONAL_YEAR_DESC[nums.personalYear] }, { n: nums.personalMonth, l: 'Pers. Monat' }, { n: nums.personalDay, l: 'Pers. Tag' }].map(({ n, l, d }) => (
                      <div key={l} style={{ flex: d ? 2 : 1, padding: '10px', border: '1px solid rgba(201,168,76,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 700, color: '#C9A84C' }}>{n}</div>
                        <div>
                          <div style={{ fontFamily: 'Raleway', fontSize: '8px', fontWeight: 700, color: 'rgba(245,240,232,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>{l}</div>
                          {d && <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: 'rgba(245,240,232,0.4)', lineHeight: '1.3', marginTop: '1px' }}>{d}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ padding: '14px', background: 'rgba(201,168,76,0.03)', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.06)' }}>
                  <Prose>Diese Karte ist eine Momentaufnahme deiner Seelenlandschaft. Die Zahlen und Energien die hier beschrieben werden, sind Einladungen — keine Festlegungen. Nimm mit, was resoniert. Lass los, was noch nicht passt. Dein Weg ist einzigartig.</Prose>
                </div>

                <div style={{ marginTop: '24px', padding: '16px 0', textAlign: 'center' }}>
                  <Ornament />
                  <div style={{ fontFamily: 'Raleway', fontSize: '8px', color: 'rgba(245,240,232,0.2)', letterSpacing: '2px', textTransform: 'uppercase' }}>Lichtkern · Human Resonanz · www.human-resonanz.de</div>
                  <div style={{ fontFamily: 'Raleway', fontSize: '7px', color: 'rgba(245,240,232,0.12)', marginTop: '2px' }}>Dient der Selbsterkenntnis · Kein Ersatz für medizinische oder therapeutische Behandlung</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ResonanzKarte };
