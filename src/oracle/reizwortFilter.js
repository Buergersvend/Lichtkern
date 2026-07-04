export const REIZWOERTER = [
  "heil","therapie","diagnos","behandl","kurier","lindert","wirkt gegen","krankheit","symptom",
  "DNA-Activation","DNA-Aktivierung","Aktivierung der DNA","aktiviere deine DNA","DNA aktivieren",
  "gesünderes Leben","gesünder","für die Gesundheit","deine Gesundheit","Heilung"
];

export const REIZWORT_AUSNAHMEN = ["heilpraktiker","heilungsversprechen"];

export function enthältReizwort(text) {
  let lower = text.toLowerCase();
  REIZWORT_AUSNAHMEN.forEach(a => { lower = lower.split(a).join(""); });
  return REIZWOERTER.some(w => lower.includes(w.toLowerCase()));
}

export const REIZWORT_HINWEIS = "Dieser Impuls konnte nicht im passenden Rahmen erzeugt werden. Bitte versuche es noch einmal.";
