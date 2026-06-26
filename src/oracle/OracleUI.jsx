import React, { useState, useEffect, useCallback, useRef } from "react";

const OT = {
  bg:"#FFFDF5", bgCard:"#FFFFFF", bgSoft:"#FFF8E7", bgSofter:"#FFFCF0",
  border:"rgba(201,168,76,0.3)", borderMid:"rgba(201,168,76,0.5)",
  text:"#1A1200", textMid:"#6B5B3A", textSoft:"#A89668",
  teal:"#C9A84C", tealL:"rgba(201,168,76,0.15)", tealD:"#A87D3A",
  violet:"#C9A84C", violetL:"rgba(201,168,76,0.15)", violetD:"#A87D3A",
  gold:"#C9A84C", goldL:"rgba(201,168,76,0.15)",
  rose:"#E11D48", roseL:"#FFE4E6",
  shadow:"rgba(201,168,76,0.12)", shadowDeep:"rgba(201,168,76,0.22)",
};

// ════════════════════════════════════════════════════════════════
//  WISSENSNETZ · Das verbundene Datensystem
// ════════════════════════════════════════════════════════════════

const CHAKRA_SYSTEM = [
  { id:"wurzel",       nr:1, name:"Wurzel-Chakra",   de:"Muladhara",   farbe:"#DC2626", hex:"#DC2626",
    symbol:"▼", mantra:"LAM", hz:396,
    themen:["Sicherheit","Überleben","Erdung","Vertrauen","Familie","Geld","Körper"],
    emotion_block:["Angst","Panik","Unsicherheit","Existenzangst","Misstrauen"],
    organe:["Nebennieren","Nieren","Blase","Dickdarm","Beine","Füße","Steißbein","Knochen"],
    aura_schicht:"Ätherischer Körper",
    hd_zentren:["Wurzel","Milz"],
    heilung:["Rote Erdkristalle","Barfußlaufen","Rhodonit","Hämatit","Affirmation: Ich bin sicher"],
    lernpfad_soft:"Das Wurzel-Chakra ist unser energetischer Anker. Es verbindet uns mit der Erde und dem physischen Leben.",
    lernpfad_deep:"Im energetischen Scan zeigt sich das Wurzel-Chakra durch Temperatur (kalt = unteraktiv, heiß = überaktiv) und Pulsation. Blockaden entstehen durch frühe Kindheitstraumata, Mangelerfahrungen oder transgenerationale Armutsmuster."
  },
  { id:"sakral",       nr:2, name:"Sakral-Chakra",   de:"Svadhisthana", farbe:"#EA580C", hex:"#EA580C",
    symbol:"◎", mantra:"VAM", hz:417,
    themen:["Kreativität","Sexualität","Gefühle","Genuss","Freude","Beziehungen","Fluss"],
    emotion_block:["Schuld","Scham","Unterdrückung","Rigidität","Frigidität","Sucht"],
    organe:["Gebärmutter","Eierstöcke","Prostata","Blase","Darm","Hüfte","Lende"],
    aura_schicht:"Emotionalkörper",
    hd_zentren:["Sakral","Milz"],
    heilung:["Mondstein","Orangencalcit","Tantra-Atmung","Hüftkreise","Wasserelement"],
    lernpfad_soft:"Das Sakral-Chakra trägt unsere Lebensenergie, Kreativität und die Fähigkeit, Freude zu empfangen.",
    lernpfad_deep:"In der energetischen Arbeit ist das Sakral-Chakra oft durch transgenerationale Sexualwunden belastet. Ahnenlinien-Arbeit und Auflösung von Loyalitätsmustern sind hier zentral."
  },
  { id:"solar",        nr:3, name:"Solarplexus",     de:"Manipura",    farbe:"#CA8A04", hex:"#CA8A04",
    symbol:"▲", mantra:"RAM", hz:528,
    themen:["Kraft","Wille","Selbstwert","Identität","Kontrolle","Durchsetzung","Verdauung des Lebens"],
    emotion_block:["Scham","Ohnmacht","Kontrollzwang","Perfektionismus","Aggression","Opferhaltung"],
    organe:["Magen","Leber","Milz","Bauchspeicheldrüse","Gallenblase","Zwölffingerdarm"],
    aura_schicht:"Mentalkörper",
    hd_zentren:["Ego","G-Zentrum","Milz"],
    heilung:["Citrin","Tigerauge","Atemarbeit","Sonnenbad","Grenzen setzen"],
    lernpfad_soft:"Der Solarplexus ist unser Kraftzentrum. Er regiert Selbstvertrauen, innere Stärke und die Fähigkeit, das Leben aktiv zu gestalten.",
    lernpfad_deep:"Im Scan zeigt sich der Solarplexus durch einen Sog-Effekt (Energie wird gezogen = Fremdenergie) oder Enge (Kontrollmuster). Karmische Themen von Macht und Ohnmacht sind häufig."
  },
  { id:"herz",         nr:4, name:"Herz-Chakra",     de:"Anahata",     farbe:"#16A34A", hex:"#16A34A",
    symbol:"✦", mantra:"YAM", hz:639,
    themen:["Liebe","Mitgefühl","Verbindung","Selbstliebe","Vergebung","Heilung","Brücke"],
    emotion_block:["Trauer","Einsamkeit","Verlust","Verhärtung","Selbstablehnung","Grenzverlust"],
    organe:["Herz","Lunge","Thymus","Arme","Hände","Brustkorb","Schultern"],
    aura_schicht:"Astralkörper",
    hd_zentren:["G-Zentrum","Milz","Ego"],
    heilung:["Rosenquarz","Malachit","Ho'oponopono","Herz-Kohärenz-Atmung","Vergebungsrituale"],
    lernpfad_soft:"Das Herz-Chakra ist die Brücke zwischen dem Unteren (Materie) und dem Oberen (Geist). Es trägt die höchste Heilfrequenz.",
    lernpfad_deep:"Herzheilungen sind oft mehrstufig: 1. Schutzpanzer auflösen 2. Alten Schmerz entlassen 3. Selbstliebe aktivieren 4. Verbindungsfaden zum höheren Selbst stärken. Besondere Methode: Blutreinigung durch Lichtarbeit im Herzraum."
  },
  { id:"kehle",        nr:5, name:"Kehlkopf-Chakra", de:"Vishuddha",   farbe:"#0284C7", hex:"#0284C7",
    symbol:"◈", mantra:"HAM", hz:741,
    themen:["Wahrheit","Ausdruck","Kommunikation","Stimme","Kreativität","Integrität","Zuhören"],
    emotion_block:["Schlucken von Gefühlen","Lügen","Schweigen","Überreden","Stimmverlust"],
    organe:["Kehle","Schilddrüse","Nebenschilddrüse","Mund","Zähne","Kiefer","Hals","Nacken","Ohren"],
    aura_schicht:"Äther-Schablone",
    hd_zentren:["Kehle","G-Zentrum"],
    heilung:["Lapislazuli","Aquamarin","Tönen","Singen","Wahrheit sprechen","Blauäther-Licht"],
    lernpfad_soft:"Das Kehlkopf-Chakra trägt unsere Stimme und Wahrheit. Hier manifestieren sich alle unausgesprochenen Worte als Energie.",
    lernpfad_deep:"Im Human Design ist das Kehle-Zentrum das einzige Manifestationszentrum. Nicht-definierte Kehle = hohe Empfindlichkeit für Fremdenergie. Klassische Muster: 'Ich darf nicht' oder 'niemand hört mir zu'."
  },
  { id:"stirn",        nr:6, name:"Stirn-Chakra",    de:"Ajna",        farbe:"#4338CA", hex:"#4338CA",
    symbol:"◉", mantra:"OM", hz:852,
    themen:["Intuition","Weisheit","Wahrnehmung","Vision","Hellsicht","Unterscheidung","Gedanken"],
    emotion_block:["Realitätsverlust","Skepsis","Übeaktion","Kopfschmerzen","Zwang","Delusion"],
    organe:["Augen","Stirn","Hypophyse","Pinealdrüse","Kleinhirn","Nase","Stirnhöhlen"],
    aura_schicht:"Kausalkörper",
    hd_zentren:["Ajna","Krone"],
    heilung:["Amethyst","Sodalith","Traumarbeit","Meditation","Dritte-Auge-Aktivierung"],
    lernpfad_soft:"Das Stirnchakra ist das Tor zur inneren Wahrnehmung – Hellsehen, Hellspüren, Hellfühlen und Hellwissen sind hier verwurzelt.",
    lernpfad_deep:"Für Heiler: Das Stirnchakra benötigt regelmäßige Reinigung nach intensiver Wahrnehmungsarbeit. Schutzvisualisierung vor und Erdung nach Sitzungen ist essenziell."
  },
  { id:"krone",        nr:7, name:"Kronen-Chakra",   de:"Sahasrara",   farbe:"#7C3AED", hex:"#7C3AED",
    symbol:"✧", mantra:"AUM", hz:963,
    themen:["Einheit","Transzendenz","Göttliche Verbindung","Bewusstsein","Erleuchtung","Stille"],
    emotion_block:["Geistige Starre","Dogmatismus","Entkörperung","Überstimulation","Depression"],
    organe:["Großhirn","Schädeldecke","Zentralnervensystem","Haut"],
    aura_schicht:"Kether-Körper",
    hd_zentren:["Krone","Ajna"],
    heilung:["Bergkristall","Selenit","Stilles Gebet","Lichtkanal öffnen","Kosmische Verbindung"],
    lernpfad_soft:"Das Kronenchakra verbindet uns mit dem Universum. Es ist weniger ein Energiezentrum als ein offenes Tor zum Unendlichen.",
    lernpfad_deep:"Kronen-Aktivierung ist nicht Ziel, sondern Nebenprodukt tiefer Reinigungsarbeit. Überstimulation führt zu Dissoziation. Erdung und Wurzel-Chakra-Stärkung ist immer parallel notwendig."
  },
];

const ORGAN_MAP = {
  "kopf / gehirn": { emoji:"🧠",
    symbolik:["Kontrolle","Überdenken","Gedankenlast","Intellekt überdominiert"],
    emotion:["Überanalyse","mentaler Stress","Überforderung","innerer Lärm"],
    chakra:"stirn", seiten:{links:"Vergangenheit / Weibliches",rechts:"Zukunft / Männliches"},
    ahnen:"Väter- oder Mutterlinie: Verbotenes Denken, unterdrückte Meinung",
    heilung:["Gedanken ordnen","innere Klarheit finden","den Kopf zur Ruhe bringen"],
    keywords:["kopfschmerzen","migräne","schwindel","gedanken","mental"]
  },
  "augen": { emoji:"👁️",
    symbolik:["Nicht-sehen-wollen","Angst vor Wahrheit","Hellsicht blockiert","blinder Fleck"],
    emotion:["Verleugnung","Schutz vor Schmerz","Überforderung"],
    chakra:"stirn", seiten:{links:"Innenschau / was du dir selbst nicht zeigst",rechts:"Außenwelt / was du anderen nicht zeigen willst"},
    ahnen:"Generationenmuster: 'Sieh nicht hin' / Zeugen von Gewalt oder Schmerz",
    heilung:["hinschauen, was sich zeigt","den eigenen Blick weiten","inneres Kind: darf sehen"],
    keywords:["augen","sehen","blind","wahrnehmung","blick"]
  },
  "ohren": { emoji:"👂",
    symbolik:["Nicht-hören-wollen","Botschaften überhören","innere Stimme ignoriert"],
    emotion:["Überwältigung durch Geräusche","Konfliktvermeidung","Gehorsam"],
    chakra:"kehle", seiten:{links:"eigene innere Stimme",rechts:"äußere Botschaften / Autorität"},
    ahnen:"'Kinder haben zu schweigen' / Verbote zu hören oder zu sprechen",
    heilung:["nach innen hören","Stille-Meditation","die innere Stimme achten"],
    keywords:["ohren","hören","tinnitus","stille","ohr"]
  },
  "mund / zähne / kiefer": { emoji:"🦷",
    symbolik:["Schlucken von Worten","Verbissenes Festhalten","aufgebissene Zähne","Ausdruck blockiert"],
    emotion:["Unterdrückte Worte","Wut","Ohnmacht","Perfektionismus","Kontrolle"],
    chakra:"kehle", seiten:{links:"Weibliches / Empfangen",rechts:"Männliches / Geben"},
    ahnen:"Muster: 'Sprich nicht darüber' / verbotene Wahrheiten",
    heilung:["Kiefer-Entspannung","die eigene Wahrheit sprechen","Ausdruck zulassen"],
    keywords:["mund","zähne","kiefer","schlucken","beißen","zähneknirschen"]
  },
  "hals / schilddrüse": { emoji:"🌀",
    symbolik:["Stimme unterdrückt","Lebensfluss gebremst","Nicht authentisch","Metabolismus des Lebens"],
    emotion:["Angst vor Ablehnung","Schweigen","Isolation","Erschöpfung (Hashimoto=Selbstangriff)"],
    chakra:"kehle", seiten:{links:"Empfangen von Liebe und Wahrheit",rechts:"Geben / Aussenden"},
    ahnen:"Generationen: verbotene Sprache, Emigration, Sprachverlust",
    heilung:["die eigene Stimme finden","Ausdruck zulassen","für die eigene Wahrheit einstehen"],
    keywords:["hals","schilddrüse","stimme","nacken","kehle","hashimoto"]
  },
  "schultern": { emoji:"💪",
    symbolik:["Last tragen","Verantwortung","Bürde","Schulterlast der Familie"],
    emotion:["Überlastung","Pflichtgefühl","Selbstaufopferung","Hilfsbereitschaft als Flucht"],
    chakra:"herz", seiten:{links:"emotionale Last / Familienthemen",rechts:"berufliche Last / männliche Linie"},
    ahnen:"Muster: 'Wir müssen funktionieren' / traumatische Familienbelastungen",
    heilung:["Lasten bewusst ablegen","Verantwortung neu sortieren","sich entlasten"],
    keywords:["schultern","schulter","last","verantwortung","verspannt","nacken"]
  },
  "ellenbogen": { emoji:"🦾",
    symbolik:["anecken","sich behaupten","Raum einnehmen","Reibungspunkte","Grenzen"],
    emotion:["Frustration","unterdrückte Durchsetzung","Ärger auf Hindernisse","Rigidität"],
    chakra:"solar", seiten:{links:"innere Blockade / Selbstbeziehung",rechts:"äußere Reibung / Beziehungen"},
    ahnen:"'Streit nicht an' / 'Pass dich an' / Rebellion unterdrückt",
    heilung:["die eigene Position halten","gesunde Grenzen wahren","Reibung zulassen"],
    keywords:["ellenbogen","anecken","reibung","grenzen","behaupten","ärger"]
  },
  "hände / finger": { emoji:"🤲",
    symbolik:["Greifen und Loslassen","Berühren und Berührt-werden","Kontrolle","Schöpfung"],
    emotion:["Festhalten","Kontrollzwang","Kreativitätsblockade","Berührungsarmut"],
    chakra:"herz", seiten:{links:"empfangen",rechts:"geben"},
    ahnen:"'Nicht anfassen' / körperliche Kälte in der Familie / Gewalt durch Hände",
    heilung:["Greifen und Loslassen spüren","loslassen üben","Geben und Nehmen"],
    keywords:["hände","finger","greifen","halten","loslassen","hände"]
  },
  "herz": { emoji:"❤️",
    symbolik:["Zentrum des Lebens","Liebe und Verlust","Herzschmerz","emotionale Wunde","Einheit"],
    emotion:["Trauer","Liebeskummer","Einsamkeit","Selbstablehnung","Sehnsucht","Verhärtung"],
    chakra:"herz", seiten:{links:"Empfangen von Liebe / Selbstliebe",rechts:"Geben von Liebe"},
    ahnen:"Verlust, Krieg, früher Tod von Geliebten, Trennungen über Generationen",
    heilung:["dem Herzen Raum geben","Verbundenheit spüren","Vergebungsarbeit"],
    keywords:["herz","herzschmerz","liebe","verlust","trauer","einsamkeit","herzrythmus"]
  },
  "lunge": { emoji:"🫁",
    symbolik:["Atem des Lebens","Raum einnehmen","Lebensfreude","Loslassen beim Ausatmen","Trauer"],
    emotion:["Unterdrückte Trauer","Lebensangst","Nicht atmen dürfen","Lebensraum verloren"],
    chakra:"herz", seiten:{links:"emotionale Trauer / Loslassen",rechts:"aktive Kraft / Lebenswille"},
    ahnen:"Verlust, Asthma-Muster, 'kein Raum für mich' / enge Verhältnisse",
    heilung:["bewusst atmen","Raum einnehmen","Trauer-Ritual"],
    keywords:["lunge","atmen","atem","asthma","husten","trauer"]
  },
  "leber / galle": { emoji:"🫀",
    symbolik:["Verarbeitung","aufgestauter Ärger","Vergiftetes","Entgiftung","Urteile"],
    emotion:["Wut","Bitterkeit","Neid","aufgestauter Ärger","unkontrollierbare Emotionen"],
    chakra:"solar", seiten:{links:"innere Bitterkeit",rechts:"äußerer Ärger / Konflikt"},
    ahnen:"Muster: unterdrückte Wut, Alkohol als Flucht, Bitterkeit über das Leben",
    heilung:["angestauten Ärger anschauen","Groll loslassen","Bitterkeit wandeln"],
    keywords:["leber","galle","wut","ärger","bitterkeit","entgiftung"]
  },
  "magen / milz": { emoji:"🫃",
    symbolik:["Verdauung des Lebens","Assimilation","Sorgen","Grübeln","Unverarbeitetes"],
    emotion:["Sorgen","Grübeln","Nicht-annehmen-können","Zu viel auf einmal","Überwältigung"],
    chakra:"solar", seiten:{links:"emotionale Assimilation",rechts:"äußere Themen / Beruf"},
    ahnen:"'Das Leben ist schwer' / Mangelernährung / Hungermuster",
    heilung:["Sorgen verdauen","sich genährt fühlen","Erdung spüren"],
    keywords:["magen","milz","verdauung","sorgen","grübeln","bauch","übelkeit"]
  },
  "nieren / nebennieren": { emoji:"🫘",
    symbolik:["Urangst","Lebenskraft","Vitalität","Filtern des Lebens","Schockstarre"],
    emotion:["Tiefe Angst","Erschöpfung","Schock","Trauma","Lebensangst","Überlebensstress"],
    chakra:"wurzel", seiten:{links:"weibliche Linie / Mutter",rechts:"männliche Linie / Vater"},
    ahnen:"Kriegstrauma, Überlebensangst, existenzielle Not über Generationen",
    heilung:["Ängste anschauen","zur Ruhe kommen","Überforderung wahrnehmen"],
    keywords:["nieren","nebennieren","angst","erschöpfung","trauma","schock","burnout"]
  },
  "rücken oben": { emoji:"🔼",
    symbolik:["Liebesbedürfnis unerfüllt","fehlende Unterstützung","emotionale Last"],
    emotion:["Mangel an Liebe","Unsupportedness","emotionale Bürde","Verlassenheit"],
    chakra:"herz",  seiten:{links:"Selbstliebe / innere Unterstützung",rechts:"äußere Unterstützung durch andere"},
    ahnen:"Liebesarmut, emotionale Kälte in der Herkunftsfamilie",
    heilung:["dem Herzen Raum geben","Selbstliebe-Ritual","sich getragen fühlen","Unterstützung annehmen lernen"],
    keywords:["rücken oben","oberer rücken","schulterblatt","verspannung"]
  },
  "rücken mitte": { emoji:"🟡",
    symbolik:["Schuldgefühle","Vergangenheit","Festhalten","Steckenbleiben"],
    emotion:["Schuld","Scham","Ohnmacht","alte Wunden","Verbitterung"],
    chakra:"solar", seiten:{links:"innere Schuld",rechts:"Schuld durch andere zugewiesen"},
    ahnen:"Muster: Strafe, Sühne, 'schuldig sein' als Familienprogramm",
    heilung:["alte Wunden anschauen","Vergebungsarbeit","Lasten der Vergangenheit loslassen"],
    keywords:["rücken mitte","mittlerer rücken","solar","schuld","vergangenheit"]
  },
  "rücken unten / lendenwirbel": { emoji:"🔽",
    symbolik:["Existenzangst","Geldsorgen","Mangel","Unterstützung fehlt","Familie"],
    emotion:["Finanzielle Angst","Überlebensangst","Verlassenheit","Erschöpfung"],
    chakra:"wurzel", seiten:{links:"weibliche Linie",rechts:"männliche Linie"},
    ahnen:"Existenzmuster, Armut, Krieg, Heimatverlust",
    heilung:["Sicherheit in sich finden","Existenzängste anschauen","Erdung spüren"],
    keywords:["rücken unten","lendenwirbel","ischias","hüfte","kreuz","exist"]
  },
  "hüfte / becken": { emoji:"🦵",
    symbolik:["Vorwärtsgehen","Sexualität","Kreativität","Familiensystem","Gleichgewicht"],
    emotion:["Stagnation","Angst vor Veränderung","sexuelle Blockaden","Familienthemen"],
    chakra:"sakral", seiten:{links:"Weibliches / Yin / Mutter",rechts:"Männliches / Yang / Vater"},
    ahnen:"Sexualität als Tabu, Bindung an Herkunftsfamilie, Bewegungsunfreiheit",
    heilung:["in Bewegung kommen","Veränderung zulassen","Becken-Entspannung"],
    keywords:["hüfte","becken","hüftschmerzen","sexualität","kreativität","fortbewegung"]
  },
  "knie": { emoji:"🦿",
    symbolik:["Flexibilität","Demut","Sturheit","Ego","Niederbeugen"],
    emotion:["Starrsinn","Stolz","Angst vor Niederlage","Unterwerfung","Autoritätskonflikte"],
    chakra:"wurzel", seiten:{links:"innere Flexibilität",rechts:"äußere Anpassung / Autorität"},
    ahnen:"Kniefall vor Autoritäten / Unterwerfungsmuster / Stolz als Überlebensstrategie",
    heilung:["Demut zulassen","Flexibilität üben","nachgeben können"],
    keywords:["knie","knieschmerzen","starrheit","flexibilität","beugen","autorität"]
  },
  "sprunggelenk / füße": { emoji:"🦶",
    symbolik:["Richtung im Leben","Schritt-für-Schritt","Erdung","Vorwärtskommen","Standpunkt"],
    emotion:["Orientierungslosigkeit","Angst vor dem nächsten Schritt","Erdungsdefizit"],
    chakra:"wurzel", seiten:{links:"Vergangenheit / Herkunft",rechts:"Zukunft / Richtung"},
    ahnen:"Entwurzelung, Flucht, Migration, heimatlose Vorfahren",
    heilung:["Erdung spüren","barfuß gehen","den eigenen Weg gehen","Heimat in sich finden"],
    keywords:["füße","fuß","sprunggelenk","knöchel","erdung","richtung","schritt"]
  },
  "haut": { emoji:"🧑",
    symbolik:["Grenze","Berührung","Abgrenzung","Kontakt","Schutz","Identität"],
    emotion:["Grenzverlust","Hypersensitivität","Berührungsangst","Kontaktangst","Identitätsverlust"],
    chakra:"wurzel", seiten:{ links:"Selbstbezug",rechts:"Außenwelt"},
    ahnen:"Generationelle Berührungsarmut, Übergriffe, zu viel oder zu wenig Nähe",
    heilung:["eigene Grenzen wahrnehmen","Schutz und Offenheit","Berührung zulassen"],
    keywords:["haut","neurodermitis","ekzem","psoriasis","jucken","kontakt","berührung"]
  },
  "blut / kreislauf": { emoji:"🩸",
    symbolik:["Lebensfluss","Kraft","Familie (Blut ist dicker)","Ahnenverbindung","Vitalität"],
    emotion:["Lebensunlust","Erschöpfung","Familienthemen","Blutsbande","Kreislauf des Lebens"],
    chakra:"herz", seiten:{links:"Vergangenheit",rechts:"Zukunft"},
    ahnen:"Zentrales Ahnenthema – Blut trägt alle Generationenmuster",
    heilung:["Lebensfluss spüren","Vergebung","familiäre Muster anschauen"],
    keywords:["blut","kreislauf","blutdruck","anämie","durchblutung","vitalität"]
  },
};

const AURA_SCHICHTEN = [
  {
    nr:1, nameDe:"Die körpernahe Ebene", nameKlassisch:"Ätherkörper",
    farbe:"#CBD5E1", naehe:"dem Erleben ganz nah",
    beschreibung:"Die erste Schicht liegt deinem Körper am nächsten — dort, wo Empfinden, Vitalität und das unmittelbare Gefühl von 'Wie geht es mir gerade?' wohnen. Sie ist die Brücke zwischen dem Körperlichen und dem Inneren: ein symbolischer Raum, in dem sich Erschöpfung, Lebendigkeit oder Anspannung als erstes zeigen.",
    themen:["Müdigkeit oder das Gefühl, ausgelaugt zu sein","Ein Bedürfnis nach Ruhe und Erdung","Spürbare Vitalität und Präsenz"],
    impuls:"Wie fühlt sich dein Körper gerade an — getragen oder angespannt? Was bräuchtest du heute, um dich lebendiger zu fühlen?"
  },
  {
    nr:2, nameDe:"Die Ebene der Gefühle", nameKlassisch:"Emotionalkörper",
    farbe:"#FCA5A5", naehe:"nah, im Fühlen",
    beschreibung:"Die zweite Schicht ist der Raum deiner Gefühle — der täglichen Wellen aus Freude, Trauer, Ärger, Sehnsucht. Hier zeigt sich, was dich gerade innerlich bewegt, oft schneller und ehrlicher als der Verstand es zugeben würde.",
    themen:["Gefühle, die sich stauen oder keinen Ausdruck finden","Eine Stimmung, die schon länger anhält","Ein neues emotionales Gleichgewicht"],
    impuls:"Welches Gefühl ist gerade am stärksten in dir? Und wann hast du ihm zuletzt wirklich Raum gegeben?"
  },
  {
    nr:3, nameDe:"Die Ebene des Denkens", nameKlassisch:"Mentalkörper",
    farbe:"#FEF08A", naehe:"einen Schritt weiter, im Denken",
    beschreibung:"Die dritte Schicht ist die Welt deiner Gedanken, Überzeugungen und inneren Erzählungen — die Geschichten, die du dir über dich selbst und die Welt erzählst. Manche tragen dich, manche begrenzen dich, oft ohne dass du es bemerkst.",
    themen:["Wiederkehrende Gedankenmuster","Ein Glaubenssatz, der nicht mehr passt","Eine neue Klarheit in der Art, wie du über etwas denkst"],
    impuls:"Welcher Gedanke kehrt in letzter Zeit immer wieder? Stimmt er noch — oder ist er eine alte Gewohnheit?"
  },
  {
    nr:4, nameDe:"Die Ebene der Verbindung", nameKlassisch:"Herzebene",
    farbe:"#86EFAC", naehe:"in der Mitte, wo sich innen und außen begegnen",
    beschreibung:"Die vierte Schicht ist die Mitte — der Übergang zwischen dem Persönlichen und dem Größeren. Hier wohnen Liebe, Mitgefühl und die Art, wie du dich mit anderen und mit dir selbst verbindest. Sie ist der Ort, an dem Nähe und Abgrenzung ihr Gleichgewicht suchen.",
    themen:["Ein Gefühl von Verbundenheit oder von Einsamkeit","Die Frage nach gesunden Grenzen","Eine Sehnsucht nach mehr Offenheit"],
    impuls:"Wo in deinem Leben fühlst du dich verbunden, wo eher allein? Und was würde dein Herz gerade brauchen?"
  },
  {
    nr:5, nameDe:"Die Ebene des Ausdrucks", nameKlassisch:"Ätherische Blaupause",
    farbe:"#7DD3FC", naehe:"nach außen gewandt, im Ausdruck",
    beschreibung:"Die fünfte Schicht hat mit deinem authentischen Ausdruck zu tun — damit, wie sehr das, was du nach außen zeigst, mit dem übereinstimmt, was innen wahr ist. Sie ist die Ebene der eigenen Wahrheit und der Stimme, die gehört werden möchte.",
    themen:["Das Gefühl, sich nicht ganz zeigen zu können","Ein Wunsch, klarer für sich einzustehen","Eine wachsende Stimmigkeit zwischen innen und außen"],
    impuls:"Wo zeigst du dich gerade so, wie du wirklich bist — und wo hältst du dich zurück?"
  },
  {
    nr:6, nameDe:"Die Ebene der Lebensthemen", nameKlassisch:"Kausalkörper",
    farbe:"#C4B5FD", naehe:"weiter gefasst, über die Zeit",
    beschreibung:"Die sechste Schicht ist die Ebene der größeren Muster — der Themen, die sich durch dein Leben ziehen, manchmal über Jahre. Hier geht es weniger um den einzelnen Tag als um die roten Fäden, die sich wiederholen und etwas über deinen Weg erzählen.",
    themen:["Ein Thema, das in verschiedenen Lebensphasen wiederkehrt","Eine Lebensaufgabe, die sich langsam klärt","Das Erkennen eines Musters, das du loslassen darfst"],
    impuls:"Welches Thema begleitet dich schon länger? Was hat es dich bisher gelehrt?"
  },
  {
    nr:7, nameDe:"Die Ebene der Weite", nameKlassisch:"Ketherkörper",
    farbe:"#FFFFFF", naehe:"in die Weite geöffnet",
    beschreibung:"Die siebte Schicht ist die weiteste — der Raum von Sinn, Vertrauen und der Verbindung zu etwas, das über dich hinausreicht. Wie jeder Mensch das nennt, ist verschieden: Quelle, Leben, Stille, das Ganze. Hier geht es um das Gefühl, getragen und Teil von etwas Größerem zu sein.",
    themen:["Eine Sehnsucht nach Sinn","Momente von tiefer Ruhe und Vertrauen","Das Gefühl, den Faden zum Größeren verloren zu haben"],
    impuls:"Wann hast du dich zuletzt mit etwas Größerem verbunden gefühlt? Was schenkt dir gerade ein Gefühl von Sinn?"
  }
];

const HELLSINN_TAGS = {
  wahrnehmung: {
    label:"💫 Wahrnehmungsart", farbe:"#C9A84C", bgfarbe:"rgba(201,168,76,0.15)",
    items:["Wärme","Kälte","Schwere","Leichtigkeit","Kribbeln","Pulsation","Enge","Druck","Zug","Leere","Fülle","Prickeln","Schmerz gespürt","Starre","Vibration","Weichheit","Härte"]
  },
  farben: {
    label:"🎨 Farben / Licht", farbe:"#EA580C", bgfarbe:"#FFF7ED",
    items:["Rot","Orange","Gelb","Grün","Hellblau","Dunkelblau","Violett","Weiß","Schwarz","Grau","Braun","Rosa","Gold","Silber","Türkis","Dunkel","Hell","Trüb","Leuchtend"]
  },
  koerper: {
    label:"🫀 Körperzone", farbe:"#C9A84C", bgfarbe:"rgba(201,168,76,0.15)",
    items:["Kopf","Herz","Bauch","Brust","Rücken","Schultern","Arme","Beine","Füße","Hände","Kehle","Gesicht","Becken","Hüfte","Knie","Wirbelsäule","Links","Rechts","Oben","Unten"]
  },
  energetisch: {
    label:"⚡ Energetisches Feld", farbe:"#A87D3A", bgfarbe:"rgba(201,168,76,0.15)",
    items:["Aura groß","Aura klein","Löcher im Feld","Korde","Fremdenergie","Schutzwand","Chakra aktiv","Chakra blockiert","Strudel","Lichtkörper","Dunkelfeld","Implantate","Seelensplitter","Verbindungsfäden"]
  },
  bildlich: {
    label:"🌿 Bilder / Symbole", farbe:"#16A34A", bgfarbe:"#DCFCE7",
    items:["Mauer","Käfig","Netz","Panzer","Schleier","Schnur","Knoten","Stein","Schwert","Licht","Fluss","Baum","Wurzel","Wasser","Feuer","Erde","Wind","Höhle","Brücke","Spiegel"]
  },
  ahnen: {
    label:"🧬 Ahnen / Karma", farbe:"#B45309", bgfarbe:"#FEF3C7",
    items:["Mutter-Linie","Vater-Linie","Großeltern","Krieg","Verlust","Emigration","Trauma","Schwur","Loyalität","Karma","Wiederholung","Verstrickung","Schicksal","Ahnen anwesend"]
  },
};

const HEILMETHODEN_KATALOG = [
  { id:"blutreinigung",  name:"Blutreinigung",      icon:"🩸", kategorie:"Energetische Heilung",
    beschreibung:"Reinigung des energetischen Blutfeldes von niedrigen Frequenzen, Schockmustern und Ahnenbelastungen. Das Blut ist der Träger aller Lebensinformation.",
    anwendung:"Chronische Erkrankungen, Erschöpfung, Ahnenthemen, Kreislaufprobleme, Bluterkrankungen",
    ablauf:["Verbindung mit dem Herzfeld","Licht durch das Blut strömen lassen","Dunkle Partikel im Licht auflösen","Neue vitale Frequenz einprogrammieren","Versiegelung"],
    stufe:3
  },
  { id:"herzheilung",    name:"Herzheilung",         icon:"💚", kategorie:"Energetische Heilung",
    beschreibung:"Tiefe Heilungsarbeit am Herzfeld: Öffnen, Reinigen, Integrieren von Herzwunden, Liebeskummer, Verlust und emotionalen Panzerungen.",
    anwendung:"Herzschmerz, Trauer, Verlust, Beziehungsprobleme, Selbstablehnung, Angststörungen",
    ablauf:["Herzraum öffnen","Schmerzschichten ablösen","Rohes Licht einlassen","Selbstliebe ankern","Herz-Kohärenz stabilisieren"],
    stufe:2
  },
  { id:"chakraheilung",  name:"Chakraheilung",        icon:"🌈", kategorie:"Energetische Heilung",
    beschreibung:"Systematische Reinigung, Balancierung und Aktivierung der sieben Hauptchakren und ihrer Verbindungskanäle (Sushumna, Ida, Pingala).",
    anwendung:"Energieimbalancen, Körperbeschwerden, emotionale Blockaden, spirituelle Stagnation",
    ablauf:["Chakren-Scan (Pendeltest/Intuition)","Blockiertes Chakra identifizieren","Reinigung","Aktivierung mit Farb-/Tonfrequenz","Nadis ausbalancieren"],
    stufe:1
  },
  { id:"meridianheilung",name:"Meridian-Ausgleich",  icon:"🌊", kategorie:"Energetische Heilung",
    beschreibung:"Energetische Aktivierung der 12 Hauptmeridiane und 2 Gefäße (Renmai/Dumai) zur Harmonisierung des gesamten Energiesystems.",
    anwendung:"Organprobleme, Schmerzbilder, emotionale Muster, TCM-Diagnoseprinzipien",
    ablauf:["Meridian-Scan","Schwache Meridiane bestimmen","Sedierung / Tonisierung","Energie nachführen","Ausleitung"],
    stufe:2
  },
  { id:"ahnenarbeit",    name:"Ahnenlinien-Heilung", icon:"🧬", kategorie:"Systemische Energie",
    beschreibung:"Heilungsarbeit an transgenerationellen Mustern, Loyalitäten, Schwüren und Traumata in Mutter- und Vaterlinie bis zur 7. Generation.",
    anwendung:"Wiederholungsmuster, Beziehungsthemen, Erkrankungsmuster die sich wiederholen",
    ablauf:["Ahnen-Feld öffnen","Thema und Ursprung finden","Anerkennung der Ahnen","Lösung/Vergebung","DNS-Reinigung","Integration"],
    stufe:3
  },
  { id:"dnaheilung",     name:"DNA / Licht-Codes",   icon:"🔮", kategorie:"Quantenheilung",
    beschreibung:"Aktivierung von Licht-Codes in der DNS über Intention, Klang und höherdimensionale Verbindung. Epigenetische Umprogrammierung.",
    anwendung:"Tiefe Familienmuster, spirituelles Erwachen, Potential-Entfaltung",
    ablauf:["Verbindung höheres Selbst","DNS-Visualisierung","Lichtcodes einsenden","Altes Programm auflösen","Neues Muster verankern"],
    stufe:5
  },
  { id:"zeitlinie",      name:"Zeitlinienarbeit",    icon:"⏳", kategorie:"Quantenheilung",
    beschreibung:"Energetische Heilungsarbeit in der Zeit: Vergangenheitshealing, Inkarnationsthemen, Zukunftsprogrammierung.",
    anwendung:"Nicht-heilende Wunden, Traumatas die 'tief' sitzen, Karma-Auflösung",
    ablauf:["Zeitlinie öffnen","Heilungspunkt identifizieren","Intervention im Energiefeld der Zeit","Integration ins Jetzt"],
    stufe:4
  },
  { id:"lichtsprache",   name:"Licht-Sprache",       icon:"✨", kategorie:"Frequenzarbeit",
    beschreibung:"Übertragung von Heilfrequenzen durch Laut, Geste und Intention jenseits des Verstandes. Direkte Arbeit mit dem Energiefeld.",
    anwendung:"Tiefe Blockaden, wenn Worte nicht reichen, Frequenzübertragung",
    ablauf:["Verbindung herstellen","Kanal öffnen","Lichtsprache fließen lassen","Empfangen und integrieren"],
    stufe:3
  },
  { id:"fernheilung",    name:"Fernheilung",         icon:"🌐", kategorie:"Quantenheilung",
    beschreibung:"Quantenenergetische Heilungsarbeit über Raum und Zeit. Intention als primäres Werkzeug. Gleiche Wirksamkeit wie Präsenz-Sitzung.",
    anwendung:"Nicht anwesende Klienten, Nachsorge, internationale Arbeit",
    ablauf:["Heiligen Raum öffnen","Verbindung mit Klientenfeld aufnehmen","Absicht setzen","Arbeit durchführen","Schließen und loslassen"],
    stufe:4
  },
];

const LERNPFAD_STUFEN = [
  { nr:1, name:"Einführung",    farbe:"#16A34A", icon:"🌱", beschreibung:"Grundverständnis, Terminologie, erste Wahrnehmungen. Für Einsteiger." },
  { nr:2, name:"Grundlagen",   farbe:"#C9A84C", icon:"📚", beschreibung:"Systematisches Wissen, erste Technikanwendung, eigenständige Anwendung." },
  { nr:3, name:"Vertiefung",   farbe:"#0284C7", icon:"🎯", beschreibung:"Komplexe Themen, Kombination von Methoden, eigene Wahrnehmungsschärfung." },
  { nr:4, name:"Meisterschaft",farbe:"#A87D3A", icon:"⚡", beschreibung:"Souveräne Anwendung und tiefes Verständnis." },
  { nr:5, name:"Zertifizierung",farbe:"#D97706",icon:"🏆", beschreibung:"Geprüfte Kompetenz · Höchste Abschlussstufe der Human Resonanz Lernwelt." },
];

// ════════════════════════════════════════════════════════════════
//  UI HILFSKOMPONENTEN
// ════════════════════════════════════════════════════════════════
const OCard = ({children, style={}}) => (
  <div style={{background:OT.bgCard,borderRadius:"18px",padding:"18px",border:`1.5px solid ${OT.border}`,boxShadow:`0 2px 14px ${OT.shadow}`,...style}}>{children}</div>
);
const OBtn = ({children,onClick,variant="primary",disabled,style={}}) => {
  const variants = {
    primary:{background:`linear-gradient(135deg,#C9A84C,#A87D3A)`,color:"white",border:"none"},
    soft:{background:OT.bgSoft,color:OT.textMid,border:`1.5px solid ${OT.border}`},
    accent:{background:`linear-gradient(135deg,#C9A84C,#A87D3A)`,color:"white",border:"none"},
    ghost:{background:"transparent",color:"#C9A84C",border:`1.5px solid #C9A84C`},
  };
  return <button onClick={onClick} disabled={disabled} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"10px 18px",borderRadius:"12px",cursor:disabled?"wait":"pointer",opacity:disabled?0.6:1,transition:"all 0.15s",...variants[variant],...style}}>{children}</button>;
};
const OTag = ({label, aktiv, onClick, farbe="#C9A84C", bgFarbe="rgba(201,168,76,0.15)"}) => (
  <button onClick={onClick} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"5px 12px",borderRadius:"20px",border:`1.5px solid ${aktiv?farbe:OT.border}`,background:aktiv?bgFarbe:OT.bgCard,color:aktiv?farbe:OT.textSoft,cursor:"pointer",transition:"all 0.12s"}}>{label}</button>
);
const OLabel = ({children, color}) => (
  <div style={{fontFamily:"Raleway",fontSize:"10px",letterSpacing:"2px",fontWeight:800,color:color||OT.textSoft,textTransform:"uppercase",marginBottom:"10px"}}>{children}</div>
);

export { OT, CHAKRA_SYSTEM, ORGAN_MAP, AURA_SCHICHTEN, HELLSINN_TAGS, HEILMETHODEN_KATALOG, LERNPFAD_STUFEN, OCard, OBtn, OTag, OLabel };
