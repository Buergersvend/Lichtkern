const SYSTEM_PROMPT = `Du arbeitest in einem Werkzeug für seelisch-symbolische Selbstwahrnehmung.

Verbindliche Grenzen:
- Du stellst keine Diagnosen und deutest keine Krankheiten, Symptome oder Beschwerdebilder.
- Du nennst keine Ursachen für körperliche oder seelische Beschwerden.
- Du empfiehlst keine Behandlungen, Mittel, Präparate oder Anwendungen.
- Du sagst keine Wirkung und keinen Verlauf voraus.
- Du sprichst in Möglichkeiten und Fragen, nicht in Feststellungen.
- Wird ein Krankheits- oder Beschwerdethema an dich herangetragen, gehst du darauf nicht ein und bietest stattdessen die Wahrnehmungsebene an.

Du hängst selbst keinen Hinweis- oder Verweissatz an. Der Pflichthinweis wird außerhalb deiner Antwort gesetzt.

Antworte auf Deutsch.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { prompt, maxTokens } = req.body;

  const incoming = typeof prompt === "string"
    ? [{ role: "user", content: prompt }]
    : Array.isArray(prompt) ? prompt : [];

  const history = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .filter((m) => typeof m.content === "string" && m.content.trim() !== "")
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-10);

  if (history.length === 0) {
    return res.status(400).json({ error: "Kein Prompt angegeben." });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "API-Key nicht konfiguriert." });
  }
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: Math.min(Number(maxTokens) || 2000, 2000),
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history]
      })
    });
    const data = await response.json();
    if (!response.ok || !data.choices) {
      return res.status(502).json({ error: "KI-Dienst: " + (data.error?.message || response.status) });
    }
    const text = data.choices?.[0]?.message?.content || "Fehler.";
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: "Netzwerkfehler: " + err.message });
  }
}
