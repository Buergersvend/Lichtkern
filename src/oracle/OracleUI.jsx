import React, { useState, useEffect, useCallback, useRef } from "react";

const OT = {
  bg:"#F0FAFA", bgCard:"#FFFFFF", bgSoft:"#E6F7F7", bgSofter:"#F5FDFD",
  border:"#B2E0DC", borderMid:"#7EC8C2",
  text:"#0F3030", textMid:"#2D6B68", textSoft:"#6AABA7",
  teal:"#0D9488", tealL:"#CCFBF1", tealD:"#0F6B63",
  violet:"#6D3FCC", violetL:"#EDE9FE", violetD:"#4C1D95",
  gold:"#D97706", goldL:"#FEF3C7",
  rose:"#E11D48", roseL:"#FFE4E6",
  shadow:"rgba(13,148,136,0.12)", shadowDeep:"rgba(13,148,136,0.22)",
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
    heilung:["Stirnchakra-Balance","Gehirn-Hemisphären-Sync","Mentalkörper-Reinigung","Ahnen: Recht auf eigene Gedanken"],
    keywords:["kopfschmerzen","migräne","schwindel","gedanken","mental"]
  },
  "augen": { emoji:"👁️",
    symbolik:["Nicht-sehen-wollen","Angst vor Wahrheit","Hellsicht blockiert","blinder Fleck"],
    emotion:["Verleugnung","Schutz vor Schmerz","Überforderung"],
    chakra:"stirn", seiten:{links:"Innenschau / was du dir selbst nicht zeigst",rechts:"Außenwelt / was du anderen nicht zeigen willst"},
    ahnen:"Generationenmuster: 'Sieh nicht hin' / Zeugen von Gewalt oder Schmerz",
    heilung:["Ajna-Chakra-Öffnung","Augen-Meridian-Arbeit","innere Kind-Arbeit: darf sehen"],
    keywords:["augen","sehen","blind","wahrnehmung","blick"]
  },
  "ohren": { emoji:"👂",
    symbolik:["Nicht-hören-wollen","Botschaften überhören","innere Stimme ignoriert"],
    emotion:["Überwältigung durch Geräusche","Konfliktvermeidung","Gehorsam"],
    chakra:"kehle", seiten:{links:"eigene innere Stimme",rechts:"äußere Botschaften / Autorität"},
    ahnen:"'Kinder haben zu schweigen' / Verbote zu hören oder zu sprechen",
    heilung:["Kehlchakra-Balance","Ohr-Meridian","Stille-Meditation","Selbstermächtigung der inneren Stimme"],
    keywords:["ohren","hören","tinnitus","stille","ohr"]
  },
  "mund / zähne / kiefer": { emoji:"🦷",
    symbolik:["Schlucken von Worten","Verbissenes Festhalten","aufgebissene Zähne","Ausdruck blockiert"],
    emotion:["Unterdrückte Worte","Wut","Ohnmacht","Perfektionismus","Kontrolle"],
    chakra:"kehle", seiten:{links:"Weibliches / Empfangen",rechts:"Männliches / Geben"},
    ahnen:"Muster: 'Sprich nicht darüber' / verbotene Wahrheiten",
    heilung:["Kiefer-Entspannung","Kehlchakra-Befreiung","Tönen","die eigene Wahrheit sprechen"],
    keywords:["mund","zähne","kiefer","schlucken","beißen","zähneknirschen"]
  },
  "hals / schilddrüse": { emoji:"🌀",
    symbolik:["Stimme unterdrückt","Lebensfluss gebremst","Nicht authentisch","Metabolismus des Lebens"],
    emotion:["Angst vor Ablehnung","Schweigen","Isolation","Erschöpfung (Hashimoto=Selbstangriff)"],
    chakra:"kehle", seiten:{links:"Empfangen von Liebe und Wahrheit",rechts:"Geben / Aussenden"},
    ahnen:"Generationen: verbotene Sprache, Emigration, Sprachverlust",
    heilung:["Schilddrüsen-Meridian","Kehle-Licht-Infusion","Singen","Aquamarin","Wahrheitsbotschaft"],
    keywords:["hals","schilddrüse","stimme","nacken","kehle","hashimoto"]
  },
  "schultern": { emoji:"💪",
    symbolik:["Last tragen","Verantwortung","Bürde","Schulterlast der Familie"],
    emotion:["Überlastung","Pflichtgefühl","Selbstaufopferung","Hilfsbereitschaft als Flucht"],
    chakra:"herz", seiten:{links:"emotionale Last / Familienthemen",rechts:"berufliche Last / männliche Linie"},
    ahnen:"Muster: 'Wir müssen funktionieren' / traumatische Familienbelastungen",
    heilung:["Herz-Chakra-Öffnung","Schultern freisprechen","Lasten rituell abgeben","Familienaufstellung"],
    keywords:["schultern","schulter","last","verantwortung","verspannt","nacken"]
  },
  "ellenbogen": { emoji:"🦾",
    symbolik:["anecken","sich behaupten","Raum einnehmen","Reibungspunkte","Grenzen"],
    emotion:["Frustration","unterdrückte Durchsetzung","Ärger auf Hindernisse","Rigidität"],
    chakra:"solar", seiten:{links:"innere Blockade / Selbstbeziehung",rechts:"äußere Reibung / Beziehungen"},
    ahnen:"'Streit nicht an' / 'Pass dich an' / Rebellion unterdrückt",
    heilung:["Solarplexus-Kraft-Aktivierung","Grenzen-Ritual","Dickdarm-Meridian","das Recht auf Reibung"],
    keywords:["ellenbogen","anecken","reibung","grenzen","behaupten","ärger"]
  },
  "hände / finger": { emoji:"🤲",
    symbolik:["Greifen und Loslassen","Berühren und Berührt-werden","Kontrolle","Schöpfung"],
    emotion:["Festhalten","Kontrollzwang","Kreativitätsblockade","Berührungsarmut"],
    chakra:"herz", seiten:{links:"empfangen",rechts:"geben"},
    ahnen:"'Nicht anfassen' / körperliche Kälte in der Familie / Gewalt durch Hände",
    heilung:["Herzchakra-Öffnung","Daumenmassage für Lungenmeridian","Handchakras aktivieren","loslassen üben"],
    keywords:["hände","finger","greifen","halten","loslassen","hände"]
  },
  "herz": { emoji:"❤️",
    symbolik:["Zentrum des Lebens","Liebe und Verlust","Herzschmerz","emotionale Wunde","Einheit"],
    emotion:["Trauer","Liebeskummer","Einsamkeit","Selbstablehnung","Sehnsucht","Verhärtung"],
    chakra:"herz", seiten:{links:"Empfangen von Liebe / Selbstliebe",rechts:"Geben von Liebe"},
    ahnen:"Verlust, Krieg, früher Tod von Geliebten, Trennungen über Generationen",
    heilung:["Herzheilung (Lichtinfusion)","Blutreinigung","Ho'oponopono","Rosenquarz","Herz-Kohärenz","Vergebungsarbeit"],
    keywords:["herz","herzschmerz","liebe","verlust","trauer","einsamkeit","herzrythmus"]
  },
  "lunge": { emoji:"🫁",
    symbolik:["Atem des Lebens","Raum einnehmen","Lebensfreude","Loslassen beim Ausatmen","Trauer"],
    emotion:["Unterdrückte Trauer","Lebensangst","Nicht atmen dürfen","Lebensraum verloren"],
    chakra:"herz", seiten:{links:"emotionale Trauer / Loslassen",rechts:"aktive Kraft / Lebenswille"},
    ahnen:"Verlust, Asthma-Muster, 'kein Raum für mich' / enge Verhältnisse",
    heilung:["Atemtherapie","Herzchakra-Öffnung","Lungenmeridian","Trauer-Ritual","Lebensraum beanspruchen"],
    keywords:["lunge","atmen","atem","asthma","husten","trauer"]
  },
  "leber / galle": { emoji:"🫀",
    symbolik:["Verarbeitung","aufgestauter Ärger","Vergiftetes","Entgiftung","Urteile"],
    emotion:["Wut","Bitterkeit","Neid","aufgestauter Ärger","unkontrollierbare Emotionen"],
    chakra:"solar", seiten:{links:"innere Bitterkeit",rechts:"äußerer Ärger / Konflikt"},
    ahnen:"Muster: unterdrückte Wut, Alkohol als Flucht, Bitterkeit über das Leben",
    heilung:["Leberentgiftung energetisch","Gallenblasen-Meridian","Wut rituell entladen","Solarplexus-Reinigung"],
    keywords:["leber","galle","wut","ärger","bitterkeit","entgiftung"]
  },
  "magen / milz": { emoji:"🫃",
    symbolik:["Verdauung des Lebens","Assimilation","Sorgen","Grübeln","Unverarbeitetes"],
    emotion:["Sorgen","Grübeln","Nicht-annehmen-können","Zu viel auf einmal","Überwältigung"],
    chakra:"solar", seiten:{links:"emotionale Assimilation",rechts:"äußere Themen / Beruf"},
    ahnen:"'Das Leben ist schwer' / Mangelernährung / Hungermuster",
    heilung:["Magenmeridian-Arbeit","Sorgen rituell entladen","Solarplexus","Milz-Stärkung","Erd-Frequenz"],
    keywords:["magen","milz","verdauung","sorgen","grübeln","bauch","übelkeit"]
  },
  "nieren / nebennieren": { emoji:"🫘",
    symbolik:["Urangst","Lebenskraft","Vitalität","Filtern des Lebens","Schockstarre"],
    emotion:["Tiefe Angst","Erschöpfung","Schock","Trauma","Lebensangst","Überlebensstress"],
    chakra:"wurzel", seiten:{links:"weibliche Linie / Mutter",rechts:"männliche Linie / Vater"},
    ahnen:"Kriegstrauma, Überlebensangst, existenzielle Not über Generationen",
    heilung:["Nierenmeridian-Stärkung","Nebennieren-Reset","Tiefes Trauma-Release","Ahnen-Frieden","Wurzelchakra"],
    keywords:["nieren","nebennieren","angst","erschöpfung","trauma","schock","burnout"]
  },
  "rücken oben": { emoji:"🔼",
    symbolik:["Liebesbedürfnis unerfüllt","fehlende Unterstützung","emotionale Last"],
    emotion:["Mangel an Liebe","Unsupportedness","emotionale Bürde","Verlassenheit"],
    chakra:"herz",  seiten:{links:"Selbstliebe / innere Unterstützung",rechts:"äußere Unterstützung durch andere"},
    ahnen:"Liebesarmut, emotionale Kälte in der Herkunftsfamilie",
    heilung:["Herzchakra-Öffnung","Selbstliebe-Ritual","Rückenmeridian-Arbeit","Unterstützung annehmen lernen"],
    keywords:["rücken oben","oberer rücken","schulterblatt","verspannung"]
  },
  "rücken mitte": { emoji:"🟡",
    symbolik:["Schuldgefühle","Vergangenheit","Festhalten","Steckenbleiben"],
    emotion:["Schuld","Scham","Ohnmacht","alte Wunden","Verbitterung"],
    chakra:"solar", seiten:{links:"innere Schuld",rechts:"Schuld durch andere zugewiesen"},
    ahnen:"Muster: Strafe, Sühne, 'schuldig sein' als Familienprogramm",
    heilung:["Solarplexus","Vergebungsarbeit","Schuld-Ritual","Gallenmeridian","Zeitlinienarbeit"],
    keywords:["rücken mitte","mittlerer rücken","solar","schuld","vergangenheit"]
  },
  "rücken unten / lendenwirbel": { emoji:"🔽",
    symbolik:["Existenzangst","Geldsorgen","Mangel","Unterstützung fehlt","Familie"],
    emotion:["Finanzielle Angst","Überlebensangst","Verlassenheit","Erschöpfung"],
    chakra:"wurzel", seiten:{links:"weibliche Linie",rechts:"männliche Linie"},
    ahnen:"Existenzmuster, Armut, Krieg, Heimatverlust",
    heilung:["Wurzelchakra-Erdung","Ahnenfrieden","Nierenmeridian","Blasenmeridian","Abundanzprogramm aktivieren"],
    keywords:["rücken unten","lendenwirbel","ischias","hüfte","kreuz","exist"]
  },
  "hüfte / becken": { emoji:"🦵",
    symbolik:["Vorwärtsgehen","Sexualität","Kreativität","Familiensystem","Gleichgewicht"],
    emotion:["Stagnation","Angst vor Veränderung","sexuelle Blockaden","Familienthemen"],
    chakra:"sakral", seiten:{links:"Weibliches / Yin / Mutter",rechts:"Männliches / Yang / Vater"},
    ahnen:"Sexualität als Tabu, Bindung an Herkunftsfamilie, Bewegungsunfreiheit",
    heilung:["Sakralchakra-Öffnung","Hüftöffner","Ahnen-Sexualitätsmuster","Becken-Entspannung"],
    keywords:["hüfte","becken","hüftschmerzen","sexualität","kreativität","fortbewegung"]
  },
  "knie": { emoji:"🦿",
    symbolik:["Flexibilität","Demut","Sturheit","Ego","Niederbeugen"],
    emotion:["Starrsinn","Stolz","Angst vor Niederlage","Unterwerfung","Autoritätskonflikte"],
    chakra:"wurzel", seiten:{links:"innere Flexibilität",rechts:"äußere Anpassung / Autorität"},
    ahnen:"Kniefall vor Autoritäten / Unterwerfungsmuster / Stolz als Überlebensstrategie",
    heilung:["Magenmeridian","Flexibilitäts-Übung mental","Wurzelchakra","Ego-Auflösung","Demut als Kraft"],
    keywords:["knie","knieschmerzen","starrheit","flexibilität","beugen","autorität"]
  },
  "sprunggelenk / füße": { emoji:"🦶",
    symbolik:["Richtung im Leben","Schritt-für-Schritt","Erdung","Vorwärtskommen","Standpunkt"],
    emotion:["Orientierungslosigkeit","Angst vor dem nächsten Schritt","Erdungsdefizit"],
    chakra:"wurzel", seiten:{links:"Vergangenheit / Herkunft",rechts:"Zukunft / Richtung"},
    ahnen:"Entwurzelung, Flucht, Migration, heimatlose Vorfahren",
    heilung:["Fußreflexzonen","Barfußlaufen","Erdungsritual","Wurzelchakra","Ahnen-Heimat-Heilung"],
    keywords:["füße","fuß","sprunggelenk","knöchel","erdung","richtung","schritt"]
  },
  "haut": { emoji:"🧑",
    symbolik:["Grenze","Berührung","Abgrenzung","Kontakt","Schutz","Identität"],
    emotion:["Grenzverlust","Hypersensitivität","Berührungsangst","Kontaktangst","Identitätsverlust"],
    chakra:"wurzel", seiten:{ links:"Selbstbezug",rechts:"Außenwelt"},
    ahnen:"Generationelle Berührungsarmut, Übergriffe, zu viel oder zu wenig Nähe",
    heilung:["Hautmeridian","Schutz-Visualisierung","Aura-Stärkung","Körpergrenzen-Ritual","Berührungs-Therapie"],
    keywords:["haut","neurodermitis","ekzem","psoriasis","jucken","kontakt","berührung"]
  },
  "blut / kreislauf": { emoji:"🩸",
    symbolik:["Lebensfluss","Kraft","Familie (Blut ist dicker)","Ahnenverbindung","Vitalität"],
    emotion:["Lebensunlust","Erschöpfung","Familienthemen","Blutsbande","Kreislauf des Lebens"],
    chakra:"herz", seiten:{links:"Vergangenheit",rechts:"Zukunft"},
    ahnen:"Zentrales Ahnenthema – Blut trägt alle Generationenmuster",
    heilung:["Blutreinigung (Lichtarbeit)","Herzchakra-Pump-Übung","DNA-Aktivierung","Ahnen-Blutlinie-Reinigung","Ferritheilung"],
    keywords:["blut","kreislauf","blutdruck","anämie","durchblutung","vitalität"]
  },
};

const AURA_SCHICHTEN = [
  { nr:1, name:"Ätherischer Körper",    farbe:"#CBD5E1", thema:"Vitalität · Körperblaupause",
    abstand:"2–5 cm", wahrnehmung:"Kribbeln, Wärme, Pulsation direkt am Körper",
    blockaden:["Erschöpfung","Chronische Erkrankungen","Energieverlust","Schmerz"],
    heilung:["Pranic Healing","Quantenheilung am Ätherfeld","Lebensenergie-Infusion","Akupunktur-Meridiane"],
    chirurgie:["Ätherische Wunden nähen","Depleted areas auffüllen","Energielecks schließen"]
  },
  { nr:2, name:"Emotionalkörper",       farbe:"#FCA5A5", thema:"Gefühle · Wünsche · Reaktionen",
    abstand:"5–15 cm", wahrnehmung:"Temperaturveränderungen, Farben, emotionale Eindrücke",
    blockaden:["Unterdrückte Gefühle","Altes Herzweh","Traumata","emotionale Verstrickungen"],
    heilung:["Emotions-Entleerung","Emotionalkörper-Reinigung","Traumaarbeit","Farbheilung"],
    chirurgie:["Emotionale Schichten ablösen","alte Gefühlsknoten lösen","Schutzpanzer auflösen"]
  },
  { nr:3, name:"Mentalkörper",          farbe:"#FEF08A", thema:"Gedanken · Überzeugungen · Muster",
    abstand:"15–25 cm", wahrnehmung:"Impulse, Gedanken die kommen, Druckgefühl am Kopf",
    blockaden:["Glaubenssätze","Negative Gedankenmuster","Mentale Programme","Fremdgedanken"],
    heilung:["Glaubenssatz-Clearing","Mentalkörper-Reinigung","Lichtsprache","Affirmationsfeld"],
    chirurgie:["Mentale Implantate entfernen","Fremdgedanken auslösen","Mentales Gitter reparieren"]
  },
  { nr:4, name:"Astralkörper",          farbe:"#86EFAC", thema:"Verbindungen · Liebe · Beziehungen",
    abstand:"25–45 cm", wahrnehmung:"Energiefäden zu Personen, Herzöffnung, Expansionsgefühl",
    blockaden:["Kord-Verbindungen","Symbiotische Bindungen","Liebeswunden","Beziehungsverstrickungen"],
    heilung:["Kord-Schneiden","Astralreisen-Reinigung","Liebeswunden-Heilung","Herzverbindungen stärken"],
    chirurgie:["Energetische Korde durchtrennen","Parasitäre Verbindungen lösen","Liebesfäden heilen"]
  },
  { nr:5, name:"Äther-Schablone",       farbe:"#7DD3FC", thema:"Göttlicher Bauplan · Identität",
    abstand:"45–60 cm", wahrnehmung:"Kristalline Struktur, Blaupausen-Qualität, Ordnung/Chaos",
    blockaden:["Identitätsverlust","Nicht authentisch leben","Lebensplan blockiert"],
    heilung:["Blaupausen-Aktivierung","Göttliche Struktur wiederherstellen","Identitätsheilung"],
    chirurgie:["Verzerrte Blaupausen korrigieren","Göttliches Muster reinstallieren"]
  },
  { nr:6, name:"Kausalkörper",          farbe:"#C4B5FD", thema:"Karma · Seelenmuster · Lebensthemen",
    abstand:"60–80 cm", wahrnehmung:"Leuchten, hohe Frequenz, Sphärenklang intern",
    blockaden:["Karmische Muster","Seelenwunden","ungelöste Lebensthemen","Seelensplitter"],
    heilung:["Karma-Auflösung","Seelenheilung","Zeitlinienarbeit","Inkarnationsthemen lösen"],
    chirurgie:["Karmische Korde trennen","Seelensplitter zurückrufen","Lebensthemen umprogrammieren"]
  },
  { nr:7, name:"Kether-Körper",         farbe:"#FFFFFF", thema:"Göttliche Verbindung · Einheit",
    abstand:"80–100+ cm", wahrnehmung:"Stille, Licht, absolute Präsenz, Grenzenlosigkeit",
    blockaden:["Spirituelle Trennung","Gottvertrauen verloren","Sinnkrise","Disconnect"],
    heilung:["Lichtkanal öffnen","Göttliche Verbindung herstellen","Quellenlicht einlassen"],
    chirurgie:["Lichtkanal reparieren","Verbindung zum Höheren reinstallieren"]
  },
];

const AURA_CHIRURGIE_TECHNIKEN = [
  { name:"Kord-Schneidung",            icon:"✂️", beschreibung:"Energetische Verbindungsfäden zu Personen, Orten oder Situationen durchtrennen. Nicht zu verwechseln mit Liebesbanden.", anwendung:"Symbiotische Abhängigkeiten, toxische Beziehungen, nicht ablösbare Bindungen", schritte:["Feld scannen nach Korden","Ursprung bestimmen","Intention setzen","Arkturanisches Lichtschwert oder Goldenes Licht","Wunde versiegeln","Neue Grenze setzen"] },
  { name:"Implantat-Entfernung",       icon:"🔮", beschreibung:"Fremdenergetische Strukturen im Aurafeld finden und auflösen. Diese können aus anderen Inkarnationen, Verträgen oder Magie stammen.", anwendung:"Unerklärliche Schwere, fremde Gedanken, blockierte Manifestation", schritte:["Scan mit Hellspürsinn","Lokalisierung (oft Chakren oder Gelenke)","Lichtzange / Goldenes Licht","Entfernen und Entsorgen im Licht","Wunde füllen mit Reines Licht"] },
  { name:"Energieleck-Versiegelung",   icon:"💧", beschreibung:"Löcher oder Risse in der Aura finden und reparieren. Entstehen durch Schock, Operationen, Drogen oder intensive emotionale Verluste.", anwendung:"Chronische Erschöpfung, das Gefühl 'immer leer zu sein'", schritte:["Aura abtasten auf Temperaturdifferenzen","Leck lokalisieren","Goldenes Licht oder Silberlicht einfüllen","Aura-Gewebe nähen (visualisiert)","Versiegeln und schützen"] },
  { name:"Fremdenergien-Clearing",     icon:"🌊", beschreibung:"Im Alltag, in Menschenmassen oder bei intensiver Kontaktarbeit sammeln sich Fremdenergien im Feld. Regelmäßige Reinigung ist essenziell.", anwendung:"Nach intensiver Sitzungsarbeit, in Menschenmassen, nach Konflikten", schritte:["Violettes Feuer / Lichtdusche","Feld von außen nach innen bürsten","Ins Licht entlassen","Schutz reaktivieren"] },
  { name:"Schutzmatrix-Stärkung",      icon:"🛡️", beschreibung:"Aufbau eines bewussten energetischen Schutzschildes für sensible Praktizierende und deren Klienten.", anwendung:"Vor Sitzungen, bei empathischen Überwältigungen, für Schutz im Alltag", schritte:["Erdung aktivieren","Lichtschutzblase aufbauen (Goldlicht oder Kristall)","Spiegel-Außenhülle","Intention: Nur das Höchste und Heilsamste darf ein und aus"] },
  { name:"Seelensplitter-Rückruf",     icon:"🌟", beschreibung:"Teile der Seele, die durch Trauma abgespalten wurden, werden zurückgerufen und reintegriert. Schamanische Kerntechnik.", anwendung:"Bei Dissoziationstendenzen, Gefühl 'nicht ganz da zu sein', nach Traumata", schritte:["Heiligen Raum öffnen","Seelensplitter lokalisieren (Zeit / Ort)","Liebevoller Ruf","Empfangen und integrieren","Mit Licht versiegeln"] },
  { name:"DNA-Aktivierung",            icon:"🧬", beschreibung:"Aktivierung von Licht-Codes in den Ahnen-DNS-Schichten. Entfernt generationelle Programme und aktiviert das volle Potenzial.", anwendung:"Bei tiefen Familienmustern, Wiederholung generationeller Themen", schritte:["Verbindung mit dem höheren Selbst","DNS-Doppelhelix visualisieren","Licht-Codes einschleusen","Altes Programm auflösen","Neues Programm verankern"] },
];

const HELLSINN_TAGS = {
  wahrnehmung: {
    label:"💫 Wahrnehmungsart", farbe:"#7C3AED", bgfarbe:"#EDE9FE",
    items:["Wärme","Kälte","Schwere","Leichtigkeit","Kribbeln","Pulsation","Enge","Druck","Zug","Leere","Fülle","Prickeln","Schmerz gespürt","Starre","Vibration","Weichheit","Härte"]
  },
  farben: {
    label:"🎨 Farben / Licht", farbe:"#EA580C", bgfarbe:"#FFF7ED",
    items:["Rot","Orange","Gelb","Grün","Hellblau","Dunkelblau","Violett","Weiß","Schwarz","Grau","Braun","Rosa","Gold","Silber","Türkis","Dunkel","Hell","Trüb","Leuchtend"]
  },
  koerper: {
    label:"🫀 Körperzone", farbe:"#0D9488", bgfarbe:"#CCFBF1",
    items:["Kopf","Herz","Bauch","Brust","Rücken","Schultern","Arme","Beine","Füße","Hände","Kehle","Gesicht","Becken","Hüfte","Knie","Wirbelsäule","Links","Rechts","Oben","Unten"]
  },
  energetisch: {
    label:"⚡ Energetisches Feld", farbe:"#6D3FCC", bgfarbe:"#EDE9FE",
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
  { id:"auraoperation",  name:"Aura-Chirurgie",      icon:"✂️", kategorie:"Aura-Arbeit",
    beschreibung:"Präzise energetische Eingriffe im Aurakörper: Kord-Schnitte, Implantat-Entfernung, Energieleck-Versiegelung, Schutzmatrix-Aufbau.",
    anwendung:"Energielecks, Fremdeinflüsse, toxische Beziehungen, chronische Energielosigkeit",
    ablauf:["Aura-Scan","Befund festhalten","Gezielte Intervention","Wunden heilen","Schutz aufbauen"],
    stufe:4
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
  { nr:2, name:"Grundlagen",   farbe:"#0D9488", icon:"📚", beschreibung:"Systematisches Wissen, erste Technikanwendung, Klienten-Grundarbeit." },
  { nr:3, name:"Vertiefung",   farbe:"#0284C7", icon:"🎯", beschreibung:"Komplexe Fälle, Kombination von Methoden, eigene Wahrnehmungsschärfung." },
  { nr:4, name:"Meisterschaft",farbe:"#7C3AED", icon:"⚡", beschreibung:"Aura-Chirurgie, Quantenarbeit, Fern-Anwendungen, Ausbildungsleitung." },
  { nr:5, name:"Zertifizierung",farbe:"#D97706",icon:"🏆", beschreibung:"Geprüfte Kompetenz, Human Resonanz Akademie Zertifikat, Lehrerlizenz." },
];

// ════════════════════════════════════════════════════════════════
//  UI HILFSKOMPONENTEN
// ════════════════════════════════════════════════════════════════
const OCard = ({children, style={}}) => (
  <div style={{background:"#FFFFFF",borderRadius:"18px",padding:"18px",border:`1.5px solid ${OT.border}`,boxShadow:`0 2px 14px ${OT.shadow}`,...style}}>{children}</div>
);
const OBtn = ({children,onClick,variant="primary",disabled,style={}}) => {
  const variants = {
    primary:{background:`linear-gradient(135deg,${OT.teal},${OT.tealD})`,color:"white",border:"none"},
    soft:{background:OT.bgSoft,color:OT.textMid,border:`1.5px solid ${OT.border}`},
    violet:{background:`linear-gradient(135deg,${OT.violet},${OT.violetD})`,color:"white",border:"none"},
    ghost:{background:"transparent",color:OT.teal,border:`1.5px solid ${OT.teal}`},
  };
  return <button onClick={onClick} disabled={disabled} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"10px 18px",borderRadius:"12px",cursor:disabled?"wait":"pointer",opacity:disabled?0.6:1,transition:"all 0.15s",...variants[variant],...style}}>{children}</button>;
};
const OTag = ({label, aktiv, onClick, farbe="#0D9488", bgFarbe="#CCFBF1"}) => (
  <button onClick={onClick} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"5px 12px",borderRadius:"20px",border:`1.5px solid ${aktiv?farbe:OT.border}`,background:aktiv?bgFarbe:"white",color:aktiv?farbe:OT.textSoft,cursor:"pointer",transition:"all 0.12s"}}>{label}</button>
);
const OLabel = ({children, color}) => (
  <div style={{fontFamily:"Raleway",fontSize:"10px",letterSpacing:"2px",fontWeight:800,color:color||OT.textSoft,textTransform:"uppercase",marginBottom:"10px"}}>{children}</div>
);

// ════════════════════════════════════════════════════════════════
//  HELLSINN-SCANNER · Kern-Feature
export { OT, CHAKRA_SYSTEM, ORGAN_MAP, AURA_SCHICHTEN, AURA_CHIRURGIE_TECHNIKEN, HELLSINN_TAGS, HEILMETHODEN_KATALOG, LERNPFAD_STUFEN, OCard, OBtn, OTag, OLabel };
