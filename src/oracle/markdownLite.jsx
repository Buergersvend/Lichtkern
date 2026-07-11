import React from "react";

// Leichtgewichtiges Markdown-Rendering für KI-Antworten:
// **fett**, Aufzählungen (* oder -), Absätze. Bewusst ohne Dependency.
function fett(text, keyPrefix) {
  const teile = text.split(/\*\*(.+?)\*\*/g);
  return teile.map((t, i) =>
    i % 2 === 1 ? <strong key={`${keyPrefix}-b${i}`}>{t}</strong> : t
  );
}

export function renderMarkdownLite(text) {
  if (!text) return null;
  const bloecke = String(text).split(/\n\s*\n/);
  return bloecke.map((block, bi) => {
    const zeilen = block.split("\n").filter(z => z.trim() !== "");
    const istListe = zeilen.length > 0 && zeilen.every(z => /^\s*[*-]\s+/.test(z));
    if (istListe) {
      return (
        <ul key={`md-ul${bi}`} style={{ margin: "6px 0", paddingLeft: "18px" }}>
          {zeilen.map((z, zi) => (
            <li key={`md-li${bi}-${zi}`} style={{ marginBottom: "3px" }}>
              {fett(z.replace(/^\s*[*-]\s+/, ""), `l${bi}-${zi}`)}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p key={`md-p${bi}`} style={{ margin: "6px 0" }}>
        {zeilen.map((z, zi) => (
          <React.Fragment key={`md-f${bi}-${zi}`}>
            {zi > 0 && <br />}
            {fett(z, `p${bi}-${zi}`)}
          </React.Fragment>
        ))}
      </p>
    );
  });
}
