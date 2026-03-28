export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, mode } = req.body;
  if (!message) return res.status(400).json({ error: "Kein Message angegeben." });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: "API-Key fehlt." });

  const systemPrompt = mode === "dev"
    ? `Du bist Oracle, der intelligente Entwicklungsassistent von Lichtkern. Lichtkern ist eine React/Vite Praxisverwaltungs-App für Energiearbeiter. Stack: React, Firebase, Vercel, Groq AI. Du kennst die App, hilfst bei Bugs, Roadmap und Entwicklungsentscheidungen. Antworte präzise und direkt auf Deutsch.`
    : `Du bist Oracle, der Praxis-Assistent von Lichtkern. Du analysierst anonymisierte Praxisdaten und gibst dem Therapeuten hilfreiche Einblicke. Keine Klientennamen, kein Personenbezug. Antworte warmherzig und professionell auf Deutsch.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "Keine Antwort.";
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: "Oracle Netzwerkfehler: " + err.message });
  }
}
