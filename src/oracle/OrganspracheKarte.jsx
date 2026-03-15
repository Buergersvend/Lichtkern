import React, { useState, useEffect, useCallback, useRef } from "react";
import { OT } from "./OracleUI.jsx";

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
        <button onClick={()=>{setGewaehltes(null);setKiDetail("");}} style={{fontFamily:"Raleway",fontSize:"13px",color:OT.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>← Alle Organe</button>
        
        <OCard style={{background:`linear-gradient(135deg,${OT.tealL},${OT.violetL})`,border:`1.5px solid ${OT.borderMid}`}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
            <span style={{fontSize:"36px"}}>{daten.emoji}</span>
            <div>
              <div style={{fontFamily:"Cinzel",fontSize:"18px",color:OT.text,fontWeight:700,textTransform:"capitalize"}}>{gewaehltes}</div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:600,marginTop:"2px"}}>Chakra: {chkr?.name||daten.chakra} · {chkr?.symbol}</div>
            </div>
          </div>

          {/* Seiten-Toggle */}
          {daten.seiten && (
            <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
              {["links","rechts"].map(s=>(
                <button key={s} onClick={()=>setSeite(s)} style={{flex:1,padding:"9px",borderRadius:"10px",border:`1.5px solid ${seite===s?OT.teal:OT.border}`,background:seite===s?OT.teal:"white",color:seite===s?"white":OT.textMid,fontFamily:"Raleway",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>
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
            {daten.heilung.map(h=><span key={h} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"3px 10px",borderRadius:"10px",background:"rgba(255,255,255,0.8)",color:OT.teal,border:`1px solid ${OT.borderMid}`}}>💚 {h}</span>)}
          </div>
        </OCard>

        {/* KI-Detailanalyse */}
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

  // Organ-Raster
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
      <OCard style={{background:`linear-gradient(135deg,${OT.tealL},${OT.violetL})`,padding:"16px"}}>
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

// ════════════════════════════════════════════════════════════════
//  AURA & CHIRURGIE
// ════════════════════════════════════════════════════════════════
function AuraChirurgie({ groqFetch }) {

// ─── ORGANSPRACHE LERNMODUL ───────────────────
  1: { name:"Einführung",    farbe:"#16A34A", icon:"🌱", bg:"#DCFCE7" },
  2: { name:"Grundlagen",   farbe:"#0D9488", icon:"📚", bg:"#CCFBF1" },
  3: { name:"Vertiefung",   farbe:"#0284C7", icon:"🎯", bg:"#DBEAFE" },
  4: { name:"Meisterschaft",farbe:"#7C3AED", icon:"⚡", bg:"#EDE9FE" },
  5: { name:"Zertifizierung",farbe:"#D97706",icon:"🏆", bg:"#FEF3C7" },
};

// ════════════════════════════════════════════════════════════════
//  LERNINHALTE · Alle 5 Stufen
// ════════════════════════════════════════════════════════════════
const ORGANSPRACHE_INHALT = {

  // ─────────────────────────────────────────────────────────────
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
        titel: "Das Grundprinzip",
        icon: "🌿",
        inhalt: `Der Körper ist kein Zufallsprodukt. Er ist der ehrlichste Spiegel, den wir haben – und er spricht eine Sprache, die jeder lernen kann.

Organsprache (auch: Körpersymbolik, psychosomatische Symbolik) beschäftigt sich mit der Frage: Warum erkrankt gerade dieses Organ? Warum schmerzt diese Körperstelle? Was will mir mein Körper damit sagen?

Das Prinzip ist so alt wie die Menschheit selbst. In der Traditionellen Chinesischen Medizin (TCM) ist seit über 3.000 Jahren bekannt, dass Leber und Galle mit Wut verbunden sind, die Lunge mit Trauer und die Nieren mit Angst. Moderne Forscher wie Dr. Ryke Geerd Hamer (Germanische Neue Medizin), Louise Hay (You Can Heal Your Life) und Ruediger Dahlke (Krankheit als Symbol) haben dieses Wissen systematisiert und zugänglich gemacht.

Der Schlüsselsatz lautet: Jede körperliche Störung ist ein Lösungsversuch der Seele – ein Signal, das gehört werden möchte.`,
        highlight: "Der Körper lügt nie. Er zeigt immer, was die Seele noch nicht in Worte gefasst hat.",
      },
      {
        titel: "Drei Grundgesetze der Organsprache",
        icon: "⚖️",
        inhalt: `**1. Gesetz der Entsprechung**
Jedes Organ entspricht einem Lebensthema, einem emotionalen Zustand oder einem Beziehungsmuster. Diese Entsprechungen sind nicht zufällig, sondern folgen einer inneren Logik.

Beispiel: Der Ellenbogen steht für „anecken", „sich Raum schaffen", „Reibung erzeugen". Wer chronisch an Ellenbogenproblemen leidet, lohnt es sich zu fragen: Wo in meinem Leben darf ich nicht anecken? Wo unterdrücke ich meine Reibung?

**2. Gesetz der Polarität (Links/Rechts)**
Der Körper ist zweigeteilt – und diese Teilung ist bedeutsam:
- Linke Seite → Weibliches Prinzip, Empfangen, Mutter, Innen, Vergangenheit
- Rechte Seite → Männliches Prinzip, Geben, Vater, Außen, Zukunft

Ein Schmerz im linken Knie betrifft also andere Themen als ein Schmerz im rechten Knie – beide handeln von Knie-Themen (Flexibilität, Demut), aber auf verschiedenen Ebenen.

**3. Gesetz der Schichten**
Körpersymptome sprechen immer auf mehreren Ebenen gleichzeitig: körperlich, emotional, mental, spirituell. Eine vollständige Arbeit mit Organsprache betrachtet alle Ebenen.`,
        highlight: null,
      },
      {
        titel: "Wichtige Pioniere der Organsprache",
        icon: "📖",
        inhalt: `**Louise Hay (1926–2017)**
Amerikanische Autorin und Begründerin der modernen Körpersymbolik. Ihr Buch „You Can Heal Your Life" verkaufte sich über 50 Millionen Mal. Ihre Kernbotschaft: Hinter jedem Körpersymptom steckt ein Gedankenmuster – und Gedankenmuster können verändert werden.

**Ruediger Dahlke (geb. 1951)**
Deutscher Arzt und Therapeut, der mit „Krankheit als Symbol" ein Standardwerk der Körpersymbolik schrieb. Dahlke verbindet medizinisches Wissen mit psychologischer Deutung und spiritueller Perspektive.

**Dr. Ryke Geerd Hamer (1935–2017)**
Begründer der Germanischen Neuen Medizin. Seine Kernthese: Jede Erkrankung beginnt mit einem biologischen Schock-Konflikt. Umstritten, aber einflussreich.

**Traditionelle Chinesische Medizin (TCM)**
Das älteste systematische Körper-Emotion-System der Welt. Die 5-Elemente-Lehre ordnet jedem Organ-Paar ein Element, eine Emotion und eine Jahreszeit zu.`,
        highlight: null,
      },
      {
        titel: "Was Organsprache NICHT ist",
        icon: "⚠️",
        inhalt: `Organsprache ist ein ergänzendes Deutungssystem – kein Ersatz für medizinische Diagnose und Behandlung.

Es ist wichtig zu verstehen:
- Organsprache macht keine Schuld: Wer krank ist, „hat es sich nicht verdient"
- Organsprache gibt keine Garantien: Themen verstehen ≠ automatisch gesund werden
- Organsprache arbeitet parallel zur Schulmedizin, nicht dagegen
- Organsprache ist immer ein Angebot, keine Behauptung

In der Arbeit mit Klienten gilt: Wir stellen Deutungsangebote. Der Klient entscheidet, was für ihn stimmig ist. Resonanz – nicht Behauptung – ist das Kriterium.`,
        highlight: "Organsprache ist eine Einladung zur Selbstreflexion, keine Schuldzuweisung.",
      },
    ],
    praxisuebungen: [
      {
        titel: "Körperscan-Tagebuch (7 Tage)",
        beschreibung: "Führe 7 Tage lang ein Körpertagebuch. Notiere täglich: Welche Körperstelle meldet sich? Was tue ich gerade im Leben? Welche Emotionen habe ich? Gibt es Zusammenhänge?",
        dauer: "10 Min täglich",
      },
      {
        titel: "Eigener Körper – erste Deutung",
        beschreibung: "Wähle ein aktuelles oder chronisches Körpersymptom bei dir selbst. Frage dich: Was könnte dieses Organ thematisieren? Was kommt dir intuitiv? Schreibe alles auf, ohne zu werten.",
        dauer: "20–30 Min",
      },
      {
        titel: "Körper-Sprache-Mapping",
        beschreibung: "Sammle 10 Redewendungen aus dem Alltag die Körperteile enthalten (z.B. 'das geht mir an die Nieren', 'das macht mir Herzschmerzen', 'ich habe etwas schlucken müssen'). Erkunde, was die Volksweisheit über Organsprache schon immer wusste.",
        dauer: "15–20 Min",
      },
    ],
    schluesselwoerter: ["Körpersymbolik","Psychosomatik","Links/Rechts-Prinzip","Biologischer Konflikt","TCM","Resonanz","Deutungsangebot"],
  },

  // ─────────────────────────────────────────────────────────────
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
        titel: "Kopf & Sinnesorgane",
        icon: "🧠",
        inhalt: `**Kopf / Gehirn**
Das Gehirn koordiniert alles – und erkrankt, wenn zu viel koordiniert werden muss. Kopfschmerzen signalisieren oft mentale Überlastung, aber auch unterdrückte Kreativität oder das Festhalten an starren Gedankenmustern. Migräne (einseitig) zeigt oft an, welche Lebenshälfte momentan überlastet ist.

Links: Vergangenheit, weibliche Linie, was ich mir selbst sage
Rechts: Zukunft, männliche Linie, was ich anderen zeige

**Augen**
Die Augen sind das Wahrnehmungsorgan par excellence. Augenprobleme deuten auf Schwierigkeiten hin, die Realität so zu sehen, wie sie ist – oder wie sie war, oder wie sie werden könnte. Kurzsichtigkeit: Die Vergangenheit/Nähe wird klar gesehen, die Zukunft/Ferne verschwimmt. Weitsichtigkeit: Der große Überblick ist vorhanden, das Detail (Nahes) wird gemieden.

Links: Was ich mir selbst nicht zeigen will – innere Wahrheit
Rechts: Was ich anderen nicht zeigen will – äußere Wahrheit

**Ohren**
Hören ist aktives Empfangen. Wenn wir etwas nicht hören wollen – oder nicht gehört werden – kann sich dies in den Ohren manifestieren. Tinnitus = innere Lärm, weil äußerer Lärm (Konflikte, Überforderung) nicht gehört werden darf. Hörverlust = Selektives Nicht-Hören als Schutzmechanismus.

Links: Eigene innere Stimme – werde ich mir selbst gerecht?
Rechts: Äußere Stimmen – was will ich von anderen nicht hören?`,
        highlight: null,
      },
      {
        titel: "Hals, Schultern & Arme",
        icon: "🫀",
        inhalt: `**Hals & Schilddrüse**
Der Hals ist die Brücke zwischen Kopf (Denken) und Herz (Fühlen). Wenn diese Brücke blockiert ist – wenn wir nicht sagen dürfen, was wir denken und fühlen – reagiert der Hals. Die Schilddrüse reguliert den Stoffwechsel (Tempo des Lebens): Überfunktion = Zu viel, zu schnell, zu gehetzt. Unterfunktion = Zu wenig, zu langsam, zurückgezogen.

Hashimoto (Autoimmun): Der Körper greift sich selbst an – ein Symbol für Selbstkritik, inneren Krieg, „Ich darf nicht so sein, wie ich bin".

**Schultern**
Die Schultern tragen. Sie tragen Last, Verantwortung, Erwartungen. Verspannungen in den Schultern zeigen an, welche Last gerade zu schwer ist – oder zu lange getragen wurde.

Links: Emotionale Last, Familienthemen, was die weibliche Linie aufgebürdet hat
Rechts: Berufliche Last, Pflichten, was die männliche Linie aufgebürdet hat

**Ellenbogen**
Der Ellenbogen sticht heraus. Er eckt an. Er schafft Raum, indem er Widerstand erzeugt. Probleme im Ellenbogenbereich zeigen, dass die eigene Reibungskraft unterdrückt wird. Fragen: Wo darf ich nicht anecken? Wo halte ich mich zurück, obwohl ich Raum brauche?

**Hände & Finger**
Die Hände sind die wichtigsten Werkzeuge für Kontakt, Schöpfung und Austausch. Greifprobleme = Kontrollthemen. Arthritis = Verbitterung und Starrheit. Kältegefühl in den Händen = emotionaler Rückzug.

Links: Empfangen – darf ich annehmen?
Rechts: Geben – darf ich geben ohne zu verlieren?`,
        highlight: null,
      },
      {
        titel: "Herz, Lunge & Brust",
        icon: "❤️",
        inhalt: `**Herz**
Das Herz ist das Zentrum des Lebens – und das Zentrum aller Verbindung. Herzprobleme berühren immer das Thema Liebe: Selbstliebe, Liebe zu anderen, Verlust von Liebe. Das Herz ist so fundamental, dass wir es in einem eigenen Modul (Herzheilung) vertiefen. Hier die Essenz: Herzblockaden entstehen durch nicht gelebte Trauer, durch Verhärtung als Schutzreaktion und durch unterdrückte Sehnsucht.

Herzrhythmusstörungen: Der Rhythmus des Lebens ist gestört – meist durch Angst oder Überanstrengung.

**Lunge**
Atmen ist Leben. Wir atmen rein (empfangen) und aus (loslassen). Lungenprobleme zeigen Schwierigkeiten mit diesem fundamentalen Austausch. Asthma: Die Einatmung ist eingeschränkt – „Ich kann nicht genug empfangen" oder „Ich bekomme keinen Raum". Chronischer Husten: Etwas will heraus – ein unterdrückter Impuls, ein unausgesprochenes Wort.

Trauer ist die klassische Emotion der Lunge (TCM). Unverarbeitete Trauer lagert sich im Lungensystem ab.

**Brust & Brustdrüsen**
Die Brust steht für Fürsorge, Nähren und Verbindung – aber auch für Grenze. Brustprobleme entstehen oft durch ein Ungleichgewicht zwischen Geben und Grenzen setzen.`,
        highlight: "Das Herz weiß immer, was es braucht. Die Arbeit ist, ihm zuzuhören.",
      },
      {
        titel: "Bauch & Verdauungsorgane",
        icon: "🫃",
        inhalt: `**Magen**
Der Magen verdaut – Nahrung und Erlebnisse. „Das ist schwer zu verdauen", „Das liegt mir im Magen" – die Volksweisheit kennt den Zusammenhang. Magenprobleme zeigen an, was sich emotional nicht verarbeiten lässt.

Sodbrennen: Bitterkeit, aufsteigender Ärger
Übelkeit: Abgrenzungsproblem, etwas wird nicht toleriert
Magengeschwür: Chronischer Stress, der sich in die Magenwand frisst

**Leber & Galle**
Leber = Wut (TCM). Die Leber verarbeitet Toxine – äußere und innere. Aufgestaute Wut, Bitterkeit und Neid belasten das Lebersystem. Die Galle gibt Gallenflüssigkeit ab, wenn es nötig ist – sie steht für Mut, Entschlossenheit und die Fähigkeit, Grenzen zu setzen. Gallensteine = kleine, verhärtete Probleme, die sich angesammelt haben.

**Bauchspeicheldrüse (Pankreas)**
Die Bauchspeicheldrüse reguliert den Blutzucker. Diabetes: Süße fehlt im Leben. Typ 1 (Kind): Kindheitswunde, Freude wurde früh unterdrückt. Typ 2 (Erwachsen): Die Süße des Lebens wird nicht mehr empfangen / verarbeitet.

**Darm (Dick- und Dünndarm)**
Der Darm ist unser zweites Gehirn. Er verarbeitet und lässt los. Verstopfung = Festhalten, Loslassen fällt schwer (Vergangenheit, Kontrollthemen). Durchfall = Überwältigtes Loslassen, keine Zeit zum Verarbeiten. Reizdarm = Hochsensibilität, ständige Überreizung.`,
        highlight: null,
      },
      {
        titel: "Nieren, Blase & Rücken",
        icon: "🫘",
        inhalt: `**Nieren**
Die Nieren filtern das Blut – sie unterscheiden, was bleibt und was geht. In der TCM sind die Nieren der Sitz der Lebensenergie (Jing) und der Urangst. Nierenprobleme entstehen durch tiefe Angst, Schock-Traumata und existenzielle Erschöpfung. Sie sind oft mit Ahnenthemen verbunden – das Nierenfeld trägt die Energie mehrerer Generationen.

Links: Weibliche Linie (Mutter, Großmutter)
Rechts: Männliche Linie (Vater, Großvater)

**Rücken (Wirbelsäule)**
Der Rücken trägt und stützt. Die drei Rückenzonen haben klare Bedeutungen:

Oberer Rücken / Schulterblätter: Mangel an Unterstützung, zu wenig Liebe empfangen
Mittlerer Rücken: Schuldgefühle, Vergangenheit, aufgestauter Ärger
Unterer Rücken / Lendenbereich: Existenzangst, Geldsorgen, fehlende Unterstützung im Alltag. Ischias: Ein langer Nerv wird gereizt – oft durch langanhaltende Unterdrückung von Lebensthemen.

**Blase**
Die Blase sammelt und entleert. Blasenprobleme entstehen durch Nervosität, Angst und das Gefühl, „nicht loslassen zu können". Blasenentzündungen sind oft mit unterdrücktem Ärger verbunden – besonders in Beziehungen.`,
        highlight: null,
      },
      {
        titel: "Hüfte, Knie, Füße & Haut",
        icon: "🦶",
        inhalt: `**Hüfte & Becken**
Die Hüfte ist das beweglichste Gelenk – und steht für Beweglichkeit im Leben, für Fortschritt und Kreativität. Hüftprobleme entstehen, wenn der Vorwärtsbewegung etwas im Weg steht. Das Becken ist eng mit Sexualität, Kreativität und Familienthemen verbunden.

**Knie**
Das Knie beugt sich – oder weigert sich zu beugen. Knieprobleme entstehen durch Starrheit (sich nicht beugen können), durch Stolz (sich nicht beugen wollen) oder durch übermäßige Unterwerfung (sich immer beugen). Die klassische Frage bei Knieproblemen: Wem oder was gegenüber fällt mir Flexibilität schwer?

Links: Innere Flexibilität, persönliche Entwicklung
Rechts: Äußere Flexibilität, Anpassung an andere/Autoritäten

**Füße & Sprunggelenk**
Die Füße tragen uns durch das Leben und bestimmen unsere Richtung. Fußprobleme entstehen, wenn die Richtung im Leben unklar ist, wenn wir Angst vor dem nächsten Schritt haben oder wenn wir nicht verwurzelt sind.

Eingewachsene Zehennägel: Widerstand gegen den eigenen Lebensweg
Fersenschmerz: Das Vorankommen ist schmerzhaft

**Haut**
Die Haut ist die äußere Grenze – sie trennt Innen von Außen, Selbst von Anderen. Hautprobleme entstehen bei Grenzthemen: zu viel Kontakt (Neurodermitis = Überreizung), zu wenig Kontakt (Trockenheit = Berührungsarmut). Die Haut ist auch das Organ der Berührung – und zeigt, wie wir Nähe erleben.`,
        highlight: null,
      },
    ],
    praxisuebungen: [
      {
        titel: "Klientensimulation – 5 Symptome deuten",
        beschreibung: "Wähle 5 Körpersymptome aus deinem Bekanntenkreis (anonym). Arbeite systematisch: Welches Organ? Welche Seite? Welches Thema? Welche mögliche Emotion? Schreibe deine Deutungen auf und teile sie (mit Einverständnis) mit der betroffenen Person.",
        dauer: "45–60 Min",
      },
      {
        titel: "Links-Rechts-Analyse an dir selbst",
        beschreibung: "Scanne deinen Körper von Kopf bis Fuß. Notiere alle Beschwerden, Verspannungen, Auffälligkeiten. Markiere: links oder rechts? Was ergibt sich für Muster auf jeder Seite?",
        dauer: "30 Min",
      },
      {
        titel: "TCM-Emotionskreis anwenden",
        beschreibung: "Zeichne den TCM-5-Elemente-Kreis: Holz (Leber/Galle/Wut), Feuer (Herz/Dünndarm/Freude), Erde (Milz/Magen/Grübeln), Metall (Lunge/Dickdarm/Trauer), Wasser (Niere/Blase/Angst). Ordne 5 Klientensymptome in dieses System ein.",
        dauer: "30–45 Min",
      },
    ],
    schluesselwoerter: ["5-Elemente-TCM","Links-Rechts-Polarität","Psychosomatik","Deutung","Organkorrespondenz","Konfliktthema","Schock"],
  },

  // ─────────────────────────────────────────────────────────────
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
        titel: "Das Deutungsgespräch – Struktur & Haltung",
        icon: "💬",
        inhalt: `Ein Deutungsgespräch in der Organsprache folgt einer inneren Struktur – auch wenn es sich natürlich anfühlt.

**Phase 1: Öffnen (5–10 Min)**
Schaffe Sicherheit. Erkläre kurz das Konzept der Organsprache. Hol die Erlaubnis: „Darf ich dir ein paar Fragen zu deinem Körper stellen?"

**Phase 2: Erheben (10–15 Min)**
Lass den Klienten erzählen: „Was zeigt sich gerade körperlich?" Frage nach: Seit wann? Auf welcher Seite? Gibt es Veränderungen? Was passierte in seinem Leben zu dem Zeitpunkt, als das Symptom erstmals auftrat?

**Phase 3: Deuten (10–15 Min)**
Biete Deutungen als Fragen an: „Könnte es sein, dass…?" „Was wäre, wenn dieses Symptom sagen wollte…?" Beobachte die Körperreaktion des Klienten – Resonanz zeigt sich als Aufatmen, Tränen, Staunen oder tiefes Nicken.

**Phase 4: Integrieren (5–10 Min)**
Was nimmt der Klient mit? Was möchte er als nächstes anschauen oder verändern? Gib einen konkreten Integrationsimpuls.

**Die wichtigste Haltung:** Du bist kein Wahrsager. Du bist ein Begleiter, der Möglichkeiten anbietet. Resonanz entscheidet – nicht du.`,
        highlight: "Nicht 'Das bedeutet X', sondern 'Könnte es sein, dass…?' – diese Formulierung verändert alles.",
      },
      {
        titel: "Fallbeispiel 1: Chronische Halsschmerzen",
        icon: "📋",
        inhalt: `**Klient:** 42-jährige Frau, Sachbearbeiterin, verheiratet, 2 Kinder.
**Symptom:** Chronische Halsschmerzen seit 3 Jahren, keine organische Ursache gefunden, Schilddrüse leicht vergrößert.

**Erste Deutungsebene (Organ):**
Hals = Brücke zwischen Kopf und Herz. Schilddrüse = Tempo des Lebens, eigene Wahrheit.

**Anamnese-Gespräch ergibt:**
- Vor 3 Jahren: Beförderung abgelehnt, die sie sich sehr gewünscht hatte
- Seitdem: Schweigen darüber im Team, Frust wird nicht ausgesprochen
- Zuhause: Meinungsverschiedenheiten mit Ehemann, die nicht offen besprochen werden
- Kindheitsmuster: „In unserer Familie redet man nicht über Probleme"

**Mehrdimensionale Deutung:**
Der Hals zeigt an, was nicht gesagt werden darf. Drei überlagernde Themen:
1. Beruflicher Schmerz (Ablehnung) = verschluckt
2. Partnerschaftskonflikte = nicht ausgesprochen
3. Kindheitsprägung = „nicht reden" als Familienregel (Ahnenmuster)

**Deutungsangebot an die Klientin:**
„Ich frage mich, ob dein Hals dir zeigt, dass da einiges ist, das gesagt werden möchte – aber noch keinen sicheren Raum gefunden hat. Was wäre, wenn deine Halsschmerzen die Botschaft hätten: Deine Wahrheit möchte gehört werden – zuerst von dir selbst?"

**Heilungsimpuls:**
Brief schreiben (nicht abschicken): Alles, was seit 3 Jahren nicht gesagt wurde. Stimme benutzen – singen, tönen, laut sprechen.`,
        highlight: null,
      },
      {
        titel: "Fallbeispiel 2: Knieschmerz links",
        icon: "📋",
        inhalt: `**Klient:** 55-jähriger Mann, Unternehmer, seit 8 Monaten starke Schmerzen im linken Knie.

**Erste Deutungsebene:**
Knie = Flexibilität, Demut, Beugen. Links = innere Welt, persönliche Entwicklung, weibliches Prinzip.

**Anamnese:**
- Vor 8 Monaten: Trennung von Geschäftspartner, die er nicht akzeptieren konnte
- Seitdem: Das Gefühl, „nachgeben zu müssen" obwohl er Recht hatte
- Persönlichkeitsmuster: Sehr hoher Anspruch an sich selbst, Perfektionismus
- Mutterlinie: Mutter war dominante Person, er musste sich oft beugen

**Mehrdimensionale Deutung:**
Das linke Knie zeigt den inneren Kampf um Flexibilität. Der Klient kann sich innerlich (links) nicht beugen – weder vor der Situation noch vor sich selbst. Das Knie physisch blockiert, was er emotional nicht kann.

Interessant: Die Mutterlinie (links) hat das Thema „sich beugen müssen" als Prägung mitgegeben – und jetzt rebel­liert er dagegen, auch wenn Flexibilität eigentlich hilfreich wäre.

**Deutungsangebot:**
„Was wäre, wenn Ihr linkes Knie gerade übt, was Ihnen noch schwerfällt: sich innerlich zu beugen – nicht als Niederlage, sondern als Stärke? Echte Flexibilität kommt aus Kraft, nicht aus Schwäche."`,
        highlight: null,
      },
      {
        titel: "Ahnenlinien & Organsprache",
        icon: "🧬",
        inhalt: `Eines der tiefsten Felder der Organsprache ist die transgenerationale Dimension. Viele chronische Körpersymptome tragen Muster, die nicht in diesem Leben entstanden sind.

**Das Prinzip:**
Ungelebtes, Unterdrücktes und Traumatisches aus früheren Generationen kann sich im Körper der Nachkommen abbilden. Dies ist kein Schicksal – aber eine Information.

**Erkennungszeichen für Ahnenmuster:**
- Symptom beginnt ohne erkennbaren Auslöser im eigenen Leben
- Ähnliche Symptome bei Eltern oder Großeltern
- Datum des Symptombeginns fällt mit Familienereignis zusammen (Todesdatum, Jahrestag)
- Symptom zeigt sich auf derselben Körperseite wie das Ahnenmuster (links = Mutterlinie, rechts = Vaterlinie)

**Beispielformulierung im Gespräch:**
„Ich frage mich, ob dieses Symptom vielleicht älter ist als Ihr jetziges Leben. Gibt es in Ihrer Familie ähnliche Beschwerden? Oder ein Thema, das sich durch die Familie zieht?"

**Wichtig:** Ahnenthemen nie diagnostizieren – nur als Möglichkeit anbieten. Die Entscheidung, ob das stimmig ist, liegt immer beim Klienten.`,
        highlight: null,
      },
    ],
    praxisuebungen: [
      {
        titel: "Strukturiertes Anamnese-Gespräch üben",
        beschreibung: "Führe mit einer Person deines Vertrauens ein vollständiges Deutungsgespräch (alle 4 Phasen) zu einem Körpersymptom. Nimm es auf (mit Einverständnis) und höre es danach durch: Wo hast du gedeutet statt gefragt? Wo war deine Haltung resonant?",
        dauer: "60–90 Min",
      },
      {
        titel: "Fallprotokoll erstellen",
        beschreibung: "Dokumentiere 3 Fälle aus deiner Praxis (anonymisiert) nach dem Schema: Symptom → Organ → Seite → Thema → Ahnenbezug möglich? → Deutungsangebot → Resonanz des Klienten → Integrationsimpuls.",
        dauer: "2–3 Stunden über mehrere Tage",
      },
      {
        titel: "Ahnen-Organ-Karte der eigenen Familie",
        beschreibung: "Erstelle eine Karte deiner eigenen Familie über 3 Generationen. Welche Erkrankungen tauchen auf? Gibt es Muster? Welche Organe wiederholen sich? Was könnte das generationelle Thema sein?",
        dauer: "45–60 Min",
      },
    ],
    schluesselwoerter: ["Deutungsgespräch","Anamnese","Transgenerational","Resonanz","Fallarbeit","Ahnenmuster","Integrationsimpuls"],
  },

  // ─────────────────────────────────────────────────────────────
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
        titel: "Das Gesamtsystem lesen",
        icon: "🗺️",
        inhalt: `Auf Meisterschaftsebene wird nicht mehr ein einzelnes Symptom betrachtet – sondern der Körper als Landkarte eines Lebenssystems.

**Die Körper-Landkarte:**
Wenn ein Klient mit mehreren Symptomen kommt, lies sie als zusammenhängende Geschichte: Linker Schulter schmerz + rechte Hüfte + Schilddrüse = Was ist das gemeinsame Thema?

In diesem Beispiel: Last (Schulter) + gehemmte Vorwärtsbewegung (Hüfte) + unterdrückte Wahrheit (Schilddrüse) = Jemand trägt eine Last, die ihn aufhält, und kann/darf das nicht benennen.

**Timing als Information:**
Wann tritt das Symptom auf? Morgens (beim Start in den Tag) vs. abends (nach der Arbeit) vs. in bestimmten Situationen? Die Umstände des Auftretens sind so bedeutsam wie das Symptom selbst.

**Intensitätsverlauf:**
Wann wird das Symptom schlimmer, wann besser? Verbesserung in Urlaub deutet auf berufliche Dimension. Verschlechterung in Familiennähe deutet auf Familienthema. Der Körper kommuniziert präzise.`,
        highlight: "Kein Symptom existiert allein. Jeder Körper erzählt eine Geschichte – lerne, das ganze Buch zu lesen.",
      },
      {
        titel: "Organsprache & Human Design verbinden",
        icon: "⚙️",
        inhalt: `Human Design und Organsprache ergänzen sich auf faszinierende Weise.

**Nicht-definierte Zentren & Körpersymptome:**
Nicht-definierte Zentren in Human Design sind besonders empfindlich für Fremdenergie. Sie nehmen die Energie anderer auf und verstärken sie. Das erklärt, warum energetisch sensitive Menschen oft Körpersymptome entwickeln, die nicht „ihr eigenes" Thema sind.

Beispiel: Nicht-definiertes Herzchakra (Ego-Zentrum) → Tendenz zur Überleistung → Erschöpfung → Herz-Kreislauf-Themen.

**HD-Typ & Körperresonanz:**
- Manifestor: Neigt zu Engegefühlen im Hals/Brust, wenn er nicht informiert (sein Naturell blockiert)
- Generator: Neigt zu Erschöpfung im Sakral- und Bauchraum, wenn er falsch Ja sagt
- Projektor: Neigt zu Kopf-/Augen-/Nackenproblemen durch energetische Überannahme
- Reflektor: Extrem empfindlich für Umgebungsenergie in allen Körperbereichen

**Praxis:** Frage bei einem Klienten mit chronischen Nackenproblemen: Ist er Projektor? Hat er das Ajna (Mentales) unkonditioniert? Die HD-Information gibt der Körperdeutung zusätzliche Tiefe.`,
        highlight: null,
      },
      {
        titel: "Organsprache & Chakralehre kombinieren",
        icon: "🌈",
        inhalt: `Jedes Organ ist einem oder mehreren Chakren zugeordnet. Diese Verbindung ermöglicht es, in der Heilarbeit gezielt vorzugehen.

**Die Organ-Chakra-Matrix:**
- Wurzelchakra: Dickdarm, Knochen, Nieren (Sicherheit, Überleben)
- Sakralchakra: Sexualorgane, Blase, Hüfte (Kreativität, Sexualität)
- Solarplexus: Leber, Magen, Milz (Kraft, Selbstwert)
- Herzchakra: Herz, Lunge, Thymus (Liebe, Mitgefühl)
- Kehlchakra: Schilddrüse, Kehle, Kiefer (Ausdruck, Wahrheit)
- Stirnchakra: Augen, Stirn, Pinealdrüse (Intuition, Wahrnehmung)
- Kronenchakra: Gehirn, Großhirn, ZNS (Bewusstsein, Verbindung)

**Praktische Anwendung:**
Wenn ein Klient chronische Magenprobleme hat → Solarplexus-Check: Wie steht es um seinen Selbstwert? Gibt es Kontrollthemen? Was stresst ihn im Beruf? Die Chakra-Ebene gibt der Deutung Tiefe, die Körperebene gibt ihr Konkretheit.

**Energetische Heilsequenz:**
1. Körpersymptom identifizieren (Organsprache)
2. Zugehöriges Chakra aktivieren
3. Meridian des Organs ausgleichen
4. Emotionale Ursache adressieren (EFT, Atemarbeit)
5. Integrationsauftrag`,
        highlight: null,
      },
      {
        titel: "Blinde Flecken des Praktizierers",
        icon: "🪞",
        inhalt: `Dies ist das unbequemste und gleichzeitig wichtigste Kapitel auf Meisterschaftsebene.

**Was sind blinde Flecken?**
Als Praktizierender bringst du dein eigenes System mit in jede Sitzung. Deine eigenen ungelösten Körperthemen, deine Glaubenssätze und deine emotionalen Wunden beeinflussen, was du beim Klienten siehst – und was du nicht siehst.

**Häufige Muster:**
- Du siehst immer Mutterthemen (weil du dein eigenes nicht aufgearbeitet hast)
- Du gehst nie in Konfrontation (weil Konfrontation in deiner Familie gefährlich war)
- Du bietest immer schnelle Lösungen an (weil das Sitzen im Nichtwissen unbequem ist)
- Du resonierst besonders stark auf bestimmte Organe (weil sie dein eigenes Thema berühren)

**Die Praxis der Selbstreflexion:**
Führe ein „Praktizierenden-Tagebuch": Nach jeder Sitzung – Was hat mich bewegt? Was hat mich unwohl gemacht? Welches Körpersymptom des Klienten hat mich am meisten beschäftigt?

**Supervision und Eigenarbeit:**
Auf Meisterschaftsebene ist regelmäßige Supervision und eigene therapeutische Begleitung kein Luxus, sondern Berufsethik. Wer andere heilt, muss bereit sein, selbst immer weiter zu heilen.`,
        highlight: "Der beste Heiler ist der, der sich selbst am besten kennt – einschließlich seiner Grenzen.",
      },
    ],
    praxisuebungen: [
      {
        titel: "Gesamtsystem-Analyse: 3 Klientenfälle",
        beschreibung: "Wähle 3 Klienten mit Mehrfachsymptomen. Erstelle für jeden eine 'Körper-Landkarte': Alle Symptome auf einer Körpersilhouette einzeichnen, Verbindungen ziehen, das Gesamtthema formulieren. Präsentiere in einer Fallbesprechung (Gruppe oder Supervisor).",
        dauer: "3–4 Stunden",
      },
      {
        titel: "HD + Organsprache Integration",
        beschreibung: "Analysiere für 5 Klienten mit bekanntem Human Design Chart: Welche ihrer chronischen Symptome lassen sich mit nicht-definierten Zentren verbinden? Schreibe eine Kurzanalyse (1 Seite pro Klient).",
        dauer: "2–3 Stunden",
      },
      {
        titel: "Selbstreflexion: Mein blinder Fleck",
        beschreibung: "Schreibe einen ehrlichen Brief an dich selbst: Welche Körperthemen bei Klienten aktivieren dich am meisten? Was weichst du aus? Was überbetonst du? Was wäre der nächste Schritt deiner eigenen Heilung?",
        dauer: "45–60 Min",
      },
    ],
    schluesselwoerter: ["Gesamtsystem","Körper-Landkarte","Timing","Human Design Integration","Chakra-Organ-Matrix","Blinder Fleck","Supervision","Berufsethik"],
  },

  // ─────────────────────────────────────────────────────────────
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
        titel: "Prüfungsvorbereitung",
        icon: "📝",
        inhalt: `Du hast die Stufen 1–4 durchlaufen. Bevor du die Prüfung startest, empfehlen wir:

**Wiederhole diese Kernthemen:**
- Die 20 Hauptorgane und ihre Themen
- Das Links-Rechts-Prinzip mit je 3 Beispielen
- Die 4 Phasen des Deutungsgesprächs
- Den Unterschied zwischen Deutung und Diagnose
- Mindestens 2 Verbindungen zu Ahnenmuster
- Berufsethische Grundsätze

**Die Prüfung besteht aus:**
15 Fragen · Multiple Choice · 3 Antwortoptionen pro Frage
Mindestpunktzahl für Zertifikat: 12/15 (80%)

Du kannst die Prüfung beliebig oft wiederholen. Das Zertifikat wird nach bestandener Prüfung ausgestellt.`,
        highlight: null,
      },
    ],
    praxisuebungen: [],
    schluesselwoerter: [],
  },
};

// ════════════════════════════════════════════════════════════════
//  QUIZ-DATEN · 15 Fragen
// ════════════════════════════════════════════════════════════════
const QUIZ_FRAGEN = [
  {
    frage: "Was beschreibt das Grundprinzip der Organsprache am treffendsten?",
    optionen: [
      "Körpersymptome entstehen ausschließlich durch Bakterien und Viren.",
      "Jeder Körper trägt emotionale Botschaften – Symptome sind Signale der Seele.",
      "Organsprache ist eine alternative Diagnose-Methode, die Schulmedizin ersetzt.",
    ],
    richtig: 1,
    erklaerung: "Organsprache arbeitet mit dem Körper als Spiegel emotionaler und lebensgeschichtlicher Themen. Sie ersetzt keine Schulmedizin, sondern ergänzt sie.",
  },
  {
    frage: "Was bedeutet die linke Körperseite im Links-Rechts-Prinzip?",
    optionen: [
      "Zukunft, männliches Prinzip, Vater, Außenwelt",
      "Vergangenheit, weibliches Prinzip, Mutter, Innenwelt",
      "Logik, Ratio, Beruf, Pflicht",
    ],
    richtig: 1,
    erklaerung: "Links steht für das weibliche Prinzip: Vergangenheit, Empfangen, Mutter, Innenwelt. Rechts steht für das männliche Prinzip: Zukunft, Geben, Vater, Außenwelt.",
  },
  {
    frage: "Welches Organ ist in der TCM klassisch mit der Emotion Wut verbunden?",
    optionen: [
      "Niere",
      "Lunge",
      "Leber",
    ],
    richtig: 2,
    erklaerung: "In der Traditionellen Chinesischen Medizin (TCM) ist die Leber das Organ, das mit Wut, Bitterkeit und aufgestautem Ärger korrespondiert. Die Niere steht für Angst, die Lunge für Trauer.",
  },
  {
    frage: "Ein Klient hat chronische Ellenbogenprobleme. Welche Frage ist im Deutungsgespräch am hilfreichsten?",
    optionen: [
      "Haben Sie zu wenig Vitamin D?",
      "Wo in Ihrem Leben dürfen Sie nicht anecken oder sich Raum nehmen?",
      "Wann haben Sie zuletzt Sport gemacht?",
    ],
    richtig: 1,
    erklaerung: "Der Ellenbogen steht symbolisch für 'anecken', sich behaupten, Reibung erzeugen. Die emotionale Kernfrage ist, wo die eigene Durchsetzungskraft unterdrückt wird.",
  },
  {
    frage: "Was versteht man unter dem 'Gesetz der Entsprechung' in der Organsprache?",
    optionen: [
      "Jedes Organ entspricht einem anderen Organ im Körper.",
      "Jedes Organ entspricht einem Lebensthema, einer Emotion oder einem Beziehungsmuster.",
      "Jedes Symptom entspricht genau einer Erkrankung.",
    ],
    richtig: 1,
    erklaerung: "Das Gesetz der Entsprechung besagt, dass Organe und Körperzonen nicht zufällig mit bestimmten Themen verbunden sind – diese Verbindungen folgen einer inneren Logik.",
  },
  {
    frage: "Was signalisiert Kurzsichtigkeit auf der symbolischen Ebene?",
    optionen: [
      "Die Vergangenheit und das Nahe wird klar gesehen, die Zukunft/das Ferne verschwimmt.",
      "Es gibt keine symbolische Bedeutung – Kurzsichtigkeit ist rein genetisch.",
      "Die Zukunft wird klar gesehen, die Vergangenheit ist unklar.",
    ],
    richtig: 0,
    erklaerung: "Kurzsichtigkeit entspricht symbolisch der Fähigkeit, das Nahe/Vergangene gut zu sehen, während der Blick in die Ferne/Zukunft verschwimmt – ein Hinweis auf Orientierungsschwierigkeiten im Vorwärtsgehen.",
  },
  {
    frage: "Welche Formulierung entspricht dem korrekten Umgang im Deutungsgespräch?",
    optionen: [
      "\"Ihr Knieschmerz bedeutet, dass Sie zu starr sind.\"",
      "\"Könnte es sein, dass dieses Symptom etwas mit Ihrer Flexibilität im Leben zu tun hat?\"",
      "\"Sie müssen jetzt sofort Ihre innere Starrheit auflösen.\"",
    ],
    richtig: 1,
    erklaerung: "Deutungen werden immer als Angebot formuliert, nie als Behauptung. 'Könnte es sein…?' lädt den Klienten ein, selbst zu resonieren – ohne Druck oder Schuldzuweisung.",
  },
  {
    frage: "Welche Aussage über Organsprache und Schulmedizin ist korrekt?",
    optionen: [
      "Organsprache ersetzt die Schulmedizin vollständig.",
      "Organsprache ist eine Ergänzung zur Schulmedizin, kein Ersatz.",
      "Organsprache sollte nie zusammen mit schulmedizinischer Behandlung eingesetzt werden.",
    ],
    richtig: 1,
    erklaerung: "Organsprache ist ein komplementäres System. Sie liefert tiefere Deutungsebenen, ersetzt aber keine medizinische Diagnose oder Behandlung.",
  },
  {
    frage: "Erkenne das Ahnenmuster: Welches dieser Zeichen deutet auf ein transgenerationales Thema hin?",
    optionen: [
      "Symptom tritt erstmals nach einer sportlichen Überbelastung auf.",
      "Symptom beginnt ohne erkennbaren Auslöser und ähnliche Beschwerden gab es bereits bei Eltern oder Großeltern.",
      "Symptom bessert sich nach einer Antibiotika-Kur sofort.",
    ],
    richtig: 1,
    erklaerung: "Transgenerationale Muster zeigen sich oft durch fehlenden erkennbaren Eigenauslöser, Ähnlichkeit mit Symptomen in der Ahnenlinie und mögliche Verbindung zu Familiendaten (Todesdaten, Jahrestage).",
  },
  {
    frage: "Welche Emotion ist in der TCM der Niere zugeordnet?",
    optionen: [
      "Wut",
      "Trauer",
      "Angst",
    ],
    richtig: 2,
    erklaerung: "In der TCM ist die Niere der Sitz der Lebensenergie (Jing) und eng mit der Urangst verbunden. Tiefe Erschöpfung und existenzielle Angst belasten das Nierenfeld.",
  },
  {
    frage: "Was beschreibt einen 'blinden Fleck' beim Praktizierenden?",
    optionen: [
      "Ein Sehproblem das die Arbeit mit Klienten erschwert.",
      "Eigene ungelöste Themen, die die Wahrnehmung in der Sitzung verzerren.",
      "Symptome bei Klienten, für die es keine Deutung gibt.",
    ],
    richtig: 1,
    erklaerung: "Blinde Flecken entstehen, wenn eigene unverarbeitete Themen die professionelle Wahrnehmung beeinflussen. Selbstreflexion und Supervision sind die wichtigsten Gegenmittel.",
  },
  {
    frage: "Welchem Chakra ist die Schilddrüse vorrangig zugeordnet?",
    optionen: [
      "Herzchakra",
      "Kehlkopfchakra",
      "Solarplexuschakra",
    ],
    richtig: 1,
    erklaerung: "Das Kehlkopfchakra (Vishuddha) regiert Ausdruck, Wahrheit und Kommunikation. Die Schilddrüse sitzt anatomisch im Halsbereich und trägt diese energetischen Themen.",
  },
  {
    frage: "Was ist das Thema von chronischen Rückenschmerzen im unteren Lendenwirbelbereich?",
    optionen: [
      "Unterdrückte Kreativität und Sexualität.",
      "Mangel an Unterstützung, Existenzangst, finanzielle Sorgen.",
      "Fehlende Kommunikation und unterdrückte Wahrheit.",
    ],
    richtig: 1,
    erklaerung: "Der untere Rücken (Lendenwirbel) steht für die Grundbedürfnisse des Lebens: Existenz, Geld, materielle Sicherheit und Unterstützung durch andere. Chronische Schmerzen dort zeigen oft Existenzangst oder das Gefühl, keine Unterstützung zu haben.",
  },
  {
    frage: "Welche Phase des Deutungsgesprächs kommt zuerst?",
    optionen: [
      "Deuten – dem Klienten die Bedeutung des Symptoms erklären.",
      "Öffnen – Sicherheit schaffen und das Konzept kurz erklären.",
      "Integrieren – einen Auftrag für zuhause mitgeben.",
    ],
    richtig: 1,
    erklaerung: "Das Deutungsgespräch beginnt immer mit der Öffnungsphase: Sicherheit schaffen, Erlaubnis holen, das Konzept kurz vorstellen. Erst danach folgen Erheben, Deuten und Integrieren.",
  },
  {
    frage: "Welche Aussage über Human Design und Organsprache ist korrekt?",
    optionen: [
      "Beide Systeme haben nichts miteinander zu tun.",
      "Nicht-definierte Zentren in HD können erklären, warum Praktizierende bestimmte Körpersymptome besonders sensitiv aufnehmen.",
      "Human Design kann Organsprache vollständig ersetzen.",
    ],
    richtig: 1,
    erklaerung: "Nicht-definierte Zentren in Human Design sind besonders empfindlich für Fremdenergie. Sie können erklären, warum bestimmte Körperzonen bei hochsensiblen Menschen häufig reagieren – die Energie anderer wird verstärkt aufgenommen.",
  },
];

// ════════════════════════════════════════════════════════════════
//  UI HILFSKOMPONENTEN
// ════════════════════════════════════════════════════════════════
const Label = ({children, color, size="10"}) => (
  <div style={{fontFamily:"Raleway",fontSize:`${size}px`,letterSpacing:"2px",fontWeight:800,color:color||OT.textSoft,textTransform:"uppercase",marginBottom:"10px"}}>{children}</div>
);

const Highlight = ({text}) => (
  <div style={{margin:"16px 0",padding:"14px 18px",background:`linear-gradient(135deg,${OT.tealL},${OT.violetL})`,borderRadius:"12px",borderLeft:`4px solid ${OT.teal}`}}>
    <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.tealD,fontWeight:700,lineHeight:"1.7",fontStyle:"italic"}}>„{text}"</div>
  </div>
);

const Lernziel = ({text, nr}) => (
  <div style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"8px"}}>
    <div style={{width:"22px",height:"22px",borderRadius:"50%",background:OT.teal,color:"white",fontFamily:"Cinzel",fontSize:"10px",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px"}}>{nr}</div>
    <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,fontWeight:500,lineHeight:"1.6"}}>{text}</div>
  </div>
);

const formatText = (text) => {
  // Simple markdown-like formatting: **bold**, newlines
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

// ════════════════════════════════════════════════════════════════
//  QUIZ KOMPONENTE
// ════════════════════════════════════════════════════════════════
function Quiz({ onAbschluss }) {
  const [aktFrage, setAktFrage]       = useState(0);
  const [antworten, setAntworten]     = useState({});
  const [gezeigt, setGezeigt]         = useState(false); // Erklärung anzeigen
  const [abgeschlossen, setAbgeschlossen] = useState(false);
  const [animiert, setAnimiert]       = useState(false);

  const frage = QUIZ_FRAGEN[aktFrage];
  const gewählt = antworten[aktFrage];
  const richtig = gewählt === frage.richtig;
  const punkte = Object.entries(antworten).filter(([i, a]) => QUIZ_FRAGEN[+i].richtig === a).length;
  const bestanden = punkte >= 12;

  const antworten_ = (opt) => {
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
        <Card style={{background:`linear-gradient(135deg,${bestanden?OT.tealL:OT.roseL},${OT.violetL})`,border:`1.5px solid ${bestanden?OT.borderMid:"#FCA5A5"}`}}>
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:"52px",marginBottom:"14px"}}>{bestanden?"🏆":"📚"}</div>
            <div style={{fontFamily:"Cinzel",fontSize:"22px",color:OT.text,fontWeight:700,marginBottom:"6px"}}>
              {bestanden?"Bestanden!":"Noch nicht bestanden"}
            </div>
            <div style={{fontFamily:"Raleway",fontSize:"15px",color:OT.textMid,fontWeight:700,marginBottom:"16px"}}>
              {punkte}/15 Punkte · {Math.round((punkte/15)*100)}%
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:"6px",marginBottom:"20px"}}>
              {QUIZ_FRAGEN.map((_, i) => {
                const korrekt = antworten[i] === QUIZ_FRAGEN[i].richtig;
                return <div key={i} style={{width:"16px",height:"16px",borderRadius:"50%",background:korrekt?OT.teal:"#FCA5A5",border:`2px solid ${korrekt?OT.tealD:"#E11D48"}`}}/>;
              })}
            </div>
            {bestanden ? (
              <div style={{background:"rgba(255,255,255,0.85)",borderRadius:"14px",padding:"16px",marginBottom:"10px"}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.tealD,fontWeight:600,lineHeight:"1.7"}}>
                  Herzlichen Glückwunsch! Du hast die Prüfung bestanden und das Resonanz Akademie Zertifikat für <strong>Organsprache</strong> verdient. Das Zertifikat wird in deinem Profil hinterlegt.
                </div>
              </div>
            ) : (
              <div style={{background:"rgba(255,255,255,0.85)",borderRadius:"14px",padding:"16px",marginBottom:"10px"}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.textMid,fontWeight:600,lineHeight:"1.7"}}>
                  Du brauchst mindestens 12/15 Punkte (80%). Geh die falsch beantworteten Fragen noch einmal durch und versuche es erneut.
                </div>
              </div>
            )}
            <button onClick={()=>{setAktFrage(0);setAntworten({});setGezeigt(false);setAbgeschlossen(false);}} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"12px 24px",borderRadius:"12px",border:"none",cursor:"pointer",background:bestanden?OT.teal:`linear-gradient(135deg,${OT.violet},${OT.violetD})`,color:"white",boxShadow:`0 4px 16px rgba(13,148,136,0.3)`}}>
              {bestanden?"✦ Nochmal absolvieren":"📚 Nochmal versuchen"}
            </button>
          </div>
        </Card>

        {/* Falsche Antworten durchgehen */}
        <Card>
          <Label color={OT.textMid}>Auswertung</Label>
          {QUIZ_FRAGEN.map((fq, i) => {
            const korrekt = antworten[i] === fq.richtig;
            return (
              <div key={i} style={{marginBottom:"10px",padding:"12px",borderRadius:"12px",background:korrekt?OT.greenL:OT.roseL,border:`1px solid ${korrekt?"#86EFAC":"#FCA5A5"}`}}>
                <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:korrekt?OT.green:OT.rose,marginBottom:"4px"}}>{korrekt?"✓":"✗"} Frage {i+1}</div>
                <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,fontWeight:600,marginBottom:"4px"}}>{fq.frage}</div>
                {!korrekt && <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500}}>
                  Richtig: {fq.optionen[fq.richtig]}
                </div>}
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px",opacity:animiert?0:1,transition:"opacity 0.2s"}}>
      {/* Fortschritt */}
      <div style={{display:"flex",gap:"4px"}}>
        {QUIZ_FRAGEN.map((_, i) => (
          <div key={i} style={{flex:1,height:"5px",borderRadius:"3px",background:i<aktFrage?(antworten[i]===QUIZ_FRAGEN[i].richtig?OT.teal:"#FCA5A5"):i===aktFrage?OT.violet:OT.border,transition:"background 0.3s"}}/>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{fontFamily:"Raleway",fontSize:"10px",color:OT.textSoft,fontWeight:700,letterSpacing:"1px"}}>FRAGE {aktFrage+1} VON {QUIZ_FRAGEN.length}</span>
        <span style={{fontFamily:"Raleway",fontSize:"10px",color:OT.teal,fontWeight:700}}>{Object.entries(antworten).filter(([i,a])=>QUIZ_FRAGEN[+i].richtig===a).length} richtig</span>
      </div>

      {/* Frage */}
      <Card style={{background:`linear-gradient(135deg,${OT.violetL},${OT.bgSoft})`,border:`1.5px solid ${OT.borderMid}`}}>
        <div style={{fontFamily:"Raleway",fontSize:"14px",color:OT.text,fontWeight:700,lineHeight:"1.7"}}>{frage.frage}</div>
      </Card>

      {/* Antwortoptionen */}
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {frage.optionen.map((opt, i) => {
          let bg = "white", border = OT.border, color = OT.text;
          if (gezeigt) {
            if (i === frage.richtig) { bg = OT.greenL; border = OT.green; color = OT.green; }
            else if (i === gewählt && i !== frage.richtig) { bg = OT.roseL; border = OT.rose; color = OT.rose; }
          } else if (gewählt === i) { bg = OT.tealL; border = OT.teal; }

          return (
            <button key={i} onClick={()=>antworten_(i)} style={{textAlign:"left",padding:"14px 16px",borderRadius:"14px",border:`1.5px solid ${border}`,background:bg,cursor:gezeigt?"default":"pointer",fontFamily:"Raleway",fontSize:"13px",color,fontWeight:gezeigt&&i===frage.richtig?700:500,lineHeight:"1.5",transition:"all 0.2s",display:"flex",alignItems:"flex-start",gap:"10px"}}>
              <span style={{fontFamily:"Cinzel",fontSize:"12px",fontWeight:700,flexShrink:0,marginTop:"2px",color:gezeigt&&i===frage.richtig?OT.green:gezeigt&&i===gewählt?OT.rose:OT.textSoft}}>
                {i===0?"A":i===1?"B":"C"}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Erklärung */}
      {gezeigt && (
        <Card style={{background:richtig?OT.greenL:OT.roseL,border:`1.5px solid ${richtig?"#86EFAC":"#FCA5A5"}`}}>
          <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:800,color:richtig?OT.green:OT.rose,marginBottom:"6px"}}>
            {richtig?"✓ Richtig!":"✗ Nicht ganz."}
          </div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,fontWeight:500,lineHeight:"1.7"}}>{frage.erklaerung}</div>
        </Card>
      )}

      {gezeigt && (
        <button onClick={weiter} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"13px",borderRadius:"13px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${OT.teal},${OT.tealD})`,color:"white",boxShadow:`0 4px 16px rgba(13,148,136,0.3)`}}>
          {aktFrage < QUIZ_FRAGEN.length - 1 ? "Nächste Frage →" : "Auswertung anzeigen →"}
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  HAUPTKOMPONENTE
// ════════════════════════════════════════════════════════════════
function OrganspracheLernmodul({ stufe = 1, onBack, onZertifikat }) {
  const [aktSektion, setAktSektion] = useState(0);
  const [quizModus, setQuizModus]   = useState(false);
  const [fertig, setFertig]         = useState(false);

  const inhalt = ORGANSPRACHE_INHALT[stufe];
  const stufeCfg = STUFEN_CFG[stufe];

  useEffect(() => {
    setAktSektion(0);
    setQuizModus(false);
    setFertig(false);
  }, [stufe]);

  const scrollTop = () => window.scrollTo({top:0,behavior:"smooth"});

  if (quizModus) {
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
          <button onClick={()=>setQuizModus(false)} style={{fontFamily:"Raleway",fontSize:"13px",color:OT.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer"}}>← Zurück</button>
          <div style={{fontFamily:"Cinzel",fontSize:"16px",color:OT.text,fontWeight:700}}>Prüfung · Organsprache</div>
        </div>
        <Quiz onAbschluss={(pkt)=>{setFertig(true);onZertifikat?.(pkt);}}/>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
      {/* Back */}
      <button onClick={onBack} style={{fontFamily:"Raleway",fontSize:"13px",color:OT.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",textAlign:"left",marginBottom:"12px"}}>← Zum Lernpfad</button>

      {/* Hero */}
      <div style={{position:"relative",borderRadius:"20px",overflow:"hidden",padding:"22px 20px",marginBottom:"16px",background:`linear-gradient(140deg,${stufeCfg.bg} 0%,#FFFFFF 45%,${OT.violetL} 100%)`,border:`1.5px solid ${stufeCfg.farbe}44`,boxShadow:`0 4px 20px ${OT.shadow}`}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:"14px",marginBottom:"14px"}}>
          <div style={{width:"52px",height:"52px",borderRadius:"50%",background:stufeCfg.farbe,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",flexShrink:0,boxShadow:`0 4px 16px ${stufeCfg.farbe}44`}}>
            {stufeCfg.icon}
          </div>
          <div>
            <div style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:800,color:stufeCfg.farbe,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"4px"}}>
              Stufe {stufe} · {stufeCfg.name}
            </div>
            <div style={{fontFamily:"Cinzel",fontSize:"18px",color:OT.text,fontWeight:700,lineHeight:"1.3"}}>{inhalt.titel}</div>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,marginTop:"4px"}}>{inhalt.untertitel}</div>
          </div>
        </div>

        {/* Lernziele */}
        <div style={{background:"rgba(255,255,255,0.75)",borderRadius:"12px",padding:"14px",backdropFilter:"blur(4px)"}}>
          <Label color={OT.tealD} size="9">Lernziele dieser Stufe</Label>
          {inhalt.lernziele.map((z, i) => <Lernziel key={i} text={z} nr={i+1}/>)}
        </div>
      </div>

      {/* Sektions-Navigation */}
      {inhalt.sektionen.length > 1 && (
        <div style={{overflowX:"auto",marginBottom:"16px"}}>
          <div style={{display:"flex",gap:"6px",minWidth:"max-content",padding:"2px"}}>
            {inhalt.sektionen.map((s, i) => (
              <button key={i} onClick={()=>{setAktSektion(i);scrollTop();}} style={{display:"flex",alignItems:"center",gap:"5px",padding:"8px 13px",borderRadius:"20px",border:`1.5px solid ${aktSektion===i?stufeCfg.farbe:OT.border}`,background:aktSektion===i?stufeCfg.bg:"white",color:aktSektion===i?stufeCfg.farbe:OT.textSoft,fontFamily:"Raleway",fontSize:"11px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>
                <span>{s.icon}</span>
                <span style={{maxWidth:"120px",overflow:"hidden",textOverflow:"ellipsis"}}>{s.titel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inhalt der aktiven Sektion */}
      {inhalt.sektionen.length > 0 && (() => {
        const s = inhalt.sektionen[stufe === 5 ? 0 : aktSektion];
        return (
          <Card style={{marginBottom:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"}}>
              <span style={{fontSize:"24px"}}>{s.icon}</span>
              <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700}}>{s.titel}</div>
            </div>
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"2",fontWeight:500}}>
              {formatText(s.inhalt)}
            </div>
            {s.highlight && <Highlight text={s.highlight}/>}

            {/* Navigation innerhalb Sektionen */}
            {inhalt.sektionen.length > 1 && (
              <div style={{display:"flex",gap:"8px",marginTop:"20px",paddingTop:"16px",borderTop:`1px solid ${OT.border}`}}>
                {aktSektion > 0 && (
                  <button onClick={()=>{setAktSektion(a=>a-1);scrollTop();}} style={{flex:1,fontFamily:"Raleway",fontWeight:700,fontSize:"12px",padding:"10px",borderRadius:"12px",border:`1.5px solid ${OT.border}`,background:"white",color:OT.textMid,cursor:"pointer"}}>← Zurück</button>
                )}
                {aktSektion < inhalt.sektionen.length - 1 && (
                  <button onClick={()=>{setAktSektion(a=>a+1);scrollTop();}} style={{flex:2,fontFamily:"Raleway",fontWeight:700,fontSize:"12px",padding:"10px",borderRadius:"12px",border:"none",background:`linear-gradient(135deg,${stufeCfg.farbe},${OT.tealD})`,color:"white",cursor:"pointer"}}>
                    Weiter: {inhalt.sektionen[aktSektion+1].titel.split(" ").slice(0,3).join(" ")}... →
                  </button>
                )}
              </div>
            )}
          </Card>
        );
      })()}

      {/* Praxisübungen */}
      {inhalt.praxisuebungen.length > 0 && (
        <Card style={{background:OT.bgSoft,border:`1.5px solid ${OT.borderMid}`}}>
          <Label color={OT.tealD}>🎯 Praxisübungen</Label>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {inhalt.praxisuebungen.map((u, i) => (
              <div key={i} style={{background:"white",borderRadius:"14px",padding:"14px 16px",border:`1px solid ${OT.border}`}}>
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

      {/* Schlüsselwörter */}
      {inhalt.schluesselwoerter.length > 0 && (
        <Card>
          <Label>Schlüsselbegriffe dieser Stufe</Label>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {inhalt.schluesselwoerter.map(w => (
              <span key={w} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"5px 12px",borderRadius:"12px",background:OT.tealL,color:OT.tealD,border:`1px solid ${OT.borderMid}`}}>{w}</span>
            ))}
          </div>
        </Card>
      )}

      {/* CTA: Weiter / Quiz */}
      <div style={{padding:"8px 0 40px"}}>
        {stufe < 5 ? (
          <div style={{background:`linear-gradient(135deg,${stufeCfg.bg},${OT.violetL})`,borderRadius:"16px",padding:"18px",border:`1.5px solid ${stufeCfg.farbe}33`,textAlign:"center"}}>
            <div style={{fontFamily:"Cinzel",fontSize:"14px",color:OT.text,fontWeight:700,marginBottom:"6px"}}>Bereit für die nächste Stufe?</div>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,marginBottom:"14px"}}>Stufe {stufe+1}: {STUFEN_CFG[stufe+1].name} – {STUFEN_CFG[stufe+1].icon}</div>
            <button onClick={onBack} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"12px 24px",borderRadius:"12px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${stufeCfg.farbe},${OT.tealD})`,color:"white",boxShadow:`0 4px 16px ${stufeCfg.farbe}44`}}>
              Zur Stufenauswahl →
            </button>
          </div>
        ) : (
          <div style={{background:`linear-gradient(135deg,${OT.goldL},${OT.violetL})`,borderRadius:"16px",padding:"22px",border:`1.5px solid #D97706`,textAlign:"center"}}>
            <div style={{fontSize:"40px",marginBottom:"12px"}}>🏆</div>
            <div style={{fontFamily:"Cinzel",fontSize:"16px",color:OT.text,fontWeight:700,marginBottom:"6px"}}>Zertifizierungsprüfung</div>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,marginBottom:"16px",lineHeight:"1.7"}}>
              15 Fragen · Multiple Choice · Mindestens 12/15 Punkte<br/>für das Resonanz Akademie Zertifikat
            </div>
            <button onClick={()=>setQuizModus(true)} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"14px",padding:"14px 28px",borderRadius:"13px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,#D97706,#B45309)`,color:"white",boxShadow:"0 4px 20px rgba(217,119,6,0.4)"}}>
              ✦ Prüfung starten
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


export { OrganspracheKarte, OrganspracheLernmodul };
