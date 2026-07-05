import React, { useState, useMemo } from "react";
import { T } from "../config/theme.js";
import { Card, Btn, SL } from "./UI.jsx";
import { Flower } from "./Decorations";
import { groqFetch } from "../config/groq.js";
import { enthältReizwort, REIZWORT_HINWEIS } from "../oracle/reizwortFilter.js";
import { ResonanzKarte } from "./ResonanzKarte.jsx";

// ─── PYTHAGOREAN LETTER MAP ────────────────────────────────────────────────
const PYTH = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
  Ä:1,Ö:6,Ü:3,ß:1
};
const VOWELS = new Set(['A','E','I','O','U','Ä','Ö','Ü']);

// ─── CORE CALCULATION HELPERS ──────────────────────────────────────────────
function digitSum(n) {
  let s = Math.abs(n);
  while (s > 9 && s !== 11 && s !== 22 && s !== 33) {
    s = String(s).split('').reduce((a, d) => a + Number(d), 0);
  }
  return s;
}

function digitSumStrict(n) {
  // Reduces fully, no master number preservation
  let s = Math.abs(n);
  while (s > 9) {
    s = String(s).split('').reduce((a, d) => a + Number(d), 0);
  }
  return s;
}

function lettersToSum(name, filterFn) {
  const letters = name.toUpperCase().replace(/[^A-ZÄÖÜß]/g, '').split('');
  const filtered = filterFn ? letters.filter(filterFn) : letters;
  const sum = filtered.reduce((a, ch) => a + (PYTH[ch] || 0), 0);
  return { sum, reduced: digitSum(sum), letters: filtered };
}

// ─── ALL NUMEROLOGY CALCULATIONS ───────────────────────────────────────────
function calcNumerology(birthDate, birthName) {
  if (!birthDate) return null;

  const [y, m, d] = birthDate.split('-').map(Number);
  if (!y || !m || !d) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // ── Geburtsdatum-basiert ──
  const dayR = digitSum(d);
  const monthR = digitSum(m);
  const yearR = digitSum(y);
  
  // Lebenszahl: Tag, Monat, Jahr EINZELN reduzieren, dann addieren
  // So bleibt 22 erhalten: z.B. 17.06.1979 → 8+6+8 = 22 (Meisterzahl!)
  const lifePathRaw = dayR + monthR + yearR;
  const lifePath = digitSum(lifePathRaw);

  // Geburtszahl (Tag allein reduziert)
  const birthDay = dayR;

  // Einstellungszahl: Tag + Monat (nicht reduzierte Summe → dann reduzieren)
  const attitudeRaw = d + m;
  const attitude = digitSumStrict(attitudeRaw);

  // Generationszahl: Quersumme des Geburtsjahres
  const generation = yearR;

  // Persönliches Jahr: reduzierter Tag + reduzierter Monat + reduziertes aktuelles Jahr
  const currentYearR = digitSumStrict(currentYear);
  const personalYearRaw = dayR + monthR + currentYearR;
  const personalYear = digitSumStrict(personalYearRaw);

  // Persönlicher Monat: Persönliches Jahr + aktueller Monat
  const personalMonth = digitSumStrict(personalYear + currentMonth);

  // Persönlicher Tag: Persönlicher Monat + aktueller Tag
  const personalDay = digitSumStrict(personalMonth + currentDay);

  // ── Namens-basiert (Meisterzahlen werden bei Namenszahlen NICHT erhalten) ──
  let expression = null, heartDesire = null, personality = null, maturity = null, spiritual = null;

  if (birthName && birthName.trim().length > 1) {
    // Ausdruckszahl / Schicksalszahl: Alle Buchstaben
    const expr = lettersToSum(birthName);
    expression = digitSumStrict(expr.sum);

    // Herzzahl / Seelenzahl: Nur Vokale
    const heart = lettersToSum(birthName, ch => VOWELS.has(ch));
    heartDesire = digitSumStrict(heart.sum);

    // Persönlichkeitszahl: Nur Konsonanten
    const pers = lettersToSum(birthName, ch => !VOWELS.has(ch));
    personality = digitSumStrict(pers.sum);

    // Reifezahl: Lebenszahl + Ausdruckszahl (Meisterzahlen hier erhalten)
    maturity = digitSum(lifePath + expression);

    // Spirituelle Zahl / Kraftzahl
    spiritual = digitSumStrict(heartDesire + personality);
  }

  // Karmische Schuldzahlen prüfen (13, 14, 16, 19 in Zwischensummen)
  const karmicDebts = [];
  const allRawSums = [lifePathRaw, attitudeRaw];
  if (allRawSums.includes(13)) karmicDebts.push(13);
  if (allRawSums.includes(14)) karmicDebts.push(14);
  if (allRawSums.includes(16)) karmicDebts.push(16);
  if (allRawSums.includes(19)) karmicDebts.push(19);

  return {
    lifePath, birthDay, attitude, generation,
    personalYear, personalMonth, personalDay,
    expression, heartDesire, personality, maturity, spiritual,
    karmicDebts,
    isMaster: [11, 22, 33].includes(lifePath),
    raw: { lifePathRaw, y, m, d }
  };
}

// ─── INTERPRETATION TEXTS ──────────────────────────────────────────────────
const LIFE_PATH_DESC = {
  1:  { title:'Der Pionier', essence:'Unabhängigkeit, Führung, Innovation', desc:'Du bist hier um neue Wege zu gehen. Deine Seele verlangt nach Originalität und Selbstständigkeit. Du bist geboren um zu initiieren — nicht um zu folgen.' },
  2:  { title:'Der Diplomat', essence:'Harmonie, Partnerschaft, Sensibilität', desc:'Deine Gabe ist es, Brücken zu bauen. Du spürst die feinen Schwingungen zwischen Menschen und schaffst Ausgleich wo Dissonanz herrscht.' },
  3:  { title:'Der Kreative', essence:'Ausdruck, Freude, Kommunikation', desc:'Das Leben will durch dich ausgedrückt werden — in Worten, Bildern, Klängen. Deine Kreativität ist kein Hobby, sie ist deine Bestimmung.' },
  4:  { title:'Der Baumeister', essence:'Struktur, Stabilität, Ausdauer', desc:'Du bist der Fels in der Brandung. Deine Aufgabe ist es, solide Fundamente zu schaffen — für dich und andere. Meisterhafte Manifestation durch Disziplin.' },
  5:  { title:'Der Freigeist', essence:'Freiheit, Wandel, Erfahrung', desc:'Deine Seele braucht Abenteuer und Veränderung. Du bist hier um alle Facetten des Lebens zu erfahren und durch deine Geschichten andere zu inspirieren.' },
  6:  { title:'Der Nährende', essence:'Liebe, Verantwortung, Fürsorge', desc:'Du trägst das Herz der Welt. Deine Bestimmung liegt im Dienst an anderen — in Familie, Gemeinschaft und Begleitung. Liebe ist dein Kompass.' },
  7:  { title:'Der Mystiker', essence:'Weisheit, Analyse, Spiritualität', desc:'Du bist der Sucher nach Wahrheit. Dein Verstand und deine Intuition arbeiten zusammen, um die tieferen Schichten der Realität zu durchdringen.' },
  8:  { title:'Der Souverän', essence:'Macht, Fülle, Manifestation', desc:'Du bist hier um materielle und spirituelle Fülle zu meistern. Deine Lektion: Macht mit Integrität zu tragen und Überfluss zu teilen.' },
  9:  { title:'Der Weise', essence:'Vollendung, Mitgefühl, Transformation', desc:'Du trägst die Weisheit aller Zahlen in dir. Dein Weg ist das Loslassen, das Dienen und die Transformation — du bist hier um einen Zyklus zu vollenden.' },
  11: { title:'Der Inspirierte — Meisterzahl', essence:'Intuition, Inspiration, spirituelle Führung', desc:'Du trägst eine besondere Frequenz. Als 11 bist du ein Kanal für höhere Wahrheiten. Deine Intuition ist überdurchschnittlich — lerne ihr zu vertrauen, auch wenn der Verstand zweifelt.' },
  22: { title:'Der Meisterbaumeister — Meisterzahl', essence:'Vision, Manifestation, globaler Einfluss', desc:'Die kraftvollste aller Zahlen. Du hast die Fähigkeit, spirituelle Visionen in materielle Realität umzusetzen. Du baust nicht für dich — du baust für die Menschheit.' },
  33: { title:'Der Meisterlehrer — Meisterzahl', essence:'Bedingungslose Liebe, nährende Präsenz', desc:'Die seltenste Meisterzahl. Du bist hier um durch dein Sein zu lehren. Deine bloße Anwesenheit kann Menschen aufrichten. Bedingungslose Liebe ist dein höchster Ausdruck.' },
};

const PERSONAL_YEAR_DESC = {
  1: 'Neuanfang — Zeit zu säen. Neue Projekte, neue Richtungen, frische Energie.',
  2: 'Geduld & Partnerschaft — Samen brauchen Zeit. Kooperationen stärken.',
  3: 'Kreativität & Ausdruck — Deine Ideen wollen raus. Sichtbar werden.',
  4: 'Fundament bauen — Harte Arbeit, die sich langfristig auszahlt.',
  5: 'Wandel & Freiheit — Altes loslassen, Neues willkommen heißen.',
  6: 'Verantwortung & Liebe — Familie, Heim, Fürsorge stehen im Fokus.',
  7: 'Innenschau & Weisheit — Rückzug, Lernen, spirituelle Vertiefung.',
  8: 'Ernte & Fülle — Die Früchte vergangener Jahre einfahren.',
  9: 'Vollendung & Loslassen — Ein Zyklus endet. Raum für Neues schaffen.',
};

const HEART_DESIRE_DESC = {
  1: 'Dein Herz sehnt sich nach Unabhängigkeit und eigener Schöpferkraft.',
  2: 'Dein Herz sehnt sich nach Harmonie, Liebe und tiefer Verbindung.',
  3: 'Dein Herz sehnt sich nach kreativem Ausdruck und Lebensfreude.',
  4: 'Dein Herz sehnt sich nach Sicherheit, Ordnung und Beständigkeit.',
  5: 'Dein Herz sehnt sich nach Freiheit, Abenteuer und Erfahrung.',
  6: 'Dein Herz sehnt sich nach Fürsorge, Familie und Schönheit.',
  7: 'Dein Herz sehnt sich nach Wahrheit, Stille und tiefem Verstehen.',
  8: 'Dein Herz sehnt sich nach Einfluss, Fülle und Meisterschaft.',
  9: 'Dein Herz sehnt sich nach Sinn, Mitgefühl und Transformation.',
  11:'Dein Herz sehnt sich nach spiritueller Erkenntnis und Inspiration.',
  22:'Dein Herz sehnt sich danach, Großes in die Welt zu bringen.',
  33:'Dein Herz sehnt sich nach bedingungsloser Liebe und Dienst.',
};

const EXPRESSION_DESC = {
  1: 'Dein natürliches Talent: Führen, initiieren, Pionierarbeit leisten.',
  2: 'Dein natürliches Talent: Vermitteln, verbinden, Harmonie schaffen.',
  3: 'Dein natürliches Talent: Kommunizieren, inspirieren, erschaffen.',
  4: 'Dein natürliches Talent: Organisieren, strukturieren, manifestieren.',
  5: 'Dein natürliches Talent: Anpassen, erneuern, andere befreien.',
  6: 'Dein natürliches Talent: Umsorgen, nähren, Schönheit schaffen.',
  7: 'Dein natürliches Talent: Analysieren, forschen, Wahrheit finden.',
  8: 'Dein natürliches Talent: Managen, Wohlstand aufbauen, führen.',
  9: 'Dein natürliches Talent: Dienen, transformieren, loslassen.',
  11:'Dein natürliches Talent: Inspirieren, kanalisieren, erleuchten.',
  22:'Dein natürliches Talent: Visionäre Projekte manifestieren.',
  33:'Dein natürliches Talent: Durch Liebe und Präsenz lehren.',
};

const PERSONALITY_DESC = {
  1: 'Du wirkst nach außen: Stark, unabhängig, entschlossen.',
  2: 'Du wirkst nach außen: Sanft, zugänglich, diplomatisch.',
  3: 'Du wirkst nach außen: Charmant, lebendig, unterhaltsam.',
  4: 'Du wirkst nach außen: Zuverlässig, geerdet, beständig.',
  5: 'Du wirkst nach außen: Dynamisch, abenteuerlich, magnetisch.',
  6: 'Du wirkst nach außen: Warmherzig, verantwortungsvoll, einladend.',
  7: 'Du wirkst nach außen: Geheimnisvoll, weise, zurückhaltend.',
  8: 'Du wirkst nach außen: Souverän, erfolgreich, kraftvoll.',
  9: 'Du wirkst nach außen: Mitfühlend, weltoffen, weise.',
  11:'Du wirkst nach außen: Inspirierend, feinfühlig, leuchtend.',
  22:'Du wirkst nach außen: Beeindruckend, visionär, verlässlich.',
  33:'Du wirkst nach außen: Liebevoll, nährend, strahlend.',
};

const KARMIC_DESC = {
  13: { title:'Karmische Schuld 13', desc:'Lektion der Disziplin — Faulheit und Abkürzungen aus früheren Leben. Wandlung durch konsequente Arbeit und Ausdauer.' },
  14: { title:'Karmische Schuld 14', desc:'Lektion der Mäßigung — Missbrauch von Freiheit in früheren Leben. Wandlung durch Verantwortung und Balance.' },
  16: { title:'Karmische Schuld 16', desc:'Lektion der Demut — Ego und Stolz aus früheren Leben. Wandlung durch spirituelles Erwachen und Loslassen des falschen Selbst.' },
  19: { title:'Karmische Schuld 19', desc:'Lektion der Eigenständigkeit — Machtmissbrauch in früheren Leben. Wandlung durch dienende Führung und Mitgefühl.' },
};

// ─── INFO TEXTS: Was ist diese Zahl? ───────────────────────────────────────
const NUM_INFO = {
  lifePath: {
    what: 'Die Lebenszahl ist die wichtigste Zahl in deinem Numerologie-Profil.',
    how: 'Berechnung: Alle Ziffern des Geburtsdatums werden einzeln addiert und auf eine Kernzahl reduziert (Meisterzahlen 11, 22, 33 bleiben erhalten).',
    why: 'Sie zeigt deinen Lebensweg, deine zentrale Aufgabe und die Energie, die dein gesamtes Leben durchzieht. Sie ist der rote Faden deiner Existenz.',
  },
  birthDay: {
    what: 'Die Geburtszahl zeigt deine natürliche Begabung — das Talent, das du von Geburt an mitbringst.',
    how: 'Berechnung: Der Geburtstag wird auf eine einzelne Ziffer reduziert (z.B. 23 → 2+3 = 5).',
    why: 'Diese Zahl beschreibt, was dir leicht fällt und was andere an dir sofort wahrnehmen. Sie ist dein angeborenes Werkzeug.',
  },
  attitude: {
    what: 'Die Einstellungszahl beschreibt deinen ersten Impuls — wie du instinktiv an Situationen herangehst.',
    how: 'Berechnung: Geburtstag + Geburtsmonat, dann auf eine Kernzahl reduziert.',
    why: 'Sie zeigt deine grundsätzliche Haltung zum Leben, bevor du nachdenkst. Dein automatischer Modus — besonders sichtbar in neuen Situationen.',
  },
  expression: {
    what: 'Die Ausdruckszahl (auch Schicksalszahl) zeigt deine natürlichen Talente und wie du in der Welt wirkst.',
    how: 'Berechnung: Alle Buchstaben des vollständigen Geburtsnamens werden in Zahlen umgewandelt (A=1, B=2… nach dem pythagoreischen System) und addiert.',
    why: 'Sie beschreibt dein volles Potenzial — die Fähigkeiten, die du in diesem Leben entfalten kannst. Dein Geburtsname trägt die Schwingung deiner Bestimmung.',
  },
  heartDesire: {
    what: 'Die Herzzahl (Seelenzahl) offenbart deine tiefsten inneren Wünsche — was deine Seele wirklich will.',
    how: 'Berechnung: Nur die Vokale (A, E, I, O, U) des Geburtsnamens werden addiert.',
    why: 'Was du wirklich brauchst, um dich erfüllt zu fühlen. Diese Zahl spricht von dem, was oft verborgen bleibt — dein innerster Antrieb, jenseits von äußeren Erwartungen.',
  },
  personality: {
    what: 'Die Persönlichkeitszahl zeigt, wie andere dich wahrnehmen — dein äußeres Erscheinungsbild.',
    how: 'Berechnung: Nur die Konsonanten des Geburtsnamens werden addiert.',
    why: 'Der erste Eindruck, den du hinterlässt. Diese Zahl beschreibt die Maske, die du trägst — nicht im negativen Sinne, sondern als natürlicher Filter zwischen deiner inneren und äußeren Welt.',
  },
  maturity: {
    what: 'Die Reifezahl entfaltet sich erst ab der Lebensmitte (ca. 35-45 Jahre) und zeigt dein langfristiges Wachstumsziel.',
    how: 'Berechnung: Lebenszahl + Ausdruckszahl, dann reduziert.',
    why: 'Sie beschreibt die Synthese deines Lebenswegs und deiner Talente — die Person, zu der du wirst, wenn du dein volles Potenzial lebst. Besonders relevant für die zweite Lebenshälfte.',
  },
  spiritual: {
    what: 'Die Spirituelle Zahl (Kraftzahl) zeigt deine verborgenen Fähigkeiten und das, was zwischen den Zeilen deines Wesens steht.',
    how: 'Berechnung: Herzzahl + Persönlichkeitszahl, dann reduziert.',
    why: 'Deine stille Kraftquelle — besonders aktiv zwischen 25 und 55 Jahren. Diese Zahl zeigt Talente, die dir vielleicht selbst nicht bewusst sind, aber die andere an dir spüren.',
  },
  generation: {
    what: 'Die Generationszahl beschreibt die kollektive Energie deines Geburtsjahrgangs.',
    how: 'Berechnung: Quersumme des Geburtsjahres.',
    why: 'Sie zeigt, welche kollektive Aufgabe deine Generation teilt. Menschen mit gleicher Generationszahl teilen bestimmte Werte und Herausforderungen ihrer Epoche.',
  },
  personalYear: {
    what: 'Das Persönliche Jahr zeigt die übergeordnete Energie und das Thema des aktuellen Jahres.',
    how: 'Berechnung: Geburtstag + Geburtsmonat + aktuelles Jahr, dann reduziert.',
    why: 'Ein 9-Jahres-Zyklus, in dem jedes Jahr eine eigene Qualität hat. Die Zeitqualität zu kennen hilft, im Einklang mit dem natürlichen Rhythmus zu leben und Entscheidungen bewusster zu treffen.',
  },
  personalMonth: {
    what: 'Der Persönliche Monat verfeinert die Jahresenergie und zeigt das Thema des aktuellen Monats.',
    how: 'Berechnung: Persönliches Jahr + aktueller Monat, dann reduziert.',
    why: 'Hilft bei der kurzfristigen Planung und zeigt, welche Aktivitäten gerade unterstützt werden.',
  },
  personalDay: {
    what: 'Der Persönliche Tag gibt einen Impuls für die Tagesenergie.',
    how: 'Berechnung: Persönlicher Monat + aktueller Tag, dann reduziert.',
    why: 'Nützlich für bewusste Tagesplanung — welche Qualität trägt dieser Tag für dich?',
  },
};

// ─── NUMBER DISPLAY COMPONENT (with expandable info) ───────────────────────
function NumCard({ number, label, sublabel, description, infoKey }) {
  const [open, setOpen] = useState(false);
  if (number === null || number === undefined) return null;
  const isMaster = [11, 22, 33].includes(number);
  const info = infoKey ? NUM_INFO[infoKey] : null;

  return (
    <div style={{
      background: isMaster ? 'rgba(201,168,76,0.12)' : T.bgSoft,
      borderRadius: '14px',
      padding: '14px',
      border: `1.5px solid ${isMaster ? 'rgba(201,168,76,0.4)' : T.border}`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {isMaster && <div style={{ position: 'absolute', top: '6px', right: '10px', fontSize: '8px', fontFamily: 'Raleway', fontWeight: 800, letterSpacing: '1.5px', color: T.gold, textTransform: 'uppercase', background: 'rgba(201,168,76,0.15)', padding: '2px 8px', borderRadius: '6px' }}>Meisterzahl</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: isMaster
            ? 'linear-gradient(135deg, rgba(201,168,76,0.3), rgba(201,168,76,0.1))'
            : 'rgba(255,255,255,0.04)',
          border: `2px solid ${isMaster ? T.gold : T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Cinzel', fontSize: isMaster ? '18px' : '20px', fontWeight: 700,
          color: isMaster ? T.gold : T.text,
          flexShrink: 0,
        }}>{number}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Raleway', fontSize: '10px', fontWeight: 800, color: T.goldD, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
          {sublabel && <div style={{ fontFamily: 'Cinzel', fontSize: '14px', fontWeight: 700, color: T.text, marginBottom: '2px' }}>{sublabel}</div>}
          {description && <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: T.textMid, lineHeight: '1.5', fontWeight: 500 }}>{description}</div>}
        </div>
      </div>

      {/* Expandable Info Section */}
      {info && (
        <>
          <button onClick={() => setOpen(!open)} style={{
            marginTop: '10px', width: '100%', textAlign: 'left',
            fontFamily: 'Raleway', fontSize: '10px', fontWeight: 700,
            color: T.goldD, background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 0', letterSpacing: '0.5px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ fontSize: '12px', transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▸</span>
            {open ? 'Erklärung ausblenden' : 'Was bedeutet diese Zahl?'}
          </button>
          {open && (
            <div style={{
              marginTop: '8px', background: T.bgCard, borderRadius: '10px',
              padding: '12px', border: `1px solid ${T.border}`,
            }}>
              {[
                { icon: '◈', title: 'Was ist das?', text: info.what },
                { icon: '⚙', title: 'Wie wird sie berechnet?', text: info.how },
                { icon: '✦', title: 'Warum ist sie wichtig?', text: info.why },
              ].map(({ icon, title, text }) => (
                <div key={title} style={{ marginBottom: '10px' }}>
                  <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 800, color: T.goldD, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>{icon} {title}</div>
                  <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: T.textMid, lineHeight: '1.6', fontWeight: 500 }}>{text}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── FORECAST ROW ──────────────────────────────────────────────────────────
function ForecastRow({ yearNum, monthNum, dayNum }) {
  const [openInfo, setOpenInfo] = useState(null);
  const items = [
    { n: yearNum, label: 'Pers. Jahr', icon: '🌅', key: 'personalYear' },
    { n: monthNum, label: 'Pers. Monat', icon: '🌙', key: 'personalMonth' },
    { n: dayNum, label: 'Pers. Tag', icon: '✦', key: 'personalDay' },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {items.map(({ n, label, icon, key }) => (
          <div key={key} onClick={() => setOpenInfo(openInfo === key ? null : key)} style={{
            background: T.bgSoft, borderRadius: '12px', padding: '12px', textAlign: 'center',
            border: `1px solid ${openInfo === key ? T.gold : T.border}`, cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>{icon}</div>
            <div style={{ fontFamily: 'Cinzel', fontSize: '22px', fontWeight: 700, color: T.gold }}>{n}</div>
            <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 700, color: T.textSoft, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>{label}</div>
            <div style={{ fontFamily: 'Raleway', fontSize: '8px', color: T.goldD, marginTop: '4px' }}>ⓘ Info</div>
          </div>
        ))}
      </div>
      {openInfo && NUM_INFO[openInfo] && (
        <div style={{ marginTop: '8px', background: T.bgCard, borderRadius: '10px', padding: '12px', border: `1px solid ${T.border}` }}>
          {[
            { icon: '◈', title: 'Was ist das?', text: NUM_INFO[openInfo].what },
            { icon: '⚙', title: 'Berechnung', text: NUM_INFO[openInfo].how },
            { icon: '✦', title: 'Warum wichtig?', text: NUM_INFO[openInfo].why },
          ].map(({ icon, title, text }) => (
            <div key={title} style={{ marginBottom: '8px' }}>
              <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 800, color: T.goldD, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>{icon} {title}</div>
              <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: T.textMid, lineHeight: '1.6', fontWeight: 500 }}>{text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NUMEROLOGY CHART VISUAL ───────────────────────────────────────────────
function NumChart({ nums }) {
  if (!nums) return null;
  const entries = [
    { key: 'lifePath', label: 'Lebens', v: nums.lifePath },
    { key: 'expression', label: 'Ausdruck', v: nums.expression },
    { key: 'heartDesire', label: 'Herz', v: nums.heartDesire },
    { key: 'personality', label: 'Person.', v: nums.personality },
    { key: 'maturity', label: 'Reife', v: nums.maturity },
    { key: 'spiritual', label: 'Spirit.', v: nums.spiritual },
    { key: 'attitude', label: 'Einstell.', v: nums.attitude },
    { key: 'generation', label: 'Gener.', v: nums.generation },
    { key: 'birthDay', label: 'Geburts.', v: nums.birthDay },
  ].filter(e => e.v !== null && e.v !== undefined);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
      {entries.map(({ key, label, v }) => {
        const isMaster = [11, 22, 33].includes(v);
        return (
          <div key={key} style={{
            width: '64px', textAlign: 'center',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 4px',
              background: isMaster ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${isMaster ? T.gold : T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Cinzel', fontSize: '18px', fontWeight: 700,
              color: isMaster ? T.gold : T.text,
            }}>{v}</div>
            <div style={{ fontFamily: 'Raleway', fontSize: '8px', fontWeight: 700, color: T.textSoft, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RESONANZ-SYNTHESE: HD × Numerologie — Das Herzstück von Lichtkern
// ═══════════════════════════════════════════════════════════════════════════

const HD_TYPE_NUMEROLOGY = {
  'Manifestor': {
    1: { resonanz: 'Doppelte Initiationskraft', insight: 'Manifestor + Lebenszahl 1: Du bist reiner Anfang. Deine Aufgabe ist es, Neues in die Welt zu bringen — ohne auf Erlaubnis zu warten. Informiere, dann handle.' },
    2: { resonanz: 'Der diplomatische Initiator', insight: 'Manifestor + Lebenszahl 2: Ungewöhnliche Kombination — deine Initiationskraft wird durch tiefe Sensibilität geleitet. Du startest Dinge, die Brücken bauen.' },
    3: { resonanz: 'Der kreative Katalysator', insight: 'Manifestor + Lebenszahl 3: Deine Worte und Ideen haben Durchschlagskraft. Was du kreierst, bewegt andere sofort.' },
    4: { resonanz: 'Der Meisterbaumeister', insight: 'Manifestor + Lebenszahl 4: Du initiierst nicht nur — du baust Fundamente die Generationen überdauern. Struktur ist dein Werkzeug der Manifestation.' },
    5: { resonanz: 'Der freiheitliche Initiator', insight: 'Manifestor + Lebenszahl 5: Unruhe trifft Durchsetzungskraft. Du brichst Strukturen auf und schaffst Raum für Neues — aber achte auf Beständigkeit.' },
    6: { resonanz: 'Der fürsorgliche Initiator', insight: 'Manifestor + Lebenszahl 6: Deine Initiationskraft dient dem Verbinden. Du startest Prozesse die andere in ihre Ganzheit führen.' },
    7: { resonanz: 'Der mystische Initiator', insight: 'Manifestor + Lebenszahl 7: Du bringst tiefe Wahrheiten in Bewegung. Deine Impulse kommen aus der Stille und treffen ins Mark.' },
    8: { resonanz: 'Die manifestierte Fülle', insight: 'Manifestor + Lebenszahl 8: Maximale Manifestationskraft. Du bist hier um Überfluss zu erschaffen — materiell und spirituell.' },
    9: { resonanz: 'Der transformative Initiator', insight: 'Manifestor + Lebenszahl 9: Du startest Zyklen des Loslassens. Deine Impulse beenden das Alte und öffnen Raum für Evolution.' },
    11: { resonanz: 'Der erleuchtete Initiator', insight: 'Manifestor + Meisterzahl 11: Deine Impulse kommen aus höheren Ebenen. Du initiierst spirituelle Durchbrüche — bei dir und bei anderen.' },
    22: { resonanz: 'Der Meister-Manifestor', insight: 'Manifestor + Meisterzahl 22: Die mächtigste Kombination. Du manifestierst Visionen die die Welt verändern. Dein Informieren ist nicht höflich — es ist prophetisch.' },
    33: { resonanz: 'Der erleuchtete Herz-Initiator', insight: 'Manifestor + Meisterzahl 33: Deine bloße Präsenz initiiert Wandlung. Du musst nicht handeln — dein Sein bewegt.' },
  },
  'Generator': {
    1: { resonanz: 'Der antwortende Pionier', insight: 'Generator + Lebenszahl 1: Deine Sakralkraft will Neues erschaffen — aber nur wenn echte Resonanz da ist. Warte auf den Impuls, dann gib alles.' },
    2: { resonanz: 'Der harmonische Generator', insight: 'Generator + Lebenszahl 2: Deine Lebenskraft fließt am stärksten in Partnerschaften. Allein arbeitest du unter deinem Potenzial.' },
    3: { resonanz: 'Der kreative Motor', insight: 'Generator + Lebenszahl 3: Unerschöpfliche kreative Energie — wenn du auf Resonanz reagierst, wird dein Ausdruck magnetisch.' },
    4: { resonanz: 'Der ausdauernde Erbauer', insight: 'Generator + Lebenszahl 4: Die beständigste Kombination. Deine Sakralkraft plus Baumeister-Energie erschafft Werke für die Ewigkeit.' },
    5: { resonanz: 'Der vielseitige Generator', insight: 'Generator + Lebenszahl 5: Deine Energie will Vielfalt — aber deine Strategie verlangt Resonanz. Der Schlüssel: Reagiere auf das, was dich wirklich begeistert.' },
    6: { resonanz: 'Der nährende Generator', insight: 'Generator + Lebenszahl 6: Deine Lebenskraft nährt. Wenn du auf Resonanz antwortest, wird deine Fürsorge zur Transformation.' },
    7: { resonanz: 'Der forschende Generator', insight: 'Generator + Lebenszahl 7: Tiefe Sakralenergie für innere Forschung. Deine Befriedigung kommt durch Erkenntnis.' },
    8: { resonanz: 'Der produktive Fülle-Generator', insight: 'Generator + Lebenszahl 8: Maximale Arbeitskraft trifft Manifestation. Du bist gebaut um Wohlstand durch Hingabe zu erschaffen.' },
    9: { resonanz: 'Der dienende Generator', insight: 'Generator + Lebenszahl 9: Deine Energie dient dem Größeren. Befriedigung kommt durch Loslassen und Transformation.' },
    11: { resonanz: 'Der inspirierte Generator', insight: 'Generator + Meisterzahl 11: Deine Sakralkraft ist ein Kanal für höhere Inspiration. Wenn du reagierst, fließt Weisheit durch dich.' },
    22: { resonanz: 'Der Meisterbauer-Generator', insight: 'Generator + Meisterzahl 22: Du hast die Ausdauer UND die Vision für Großprojekte. Deine Sakralkraft baut Tempel.' },
    33: { resonanz: 'Der liebende Generator', insight: 'Generator + Meisterzahl 33: Deine Arbeit ist Liebe. Deine Energie nährt durch pure Hingabe an das, was Resonanz erzeugt.' },
  },
  'Manifesting Generator': {
    1: { resonanz: 'Der schnelle Pionier', insight: 'MG + Lebenszahl 1: Blitzschnelle Initiation mit Sakralkraft. Du reagierst, informierst und handelst in einem Atemzug.' },
    4: { resonanz: 'Der Multi-Baumeister', insight: 'MG + Lebenszahl 4: Du baust auf vielen Ebenen gleichzeitig — und trotzdem steht alles auf solidem Fundament.' },
    5: { resonanz: 'Der Freiheits-Generator', insight: 'MG + Lebenszahl 5: Maximale Vielseitigkeit. Du brauchst Abwechslung wie Luft — folge deiner sakralen Resonanz durch alle Abenteuer.' },
    7: { resonanz: 'Der tiefgründige Multitasker', insight: 'MG + Lebenszahl 7: Schnelligkeit und Tiefe in einer Person. Du springst zwischen Projekten — aber jedes berührt die Essenz.' },
    22: { resonanz: 'Der beschleunigte Meisterbaumeister', insight: 'MG + Meisterzahl 22: Die Kombination aus Geschwindigkeit und Meistervision. Du baust schneller als alle anderen — und größer.' },
  },
  'Projektor': {
    1: { resonanz: 'Der einladende Pionier', insight: 'Projektor + Lebenszahl 1: Du siehst neue Wege bevor andere sie ahnen — aber warte auf die Einladung, bevor du vorangehst.' },
    2: { resonanz: 'Der natürliche Berater', insight: 'Projektor + Lebenszahl 2: Doppelte Führungsqualität durch Einfühlung. Deine Einladungen kommen durch deine diplomatische Weisheit.' },
    4: { resonanz: 'Der systemische Führer', insight: 'Projektor + Lebenszahl 4: Du siehst die Strukturen die andere brauchen. Dein Erfolg kommt durch geduldiges Warten und meisterhaftes Organisieren.' },
    6: { resonanz: 'Der fürsorgliche Führer', insight: 'Projektor + Lebenszahl 6: Du führst durch Fürsorge. Deine Einladungen kommen weil andere spüren, dass du sie wirklich siehst.' },
    7: { resonanz: 'Der weise Beobachter', insight: 'Projektor + Lebenszahl 7: Die tiefgründigste Kombination. Du durchschaust Systeme und Menschen — deine Weisheit ist dein Schlüssel zur Einladung.' },
    9: { resonanz: 'Der universelle Führer', insight: 'Projektor + Lebenszahl 9: Du führst durch Loslassen. Je weniger du festhältst, desto mehr Einladungen kommen.' },
    11: { resonanz: 'Der intuitive Führer', insight: 'Projektor + Meisterzahl 11: Deine Führung kommt aus purer Intuition. Du siehst was andere brauchen bevor sie es selbst wissen.' },
    33: { resonanz: 'Der Meisterlehrer-Projektor', insight: 'Projektor + Meisterzahl 33: Du lehrst durch dein Sein. Deine bloße Anwesenheit ordnet die Energie im Raum.' },
  },
  'Reflektor': {
    7: { resonanz: 'Der Spiegel der Wahrheit', insight: 'Reflektor + Lebenszahl 7: Maximale Durchlässigkeit trifft tiefste Analyse. Du spiegelst nicht nur — du enthüllst verborgene Wahrheiten.' },
    9: { resonanz: 'Der universelle Spiegel', insight: 'Reflektor + Lebenszahl 9: Du spiegelst die Vollständigkeit. Dein Mondzyklus ist dein Kompass durch die Transformation.' },
    11: { resonanz: 'Der mystische Spiegel', insight: 'Reflektor + Meisterzahl 11: Du empfängst höhere Frequenzen und spiegelst sie in die Welt. Ein seltenes und kostbares Geschenk.' },
  },
};

const AUTHORITY_NUMEROLOGY = {
  'Emotional': {
    deep: 'Deine emotionale Welle und deine Zahlen erzählen die gleiche Geschichte: Klarheit braucht Zeit.',
    tip: 'Nutze die Zeitqualität deines Persönlichen Monats als Rahmen für wichtige Entscheidungen — nicht gegen die Welle, sondern mit ihr.',
  },
  'Sakral': {
    deep: 'Dein Sakral antwortet im Jetzt — deine Zahlen zeigen den größeren Bogen. Beides zusammen ergibt Weisheit.',
    tip: 'Achte darauf ob dein sakrales Ja/Nein in Einklang mit deiner aktuellen Zeitqualität steht.',
  },
  'Milz': {
    deep: 'Dein erster Impuls trägt die Wahrheit — und deine Zahlen bestätigen den tieferen Sinn dahinter.',
    tip: 'Vertraue deiner spontanen Intuition, aber reflektiere anschließend anhand deiner Zahlenmuster.',
  },
  'Ego': {
    deep: 'Dein Herzensimpuls trifft auf die Kraft deiner Zahlen — was sich lohnt, zeigt sich auf beiden Ebenen.',
    tip: 'Frage dich: Will mein Herz UND bestätigt meine Zeitqualität diesen Schritt?',
  },
  'Selbst': {
    deep: 'Dein Körper führt dich an die richtigen Orte — deine Zahlen zeigen warum diese Orte wichtig sind.',
    tip: 'Folge deinem Körper und nutze die Numerologie als Landkarte für das Warum.',
  },
};

function ResonanzSynthese({ client, nums, lifePath }) {
  const [expanded, setExpanded] = useState(false);
  
  const hdType = client.hdType || '';
  const authority = client.hdAuthority || '';
  const profile = client.hdProfile || '';
  
  // Find HD × Numerologie synthesis
  const typeMatch = HD_TYPE_NUMEROLOGY[hdType]?.[lifePath];
  const authMatch = AUTHORITY_NUMEROLOGY[authority];
  
  // Profile × Lebenszahl insight
  const profileLine1 = profile ? parseInt(profile.split('/')[0]) : null;
  const profileInsight = profileLine1 ? getProfileInsight(profileLine1, lifePath) : null;
  
  if (!typeMatch && !authMatch) return null;
  
  return (
    <div style={{
      marginBottom: '16px',
      background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))',
      borderRadius: '18px',
      border: `2px solid rgba(201,168,76,0.3)`,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <Flower size={180} opacity={0.06} color={T.gold} />
      
      {/* Header */}
      <div style={{ padding: '18px 16px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '16px' }}>⚙</span>
          <span style={{ fontSize: '12px', color: T.textSoft }}>×</span>
          <span style={{ fontSize: '16px' }}>🔢</span>
          <div style={{ fontFamily: 'Raleway', fontSize: '10px', fontWeight: 800, color: T.gold, letterSpacing: '2px', textTransform: 'uppercase' }}>Resonanz-Synthese</div>
        </div>
        
        {typeMatch && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontFamily: 'Cinzel', fontSize: '16px', fontWeight: 700, color: T.gold }}>{typeMatch.resonanz}</div>
            <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: T.textMid, marginTop: '2px' }}>{hdType} × Lebenszahl {lifePath}</div>
          </div>
        )}
      </div>
      
      {/* Main Insight */}
      <div style={{ padding: '12px 16px', position: 'relative', zIndex: 1 }}>
        {typeMatch && (
          <div style={{
            fontFamily: 'Raleway', fontSize: '13px', color: T.text, lineHeight: '1.7',
            fontWeight: 500, fontStyle: 'italic',
          }}>{typeMatch.insight}</div>
        )}
        
        <button onClick={() => setExpanded(!expanded)} style={{
          marginTop: '12px', fontFamily: 'Raleway', fontSize: '11px', fontWeight: 700,
          color: T.goldD, background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.25)`,
          borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', width: '100%',
        }}>
          {expanded ? '▾ Synthese einklappen' : '▸ Tiefere Verknüpfungen anzeigen'}
        </button>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', position: 'relative', zIndex: 1 }}>
          
          {/* Authority × Numerologie */}
          {authMatch && (
            <div style={{
              background: T.bgCard, borderRadius: '12px', padding: '14px',
              border: `1px solid ${T.border}`, marginBottom: '10px',
            }}>
              <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 800, color: T.goldD, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                ✦ {authority} Autorität × Zahlen
              </div>
              <div style={{ fontFamily: 'Raleway', fontSize: '12px', color: T.text, lineHeight: '1.6', fontWeight: 500, marginBottom: '8px' }}>
                {authMatch.deep}
              </div>
              <div style={{
                background: 'rgba(201,168,76,0.08)', borderRadius: '8px', padding: '10px',
                border: `1px solid rgba(201,168,76,0.15)`,
              }}>
                <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 800, color: T.goldD, letterSpacing: '1px', marginBottom: '3px' }}>💡 PRAXIS-IMPULS</div>
                <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: T.textMid, lineHeight: '1.5' }}>{authMatch.tip}</div>
              </div>
            </div>
          )}
          
          {/* Profile × Numerologie */}
          {profileInsight && (
            <div style={{
              background: T.bgCard, borderRadius: '12px', padding: '14px',
              border: `1px solid ${T.border}`, marginBottom: '10px',
            }}>
              <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 800, color: T.goldD, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                ✦ Profil {profile} × Lebenszahl {lifePath}
              </div>
              <div style={{ fontFamily: 'Raleway', fontSize: '12px', color: T.text, lineHeight: '1.6', fontWeight: 500 }}>
                {profileInsight}
              </div>
            </div>
          )}
          
          {/* Zeitqualität × Strategie */}
          {nums.personalYear && (
            <div style={{
              background: T.bgCard, borderRadius: '12px', padding: '14px',
              border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontFamily: 'Raleway', fontSize: '9px', fontWeight: 800, color: T.goldD, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                ✦ Zeitqualität × HD-Strategie
              </div>
              <div style={{ fontFamily: 'Raleway', fontSize: '12px', color: T.text, lineHeight: '1.6', fontWeight: 500 }}>
                {getTimeStrategyInsight(hdType, nums.personalYear)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getProfileInsight(line1, lifePath) {
  const insights = {
    1: `Linie 1 (der Forscher) mit Lebenszahl ${lifePath}: Dein Fundament braucht Tiefe bevor du deine ${lifePath}er-Energie leben kannst. Erst verstehen, dann handeln.`,
    2: `Linie 2 (der Eremit) mit Lebenszahl ${lifePath}: Deine ${lifePath}er-Gabe will von innen reifen. Andere sehen dein Talent bevor du es selbst erkennst.`,
    3: `Linie 3 (der Experimentierer) mit Lebenszahl ${lifePath}: Deine ${lifePath}er-Lektion lernst du durch Erfahrung — jeder "Fehler" ist ein Meisterschritt.`,
    4: `Linie 4 (der Netzwerker) mit Lebenszahl ${lifePath}: Deine ${lifePath}er-Kraft entfaltet sich durch Beziehungen. Dein Netzwerk ist dein Resonanzfeld.`,
    5: `Linie 5 (der Universalist) mit Lebenszahl ${lifePath}: Andere projizieren ihre Erwartungen auf deine ${lifePath}er-Energie. Bleib bei deiner Wahrheit.`,
    6: `Linie 6 (das Vorbild) mit Lebenszahl ${lifePath}: Deine ${lifePath}er-Weisheit reift in drei Phasen — Experiment, Rückzug, Vorbild. Geduld ist dein Schlüssel.`,
  };
  return insights[line1] || null;
}

function getTimeStrategyInsight(hdType, personalYear) {
  const strategies = {
    'Manifestor': {
      1: 'Persönliches Jahr 1 + Manifestor: JETZT initiieren. Die Energie unterstützt neue Anfänge — informiere und starte.',
      4: 'Persönliches Jahr 4 + Manifestor: Zeit für strukturiertes Manifestieren. Baue Systeme statt spontane Impulse.',
      5: 'Persönliches Jahr 5 + Manifestor: Veränderungsenergie trifft Initiationskraft — ideale Zeit für mutige neue Richtungen.',
      7: 'Persönliches Jahr 7 + Manifestor: Ungewöhnliche Phase — dein Impuls ist Rückzug statt Aktion. Höre auf die innere Stimme.',
      9: 'Persönliches Jahr 9 + Manifestor: Loslassen statt initiieren. Beende bewusst, was nicht mehr dient.',
    },
    'Generator': {
      1: 'Persönliches Jahr 1 + Generator: Neue Resonanzen tauchen auf — reagiere auf das was dein Sakral zum Leuchten bringt.',
      3: 'Persönliches Jahr 3 + Generator: Kreative Hochphase — deine Sakralenergie will sich ausdrücken.',
      6: 'Persönliches Jahr 6 + Generator: Deine Energie fließt in Fürsorge und Verbundenheit — höre auf dein Sakral bei Beziehungsfragen.',
      8: 'Persönliches Jahr 8 + Generator: Erntejahr — deine bisherige Arbeit zahlt sich aus. Sakral sagt Ja zu Fülle.',
    },
    'Projektor': {
      2: 'Persönliches Jahr 2 + Projektor: Geduldsphase — die richtigen Einladungen kommen durch stille Präsenz.',
      7: 'Persönliches Jahr 7 + Projektor: Deine natürliche Energie — Rückzug und tiefe Erkenntnis. Die beste Zeit für Selbststudium.',
      8: 'Persönliches Jahr 8 + Projektor: Anerkennungsjahr — deine Führungsqualität wird sichtbar und eingeladen.',
    },
  };
  
  const typeStrategies = strategies[hdType];
  if (typeStrategies?.[personalYear]) return typeStrategies[personalYear];
  
  // Fallback
  return `Im Persönlichen Jahr ${personalYear} als ${hdType}: Achte besonders darauf, wie die Jahresenergie ${personalYear} deine ${hdType}-Strategie beeinflusst. ${personalYear <= 3 ? 'Aufbauphase' : personalYear <= 6 ? 'Wachstumsphase' : 'Ernteund Reflexionsphase'} — handle entsprechend deiner Strategie.`;
}

// ─── MAIN NUMEROLOGY TAB ───────────────────────────────────────────────────
function NumerologyTab({ client, onSave }) {
  const [birthDate, setBirthDate] = useState(client.birthDate || '');
  const [birthName, setBirthName] = useState(client.birthName || '');
  const [saved, setSaved] = useState(!!(client.birthDate));
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [showKarte, setShowKarte] = useState(false);

  const nums = useMemo(() => calcNumerology(birthDate, birthName), [birthDate, birthName]);

  const handleSave = () => {
    if (!birthDate) return;
    onSave({ ...client, birthDate, birthName });
    setSaved(true);
  };

  const genAI = async () => {
    if (!nums) return;
    setAiLoading(true);
    const lp = LIFE_PATH_DESC[nums.lifePath];
    try {
      const prompt = `Du bist ein einfühlsamer Begleiter im Lichtkern-System mit numerologischem Wissen. Betrachte diese Zahlen auf seelisch-symbolischer Ebene:

Klient: Anonym
Geburtsdatum: ${birthDate}
Geburtsname: nicht übermittelt

NUMEROLOGIE-PROFIL:
- Lebenszahl: ${nums.lifePath} (${lp?.title || ''})
- Geburtszahl: ${nums.birthDay}
- Einstellungszahl: ${nums.attitude}
- Generationszahl: ${nums.generation}
${nums.expression !== null ? `- Ausdruckszahl: ${nums.expression}` : ''}
${nums.heartDesire !== null ? `- Herzzahl/Seelenzahl: ${nums.heartDesire}` : ''}
${nums.personality !== null ? `- Persönlichkeitszahl: ${nums.personality}` : ''}
${nums.maturity !== null ? `- Reifezahl: ${nums.maturity}` : ''}
${nums.spiritual !== null ? `- Spirituelle Zahl: ${nums.spiritual}` : ''}
- Persönliches Jahr: ${nums.personalYear}
- Persönlicher Monat: ${nums.personalMonth}
${nums.karmicDebts.length > 0 ? `- Karmische Schuldzahlen: ${nums.karmicDebts.join(', ')}` : ''}
${nums.isMaster ? '- TRÄGT EINE MEISTERZAHL' : ''}

${client.hdType ? `Human Design: ${client.hdType} ${client.hdProfile || ''} ${client.hdAuthority || ''}` : ''}

Bitte gib:
1. **Seelenporträt** (3-4 Sätze): Was erzählen die Zahlen über die tiefere Natur dieses Menschen?
2. **Lebensaufgabe** (2 Sätze): Was ist die zentrale Lektion dieses Lebens?
3. **Aktuelle Zeitqualität** (2-3 Sätze): Was sagen Persönliches Jahr ${nums.personalYear} und Monat ${nums.personalMonth} über die aktuelle Phase?
4. Impulse zur Selbstwahrnehmung (3 Anregungen zur Reflexion, basierend auf den Zahlen)
${nums.karmicDebts.length > 0 ? `5. **Karmische Themen** (2 Sätze): Was bedeuten die Schuldzahlen ${nums.karmicDebts.join(', ')} für die persönliche Betrachtung?` : ''}
${client.hdType ? `6. **Brücke HD ↔ Numerologie** (2 Sätze): Wie ergänzen sich ${client.hdType} und Lebenszahl ${nums.lifePath}?` : ''}

Warmherzig, tiefgründig, poetisch aber präzise. Ohne Heilversprechen. Keine Wirksamkeits- oder Erfolgsaussagen, keine Ursache-Wirkungs-Aussagen zu körperlichen Zuständen. Schließe mit exakt diesem Satz: Bei körperlichen oder gesundheitlichen Beschwerden gehört die Abklärung zu Arzt, Heilpraktiker oder Therapeut.`;

      const antwort = await groqFetch(prompt);
      const bereinigt = antwort.replace(/\*\*/g,"");
      setAiText(enthältReizwort(bereinigt) ? REIZWORT_HINWEIS : bereinigt);
    } catch { setAiText('Netzwerkfehler.'); }
    setAiLoading(false);
  };

  const hasData = nums !== null;
  const lp = hasData ? LIFE_PATH_DESC[nums.lifePath] : null;

  return (
    <div style={{ paddingBottom: '20px' }}>

      {/* ── Eingabe ── */}
      {!saved && (
        <Card style={{ marginBottom: '16px', background: T.bgSoft, border: `1.5px solid ${T.borderMid}` }}>
          <SL color={T.goldD}>✦ Numerologie-Daten</SL>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: T.textMid, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Geburtsdatum *</div>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${T.border}`, fontFamily: 'Raleway', fontSize: '13px', color: T.text, background: T.bgCard, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: T.textMid, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Vollständiger Geburtsname *</div>
            <input
              type="text"
              value={birthName}
              onChange={e => setBirthName(e.target.value)}
              placeholder="z.B. Sven Donath"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${T.border}`, fontFamily: 'Raleway', fontSize: '13px', color: T.text, background: T.bgCard, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: T.goldD, marginTop: '6px', lineHeight: '1.5' }}>⚠ Vorname + Nachname eingeben (Geburtsname vor Heirat). Nur der Nachname allein ergibt falsche Namenszahlen.</div>
          </div>
          <Btn onClick={handleSave} disabled={!birthDate} style={{ width: '100%', opacity: birthDate ? 1 : 0.5 }}>✦ Berechnen & Speichern</Btn>
        </Card>
      )}

      {/* ── Daten vorhanden → Anzeige ── */}
      {hasData && saved && (
        <>
          {/* Header mit Lebenszahl */}
          <div style={{ background: T.bgSoft, borderRadius: '16px', padding: '18px', marginBottom: '16px', border: `1.5px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
            <Flower size={160} opacity={0.1} color={T.gold} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: 'Cinzel', fontSize: '13px', color: T.goldD, letterSpacing: '2px', marginBottom: '4px' }}>✦ NUMEROLOGIE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: nums.isMaster
                    ? 'linear-gradient(135deg, rgba(201,168,76,0.35), rgba(201,168,76,0.1))'
                    : 'rgba(201,168,76,0.12)',
                  border: `2.5px solid ${T.gold}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Cinzel', fontSize: '24px', fontWeight: 700, color: T.gold,
                  flexShrink: 0,
                  boxShadow: nums.isMaster ? '0 0 20px rgba(201,168,76,0.3)' : 'none',
                }}>{nums.isMaster ? `${nums.lifePath}/${digitSumStrict(nums.lifePath)}` : nums.lifePath}</div>
                <div>
                  <div style={{ fontFamily: 'Raleway', fontWeight: 800, fontSize: '18px', color: T.text }}>{lp?.title || `Lebenszahl ${nums.lifePath}`}</div>
                  <div style={{ fontFamily: 'Raleway', fontSize: '12px', color: T.textMid, fontWeight: 600, marginTop: '2px' }}>{lp?.essence}</div>
                </div>
              </div>
              {lp?.desc && <div style={{ fontFamily: 'Raleway', fontSize: '12px', color: T.textMid, lineHeight: '1.6', marginTop: '12px', fontWeight: 500 }}>{lp.desc}</div>}
              <button onClick={() => setSaved(false)} style={{ marginTop: '10px', fontFamily: 'Raleway', fontSize: '10px', color: T.textSoft, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Daten bearbeiten</button>
            </div>
          </div>

          {/* Numerologie-Chart Übersicht */}
          <Card style={{ marginBottom: '16px', padding: '16px' }}>
            <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: T.goldD, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>✦ Zahlen-Profil</div>
            <NumChart nums={nums} />
          </Card>

          {/* Zeitqualität / Forecast */}
          <Card style={{ marginBottom: '16px', background: T.bgSoft, border: `1.5px solid ${T.borderMid}` }}>
            <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: T.goldD, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>✦ Aktuelle Zeitqualität</div>
            <ForecastRow yearNum={nums.personalYear} monthNum={nums.personalMonth} dayNum={nums.personalDay} />
            {PERSONAL_YEAR_DESC[nums.personalYear] && (
              <div style={{ marginTop: '12px', fontFamily: 'Raleway', fontSize: '12px', color: T.textMid, lineHeight: '1.6', fontWeight: 500, background: T.bgCard, borderRadius: '10px', padding: '12px', border: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 700, color: T.goldD }}>Jahr {nums.personalYear}: </span>
                {PERSONAL_YEAR_DESC[nums.personalYear]}
              </div>
            )}
          </Card>

          {/* Kernzahlen Detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <NumCard number={nums.lifePath} label="Lebenszahl" sublabel={lp?.title} description={lp?.essence} infoKey="lifePath" />
            <NumCard number={nums.birthDay} label="Geburtszahl" description={`Tag der Geburt reduziert — deine natürliche Gabe.`} infoKey="birthDay" />
            <NumCard number={nums.attitude} label="Einstellungszahl" description="Wie du das Leben grundsätzlich angehst — dein erster Impuls." infoKey="attitude" />
            {nums.expression !== null && <NumCard number={nums.expression} label="Ausdruckszahl / Schicksalszahl" sublabel={EXPRESSION_DESC[nums.expression]?.split(':')[0]} description={EXPRESSION_DESC[nums.expression]} infoKey="expression" />}
            {nums.heartDesire !== null && <NumCard number={nums.heartDesire} label="Herzzahl / Seelenzahl" description={HEART_DESIRE_DESC[nums.heartDesire]} infoKey="heartDesire" />}
            {nums.personality !== null && <NumCard number={nums.personality} label="Persönlichkeitszahl" description={PERSONALITY_DESC[nums.personality]} infoKey="personality" />}
            {nums.maturity !== null && <NumCard number={nums.maturity} label="Reifezahl" description="Entfaltet sich ab der Lebensmitte — die Synthese deiner Lebenszahl und Ausdruckszahl." infoKey="maturity" />}
            {nums.spiritual !== null && <NumCard number={nums.spiritual} label="Spirituelle Zahl" description="Deine verborgenen Talente und Fähigkeiten — besonders stark zwischen 25 und 55 Jahren." infoKey="spiritual" />}
            <NumCard number={nums.generation} label="Generationszahl" description="Die kollektive Energie deines Geburtsjahrgangs." infoKey="generation" />
          </div>

          {/* Karmische Schuldzahlen */}
          {nums.karmicDebts.length > 0 && (
            <Card style={{ marginBottom: '16px', background: 'rgba(220,38,38,0.05)', border: '1.5px solid rgba(220,38,38,0.2)' }}>
              <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: '#ff6b6b', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>✦ Karmische Schuldzahlen</div>
              {nums.karmicDebts.map(k => KARMIC_DESC[k] && (
                <div key={k} style={{ marginBottom: '8px' }}>
                  <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '12px', color: T.text, marginBottom: '3px' }}>{KARMIC_DESC[k].title}</div>
                  <div style={{ fontFamily: 'Raleway', fontSize: '11px', color: T.textMid, lineHeight: '1.5' }}>{KARMIC_DESC[k].desc}</div>
                </div>
              ))}
            </Card>
          )}

          {/* Resonanzkarte Button */}
          <button onClick={() => setShowKarte(true)} style={{
            width: '100%', marginBottom: '16px', padding: '14px',
            borderRadius: '14px', border: '1.5px solid rgba(201,168,76,0.35)',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04))',
            cursor: 'pointer', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Raleway', fontWeight: 800, fontSize: '13px', color: T.goldD }}>🖨 Resonanzkarte erstellen</div>
            <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: T.textMid, marginTop: '3px' }}>Druckbare Seelenlandkarte für deinen Klienten</div>
          </button>
          {showKarte && <ResonanzKarte client={{...client, birthDate, birthName}} onClose={() => setShowKarte(false)} onSave={onSave} />}
          {/* ═══ RESONANZ-SYNTHESE: HD × Numerologie ═══ */}
          {client.hdType && nums && (
            <ResonanzSynthese client={client} nums={nums} lifePath={nums.lifePath} />
          )}

          {/* KI Resonanz-Analyse */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <SL>✦ Resonanz-Analyse</SL>
              <Btn onClick={genAI} disabled={aiLoading} style={{ padding: '8px 16px', fontSize: '11px', opacity: aiLoading ? 0.5 : 1 }}>
                {aiLoading ? '…' : '✦ Analysieren'}
              </Btn>
            </div>
            {aiText && <div style={{ background: T.bgSoft, borderRadius: '14px', padding: '16px', border: `1.5px solid ${T.borderMid}`, fontFamily: 'Raleway', fontSize: '13px', color: T.text, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{aiText}</div>}
          </div>
        </>
      )}

      {/* Noch keine Daten und nichts gespeichert */}
      {!hasData && !birthDate && saved && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.3 }}>🔢</div>
          <div style={{ fontFamily: 'Raleway', fontSize: '14px', color: T.textMid, fontWeight: 600 }}>Noch keine Numerologie-Daten</div>
          <div style={{ fontFamily: 'Raleway', fontSize: '12px', color: T.textSoft, marginTop: '4px' }}>Geburtsdatum eingeben um das Zahlen-Profil zu berechnen.</div>
          <Btn onClick={() => setSaved(false)} style={{ marginTop: '12px', padding: '10px 20px' }}>✦ Daten eingeben</Btn>
        </div>
      )}

    </div>
  );
}

export { calcNumerology, NumerologyTab, LIFE_PATH_DESC, PERSONAL_YEAR_DESC };
