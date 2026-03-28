export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, mode } = req.body;
  if (!message) return res.status(400).json({ error: "Kein Message angegeben." });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: "API-Key fehlt." });

  const systemPrompt = mode === "dev"
    ? `Du bist Oracle, der intelligente Entwicklungsassistent von Lichtkern. Lichtkern ist eine React/Vite Praxisverwaltungs-App für Energiearbeiter und Therapeuten. Stack: React, Firebase, Vercel, Groq AI. Du kennst die App, hilfst bei Bugs, Roadmap und Entwicklungsentscheidungen. Antworte präzise und direkt auf Deutsch.`
    : `Du bist Oracle, der Praxis-Assistent von Lichtkern. Du analysierst anonymisierte Praxisdaten und gibst dem Therapeuten hilfreiche Einblicke. Keine Klientennamen, kein Personenbezug. Antworte warmherzig und professionell auf Deutsch.`;

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
