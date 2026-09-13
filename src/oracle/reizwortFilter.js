// reizwortFilter.js — zentrales Ausgabe- und Eingabefilter-Modul
// Umgebaut 2026-09-11. Vorher: Substring "heil" sperrte heilsam/unheilvoll/heilfroh,
// Krankheitsnamen liefen ungefiltert durch (Raster 1c).

// Umlaute vereinheitlichen, damit "Migräne" und "Migraene" gleich behandelt werden
const normalisiere = (s) =>
  s.toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");

// ---------------------------------------------------------------- AUSGABE
// Greift NACH dem Modell. Ein Treffer ersetzt die Antwort.
export const REIZWOERTER = [
  // Heilbezug — praezise Wortformen statt Substring "heil"
  "heilen", "heilt", "heilung", "heilend", "geheilt", "heiler",
  "heilmethode", "heilkraft", "heilwirkung", "heilsversprechen",
  // Behandlungs- und Diagnosebezug
  "therapie", "diagnos", "behandl", "kurier", "lindert", "wirkt gegen",
  "krankheit", "symptom",
  // Arzneimittelbezug
  "medikament", "arzneimittel", "dosierung", "nebenwirkung", "rezeptfrei",
  // Gesundheitsversprechen
  // Gesundheitsbezug als Satzmuster, nicht als Wortwurzel.
  // "ein gesunder Umgang" ist eine Beschreibung, "gesuender fuer dich" ein Versprechen.
  // Beide Schreibweisen, weil die Normalisierung nur ue -> u aufloest, nicht umgekehrt.
  "ist gesunder", "ist gesuender", "gesunder als", "gesuender als",
  "gesunder fur", "gesuender fur", "gesunder leben", "gesuender leben",
  "gesunderes leben", "gesuenderes leben", "gesunder werden", "gesuender werden",
  "macht gesund", "wird gesund", "wieder gesund",
  "fur die gesundheit", "fuer die gesundheit", "deine gesundheit",
  // DNA-Claims
  "dna-activation", "dna-aktivierung", "aktivierung der dna",
  "aktiviere deine dna", "dna aktivieren"
];

// Zeichenfolgen, die vor der Pruefung entfernt werden.
// "heilpraktiker" steht im Pflicht-Verweissatz und darf nicht sperren.
export const REIZWORT_AUSNAHMEN = ["heilpraktiker", "heilungsversprechen"];

export function enthältReizwort(text) {
  if (!text) return false;
  let n = normalisiere(text);
  REIZWORT_AUSNAHMEN.forEach((a) => { n = n.split(normalisiere(a)).join(""); });
  return REIZWOERTER.some((w) => n.includes(normalisiere(w)));
}

// ---------------------------------------------------------------- EINGABE
// Greift VOR dem Modellaufruf. Raster 1c: Bezug auf ein benanntes Krankheitsbild.
// Erste Linie, nie vollstaendig — der Ausgabefilter bleibt daneben bestehen.
export const KRANKHEITSBEGRIFFE = [
  "entzundung", "entzuendung", "infektion", "diabetes", "krebs", "tumor", "asthma", "migrane", "migraene",
  "arthrose", "rheuma", "bluthochdruck", "depression", "burnout", "allergie",
  "neurodermitis", "schilddruse", "schilddruese", "bandscheibe", "tinnitus", "otitis", "gastritis",
  "reizdarm", "borreliose", "long covid", "adhs", "demenz", "parkinson",
  "epilepsie", "osteoporose", "endometriose", "fibromyalgie", "colitis", "morbus"
];

export function enthältKrankheitsbegriff(text) {
  if (!text) return false;
  const n = normalisiere(text);
  return KRANKHEITSBEGRIFFE.some((k) => n.includes(normalisiere(k)));
}

// ---------------------------------------------------------------- HINWEISE
// Getrennt nach Ursache (KVP-89). Der alte Text legte einen technischen Fehler
// nahe und lud dazu ein, die Frage umformuliert zu wiederholen.
export const REIZWORT_HINWEIS =
  "Dazu gebe ich keine Auskunft. Bei körperlichen oder gesundheitlichen " +
  "Beschwerden gehört die Abklärung zu Arzt, Heilpraktiker oder Therapeut.";

// Umleitung statt Abweisung. Der Nutzer wird auf die Ebene gefuehrt,
// die offen ist, statt vor einer Wand zu stehen. Der Pflichtsatz steht am Ende.
export const KRANKHEITS_HINWEIS =
  "Zu Krankheiten, Diagnosen und Beschwerdebildern äußere ich mich nicht.\n\n" +
  "Beschreibe stattdessen, was du wahrnimmst — etwa Enge, Druck, Wärme, " +
  "ein Nicht-hören-wollen, das Gefühl zu überhören. Die Wahrnehmungs-Tags oben " +
  "helfen beim Einstieg. Damit arbeite ich gern weiter.\n\n" +
  "Bei körperlichen oder gesundheitlichen Beschwerden gehört die Abklärung " +
  "zu Arzt, Heilpraktiker oder Therapeut.";

export const TECHNIK_HINWEIS =
  "Der Impuls konnte technisch nicht erzeugt werden. Bitte versuche es noch einmal.";
