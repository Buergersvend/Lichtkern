import React, { useRef, useState, useEffect } from "react";
import { T } from "../config/theme.js";
import { calcNumerology, LIFE_PATH_DESC, PERSONAL_YEAR_DESC } from "./Numerology.jsx";
import { HD_TYPE_DESC, HD_AUTHORITY_DESC } from "./HumanDesign.jsx";
import { groqFetch } from "../config/groq.js";

/* ── SVG ornaments for print ── */
const CORNER_SVG = `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 58V20C2 10 10 2 20 2H58" stroke="#8B7332" stroke-width="1.8" fill="none"/><path d="M2 58V30C2 15 15 2 30 2H58" stroke="#8B7332" stroke-width="0.8" opacity="0.5" fill="none"/><circle cx="2" cy="58" r="2.5" fill="#8B7332"/><circle cx="58" cy="2" r="2.5" fill="#8B7332"/></svg>`;

const DIVIDER_SVG = `<svg width="200" height="20" viewBox="0 0 200 20" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="10" x2="80" y2="10" stroke="#8B7332" stroke-width="0.8" opacity="0.5"/><line x1="120" y1="10" x2="200" y2="10" stroke="#8B7332" stroke-width="0.8" opacity="0.5"/><path d="M92 10L100 3L108 10L100 17Z" stroke="#8B7332" stroke-width="1" fill="none" opacity="0.6"/><circle cx="100" cy="10" r="2" fill="#8B7332" opacity="0.5"/></svg>`;

const STAR_ORNAMENT = `<svg width="120" height="24" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="12" r="3" stroke="#8B7332" stroke-width="1" fill="none" opacity="0.6"/><circle cx="60" cy="12" r="1" fill="#8B7332" opacity="0.7"/><line x1="10" y1="12" x2="52" y2="12" stroke="#8B7332" stroke-width="0.6" opacity="0.4"/><line x1="68" y1="12" x2="110" y2="12" stroke="#8B7332" stroke-width="0.6" opacity="0.4"/><circle cx="10" cy="12" r="1.5" fill="#8B7332" opacity="0.3"/><circle cx="110" cy="12" r="1.5" fill="#8B7332" opacity="0.3"/></svg>`;

/* ── Watermark SVGs — visible at ~10% opacity ── */
const WATERMARK_FLOWER = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#B8A060" stroke-width="0.8">
  <circle cx="200" cy="200" r="60"/>
  <circle cx="200" cy="140" r="60"/>
  <circle cx="200" cy="260" r="60"/>
  <circle cx="252" cy="170" r="60"/>
  <circle cx="252" cy="230" r="60"/>
  <circle cx="148" cy="170" r="60"/>
  <circle cx="148" cy="230" r="60"/>
  <circle cx="200" cy="80" r="60" stroke-width="0.5"/>
  <circle cx="200" cy="320" r="60" stroke-width="0.5"/>
  <circle cx="304" cy="140" r="60" stroke-width="0.5"/>
  <circle cx="304" cy="260" r="60" stroke-width="0.5"/>
  <circle cx="96" cy="140" r="60" stroke-width="0.5"/>
  <circle cx="96" cy="260" r="60" stroke-width="0.5"/>
  <circle cx="200" cy="200" r="100" stroke-width="0.4"/>
  <circle cx="200" cy="200" r="140" stroke-width="0.3"/>
  <circle cx="200" cy="200" r="180" stroke-width="0.2"/>
</svg>`;

const WATERMARK_LOTUS = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#B8A060">
  <g transform="translate(200,200)">
    <g stroke-width="0.7">
      <ellipse cx="0" cy="0" rx="14" ry="55" transform="rotate(0)"/>
      <ellipse cx="0" cy="0" rx="14" ry="55" transform="rotate(30)"/>
      <ellipse cx="0" cy="0" rx="14" ry="55" transform="rotate(60)"/>
      <ellipse cx="0" cy="0" rx="14" ry="55" transform="rotate(90)"/>
      <ellipse cx="0" cy="0" rx="14" ry="55" transform="rotate(120)"/>
      <ellipse cx="0" cy="0" rx="14" ry="55" transform="rotate(150)"/>
    </g>
    <g stroke-width="0.5">
      <ellipse cx="0" cy="0" rx="22" ry="85" transform="rotate(0)"/>
      <ellipse cx="0" cy="0" rx="22" ry="85" transform="rotate(30)"/>
      <ellipse cx="0" cy="0" rx="22" ry="85" transform="rotate(60)"/>
      <ellipse cx="0" cy="0" rx="22" ry="85" transform="rotate(90)"/>
      <ellipse cx="0" cy="0" rx="22" ry="85" transform="rotate(120)"/>
      <ellipse cx="0" cy="0" rx="22" ry="85" transform="rotate(150)"/>
    </g>
    <g stroke-width="0.3">
      <ellipse cx="0" cy="0" rx="32" ry="115" transform="rotate(15)"/>
      <ellipse cx="0" cy="0" rx="32" ry="115" transform="rotate(45)"/>
      <ellipse cx="0" cy="0" rx="32" ry="115" transform="rotate(75)"/>
      <ellipse cx="0" cy="0" rx="32" ry="115" transform="rotate(105)"/>
      <ellipse cx="0" cy="0" rx="32" ry="115" transform="rotate(135)"/>
      <ellipse cx="0" cy="0" rx="32" ry="115" transform="rotate(165)"/>
    </g>
    <circle cx="0" cy="0" r="16" stroke-width="0.8"/>
    <circle cx="0" cy="0" r="6" fill="#B8A060" stroke="none" opacity="0.2"/>
  </g>
</svg>`;

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

function ResonanzKarte({ client, onClose, onSave }) {
  const printRef = useRef();
  // Load saved text if it's from the current month
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-05"
  const savedIsCurrentMonth = client.resonanzKarteMonth === currentMonth;
  const [karteText, setKarteText] = useState(savedIsCurrentMonth ? (client.resonanzKarteText || '') : '');
  const [loading, setLoading] = useState(false);
  const [autoGenTriggered, setAutoGenTriggered] = useState(false);

  // Auto-generate if we have data but no current-month text
  useEffect(() => {
    if (!karteText && !loading && !autoGenTriggered && (client.hdType || client.birthDate)) {
      setAutoGenTriggered(true);
      generateKarteText();
    }
  }, []); // eslint-disable-line

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

Schreibe folgende Abschnitte (jeweils 3-4 Sätze, warmherzig und tiefgründig).

WICHTIG: Verwende EXAKT diese Abschnittstitel in Großbuchstaben, jeder Titel auf einer eigenen Zeile, gefolgt vom Fließtext. Keine anderen Titel verwenden!

DEIN WESEN
Beschreibe wer dieser Mensch im Kern ist — basierend auf der Kombination von HD-Typ und Lebenszahl.

DEINE INNERE LANDSCHAFT
Was bewegt diesen Menschen innerlich? Herzzahl, Autorität und Persönlichkeitszahl.

DEIN WEG
Basierend auf Strategie, Lebenszahl und Profil: Wie navigiert dieser Mensch am besten durchs Leben?

DEINE AKTUELLE PHASE
Persönliches Jahr ${hasNums ? nums.personalYear : '?'} und was das für die nächsten Monate bedeutet.

DREI GESCHENKE FÜR DEINEN WEG
Drei konkrete, warmherzige Impulse als drei kurze Absätze, jeder beginnt mit einem kraftvollen Satz.

${nums?.karmicDebts?.length > 0 ? `DEINE KARMISCHE EINLADUNG
Was die Schuldzahl(en) ${nums.karmicDebts.join(', ')} als Einladung zur Heilung bedeuten.` : ''}

STRIKTE REGELN:
- Verwende NUR die oben genannten Abschnittstitel, EXAKT so geschrieben.
- KEINE Markdown-Formatierung (keine **, keine #, keine Aufzählungszeichen, keine nummerierte Listen).
- Nur Fließtext und Absätze. Ohne Heilversprechen.
- Schreibe in der Du-Form, sprich den Klienten direkt an.`;

      const text = await groqFetch(prompt);
      // Strip any remaining markdown artifacts
      const cleaned = text.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/^\d+\.\s+/gm, '');
      setKarteText(cleaned);
      // Persist to Firestore via parent
      if (onSave && cleaned && !cleaned.includes('nicht generiert')) {
        onSave({ ...client, resonanzKarteText: cleaned, resonanzKarteMonth: currentMonth });
      }
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
      const cleaned = line.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '').replace(/^#+\s*/, '').trim();
      // Check for known section titles OR detect all-caps lines as section headers
      const isKnownTitle = sectionTitles.some(t => cleaned.toUpperCase().includes(t));
      const isAllCapsLine = cleaned.length > 3 && cleaned.length < 60 && cleaned === cleaned.toUpperCase() && /^[A-ZÄÖÜ\s\-—·×↔]+$/.test(cleaned);
      if (isKnownTitle || isAllCapsLine) {
        if (current.body.trim()) sections.push({ ...current });
        current = { title: cleaned.replace(/\*/g, ''), body: '' };
      } else {
        current.body += (current.body ? '\n\n' : '') + cleaned;
      }
    }
    if (current.body.trim()) sections.push({ ...current });
    return sections;
  };

  /* ── Print helpers ── */
  const buildPrintSection = (sec, isFirst) => {
    const bodyParagraphs = sec.body.split('\n\n').filter(p => p.trim());
    let html = '';
    if (isFirst && bodyParagraphs.length > 0) {
      const first = bodyParagraphs[0];
      html += `<p style="font-family:'Cormorant Garamond',serif;font-size:16px;color:#2A2418;line-height:1.85;margin:0 0 12px;"><span style="float:left;font-family:'Cormorant Garamond',serif;font-size:58px;line-height:0.78;padding:2px 10px 0 0;color:#8B7332;font-weight:600;">${first.charAt(0)}</span>${first.substring(1)}</p>`;
      for (let i = 1; i < bodyParagraphs.length; i++)
        html += `<p style="font-family:'Cormorant Garamond',serif;font-size:16px;color:#2A2418;line-height:1.85;margin:0 0 12px;text-indent:1.5em;">${bodyParagraphs[i]}</p>`;
    } else {
      for (const p of bodyParagraphs)
        html += `<p style="font-family:'Cormorant Garamond',serif;font-size:16px;color:#2A2418;line-height:1.85;margin:0 0 12px;">${p}</p>`;
    }
    return `<div style="margin-bottom:26px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <div style="flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(139,115,50,0.45));"></div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:14.5px;font-weight:700;color:#8B7332;letter-spacing:3.5px;text-transform:uppercase;white-space:nowrap;">${sec.title}</div>
        <div style="flex:1;height:1px;background:linear-gradient(to left,transparent,rgba(139,115,50,0.45));"></div>
      </div>
      ${html}
    </div>`;
  };

  const buildNumCircle = (n, label) => {
    const isMaster = [11, 22, 33].includes(n);
    return `<div style="text-align:center;width:52px;">
      <div style="width:38px;height:38px;border-radius:50%;margin:0 auto 3px;border:${isMaster ? '2.5px solid #8B7332' : '1.5px solid rgba(139,115,50,0.4)'};${isMaster ? 'background:rgba(139,115,50,0.08);box-shadow:0 0 10px rgba(139,115,50,0.2);' : ''}display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:700;color:${isMaster ? '#8B7332' : '#2A2418'};">${n}</div>
      <div style="font-family:'Raleway',sans-serif;font-size:7.5px;font-weight:700;color:rgba(42,36,24,0.5);text-transform:uppercase;letter-spacing:0.5px;">${label}</div>
    </div>`;
  };

  const inlineStar = (w, op) => `<div style="text-align:center;opacity:${op};">${STAR_ORNAMENT.replace('width="120"', `width="${w}"`)}</div>`;
  const inlineDivider = (w, op) => `<div style="text-align:center;opacity:${op};">${DIVIDER_SVG.replace('width="200"', `width="${w}"`)}</div>`;
  const inlineCorner = (pos) => {
    const tr = { tl: '', br: 'transform:rotate(180deg);' };
    const ps = { tl: 'top:14mm;left:14mm;', br: 'bottom:14mm;right:14mm;' };
    return `<div style="position:absolute;${ps[pos]}width:60px;height:60px;${tr[pos]||''}">${CORNER_SVG}</div>`;
  };

  const watermark = (svg, op, top) => `<div style="position:absolute;top:${top};left:50%;transform:translate(-50%,-50%);width:480px;height:480px;opacity:${op};pointer-events:none;">${svg}</div>`;

  const pageShell = (content, wm) => `
<div class="rk-page">
  <div class="rk-frame"></div>
  ${wm || ''}
  ${inlineCorner('tl')}
  ${inlineCorner('br')}
  ${content}
</div>`;

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

    /* ── PAGE 1: Header + first 2 sections ── */
    const page1Content = `
  <div style="text-align:center;margin-bottom:4px;">
    <div style="font-family:'Raleway',sans-serif;font-size:10px;font-weight:600;letter-spacing:5px;color:rgba(139,115,50,0.45);text-transform:uppercase;">Human Resonanz</div>
  </div>
  ${inlineStar(120, 0.5)}
  <div style="text-align:center;margin:2px 0 4px;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:300;color:#8B7332;letter-spacing:3px;font-style:italic;">Resonanzkarte</div>
  </div>
  <div style="margin-bottom:12px;">${inlineDivider(200, 1)}</div>
  <div style="text-align:center;margin-bottom:2px;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:600;color:#2A2418;letter-spacing:1px;">${client.name}</div>
    <div style="font-family:'Raleway',sans-serif;font-size:12px;color:rgba(42,36,24,0.4);letter-spacing:1.5px;margin-top:5px;">${meta}</div>
  </div>
  <div style="margin-bottom:16px;">${inlineStar(100, 0.35)}</div>
  ${secs.slice(0, 2).map((s, i) => buildPrintSection(s, i === 0)).join('')}
  <div style="position:absolute;bottom:14mm;left:0;right:0;text-align:center;">
    <div style="font-family:'Raleway',sans-serif;font-size:7.5px;color:rgba(42,36,24,0.28);letter-spacing:2.5px;text-transform:uppercase;">Lichtkern · Human Resonanz · ${today}</div>
  </div>`;

    /* ── PAGE 2: Remaining text sections ── */
    const page2Content = `
  ${inlineStar(100, 0.35)}
  <div style="margin-top:12px;">
    ${secs.slice(2).map(s => buildPrintSection(s, false)).join('')}
  </div>
  <div style="position:absolute;bottom:14mm;left:0;right:0;text-align:center;">
    <div style="font-family:'Raleway',sans-serif;font-size:7.5px;color:rgba(42,36,24,0.28);letter-spacing:2.5px;text-transform:uppercase;">Lichtkern · Human Resonanz · Seite 2</div>
  </div>`;

    /* ── PAGE 3: Data overview + closing ── */
    const page3Content = `
  ${inlineStar(100, 0.35)}
  <div style="text-align:center;margin:8px 0 18px;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:300;color:#8B7332;letter-spacing:2px;font-style:italic;">Deine Resonanz auf einen Blick</div>
  </div>
  <div style="margin-bottom:14px;">${inlineDivider(160, 0.6)}</div>

  <div style="display:flex;gap:16px;margin-bottom:18px;">
    ${hasHD ? `<div style="flex:1;padding:18px;border:1.5px solid rgba(139,115,50,0.3);border-radius:8px;background:rgba(139,115,50,0.03);">
      <div style="font-family:'Raleway',sans-serif;font-size:9px;font-weight:700;color:#8B7332;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:10px;">✦ Human Design</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;color:#2A2418;">${client.hdType}</div>
      <div style="font-family:'Raleway',sans-serif;font-size:11px;color:rgba(42,36,24,0.6);margin-top:3px;">${client.hdProfile ? `Profil ${client.hdProfile}` : ''}${client.hdAuthority ? ` · ${client.hdAuthority}` : ''}</div>
      <div style="width:30px;height:1px;background:rgba(139,115,50,0.35);margin:10px 0;"></div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:12px;color:rgba(42,36,24,0.6);font-style:italic;">Strategie: ${hdInfo?.strategy || '—'}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:12px;color:rgba(42,36,24,0.6);font-style:italic;margin-top:2px;">Signatur: ${hdInfo?.signature || '—'}</div>
    </div>` : ''}
    ${hasNums ? `<div style="flex:1;padding:18px;border:1.5px solid rgba(139,115,50,0.3);border-radius:8px;background:rgba(139,115,50,0.03);">
      <div style="font-family:'Raleway',sans-serif;font-size:9px;font-weight:700;color:#8B7332;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:12px;">✦ Numerologie</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
        ${numCircles.map(x => buildNumCircle(x.n, x.l)).join('')}
      </div>
    </div>` : ''}
  </div>

  ${hasNums ? `<div style="display:flex;gap:10px;margin-bottom:20px;">
    ${timeBlocks.map(({ n, l, d }) => `<div style="flex:${d ? 2 : 1};padding:12px 14px;border:1.5px solid rgba(139,115,50,0.2);border-radius:8px;display:flex;align-items:center;gap:12px;background:rgba(139,115,50,0.02);">
      <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:#8B7332;line-height:1;">${n}</div>
      <div>
        <div style="font-family:'Raleway',sans-serif;font-size:8px;font-weight:700;color:rgba(42,36,24,0.5);letter-spacing:1.5px;text-transform:uppercase;">${l}</div>
        ${d ? `<div style="font-family:'Cormorant Garamond',serif;font-size:11px;color:rgba(42,36,24,0.55);line-height:1.3;margin-top:2px;font-style:italic;">${d}</div>` : ''}
      </div>
    </div>`).join('')}
  </div>` : ''}

  <div style="padding:20px 26px;background:rgba(139,115,50,0.04);border-radius:10px;border:1.5px solid rgba(139,115,50,0.15);text-align:center;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:16px;color:rgba(42,36,24,0.65);line-height:2;font-style:italic;">Diese Karte ist eine Momentaufnahme deiner Seelenlandschaft.<br>Die Zahlen und Energien die hier beschrieben werden, sind Einladungen — keine Festlegungen.<br>Nimm mit, was resoniert. Lass los, was noch nicht passt.<br>Dein Weg ist einzigartig.</div>
  </div>

  <div style="position:absolute;bottom:16mm;left:0;right:0;text-align:center;">
    ${inlineStar(80, 0.4)}
    <div style="font-family:'Raleway',sans-serif;font-size:7.5px;color:rgba(42,36,24,0.28);letter-spacing:2.5px;text-transform:uppercase;margin-top:5px;">Lichtkern · Human Resonanz · www.human-resonanz.de</div>
    <div style="font-family:'Raleway',sans-serif;font-size:6.5px;color:rgba(42,36,24,0.2);margin-top:3px;letter-spacing:1px;">Dient der Selbsterkenntnis · Kein Ersatz für medizinische oder therapeutische Behandlung</div>
  </div>`;

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
    padding: 28mm 26mm 20mm;
    background: #FFFDF8;
    overflow: hidden;
  }
  .rk-frame {
    position: absolute;
    top: 10mm; right: 10mm; bottom: 10mm; left: 10mm;
    border: 1px solid rgba(139,115,50,0.35);
    pointer-events: none;
  }
  .rk-frame::after {
    content: '';
    position: absolute;
    top: 3px; right: 3px; bottom: 3px; left: 3px;
    border: 0.5px solid rgba(139,115,50,0.18);
  }
</style></head><body>

${pageShell(page1Content, watermark(WATERMARK_FLOWER, 0.30, '55%'))}
${pageShell(page2Content, watermark(WATERMARK_LOTUS, 0.25, '55%'))}
${pageShell(page3Content, watermark(WATERMARK_FLOWER, 0.18, '55%'))}

</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(printHTML);
    win.document.close();
    setTimeout(() => { win.print(); }, 700);
  };

  const sections = parseSections(karteText);

  /* ═══ SCREEN UI (unchanged) ═══ */
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        position: 'relative', background: T.bgCard, borderRadius: '20px',
        border: `1px solid ${T.border}`, width: '100%', maxWidth: '780px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Toolbar */}
        <div className="rk-no-print" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.bgCard
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

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
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
          {loading && (
            <div style={{ padding: '80px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px', animation: 'pulse 2s ease-in-out infinite' }}>✦</div>
              <div style={{ fontFamily: 'Raleway', fontSize: '14px', color: T.goldD, fontWeight: 600 }}>Seelenlandkarte wird geschrieben…</div>
              <div style={{ fontFamily: 'Raleway', fontSize: '12px', color: T.textSoft, marginTop: '6px' }}>Human Design und Numerologie werden zu einem persönlichen Brief verwoben.</div>
              <style>{`@keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
            </div>
          )}
          {karteText && !loading && (
            <div ref={printRef}>
              <div className="rk-page" style={{ width: '100%', padding: '40px 48px 32px', background: '#0D0D0A', color: '#F5F0E8', boxSizing: 'border-box' }}>
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontFamily: 'Raleway', fontSize: '10px', fontWeight: 700, letterSpacing: '4px', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>Human Resonanz</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 600, color: '#C9A84C', letterSpacing: '2px' }}>Resonanzkarte</div>
                </div>
                <Ornament />
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 700, color: '#F5F0E8', marginBottom: '4px' }}>{client.name}</div>
                  <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: 'rgba(245,240,232,0.4)', letterSpacing: '1px' }}>
                    {[client.birthDate && new Date(client.birthDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }), hasHD && `${client.hdType} · ${client.hdProfile || ''}`, hasNums && `Lebenszahl ${nums.lifePath}`].filter(Boolean).join('  ·  ')}
                  </div>
                </div>
                <Ornament />
                {sections.map((sec, i) => (
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
                        {[{n:nums.lifePath,l:'Leben'},{n:nums.expression,l:'Ausdruck'},{n:nums.heartDesire,l:'Herz'},{n:nums.personality,l:'Person.'},{n:nums.birthDay,l:'Geburt'},{n:nums.attitude,l:'Einstell.'},{n:nums.maturity,l:'Reife'},{n:nums.generation,l:'Gener.'}].filter(x=>x.n!==null&&x.n!==undefined).map(({n,l})=>(
                          <div key={l} style={{textAlign:'center',width:'44px'}}>
                            <div style={{width:'32px',height:'32px',borderRadius:'50%',margin:'0 auto 2px',border:`1.5px solid ${[11,22,33].includes(n)?'#C9A84C':'rgba(201,168,76,0.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond', serif",fontSize:'14px',fontWeight:700,color:[11,22,33].includes(n)?'#C9A84C':'#F5F0E8'}}>{n}</div>
                            <div style={{fontFamily:'Raleway',fontSize:'7px',fontWeight:700,color:'rgba(245,240,232,0.3)',textTransform:'uppercase'}}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {hasNums && (
                  <div style={{display:'flex',gap:'10px',marginBottom:'16px'}}>
                    {[{n:nums.personalYear,l:'Pers. Jahr',d:PERSONAL_YEAR_DESC[nums.personalYear]},{n:nums.personalMonth,l:'Pers. Monat'},{n:nums.personalDay,l:'Pers. Tag'}].map(({n,l,d})=>(
                      <div key={l} style={{flex:d?2:1,padding:'10px',border:'1px solid rgba(201,168,76,0.08)',borderRadius:'8px',display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'24px',fontWeight:700,color:'#C9A84C'}}>{n}</div>
                        <div>
                          <div style={{fontFamily:'Raleway',fontSize:'8px',fontWeight:700,color:'rgba(245,240,232,0.35)',letterSpacing:'1px',textTransform:'uppercase'}}>{l}</div>
                          {d&&<div style={{fontFamily:'Raleway',fontSize:'10px',color:'rgba(245,240,232,0.4)',lineHeight:'1.3',marginTop:'1px'}}>{d}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{padding:'14px',background:'rgba(201,168,76,0.03)',borderRadius:'10px',border:'1px solid rgba(201,168,76,0.06)'}}>
                  <Prose>Diese Karte ist eine Momentaufnahme deiner Seelenlandschaft. Die Zahlen und Energien die hier beschrieben werden, sind Einladungen — keine Festlegungen. Nimm mit, was resoniert. Lass los, was noch nicht passt. Dein Weg ist einzigartig.</Prose>
                </div>
                <div style={{marginTop:'24px',padding:'16px 0',textAlign:'center'}}>
                  <Ornament />
                  <div style={{fontFamily:'Raleway',fontSize:'8px',color:'rgba(245,240,232,0.2)',letterSpacing:'2px',textTransform:'uppercase'}}>Lichtkern · Human Resonanz · www.human-resonanz.de</div>
                  <div style={{fontFamily:'Raleway',fontSize:'7px',color:'rgba(245,240,232,0.12)',marginTop:'2px'}}>Dient der Selbsterkenntnis · Kein Ersatz für medizinische oder therapeutische Behandlung</div>
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
