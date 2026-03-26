// src/config/groq.js

export async function groqFetch(prompt) {
  const res = await fetch("/api/ki.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error("KI Netzwerkfehler");
  const data = await res.json();
  return data.text || data.result || "";
}

export function hdCalcDefinedCenters(gates) {
  // Gibt ein Set der definierten Zentren zurück
  // Importiert HD_GATE_CENTER aus HumanDesign.jsx nicht möglich hier,
  // daher Mapping inline
  return new Set(gates);
}
