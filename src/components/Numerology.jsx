import React, { useState, useMemo } from "react";
import { T } from "../config/theme.js";
import { Card, Btn, SL } from "./UI.jsx";
import { Flower } from "./Decorations";
import { groqFetch } from "../config/groq.js";

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
  const daySum = digitSum(d);
  const monthSum = digitSum(m);
  const yearSum = digitSum(y);
  
  // Lebenszahl: Quersumme aller Ziffern des Geburtsdatums
  const lifePathRaw = String(d).split('').concat(String(m).split(''), String(y).split('')).reduce((a, n) => a + Number(n), 0);
  const lifePath = digitSum(lifePathRaw);

  // Geburtszahl (Tag allein reduziert)
  const birthDay = digitSum(d);

  // Einstellungszahl: Tag + Monat (nicht reduzierte Summe → dann reduzieren)
  const attitudeRaw = d + m;
  const attitude = digitSum(attitudeRaw);

  // Generationszahl: Quersumme des Geburtsjahres
  const generation = digitSum(y);

  // Persönliches Jahr: Geburtstag + Geburtsmonat + aktuelles Jahr
  const personalYearRaw = String(d).split('').concat(String(m).split(''), String(currentYear).split('')).reduce((a, n) => a + Number(n), 0);
  const personalYear = digitSumStrict(personalYearRaw);

  // Persönlicher Monat: Persönliches Jahr + aktueller Monat
  const personalMonth = digitSumStrict(personalYear + currentMonth);

  // Persönlicher Tag: Persönlicher Monat + aktueller Tag
  const personalDay = digitSumStrict(personalMonth + currentDay);

  // ── Namens-basiert ──
  let expression = null, heartDesire = null, personality = null, maturity = null, spiritual = null;

  if (birthName && birthName.trim().length > 1) {
    // Ausdruckszahl / Schicksalszahl: Alle Buchstaben
    const expr = lettersToSum(birthName);
    expression = expr.reduced;

    // Herzzahl / Seelenzahl: Nur Vokale
    const heart = lettersToSum(birthName, ch => VOWELS.has(ch));
    heartDesire = heart.reduced;

    // Persönlichkeitszahl: Nur Konsonanten
    const pers = lettersToSum(birthName, ch => !VOWELS.has(ch));
    personality = pers.reduced;

    // Reifezahl: Lebenszahl + Ausdruckszahl
    maturity = digitSum(lifePath + expression);

    // Spirituelle Zahl / Kraftzahl
    spiritual = digitSum(heartDesire + personality);
  }

  // Karmische Schuldzahlen prüfen (13, 14, 16, 19 im Lebenspfad)
  const karmicDebts = [];
  if (lifePathRaw === 13 || attitudeRaw === 13) karmicDebts.push(13);
  if (lifePathRaw === 14 || attitudeRaw === 14) karmicDebts.push(14);
  if (lifePathRaw === 16 || attitudeRaw === 16) karmicDebts.push(16);
  if (lifePathRaw === 19 || attitudeRaw === 19) karmicDebts.push(19);

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
  6:  { title:'Der Heiler', essence:'Liebe, Verantwortung, Fürsorge', desc:'Du trägst das Herz der Welt. Deine Bestimmung liegt im Dienst an anderen — in Familie, Gemeinschaft und Heilarbeit. Liebe ist dein Kompass.' },
  7:  { title:'Der Mystiker', essence:'Weisheit, Analyse, Spiritualität', desc:'Du bist der Sucher nach Wahrheit. Dein Verstand und deine Intuition arbeiten zusammen, um die tieferen Schichten der Realität zu durchdringen.' },
  8:  { title:'Der Souverän', essence:'Macht, Fülle, Manifestation', desc:'Du bist hier um materielle und spirituelle Fülle zu meistern. Deine Lektion: Macht mit Integrität zu tragen und Überfluss zu teilen.' },
  9:  { title:'Der Weise', essence:'Vollendung, Mitgefühl, Transformation', desc:'Du trägst die Weisheit aller Zahlen in dir. Dein Weg ist das Loslassen, das Dienen und die Transformation — du bist hier um einen Zyklus zu vollenden.' },
  11: { title:'Der Inspirierte — Meisterzahl', essence:'Intuition, Inspiration, spirituelle Führung', desc:'Du trägst eine besondere Frequenz. Als 11 bist du ein Kanal für höhere Wahrheiten. Deine Intuition ist überdurchschnittlich — lerne ihr zu vertrauen, auch wenn der Verstand zweifelt.' },
  22: { title:'Der Meisterbaumeister — Meisterzahl', essence:'Vision, Manifestation, globaler Einfluss', desc:'Die kraftvollste aller Zahlen. Du hast die Fähigkeit, spirituelle Visionen in materielle Realität umzusetzen. Du baust nicht für dich — du baust für die Menschheit.' },
  33: { title:'Der Meisterlehrer — Meisterzahl', essence:'Bedingungslose Liebe, heilende Präsenz', desc:'Die seltenste Meisterzahl. Du bist hier um durch dein Sein zu lehren. Deine bloße Anwesenheit kann heilen. Bedingungslose Liebe ist dein höchster Ausdruck.' },
};

const PERSONAL_YEAR_DESC = {
  1: 'Neuanfang — Zeit zu säen. Neue Projekte, neue Richtungen, frische Energie.',
  2: 'Geduld & Partnerschaft — Samen brauchen Zeit. Kooperationen stärken.',
  3: 'Kreativität & Ausdruck — Deine Ideen wollen raus. Sichtbar werden.',
  4: 'Fundament bauen — Harte Arbeit, die sich langfristig auszahlt.',
  5: 'Wandel & Freiheit — Altes loslassen, Neues willkommen heißen.',
  6: 'Verantwortung & Liebe — Familie, Heim, Heilung stehen im Fokus.',
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
  6: 'Dein natürliches Talent: Heilen, nähren, Schönheit schaffen.',
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
  33:'Du wirkst nach außen: Liebevoll, heilend, strahlend.',
};

const KARMIC_DESC = {
  13: { title:'Karmische Schuld 13', desc:'Lektion der Disziplin — Faulheit und Abkürzungen aus früheren Leben. Heilung durch konsequente Arbeit und Ausdauer.' },
  14: { title:'Karmische Schuld 14', desc:'Lektion der Mäßigung — Missbrauch von Freiheit in früheren Leben. Heilung durch Verantwortung und Balance.' },
  16: { title:'Karmische Schuld 16', desc:'Lektion der Demut — Ego und Stolz aus früheren Leben. Heilung durch spirituelles Erwachen und Loslassen des falschen Selbst.' },
  19: { title:'Karmische Schuld 19', desc:'Lektion der Eigenständigkeit — Machtmissbrauch in früheren Leben. Heilung durch dienende Führung und Mitgefühl.' },
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

// ─── MAIN NUMEROLOGY TAB ───────────────────────────────────────────────────
function NumerologyTab({ client, onSave }) {
  const [birthDate, setBirthDate] = useState(client.birthDate || '');
  const [birthName, setBirthName] = useState(client.birthName || '');
  const [saved, setSaved] = useState(!!(client.birthDate));
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState('');

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
      const prompt = `Du bist ein erfahrener Numerologe und ganzheitlicher Therapeut in einer Heilpraxis. Analysiere diesen Klienten für die therapeutische Begleitung:

Klient: ${client.name}
Geburtsdatum: ${birthDate}
Geburtsname: ${birthName || 'nicht angegeben'}

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
4. **Heilungsimpulse** (3 konkrete Ansätze für die Praxisarbeit basierend auf den Zahlen)
${nums.karmicDebts.length > 0 ? `5. **Karmische Themen** (2 Sätze): Was bedeuten die Schuldzahlen ${nums.karmicDebts.join(', ')} für die therapeutische Arbeit?` : ''}
${client.hdType ? `6. **Brücke HD ↔ Numerologie** (2 Sätze): Wie ergänzen sich ${client.hdType} und Lebenszahl ${nums.lifePath}?` : ''}

Warmherzig, tiefgründig, poetisch aber präzise. Ohne Heilversprechen.`;

      setAiText(await groqFetch(prompt));
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
            <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: T.textMid, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Geburtsname (für Namenszahlen)</div>
            <input
              type="text"
              value={birthName}
              onChange={e => setBirthName(e.target.value)}
              placeholder="Vollständiger Geburtsname…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${T.border}`, fontFamily: 'Raleway', fontSize: '13px', color: T.text, background: T.bgCard, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontFamily: 'Raleway', fontSize: '10px', color: T.textSoft, marginTop: '4px' }}>Tipp: Der Geburtsname (vor Heirat) ergibt die genauesten Namenszahlen.</div>
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
                }}>{nums.lifePath}</div>
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
