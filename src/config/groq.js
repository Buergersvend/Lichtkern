export async function groqFetch(prompt, maxTokens) {
  const res = await fetch("/api/ki.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxTokens }),
  });
  if (!res.ok) throw new Error("KI Netzwerkfehler");
  const data = await res.json();
  return data.text || data.result || "";
}
