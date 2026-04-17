import React, { useState, useEffect, useCallback, useRef } from "react";
import { OT, ORGAN_MAP, CHAKRA_SYSTEM, OCard, OBtn, OLabel } from "./OracleUI.jsx";

const OT_GREEN = "#16A34A";
const OT_GREENL = "#DCFCE7";

function OrganspracheKarte({ groqFetch }){
  const [gewaehltes, setGewaehltes] = useState(null);
  const [seite, setSeite]           = useState("links");
  const [kiDetail, setKiDetail]     = useState("");
  const [kiLaed, setKiLaed]         = useState(false);

  const ladeKiDetail = async (organ, daten) => {
    if (!groqFetch) return;
    setKiLaed(true); setKiDetail("");
    const chkr = CHAKRA_SYSTEM.find(c=>c.id===daten.chakra);
    const prompt = `Du bist ein energetischer Heiler und erklärst Organsprache präzise und praxisnah.

Organ: ${organ} (Emoji: ${daten.emoji})
Seite: ${seite} = ${daten.seiten?.[seite]||"universal"}
Symbolik: ${daten.symbolik.join(", ")}
Emotionen: ${daten.emotion.join(", ")}
Chakra-Bezug: ${chkr?.name}
Ahnen-Thema: ${daten.ahnen}

Gib eine PRAXISNAHE Erklärung in 3 kurzen Abschnitten:

1. 🎯 WAS DIESES ORGAN JETZT SAGEN WILL (3-4 Sätze, direkt zum Punkt)
2. 💬 TYPISCHE SÄTZE DES KLIENTEN (3 konkrete Sätze die der Klient oft sagt wenn dieses Muster aktiv ist)  
3. 🌟 NÄCHSTE SCHRITTE IN DER SITZUNG (2-3 konkrete Handlungsimpulse)

Keine langen Einleitungen. Sofort in die Praxis.`;

    try {
      const antwort = await groqFetch(prompt);
      setKiDetail(antwort);
    } catch { setKiDetail("Fehler bei der Analyse."); }
    setKiLaed(false);
  };

  const waehleOrgan = (organ) => {
    setGewaehltes(organ);
    setKiDetail("");
    ladeKiDetail(organ, ORGAN_MAP[organ]);
  };

  if (gewaehltes && ORGAN_MAP[gewaehltes]) {
    const daten = ORGAN_MAP[gewaehltes];
    const chkr = CHAKRA_SYSTEM.find(c=>c.id===daten.chakra);
    return (
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <button onClick={()=>{setGewaehltes(null);setKiDetail("");}} style={{fontFamily:"Raleway",fontSize:"13px",color:"#C9A84C",fontWeight:700,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>← Alle Organe</button>

        <OCard style={{background:OT.bgSoft,border:`1.5px solid ${OT.borderMid}`}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
            <span style={{fontSize:"36px"}}>{daten.emoji}</span>
            <div>
              <div style={{fontFamily:"Cinzel",fontSize:"18px",color:OT.text,fontWeight:700,textTransform:"capitalize"}}>{gewaehltes}</div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:600,marginTop:"2px"}}>Chakra: {chkr?.name||daten.chakra} · {chkr?.symbol}</div>
            </div>
          </div>

          {daten.seiten && (
            <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
              {["links","rechts"].map(s=>(
                <button key={s} onClick={()=>setSeite(s)} style={{flex:1,padding:"9px",borderRadius:"10px",border:`1.5px solid ${seite===s?"#C9A84C":OT.border}`,background:seite===s?"#C9A84C":OT.bgCard,color:seite===s?"white":OT.textMid,fontFamily:"Raleway",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>
                  {s==="links"?"◀ Links":"Rechts ▶"}<br/>
                  <span style={{fontSize:"9px",fontWeight:500,opacity:0.85}}>{daten.seiten[s]}</span>
                </button>
              ))}
            </div>
          )}

          <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"}}>
            {daten.symbolik.map(s=><span key={s} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"4px 11px",borderRadius:"12px",background:"rgba(255,255,255,0.9)",color:OT.gold,border:"1px solid #D97706"}}>{s}</span>)}
          </div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,lineHeight:"1.6",marginBottom:"10px"}}>
            <b>Ahnen-Thema:</b> {daten.ahnen}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {daten.heilung.map(h=><span key={h} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"3px 10px",borderRadius:"10px",background:"rgba(201,168,76,0.15)",color:"#A87D3A",border:`1px solid ${OT.borderMid}`}}>💚 {h}</span>)}
          </div>
        </OCard>

        <OCard>
          <OLabel color={OT.violetD}>✦ KI-Praxisanalyse</OLabel>
          {kiLaed ? (
            <div style={{textAlign:"center",padding:"24px",fontFamily:"Raleway",fontSize:"13px",color:OT.textMid}}>⏳ Analysiere...</div>
          ) : kiDetail ? (
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.9",whiteSpace:"pre-wrap",fontWeight:500}}>{kiDetail}</div>
          ) : (
            <OBtn onClick={()=>ladeKiDetail(gewaehltes,daten)}>✦ KI-Praxisanalyse laden</OBtn>
          )}
        </OCard>
      </div>
    );
  }

  const kategorien = {
    "Kopf & Sinne":["kopf / gehirn","augen","ohren","mund / zähne / kiefer"],
    "Hals & Torso":["hals / schilddrüse","schultern","herz","lunge","leber / galle","magen / milz"],
    "Bauch & Becken":["nieren / nebennieren","hüfte / becken","blut / kreislauf"],
    "Extremitäten":["ellenbogen","hände / finger","knie","sprunggelenk / füße"],
    "Rücken":["rücken oben","rücken mitte","rücken unten / lendenwirbel"],
    "Systemisch":["haut"],
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      <OCard style={{background:OT.bgSoft,padding:"16px"}}>
        <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700,marginBottom:"4px"}}>Organsprache-Navigator</div>
        <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Wähle ein Organ → sofortige energetische Deutung + KI-Praxisanalyse</div>
      </OCard>
      {Object.entries(kategorien).map(([kat, organe]) => (
        <OCard key={kat}>
          <OLabel>{kat}</OLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            {organe.filter(o=>ORGAN_MAP[o]).map(organ => (
              <button key={organ} onClick={()=>waehleOrgan(organ)} style={{padding:"10px 12px",borderRadius:"12px",border:`1.5px solid ${OT.border}`,background:OT.bgSofter,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"8px",transition:"all 0.15s"}}>
                <span style={{fontSize:"18px"}}>{ORGAN_MAP[organ].emoji}</span>
                <span style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:OT.text,textTransform:"capitalize",lineHeight:"1.3"}}>{organ}</span>
              </button>
            ))}
          </div>
        </OCard>
      ))}
    </div>
  );
}

const LERNMODUL_STUFEN = {
  1: { name:"Einführung",    farbe:"#16A34A", icon:"🌱", bg:"#DCFCE7" },
  2: { name:"Grundlagen",   farbe:"#C9A84C", icon:"📚", bg:"rgba(201,168,76,0.15)" },
  3: { name:"Vertiefung",   farbe:"#0284C7", icon:"🎯", bg:"#DBEAFE" },
  4: { name:"Meisterschaft",farbe:"#7C3AED", icon:"⚡", bg:"#EDE9FE" },
  5: { name:"Zertifizierung",farbe:"#D97706",icon:"🏆", bg:"#FEF3C7" },
};

const ORGANSPRACHE_INHALT = {
  1: {
    titel: "Was ist Organsprache?",
    untertitel: "Das Grundprinzip: Körper als Spiegel der Seele",
    lernziele: [
      "Verstehen, dass Körpersymptome immer eine Botschaft tragen",
      "Den Zusammenhang zwischen Emotion und Organ erfassen",
      "Erste Schlüsselbegriffe der Organsprache kennen",
      "Den respektvollen Umgang mit Körperbotschaften üben",
    ],
    sektionen: [
      {
        titel: "Das Grundprinzip", icon: "🌿",
        inhalt: `Der Körper ist kein Zufallsprodukt. Er ist der ehrlichste Spiegel, den wir haben – und er spricht eine Sprache, die jeder lernen kann.\n\nOrgansprache beschäftigt sich mit der Frage: Warum erkrankt gerade dieses Organ? Was will mir mein Körper damit sagen?\n\nDer Schlüsselsatz lautet: Jede körperliche Störung ist ein Lösungsversuch der Seele – ein Signal, das gehört werden möchte.`,
        highlight: "Der Körper lügt nie. Er zeigt immer, was die Seele noch nicht in Worte gefasst hat.",
      },
      {
        titel: "Drei Grundgesetze der Organsprache", icon: "⚖️",
        inhalt: `**1. Gesetz der Entsprechung**\nJedes Organ entspricht einem Lebensthema, einem emotionalen Zustand oder einem Beziehungsmuster.\n\n**2. Gesetz der Polarität (Links/Rechts)**\nLinke Seite → Weibliches Prinzip, Empfangen, Mutter, Innen, Vergangenheit\nRechte Seite → Männliches Prinzip, Geben, Vater, Außen, Zukunft\n\n**3. Gesetz der Schichten**\nKörpersymptome sprechen immer auf mehreren Ebenen gleichzeitig: körperlich, emotional, mental, spirituell.`,
        highlight: null,
      },
      {
        titel: "Was Organsprache NICHT ist", icon: "⚠️",
        inhalt: `Organsprache ist ein ergänzendes Deutungssystem – kein Ersatz für medizinische Diagnose und Behandlung.\n\nIn der Arbeit mit Klienten gilt: Wir stellen Deutungsangebote. Der Klient entscheidet, was für ihn stimmig ist.`,
        highlight: "Organsprache ist eine Einladung zur Selbstreflexion, keine Schuldzuweisung.",
      },
    ],
    praxisuebungen: [
      { titel: "Körperscan-Tagebuch (7 Tage)", beschreibung: "Führe 7 Tage lang ein Körpertagebuch. Notiere täglich: Welche Körperstelle meldet sich? Was tue ich gerade im Leben? Welche Emotionen habe ich?", dauer: "10 Min täglich" },
      { titel: "Eigener Körper – erste Deutung", beschreibung: "Wähle ein aktuelles Körpersymptom bei dir selbst. Frage dich: Was könnte dieses Organ thematisieren? Schreibe alles auf, ohne zu werten.", dauer: "20–30 Min" },
    ],
    schluesselwoerter: ["Körpersymbolik","Psychosomatik","Links/Rechts-Prinzip","TCM","Resonanz","Deutungsangebot"],
  },
  2: {
    titel: "Die 20 Hauptorgane systematisch",
    untertitel: "Themen, Emotionen, Polarität – das vollständige Referenzsystem",
    lernziele: [
      "Die 20 wichtigsten Organe und ihre Kernthemen kennen",
      "Links-Rechts-Polarität sicher anwenden",
      "Emotionale Muster hinter Körpersymptomen erkennen",
      "Erste Klientendeutungen strukturiert durchführen",
    ],
    sektionen: [
      {
        titel: "Kopf & Sinnesorgane", icon: "🧠",
        inhalt: `**Kopf / Gehirn**\nKopfschmerzen signalisieren oft mentale Überlastung. Links: Vergangenheit, weibliche Linie. Rechts: Zukunft, männliche Linie.\n\n**Augen**\nAugenprobleme deuten auf Schwierigkeiten hin, die Realität so zu sehen, wie sie ist. Links: Innenschau. Rechts: Außenwelt.\n\n**Ohren**\nTinnitus = innerer Lärm. Hörverlust = Selektives Nicht-Hören als Schutz. Links: Eigene innere Stimme. Rechts: Äußere Stimmen.`,
        highlight: null,
      },
      {
        titel: "Herz, Lunge & Brust", icon: "❤️",
        inhalt: `**Herz**\nHerzblockaden entstehen durch nicht gelebte Trauer, Verhärtung als Schutzreaktion und unterdrückte Sehnsucht.\n\n**Lunge**\nTrauer ist die klassische Emotion der Lunge (TCM). Asthma: 'Ich kann nicht genug empfangen.'\n\n**Schilddrüse**\nÜberfunktion = Zu viel, zu schnell. Unterfunktion = Zu langsam, zurückgezogen. Hashimoto = Selbstangriff, innerer Krieg.`,
        highlight: "Das Herz weiß immer, was es braucht. Die Arbeit ist, ihm zuzuhören.",
      },
    ],
    praxisuebungen: [
      { titel: "Klientensimulation – 5 Symptome deuten", beschreibung: "Wähle 5 Körpersymptome aus deinem Bekanntenkreis. Arbeite systematisch: Welches Organ? Welche Seite? Welches Thema?", dauer: "45–60 Min" },
    ],
    schluesselwoerter: ["5-Elemente-TCM","Links-Rechts-Polarität","Psychosomatik","Deutung","Organkorrespondenz"],
  },
  3: {
    titel: "Organsprache in der Praxis",
    untertitel: "Fallarbeit, Tiefendeutung & Ahnenlinie",
    lernziele: [
      "Komplexe Symptombilder mehrdimensional deuten",
      "Ahnenlinien-Bezüge in der Organsprache erkennen",
      "Ein strukturiertes Anamnese-Gespräch führen",
      "Deutungsangebote klientenzentriert formulieren",
    ],
    sektionen: [
      {
        titel: "Das Deutungsgespräch – Struktur & Haltung", icon: "💬",
        inhalt: `**Phase 1: Öffnen** – Sicherheit schaffen, Erlaubnis holen.\n**Phase 2: Erheben** – Lass den Klienten erzählen.\n**Phase 3: Deuten** – Biete Deutungen als Fragen an: 'Könnte es sein, dass…?'\n**Phase 4: Integrieren** – Was nimmt der Klient mit?`,
        highlight: "Nicht 'Das bedeutet X', sondern 'Könnte es sein, dass…?' – diese Formulierung verändert alles.",
      },
      {
        titel: "Ahnenlinien & Organsprache", icon: "🧬",
        inhalt: `Viele chronische Körpersymptome tragen Muster, die nicht in diesem Leben entstanden sind.\n\n**Erkennungszeichen für Ahnenmuster:**\n- Symptom beginnt ohne erkennbaren Auslöser\n- Ähnliche Symptome bei Eltern oder Großeltern\n- Links = Mutterlinie, rechts = Vaterlinie`,
        highlight: null,
      },
    ],
    praxisuebungen: [
      { titel: "Strukturiertes Anamnese-Gespräch üben", beschreibung: "Führe mit einer Person ein vollständiges Deutungsgespräch (alle 4 Phasen) zu einem Körpersymptom.", dauer: "60–90 Min" },
    ],
    schluesselwoerter: ["Deutungsgespräch","Anamnese","Transgenerational","Resonanz","Ahnenmuster"],
  },
  4: {
    titel: "Meisterschaft der Organsprache",
    untertitel: "Komplexe Muster, Systemik & energetische Integration",
    lernziele: [
      "Mehrfachsymptome als Gesamtsystem lesen",
      "Organsprache mit anderen Methoden verbinden",
      "Energetische Heilarbeit auf Basis von Organsprache ableiten",
      "Eigene blinde Flecken als Praktizierender erkennen",
    ],
    sektionen: [
      {
        titel: "Das Gesamtsystem lesen", icon: "🗺️",
        inhalt: `Auf Meisterschaftsebene wird nicht mehr ein einzelnes Symptom betrachtet – sondern der Körper als Landkarte eines Lebenssystems.\n\nWenn ein Klient mit mehreren Symptomen kommt, lies sie als zusammenhängende Geschichte.`,
        highlight: "Kein Symptom existiert allein. Jeder Körper erzählt eine Geschichte – lerne, das ganze Buch zu lesen.",
      },
      {
        titel: "Blinde Flecken des Praktizierers", icon: "🪞",
        inhalt: `Als Praktizierender bringst du dein eigenes System mit in jede Sitzung. Deine eigenen ungelösten Körperthemen beeinflussen, was du beim Klienten siehst.\n\n**Die Praxis der Selbstreflexion:**\nFühre ein Praktizierenden-Tagebuch: Nach jeder Sitzung – Was hat mich bewegt?`,
        highlight: "Der beste Heiler ist der, der sich selbst am besten kennt – einschließlich seiner Grenzen.",
      },
    ],
    praxisuebungen: [
      { titel: "Gesamtsystem-Analyse: 3 Klientenfälle", beschreibung: "Erstelle für 3 Klienten eine Körper-Landkarte: Alle Symptome einzeichnen, Verbindungen ziehen, das Gesamtthema formulieren.", dauer: "3–4 Stunden" },
    ],
    schluesselwoerter: ["Gesamtsystem","Körper-Landkarte","Blinder Fleck","Supervision","Berufsethik"],
  },
  5: {
    titel: "Zertifizierungsprüfung",
    untertitel: "Nachweis deiner Kompetenz in Organsprache",
    lernziele: [
      "Alle Lerninhalte der Stufen 1–4 sicher abrufen",
      "Deutungen klar und klientenzentriert formulieren",
      "Berufsethische Standards kennen und vertreten",
    ],
    sektionen: [
      {
        titel: "Prüfungsvorbereitung", icon: "📝",
        inhalt: `15 Fragen · Multiple Choice · 3 Antwortoptionen pro Frage\nMindestpunktzahl für Zertifikat: 12/15 (80%)\n\nDu kannst die Prüfung beliebig oft wiederholen.`,
        highlight: null,
      },
    ],
    praxisuebungen: [],
    schluesselwoerter: [],
  },
};

const QUIZ_FRAGEN = [
  { frage: "Was beschreibt das Grundprinzip der Organsprache am treffendsten?", optionen: ["Körpersymptome entstehen ausschließlich durch Bakterien und Viren.", "Jeder Körper trägt emotionale Botschaften – Symptome sind Signale der Seele.", "Organsprache ist eine alternative Diagnose-Methode, die Schulmedizin ersetzt."], richtig: 1, erklaerung: "Organsprache arbeitet mit dem Körper als Spiegel emotionaler Themen. Sie ersetzt keine Schulmedizin, sondern ergänzt sie." },
  { frage: "Was bedeutet die linke Körperseite im Links-Rechts-Prinzip?", optionen: ["Zukunft, männliches Prinzip, Vater, Außenwelt", "Vergangenheit, weibliches Prinzip, Mutter, Innenwelt", "Logik, Ratio, Beruf, Pflicht"], richtig: 1, erklaerung: "Links steht für das weibliche Prinzip: Vergangenheit, Empfangen, Mutter, Innenwelt." },
  { frage: "Welches Organ ist in der TCM klassisch mit der Emotion Wut verbunden?", optionen: ["Niere", "Lunge", "Leber"], richtig: 2, erklaerung: "In der TCM ist die Leber das Organ, das mit Wut, Bitterkeit und aufgestautem Ärger korrespondiert." },
  { frage: "Ein Klient hat chronische Ellenbogenprobleme. Welche Frage ist im Deutungsgespräch am hilfreichsten?", optionen: ["Haben Sie zu wenig Vitamin D?", "Wo in Ihrem Leben dürfen Sie nicht anecken oder sich Raum nehmen?", "Wann haben Sie zuletzt Sport gemacht?"], richtig: 1, erklaerung: "Der Ellenbogen steht symbolisch für 'anecken', sich behaupten, Reibung erzeugen." },
  { frage: "Was versteht man unter dem 'Gesetz der Entsprechung' in der Organsprache?", optionen: ["Jedes Organ entspricht einem anderen Organ im Körper.", "Jedes Organ entspricht einem Lebensthema, einer Emotion oder einem Beziehungsmuster.", "Jedes Symptom entspricht genau einer Erkrankung."], richtig: 1, erklaerung: "Das Gesetz der Entsprechung besagt, dass Organe mit bestimmten Themen verbunden sind – diese Verbindungen folgen einer inneren Logik." },
  { frage: "Was signalisiert Kurzsichtigkeit auf der symbolischen Ebene?", optionen: ["Die Vergangenheit und das Nahe wird klar gesehen, die Zukunft/das Ferne verschwimmt.", "Es gibt keine symbolische Bedeutung – Kurzsichtigkeit ist rein genetisch.", "Die Zukunft wird klar gesehen, die Vergangenheit ist unklar."], richtig: 0, erklaerung: "Kurzsichtigkeit entspricht symbolisch der Fähigkeit, das Nahe/Vergangene gut zu sehen, während der Blick in die Ferne verschwimmt." },
  { frage: "Welche Formulierung entspricht dem korrekten Umgang im Deutungsgespräch?", optionen: ["\"Ihr Knieschmerz bedeutet, dass Sie zu starr sind.\"", "\"Könnte es sein, dass dieses Symptom etwas mit Ihrer Flexibilität im Leben zu tun hat?\"", "\"Sie müssen jetzt sofort Ihre innere Starrheit auflösen.\""], richtig: 1, erklaerung: "Deutungen werden immer als Angebot formuliert, nie als Behauptung." },
  { frage: "Welche Aussage über Organsprache und Schulmedizin ist korrekt?", optionen: ["Organsprache ersetzt die Schulmedizin vollständig.", "Organsprache ist eine Ergänzung zur Schulmedizin, kein Ersatz.", "Organsprache sollte nie zusammen mit schulmedizinischer Behandlung eingesetzt werden."], richtig: 1, erklaerung: "Organsprache ist ein komplementäres System. Sie liefert tiefere Deutungsebenen, ersetzt aber keine medizinische Behandlung." },
  { frage: "Erkenne das Ahnenmuster: Welches dieser Zeichen deutet auf ein transgenerationales Thema hin?", optionen: ["Symptom tritt erstmals nach einer sportlichen Überbelastung auf.", "Symptom beginnt ohne erkennbaren Auslöser und ähnliche Beschwerden gab es bereits bei Eltern oder Großeltern.", "Symptom bessert sich nach einer Antibiotika-Kur sofort."], richtig: 1, erklaerung: "Transgenerationale Muster zeigen sich durch fehlenden Eigenauslöser und Ähnlichkeit mit Symptomen in der Ahnenlinie." },
  { frage: "Welche Emotion ist in der TCM der Niere zugeordnet?", optionen: ["Wut", "Trauer", "Angst"], richtig: 2, erklaerung: "In der TCM ist die Niere der Sitz der Lebensenergie (Jing) und eng mit der Urangst verbunden." },
  { frage: "Was beschreibt einen 'blinden Fleck' beim Praktizierenden?", optionen: ["Ein Sehproblem das die Arbeit mit Klienten erschwert.", "Eigene ungelöste Themen, die die Wahrnehmung in der Sitzung verzerren.", "Symptome bei Klienten, für die es keine Deutung gibt."], richtig: 1, erklaerung: "Blinde Flecken entstehen, wenn eigene unverarbeitete Themen die professionelle Wahrnehmung beeinflussen." },
  { frage: "Welchem Chakra ist die Schilddrüse vorrangig zugeordnet?", optionen: ["Herzchakra", "Kehlkopfchakra", "Solarplexuschakra"], richtig: 1, erklaerung: "Das Kehlkopfchakra regiert Ausdruck, Wahrheit und Kommunikation. Die Schilddrüse sitzt im Halsbereich." },
  { frage: "Was ist das Thema von chronischen Rückenschmerzen im unteren Lendenwirbelbereich?", optionen: ["Unterdrückte Kreativität und Sexualität.", "Mangel an Unterstützung, Existenzangst, finanzielle Sorgen.", "Fehlende Kommunikation und unterdrückte Wahrheit."], richtig: 1, erklaerung: "Der untere Rücken steht für Grundbedürfnisse: Existenz, Geld, materielle Sicherheit." },
  { frage: "Welche Phase des Deutungsgesprächs kommt zuerst?", optionen: ["Deuten – dem Klienten die Bedeutung des Symptoms erklären.", "Öffnen – Sicherheit schaffen und das Konzept kurz erklären.", "Integrieren – einen Auftrag für zuhause mitgeben."], richtig: 1, erklaerung: "Das Deutungsgespräch beginnt immer mit der Öffnungsphase: Sicherheit schaffen, Erlaubnis holen." },
  { frage: "Welche Aussage über Human Design und Organsprache ist korrekt?", optionen: ["Beide Systeme haben nichts miteinander zu tun.", "Nicht-definierte Zentren in HD können erklären, warum Praktizierende bestimmte Körpersymptome besonders sensitiv aufnehmen.", "Human Design kann Organsprache vollständig ersetzen."], richtig: 1, erklaerung: "Nicht-definierte Zentren in Human Design sind besonders empfindlich für Fremdenergie." },
];

const Label = ({children, color, size="10"}) => (
  <div style={{fontFamily:"Raleway",fontSize:`${size}px`,letterSpacing:"2px",fontWeight:800,color:color||OT.textSoft,textTransform:"uppercase",marginBottom:"10px"}}>{children}</div>
);

const Card = ({children, style={}}) => (
  <div style={{background:OT.bgCard,borderRadius:"18px",padding:"18px",border:`1.5px solid ${OT.border}`,boxShadow:`0 2px 14px ${OT.shadow}`,...style}}>{children}</div>
);

const Highlight = ({text}) => (
  <div style={{margin:"16px 0",padding:"14px 18px",background:OT.bgSoft,borderRadius:"12px",borderLeft:`4px solid #C9A84C`}}>
    <div style={{fontFamily:"Raleway",fontSize:"13px",color:"#A87D3A",fontWeight:700,lineHeight:"1.7",fontStyle:"italic"}}>„{text}"</div>
  </div>
);

const Lernziel = ({text, nr}) => (
  <div style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"8px"}}>
    <div style={{width:"22px",height:"22px",borderRadius:"50%",background:"#C9A84C",color:"white",fontFamily:"Cinzel",fontSize:"10px",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px"}}>{nr}</div>
    <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,fontWeight:500,lineHeight:"1.6"}}>{text}</div>
  </div>
);

const formatText = (text) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <React.Fragment key={i}>
        {parts.map((part, j) => j % 2 === 1
          ? <strong key={j} style={{color:OT.text,fontWeight:800}}>{part}</strong>
          : part
        )}
        {i < lines.length - 1 && <br/>}
      </React.Fragment>
    );
  });
};

function Quiz({ onAbschluss }) {
  const [aktFrage, setAktFrage]           = useState(0);
  const [antworten, setAntworten]         = useState({});
  const [gezeigt, setGezeigt]             = useState(false);
  const [abgeschlossen, setAbgeschlossen] = useState(false);
  const [animiert, setAnimiert]           = useState(false);

  const frage = QUIZ_FRAGEN[aktFrage];
  const gewählt = antworten[aktFrage];
  const richtig = gewählt === frage.richtig;
  const punkte = Object.entries(antworten).filter(([i, a]) => QUIZ_FRAGEN[+i].richtig === a).length;
  const bestanden = punkte >= 12;

  const antwortenFn = (opt) => {
    if (gezeigt) return;
    setAntworten(a => ({...a, [aktFrage]: opt}));
    setGezeigt(true);
  };

  const weiter = () => {
    setAnimiert(true);
    setTimeout(() => {
      setGezeigt(false);
      if (aktFrage < QUIZ_FRAGEN.length - 1) {
        setAktFrage(a => a + 1);
      } else {
        setAbgeschlossen(true);
        if (bestanden) onAbschluss?.(punkte);
      }
      setAnimiert(false);
    }, 200);
  };

  if (abgeschlossen) {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        <Card style={{background:OT.bgSoft,border:`1.5px solid ${bestanden?OT.borderMid:"#FCA5A5"}`}}>
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:"52px",marginBottom:"14px"}}>{bestanden?"🏆":"📚"}</div>
            <div style={{fontFamily:"Cinzel",fontSize:"22px",color:OT.text,fontWeight:700,marginBottom:"6px"}}>{bestanden?"Bestanden!":"Noch nicht bestanden"}</div>
            <div style={{fontFamily:"Raleway",fontSize:"15px",color:OT.textMid,fontWeight:700,marginBottom:"16px"}}>{punkte}/15 Punkte · {Math.round((punkte/15)*100)}%</div>
            <div style={{display:"flex",justifyContent:"center",gap:"6px",marginBottom:"20px"}}>
              {QUIZ_FRAGEN.map((_, i) => {
                const korrekt = antworten[i] === QUIZ_FRAGEN[i].richtig;
                return <div key={i} style={{width:"16px",height:"16px",borderRadius:"50%",background:korrekt?OT_GREEN:"#FCA5A5",border:`2px solid ${korrekt?"#15803D":"#E11D48"}`}}/>;
              })}
            </div>
            {bestanden ? (
              <div style={{background:"rgba(255,255,255,0.85)",borderRadius:"14px",padding:"16px",marginBottom:"10px"}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",color:"#15803D",fontWeight:600,lineHeight:"1.7"}}>
                  Herzlichen Glückwunsch! Du hast die Prüfung bestanden und das Human Resonanz Akademie Zertifikat für <strong>Organsprache</strong> verdient.
                </div>
              </div>
            ) : (
              <div style={{background:"rgba(255,255,255,0.85)",borderRadius:"14px",padding:"16px",marginBottom:"10px"}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.textMid,fontWeight:600,lineHeight:"1.7"}}>Du brauchst mindestens 12/15 Punkte (80%). Versuche es erneut.</div>
              </div>
            )}
            <button onClick={()=>{setAktFrage(0);setAntworten({});setGezeigt(false);setAbgeschlossen(false);}} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"12px 24px",borderRadius:"12px",border:"none",cursor:"pointer",background:bestanden?`linear-gradient(135deg,#C9A84C,#A87D3A)`:`linear-gradient(135deg,${OT.violet},${OT.violetD})`,color:"white"}}>
              {bestanden?"✦ Nochmal absolvieren":"📚 Nochmal versuchen"}
            </button>
          </div>
        </Card>
        <Card>
          <Label color={OT.textMid}>Auswertung</Label>
          {QUIZ_FRAGEN.map((fq, i) => {
            const korrekt = antworten[i] === fq.richtig;
            return (
              <div key={i} style={{marginBottom:"10px",padding:"12px",borderRadius:"12px",background:korrekt?OT_GREENL:"#FFE4E6",border:`1px solid ${korrekt?"#86EFAC":"#FCA5A5"}`}}>
                <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:korrekt?OT_GREEN:OT.rose,marginBottom:"4px"}}>{korrekt?"✓":"✗"} Frage {i+1}</div>
                <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,fontWeight:600,marginBottom:"4px"}}>{fq.frage}</div>
                {!korrekt && <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500}}>Richtig: {fq.optionen[fq.richtig]}</div>}
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px",opacity:animiert?0:1,transition:"opacity 0.2s"}}>
      <div style={{display:"flex",gap:"4px"}}>
        {QUIZ_FRAGEN.map((_, i) => (
          <div key={i} style={{flex:1,height:"5px",borderRadius:"3px",background:i<aktFrage?(antworten[i]===QUIZ_FRAGEN[i].richtig?OT_GREEN:"#FCA5A5"):i===aktFrage?OT.violet:OT.border,transition:"background 0.3s"}}/>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{fontFamily:"Raleway",fontSize:"10px",color:OT.textSoft,fontWeight:700,letterSpacing:"1px"}}>FRAGE {aktFrage+1} VON {QUIZ_FRAGEN.length}</span>
        <span style={{fontFamily:"Raleway",fontSize:"10px",color:"#C9A84C",fontWeight:700}}>{Object.entries(antworten).filter(([i,a])=>QUIZ_FRAGEN[+i].richtig===a).length} richtig</span>
      </div>
      <Card style={{background:OT.bgSoft,border:`1.5px solid ${OT.borderMid}`}}>
        <div style={{fontFamily:"Raleway",fontSize:"14px",color:OT.text,fontWeight:700,lineHeight:"1.7"}}>{frage.frage}</div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {frage.optionen.map((opt, i) => {
          let bg = OT.bgCard, border = OT.border, color = OT.text;
          if (gezeigt) {
            if (i === frage.richtig) { bg = OT_GREENL; border = OT_GREEN; color = OT_GREEN; }
            else if (i === gewählt && i !== frage.richtig) { bg = "#FFE4E6"; border = OT.rose; color = OT.rose; }
          } else if (gewählt === i) { bg = "rgba(201,168,76,0.15)"; border = "#C9A84C"; }
          return (
            <button key={i} onClick={()=>antwortenFn(i)} style={{textAlign:"left",padding:"14px 16px",borderRadius:"14px",border:`1.5px solid ${border}`,background:bg,cursor:gezeigt?"default":"pointer",fontFamily:"Raleway",fontSize:"13px",color,fontWeight:gezeigt&&i===frage.richtig?700:500,lineHeight:"1.5",transition:"all 0.2s",display:"flex",alignItems:"flex-start",gap:"10px"}}>
              <span style={{fontFamily:"Cinzel",fontSize:"12px",fontWeight:700,flexShrink:0,marginTop:"2px",color:gezeigt&&i===frage.richtig?OT_GREEN:gezeigt&&i===gewählt?OT.rose:OT.textSoft}}>
                {i===0?"A":i===1?"B":"C"}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {gezeigt && (
        <Card style={{background:richtig?OT_GREENL:"#FFE4E6",border:`1.5px solid ${richtig?"#86EFAC":"#FCA5A5"}`}}>
          <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:800,color:richtig?OT_GREEN:OT.rose,marginBottom:"6px"}}>{richtig?"✓ Richtig!":"✗ Nicht ganz."}</div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,fontWeight:500,lineHeight:"1.7"}}>{frage.erklaerung}</div>
        </Card>
      )}
      {gezeigt && (
        <button onClick={weiter} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"13px",borderRadius:"13px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,#C9A84C,#A87D3A)`,color:"white",boxShadow:"0 4px 16px rgba(201,168,76,0.3)"}}>
          {aktFrage < QUIZ_FRAGEN.length - 1 ? "Nächste Frage →" : "Auswertung anzeigen →"}
        </button>
      )}
    </div>
  );
}

function OrganspracheLernmodul({ stufe = 1, onBack, onZertifikat }) {
  const [aktSektion, setAktSektion] = useState(0);
  const [quizModus, setQuizModus]   = useState(false);

  const inhalt = ORGANSPRACHE_INHALT[stufe];
  const stufeCfg = LERNMODUL_STUFEN[stufe];

  useEffect(() => { setAktSektion(0); setQuizModus(false); }, [stufe]);

  const scrollTop = () => window.scrollTo({top:0,behavior:"smooth"});

  if (quizModus) {
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
          <button onClick={()=>setQuizModus(false)} style={{fontFamily:"Raleway",fontSize:"13px",color:"#C9A84C",fontWeight:700,background:"none",border:"none",cursor:"pointer"}}>← Zurück</button>
          <div style={{fontFamily:"Cinzel",fontSize:"16px",color:OT.text,fontWeight:700}}>Prüfung · Organsprache</div>
        </div>
        <Quiz onAbschluss={(pkt)=>{onZertifikat?.(pkt);}}/>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
      <button onClick={onBack} style={{fontFamily:"Raleway",fontSize:"13px",color:"#C9A84C",fontWeight:700,background:"none",border:"none",cursor:"pointer",textAlign:"left",marginBottom:"12px"}}>← Zum Lernpfad</button>
      <div style={{position:"relative",borderRadius:"20px",overflow:"hidden",padding:"22px 20px",marginBottom:"16px",background:`linear-gradient(140deg,${stufeCfg.bg} 0%,#FFFFFF 45%,${OT.violetL} 100%)`,border:`1.5px solid ${stufeCfg.farbe}44`,boxShadow:`0 4px 20px ${OT.shadow}`}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:"14px",marginBottom:"14px"}}>
          <div style={{width:"52px",height:"52px",borderRadius:"50%",background:stufeCfg.farbe,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",flexShrink:0}}>{stufeCfg.icon}</div>
          <div>
            <div style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:800,color:stufeCfg.farbe,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"4px"}}>Stufe {stufe} · {stufeCfg.name}</div>
            <div style={{fontFamily:"Cinzel",fontSize:"18px",color:OT.text,fontWeight:700,lineHeight:"1.3"}}>{inhalt.titel}</div>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,marginTop:"4px"}}>{inhalt.untertitel}</div>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,0.75)",borderRadius:"12px",padding:"14px"}}>
          <Label color="#A87D3A" size="9">Lernziele dieser Stufe</Label>
          {inhalt.lernziele.map((z, i) => <Lernziel key={i} text={z} nr={i+1}/>)}
        </div>
      </div>

      {inhalt.sektionen.length > 1 && (
        <div style={{overflowX:"auto",marginBottom:"16px"}}>
          <div style={{display:"flex",gap:"6px",minWidth:"max-content",padding:"2px"}}>
            {inhalt.sektionen.map((s, i) => (
              <button key={i} onClick={()=>{setAktSektion(i);scrollTop();}} style={{display:"flex",alignItems:"center",gap:"5px",padding:"8px 13px",borderRadius:"20px",border:`1.5px solid ${aktSektion===i?stufeCfg.farbe:OT.border}`,background:aktSektion===i?stufeCfg.bg:OT.bgCard,color:aktSektion===i?stufeCfg.farbe:OT.textSoft,fontFamily:"Raleway",fontSize:"11px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>
                <span>{s.icon}</span><span style={{maxWidth:"120px",overflow:"hidden",textOverflow:"ellipsis"}}>{s.titel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {inhalt.sektionen.length > 0 && (() => {
        const s = inhalt.sektionen[stufe === 5 ? 0 : aktSektion];
        return (
          <Card style={{marginBottom:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"}}>
              <span style={{fontSize:"24px"}}>{s.icon}</span>
              <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700}}>{s.titel}</div>
            </div>
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"2",fontWeight:500}}>{formatText(s.inhalt)}</div>
            {s.highlight && <Highlight text={s.highlight}/>}
            {inhalt.sektionen.length > 1 && (
              <div style={{display:"flex",gap:"8px",marginTop:"20px",paddingTop:"16px",borderTop:`1px solid ${OT.border}`}}>
                {aktSektion > 0 && (
                  <button onClick={()=>{setAktSektion(a=>a-1);scrollTop();}} style={{flex:1,fontFamily:"Raleway",fontWeight:700,fontSize:"12px",padding:"10px",borderRadius:"12px",border:`1.5px solid ${OT.border}`,background:OT.bgCard,color:OT.textMid,cursor:"pointer"}}>← Zurück</button>
                )}
                {aktSektion < inhalt.sektionen.length - 1 && (
                  <button onClick={()=>{setAktSektion(a=>a+1);scrollTop();}} style={{flex:2,fontFamily:"Raleway",fontWeight:700,fontSize:"12px",padding:"10px",borderRadius:"12px",border:"none",background:`linear-gradient(135deg,${stufeCfg.farbe},#A87D3A)`,color:"white",cursor:"pointer"}}>
                    Weiter: {inhalt.sektionen[aktSektion+1].titel.split(" ").slice(0,3).join(" ")}... →
                  </button>
                )}
              </div>
            )}
          </Card>
        );
      })()}

      {inhalt.praxisuebungen.length > 0 && (
        <Card style={{background:OT.bgSoft,border:`1.5px solid ${OT.borderMid}`}}>
          <Label color="#A87D3A">🎯 Praxisübungen</Label>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {inhalt.praxisuebungen.map((u, i) => (
              <div key={i} style={{background:OT.bgCard,borderRadius:"14px",padding:"14px 16px",border:`1px solid ${OT.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px",gap:"8px"}}>
                  <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,fontWeight:700}}>{u.titel}</div>
                  <span style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"3px 9px",borderRadius:"10px",background:OT.goldL,color:OT.gold,flexShrink:0}}>⏱ {u.dauer}</span>
                </div>
                <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,lineHeight:"1.7"}}>{u.beschreibung}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {inhalt.schluesselwoerter.length > 0 && (
        <Card>
          <Label>Schlüsselbegriffe dieser Stufe</Label>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {inhalt.schluesselwoerter.map(w => (
              <span key={w} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"5px 12px",borderRadius:"12px",background:OT.bgCard,color:"#A87D3A",border:`1px solid ${OT.borderMid}`}}>{w}</span>
            ))}
          </div>
        </Card>
      )}

      <div style={{padding:"8px 0 40px"}}>
        {stufe < 5 ? (
          <div style={{background:OT.bgSoft,borderRadius:"16px",padding:"18px",border:`1.5px solid ${stufeCfg.farbe}33`,textAlign:"center"}}>
            <div style={{fontFamily:"Cinzel",fontSize:"14px",color:OT.text,fontWeight:700,marginBottom:"6px"}}>Bereit für die nächste Stufe?</div>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,marginBottom:"14px"}}>Stufe {stufe+1}: {LERNMODUL_STUFEN[stufe+1].name} – {LERNMODUL_STUFEN[stufe+1].icon}</div>
            <button onClick={onBack} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"12px 24px",borderRadius:"12px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${stufeCfg.farbe},#A87D3A)`,color:"white"}}>Zur Stufenauswahl →</button>
          </div>
        ) : (
          <div style={{background:OT.bgSoft,borderRadius:"16px",padding:"22px",border:`1.5px solid #D97706`,textAlign:"center"}}>
            <div style={{fontSize:"40px",marginBottom:"12px"}}>🏆</div>
            <div style={{fontFamily:"Cinzel",fontSize:"16px",color:OT.text,fontWeight:700,marginBottom:"6px"}}>Zertifizierungsprüfung</div>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,marginBottom:"16px",lineHeight:"1.7"}}>15 Fragen · Multiple Choice · Mindestens 12/15 Punkte</div>
            <button onClick={()=>setQuizModus(true)} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"14px",padding:"14px 28px",borderRadius:"13px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,#D97706,#B45309)`,color:"white",boxShadow:"0 4px 20px rgba(217,119,6,0.4)"}}>✦ Prüfung starten</button>
          </div>
        )}
      </div>
    </div>
  );
}

export { OrganspracheKarte, OrganspracheLernmodul };
