import React, { useState } from "react";
import { T } from "../config/theme.js";
import { Btn, TI, SL } from "../components/UI.jsx";

export default function OracleAgent({ onClose }) {
  const [mode, setMode] = useState("dev");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, mode }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "oracle", text: data.text || data.error }]);
    } catch {
      setMessages(prev => [...prev, { role: "oracle", text: "Netzwerkfehler." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.bgCard, borderRadius: "24px", width: "95%", maxWidth: "600px", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "Cinzel", fontSize: "20px", color: T.text, fontWeight: 700 }}>✦ Resonanz</div>
            <div style={{ fontFamily: "Raleway", fontSize: "11px", color: T.textSoft, marginTop: "2px" }}>Dein intelligenter Praxis-Assistent</div>
          </div>
          <button onClick={onClose} style={{ background: T.bgSoft, border: `1.5px solid ${T.border}`, borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: T.textMid }}>✕</button>
        </div>

        {/* Modus */}
        <div style={{ display: "flex", gap: "8px", padding: "12px 24px" }}>
          {[["dev", "⚙ DEV"], ["analyse", "📊 Analyse"]].map(([v, l]) => (
            <button key={v} onClick={() => setMode(v)} style={{ padding: "7px 16px", borderRadius: "10px", border: `1.5px solid ${mode === v ? T.teal : T.border}`, background: mode === v ? T.teal : "white", fontFamily: "Raleway", fontSize: "12px", fontWeight: 700, color: mode === v ? "white" : T.textMid, cursor: "pointer" }}>{l}</button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 12px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: T.textSoft, fontFamily: "Raleway", fontSize: "13px" }}>
              {mode === "dev" ? "Frag mich zu Bugs, Roadmap oder App-Entwicklung." : "Frag mich zu deiner Praxis-Auslastung oder Sitzungsmustern."}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%", background: m.role === "user" ? T.teal : T.bgSoft, color: m.role === "user" ? "white" : T.text, borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", fontFamily: "Raleway", fontSize: "13px", lineHeight: "1.6" }}>
              {m.text}
            </div>
          ))}
          {loading && <div style={{ alignSelf: "flex-start", fontFamily: "Raleway", fontSize: "13px", color: T.textSoft }}>Resonanz denkt…</div>}
        </div>

        {/* Input */}
        <div style={{ padding: "12px 24px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <TI value={input} onChange={setInput} placeholder="Frage an Resonanz…" />
          </div>
          <Btn onClick={send} disabled={loading} style={{ padding: "10px 20px" }}>Senden</Btn>
        </div>
      </div>
    </div>
  );
}
