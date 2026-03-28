export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, mode } = req.body;
  if (!message) return res.status(400).json({ error: "Kein Message angegeben." });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: "API-Key fehlt." });

  const systemPrompt = mode === "dev"
  ? `Du bist Resonanz, der intelligente Entwicklungsassistent von Lichtkern. Lichtkern ist eine React/Vite Praxisverwaltungs-App für Energiearbeiter und Therapeuten. Stack: React, Vite, Firebase, Vercel, Groq AI. Dateistruktur: screens/ (Dashboard,Clients,Calendar,Session,History,Analytics,Billing,Settings,Knowledge,GenTree,PDFModal), components/ (UI.jsx,Decorations.jsx,HumanDesign.jsx), config/ (theme.js,constants.js,helpers.js,firebase.js,groq.js), oracle/ (OracleAgent.jsx), api/ (ki.js,oracle.js). Offene Bugs: Settings.jsx Absturz, PDF Markierungen funktionieren nicht. Roadmap: Dashboard modernisieren, Akademie, B2B, Billing/Stripe. Geschäftsmodell: App-Abo (Free/Starter €14/Pro €29/Studio €49), Akademie pro Zertifikat, B2B später. Entwickler: Sven Donath, Laie, GitHub Web Editor, max 2 Dateien pro Session, Deutsch. Antworte präzise und direkt auf Deutsch.`
  : `Du bist Resonanz, der Praxis-Assistent von Lichtkern. Du analysierst anonymisierte Praxisdaten und gibst dem Therapeuten hilfreiche Einblicke. Kein Personenbezug. Antworte warmherzig auf Deutsch.`;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Keine Antwort.";
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: "Oracle Fehler: " + err.message });
  }
}
