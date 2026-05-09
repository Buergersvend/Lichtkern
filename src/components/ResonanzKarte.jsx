import React, { useRef, useState } from "react";
import { T } from "../config/theme.js";
import { calcNumerology, LIFE_PATH_DESC, PERSONAL_YEAR_DESC } from "./Numerology.jsx";
import { HD_TYPE_DESC, HD_AUTHORITY_DESC } from "./HumanDesign.jsx";
import { groqFetch } from "../config/groq.js";

/* ── SVG ornaments for print (inline, not as img src) ── */
const CORNER_SVG = `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 58V20C2 10 10 2 20 2H58" stroke="#8B7332" stroke-width="1.2" fill="none"/><path d="M2 58V30C2 15 15 2 30 2H58" stroke="#8B7332" stroke-width="0.5" opacity="0.4" fill="none"/><circle cx="2" cy="58" r="2" fill="#8B7332"/><circle cx="58" cy="2" r="2" fill="#8B7332"/></svg>`;

const DIVIDER_SVG = `<svg width="200" height="20" viewBox="0 0 200 20" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="10" x2="80" y2="10" stroke="#8B7332" stroke-width="0.5" opacity="0.3"/><line x1="120" y1="10" x2="200" y2="10" stroke="#8B7332" stroke-width="0.5" opacity="0.3"/><path d="M92 10L100 3L108 10L100 17Z" stroke="#8B7332" stroke-width="0.8" fill="none" opacity="0.5"/><circle cx="100" cy="10" r="2" fill="#8B7332" opacity="0.4"/></svg>`;

const STAR_ORNAMENT = `<svg width="120" height="24" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="12" r="3" stroke="#8B7332" stroke-width="0.8" fill="none" opacity="0.5"/><circle cx="60" cy="12" r="1" fill="#8B7332" opacity="0.6"/><line x1="10" y1="12" x2="52" y2="12" stroke="#8B7332" stroke-width="0.4" opacity="0.25"/><line x1="68" y1="12" x2="110" y2="12" stroke="#8B7332" stroke-width="0.4" opacity="0.25"/><circle cx="10" cy="12" r="1.5" fill="#8B7332" opacity="0.2"/><circle cx="110" cy="12" r="1.5" fill="#8B7332" opacity="0.2"/></svg>`;

const printCSS = `
@media print {
  body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rk-no-print { display: none !important; }
  .rk-page { page-break-after: always; break-after: page; }
  .rk-page:last-child { page-break-after: avoid; break-after: avoid; }
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

  /* ── Build premium print HTML ── */
  const buildPrintSection = (sec, isFirst) => {
    const bodyParagraphs = sec.body.split('\n\n').filter(p => p.trim());
    let html = '';

    if (isFirst && bodyParagraphs.length > 0) {
      const firstPara = bodyParagraphs[0];
      const firstChar = firstPara.charAt(0);
      const rest = firstPara.substring(1);
      html += `<p style="font-family:'Cormorant Garamond',serif;font-size:13px;color:#2A2418;line-height:1.9;margin:0 0 10px;"><span style="float:left;font-family:'Cormorant Garamond',serif;font-size:52px;line-height:0.78;padding:2px 8px 0 0;color:#8B7332;font-weight:600;">${firstChar}</span>${rest}</p>`;
      for (let i = 1; i < bodyParagraphs.length; i++) {
        html += `<p style="font-family:'Cormorant Garamond',serif;font-size:13px;color:#2A2418;line-height:1.9;margin:0 0 10px;text-indent:1.5em;">${bodyParagraphs[i]}</p>`;
      }
    } else {
      for (const p of bodyParagraphs) {
        html += `<p style="font-family:'Cormorant Garamond',serif;font-size:13px;color:#2A2418;line-height:1.9;margin:0 0 10px;">${p}</p>`;
      }
    }

    return `
      <div style="margin-bottom:26px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(139,115,50,0.25));"></div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:12px;font-weight:700;color:#8B7332;letter-spacing:3.5px;text-transform:uppercase;white-space:nowrap;">${sec.title}</div>
          <div style="flex:1;height:1px;background:linear-gradient(to left,transparent,rgba(139,115,50,0.25));"></div>
        </div>
        ${html}
      </div>`;
  };

  const buildNumCircle = (n, label) => {
    const isMaster = [11, 22, 33].includes(n);
    return `<div style="text-align:center;width:52px;">
      <div style="width:38px;height:38px;border-radius:50%;margin:0 auto 3px;border:${isMaster ? '2px solid #8B7332' : '1.5px solid rgba(139,115,50,0.25)'};${isMaster ? 'background:rgba(139,115,50,0.06);box-shadow:0 0 10px rgba(139,115,50,0.15);' : ''}display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:700;color:${isMaster ? '#8B7332' : '#2A2418'};">${n}</div>
      <div style="font-family:'Raleway',sans-serif;font-size:7px;font-weight:700;color:rgba(42,36,24,0.4);text-transform:uppercase;letter-spacing:0.5px;">${label}</div>
    </div>`;
  };

  const handlePrint = () => {
    const secs = parseSections(karteText);
    const meta = [
      client.birthDate && new Date(client.birthDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
      hasHD && `${client.hdType} · ${client.hdProfile || ''}`,
      hasNums && `Lebenszahl ${nums.lifePath}`,
    ].filter(Boolean).join('  ·  ');

    const numCircles = hasNums ? [
      { n: nums.lifePath, l: 'Leben' }, { n: nums.expression, l: 'Ausdruck' }, { n: nums.heartDesire, l: 'Herz' },
      { n: nums.personality, l: 'Person.' }, { n: nums.birthDay, l: 'Geburt' }, { n: nums.attitude, l: 'Einstell.' },
      { n: nums.maturity, l: 'Reife' }, { n: nums.generation, l: 'Gener.' },
    ].filter(x => x.n !== null && x.n !== undefined) : [];

    const timeBlocks = hasNums ? [
      { n: nums.personalYear, l: 'Persönliches Jahr', d: PERSONAL_YEAR_DESC[nums.personalYear] },
      { n: nums.personalMonth, l: 'Persönlicher Monat' },
      { n: nums.personalDay, l: 'Persönlicher Tag' },
    ] : [];

    /* Inline SVG wrappers — rendered directly in the HTML, no img/data-uri */
    const inlineStar = (w, op) => `<div style="text-align:center;opacity:${op};">${STAR_ORNAMENT.replace('width="120"', `width="${w}"`).replace('height="24"', 'height="24"')}</div>`;
    const inlineDivider = (w, op) => `<div style="text-align:center;opacity:${op};">${DIVIDER_SVG.replace('width="200"', `width="${w}"`)}</div>`;
    const inlineCorner = (pos) => {
      const transforms = {
        tl: '',
        tr: 'transform:scaleX(-1);',
        bl: 'transform:scaleY(-1);',
        br: 'transform:rotate(180deg);',
      };
      const positions = {
        tl: 'top:16mm;left:16mm;',
        tr: 'top:16mm;right:16mm;',
        bl: 'bottom:16mm;left:16mm;',
        br: 'bottom:16mm;right:16mm;',
      };
      return `<div style="position:absolute;${positions[pos]}width:60px;height:60px;${transforms[pos]}">${CORNER_SVG}</div>`;
    };

    const printHTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Resonanzkarte — ${client.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Raleway:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  ${printCSS}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cormorant Garamond', serif; background: #FFFDF8; color: #2A2418; }
  .rk-page {
    position: relative;
    width: 210mm; min-height: 297mm;
    padding: 30mm 28mm 22mm;
    background: #FFFDF8;
    overflow: hidden;
  }
  /* Double border frame */
  .rk-frame {
    position: absolute;
    top: 12mm; right: 12mm; bottom: 12mm; left: 12mm;
    border: 0.6px solid rgba(139,115,50,0.18);
    pointer-events: none;
  }
  .rk-frame::after {
    content: '';
    position: absolute;
    top: 3px; right: 3px; bottom: 3px; left: 3px;
    border: 0.3px solid rgba(139,115,50,0.09);
  }
</style></head><body>

<!-- PAGE 1 -->
<div class="rk-page">
  <div class="rk-frame"></div>
  ${inlineCorner('tl')}
  ${inlineCorner('br')}

  <div style="text-align:center;margin-bottom:6px;">
    <div style="font-family:'Raleway',sans-serif;font-size:9px;font-weight:600;letter-spacing:5px;color:rgba(139,115,50,0.45);text-transform:uppercase;">Human Resonanz</div>
  </div>

  ${inlineStar(120, 0.5)}

  <div style="text-align:center;margin:2px 0 4px;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:300;color:#8B7332;letter-spacing:3px;font-style:italic;">Resonanzkarte</div>
  </div>

  <div style="margin-bottom:14px;">${inlineDivider(200, 1)}</div>

  <div style="text-align:center;margin-bottom:4px;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:#2A2418;letter-spacing:1px;">${client.name}</div>
    <div style="font-family:'Raleway',sans-serif;font-size:10px;color:rgba(42,36,24,0.4);letter-spacing:1.5px;margin-top:5px;">${meta}</div>
  </div>

  <div style="margin-bottom:18px;">${inlineStar(100, 0.35)}</div>

  ${secs.slice(0, 3).map((s, i) => buildPrintSection(s, i === 0)).join('')}

  <div style="position:absolute;bottom:16mm;left:0;right:0;text-align:center;">
    <div style="font-family:'Raleway',sans-serif;font-size:7px;color:rgba(42,36,24,0.18);letter-spacing:2.5px;text-transform:uppercase;">Lichtkern · Human Resonanz · ${today}</div>
  </div>
</div>

<!-- PAGE 2 -->
<div class="rk-page">
  <div class="rk-frame"></div>
  ${inlineCorner('tl')}
  ${inlineCorner('br')}

  <div style="margin-bottom:18px;">${inlineStar(100, 0.35)}</div>

  ${secs.slice(3).map(s => buildPrintSection(s, false)).join('')}

  <div style="margin:22px 0 18px;">${inlineDivider(180, 0.5)}</div>

  <!-- Reference blocks -->
  <div style="display:flex;gap:16px;margin-bottom:16px;">
    ${hasHD ? `<div style="flex:1;padding:16px;border:1px solid rgba(139,115,50,0.15);border-radius:8px;background:rgba(139,115,50,0.02);">
      <div style="font-family:'Raleway',sans-serif;font-size:8px;font-weight:700;color:#8B7332;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:8px;">✦ Human Design</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:#2A2418;">${client.hdType}</div>
      <div style="font-family:'Raleway',sans-serif;font-size:10px;color:rgba(42,36,24,0.5);margin-top:3px;">${client.hdProfile ? `Profil ${client.hdProfile}` : ''}${client.hdAuthority ? ` · ${client.hdAuthority}` : ''}</div>
      <div style="width:30px;height:1px;background:rgba(139,115,50,0.2);margin:8px 0;"></div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:11px;color:rgba(42,36,24,0.5);font-style:italic;">Strategie: ${hdInfo?.strategy || '—'}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:11px;color:rgba(42,36,24,0.5);font-style:italic;">Signatur: ${hdInfo?.signature || '—'}</div>
    </div>` : ''}

    ${hasNums ? `<div style="flex:1;padding:16px;border:1px solid rgba(139,115,50,0.15);border-radius:8px;background:rgba(139,115,50,0.02);">
      <div style="font-family:'Raleway',sans-serif;font-size:8px;font-weight:700;color:#8B7332;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:10px;">✦ Numerologie</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
        ${numCircles.map(x => buildNumCircle(x.n, x.l)).join('')}
      </div>
    </div>` : ''}
  </div>

  ${hasNums ? `<div style="display:flex;gap:10px;margin-bottom:16px;">
    ${timeBlocks.map(({ n, l, d }) => `<div style="flex:${d ? 2 : 1};padding:10px 14px;border:1px solid rgba(139,115,50,0.1);border-radius:8px;display:flex;align-items:center;gap:12px;background:rgba(139,115,50,0.015);">
      <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:#8B7332;line-height:1;">${n}</div>
      <div>
        <div style="font-family:'Raleway',sans-serif;font-size:7px;font-weight:700;color:rgba(42,36,24,0.4);letter-spacing:1.5px;text-transform:uppercase;">${l}</div>
        ${d ? `<div style="font-family:'Cormorant Garamond',serif;font-size:10px;color:rgba(42,36,24,0.45);line-height:1.3;margin-top:2px;font-style:italic;">${d}</div>` : ''}
      </div>
    </div>`).join('')}
  </div>` : ''}

  <!-- Closing message -->
  <div style="padding:18px 24px;background:rgba(139,115,50,0.025);border-radius:10px;border:1px solid rgba(139,115,50,0.08);text-align:center;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:13px;color:rgba(42,36,24,0.55);line-height:1.9;font-style:italic;">Diese Karte ist eine Momentaufnahme deiner Seelenlandschaft.<br>Die Zahlen und Energien die hier beschrieben werden, sind Einladungen — keine Festlegungen.<br>Nimm mit, was resoniert. Lass los, was noch nicht passt.<br>Dein Weg ist einzigartig.</div>
  </div>

  <div style="position:absolute;bottom:18mm;left:0;right:0;text-align:center;">
    ${inlineStar(80, 0.25)}
    <div style="font-family:'Raleway',sans-serif;font-size:7.5px;color:rgba(42,36,24,0.18);letter-spacing:2.5px;text-transform:uppercase;margin-top:5px;">Lichtkern · Human Resonanz · www.human-resonanz.de</div>
    <div style="font-family:'Raleway',sans-serif;font-size:6.5px;color:rgba(42,36,24,0.12);margin-top:3px;letter-spacing:1px;">Dient der Selbsterkenntnis · Kein Ersatz für medizinische oder therapeutische Behandlung</div>
  </div>
</div>

</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(printHTML);
    win.document.close();
    setTimeout(() => { win.print(); }, 700);
  };

  const sections = parseSections(karteText);

  return (
    <div style={{
      position: 'fixed',
      top: 0, right: 0, bottom: 0, left: 0,
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

        {/* Toolbar */}
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
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

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

          {/* ═══ SCREEN PREVIEW (Dark) ═══ */}
          {karteText && !loading && (
            <div ref={printRef}>

              {/* PAGE 1 */}
              <div className="rk-page" style={{
                width: '100%', padding: '40px 48px 32px',
                background: '#0D0D0A', color: '#F5F0E8', boxSizing: 'border-box'
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
                width: '100%', padding: '40px 48px 32px',
                background: '#0D0D0A', color: '#F5F0E8', boxSizing: 'border-box'
              }}>
                {sections.slice(3).map((sec, i) => (
                  <div key={i} style={{ marginBottom: '22px' }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', fontWeight: 700, color: '#C9A84C', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{sec.title}</div>
                    <Prose>{sec.body}</Prose>
                  </div>
                ))}

                <Ornament />

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
