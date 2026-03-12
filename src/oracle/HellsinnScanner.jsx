import React, { useState, useEffect, useCallback, useRef } from "react";
import { OT } from "./OracleUI.jsx";

function HellsinnScanner({ groqFetch }){
  const [eingabe, setEingabe]       = useState("");
  const [tags, setTags]             = useState([]);
  const [aktivKat, setAktivKat]    = useState("wahrnehmung");
  const [lokalInfo, setLokalInfo]  = useState([]);
  const [kiAntwort, setKiAntwort]  = useState("");
  const [kiLaed, setKiLaed]        = useState(false);
  const [kiGestellt, setKiGestellt]= useState(false);
  const debounceRef                 = useRef();

  // Lokale Sofort-Analyse bei Änderung der Tags/Eingabe
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => analysiereLokal(), 300);
  }, [eingabe, tags]);

  const analysiereLokal = () => {
    const alleWorte = [...tags, ...eingabe.toLowerCase().split(/[\s,;]+/)].filter(Boolean);
    const treffer = [];

    // Organ-Treffer
    Object.entries(ORGAN_MAP).forEach(([organ, daten]) => {
      const matchScore = daten.keywords.filter(k => alleWorte.some(w => w.includes(k) || k.includes(w))).length;
      if (matchScore > 0) treffer.push({ typ:"organ", organ, daten, score: matchScore });
    });

    // Chakra-Treffer
    CHAKRA_SYSTEM.forEach(chakra => {
      const matchScore = [...chakra.themen, ...chakra.emotion_block, ...chakra.organe]
        .filter(t => alleWorte.some(w => t.toLowerCase().includes(w) || w.includes(t.toLowerCase().split(" ")[0]))).length;
      if (matchScore > 0) treffer.push({ typ:"chakra", chakra, score: matchScore });
    });

    // Aura-Treffer
    const auraWorte = ["aura","feld","schicht","korde","leck","schutz","implantat","splitter","fremdenergie"];
    if (alleWorte.some(w => auraWorte.some(a => a.includes(w) || w.includes(a)))) {
      treffer.push({ typ:"aura_hinweis", score:1 });
    }

    treffer.sort((a,b) => b.score - a.score);
    setLokalInfo(treffer.slice(0, 4));
  };

  const tagToggle = (tag) => setTags(t => t.includes(tag) ? t.filter(x=>x!==tag) : [...t, tag]);

  const kiAnalyse = async () => {
    if (!groqFetch) { setKiAntwort("⚠️ Kein API-Zugang. Verbinde die App mit /api/ki."); return; }
    setKiLaed(true); setKiGestellt(true); setKiAntwort("");
    const kontext = `Stichworte: ${eingabe}\nWahrnehmungs-Tags: ${tags.join(", ")}`;
    const organTreffer = lokalInfo.filter(i=>i.typ==="organ").map(i=>`Organ: ${i.organ} (${i.daten.symbolik.join(", ")})`).join("\n");
    const chakraTreffer = lokalInfo.filter(i=>i.typ==="chakra").map(i=>`Chakra: ${i.chakra.name} - Themen: ${i.chakra.themen.slice(0,3).join(", ")}`).join("\n");
    
    const prompt = `Du bist ein erfahrener energetischer Heiler und feinstofflicher Berater im Lichtkern-System. Du erhältst die Wahrnehmungen eines Praktizierers an einem Klienten und gibst sofort strukturierte Handlungsempfehlungen. Antworte auf Deutsch, klar und professionell.

WAHRNEHMUNGEN:
${kontext}

AUTOMATISCH ERKANNTE BEZÜGE:
${organTreffer}
${chakraTreffer}

Gib eine strukturierte Analyse in GENAU diesem Format (nutze diese Überschriften):

🫀 ORGANSPRACHE & KÖRPERSYMBOLIK
[Was sagen diese Körperregionen/Symptome auf der energetischen Ebene? Welche Themen, Gefühle, Lebensbereiche sind gemeint?]

⚡ CHAKRA & ENERGIEFELD
[Welche Chakren sind betroffen? Was zeigt das Energiefeld? Offen/geschlossen/überaktiv?]

🧬 MÖGLICHE AHNENMUSTER / GENERATIONENTHEMEN
[Welche generationellen Themen könnten dahinterstecken?]

💚 HEILUNGSEMPFEHLUNGEN (Priorität: Energetisch)
1. [Erste Maßnahme, z.B. Chakraheilung / Blutreinigung / Herzheilung]
2. [Zweite Maßnahme]
3. [Dritte Maßnahme]
[Weitere wenn relevant]

🎯 FRAGEN AN DEN KLIENTEN
[2-3 gezielte Fragen die mehr Klarheit bringen]

Sei präzise, praxisnah und einfühlsam. Keine Heilversprechen, keine Diagnosen.`;

    try {
      const antwort = await groqFetch(prompt);
      setKiAntwort(antwort);
    } catch (e) {
      setKiAntwort("❌ Fehler bei der KI-Analyse. Bitte Verbindung prüfen.");
    }
    setKiLaed(false);
  };

  const reset = () => { setEingabe(""); setTags([]); setLokalInfo([]); setKiAntwort(""); setKiGestellt(false); };

  const alleTagsKat = HELLSINN_TAGS[aktivKat];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      {/* Eingabe */}
      <OCard>
        <OLabel>✦ Hellsinn-Eingabe · Was nimmst du wahr?</OLabel>
        <textarea
          value={eingabe}
          onChange={e=>setEingabe(e.target.value)}
          placeholder="Notiere frei, was du wahrnimmst... z.B. 'Wärme im Herzbereich, Enge links, schwerer Energiepanzer, Bild: graue Mauer, Korde zur Mutter spürbar...'"
          style={{width:"100%",minHeight:"90px",padding:"12px 14px",borderRadius:"12px",border:`1.5px solid ${OT.border}`,fontFamily:"Raleway",fontSize:"13px",color:OT.text,resize:"vertical",outline:"none",background:OT.bgSofter,lineHeight:"1.7",boxSizing:"border-box",fontWeight:500}}
        />
        <div style={{display:"flex",gap:"8px",marginTop:"10px",flexWrap:"wrap"}}>
          <OBtn onClick={kiAnalyse} disabled={kiLaed||(!eingabe.trim()&&tags.length===0)}>
            {kiLaed?"⏳ KI analysiert...":"✦ KI-Analyse starten"}
          </OBtn>
          {(eingabe||tags.length>0)&&<OBtn variant="ghost" onClick={reset}>← Neu</OBtn>}
        </div>
      </OCard>

      {/* Tag-Auswahl nach Kategorie */}
      <OCard>
        <OLabel>Wahrnehmungs-Tags schnell hinzufügen</OLabel>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"10px"}}>
          {Object.entries(HELLSINN_TAGS).map(([key,kat])=>(
            <button key={key} onClick={()=>setAktivKat(key)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"6px 12px",borderRadius:"20px",border:`1.5px solid ${aktivKat===key?kat.farbe:OT.border}`,background:aktivKat===key?kat.bgfarbe:"white",color:aktivKat===key?kat.farbe:OT.textSoft,cursor:"pointer"}}>
              {kat.label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
          {alleTagsKat.items.map(item=>(
            <OTag key={item} label={item} aktiv={tags.includes(item)} onClick={()=>tagToggle(item)} farbe={alleTagsKat.farbe} bgFarbe={alleTagsKat.bgfarbe}/>
          ))}
        </div>
        {tags.length>0&&(
          <div style={{marginTop:"10px",padding:"10px 14px",background:OT.tealL,borderRadius:"12px",border:`1px solid ${OT.borderMid}`}}>
            <span style={{fontFamily:"Raleway",fontSize:"11px",color:OT.tealD,fontWeight:700}}>Aktive Tags: </span>
            <span style={{fontFamily:"Raleway",fontSize:"11px",color:OT.tealD,fontWeight:500}}>{tags.join(" · ")}</span>
          </div>
        )}
      </OCard>

      {/* Lokale Sofort-Bezüge */}
      {lokalInfo.length > 0 && (
        <OCard style={{background:`linear-gradient(135deg,${OT.bgSoft},#FAFFFE)`,border:`1.5px solid ${OT.borderMid}`}}>
          <OLabel color={OT.tealD}>⚡ Sofortige Resonanz-Bezüge</OLabel>
          {lokalInfo.map((info, idx) => {
            if (info.typ === "organ") {
              const { organ, daten } = info;
              return (
                <div key={idx} style={{marginBottom:"12px",padding:"12px",background:"white",borderRadius:"12px",border:`1px solid ${OT.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                    <span style={{fontSize:"20px"}}>{daten.emoji}</span>
                    <span style={{fontFamily:"Cinzel",fontSize:"13px",color:OT.text,fontWeight:700,textTransform:"capitalize"}}>{organ}</span>
                    <span style={{marginLeft:"auto",fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"8px",background:OT.tealL,color:OT.tealD}}>Organsprache</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"6px"}}>
                    {daten.symbolik.map(s=><span key={s} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"3px 9px",borderRadius:"10px",background:"#FEF3C7",color:OT.gold}}>{s}</span>)}
                  </div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500}}>
                    Chakra-Bezug: <b>{CHAKRA_SYSTEM.find(c=>c.id===daten.chakra)?.name||daten.chakra}</b>
                    {daten.seiten && <span style={{marginLeft:"8px"}}>· L: {daten.seiten.links} · R: {daten.seiten.rechts}</span>}
                  </div>
                </div>
              );
            }
            if (info.typ === "chakra") {
              const { chakra } = info;
              return (
                <div key={idx} style={{marginBottom:"12px",padding:"12px",background:"white",borderRadius:"12px",border:`1px solid ${OT.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                    <span style={{fontSize:"20px",color:chakra.hex}}>●</span>
                    <span style={{fontFamily:"Cinzel",fontSize:"13px",color:OT.text,fontWeight:700}}>{chakra.name}</span>
                    <span style={{marginLeft:"auto",fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"8px",background:"#EDE9FE",color:OT.violet}}>Chakra</span>
                  </div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500,marginBottom:"6px"}}>
                    Mögliche Blockaden: {chakra.emotion_block.slice(0,3).join(" · ")}
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                    {chakra.heilung.slice(0,3).map(h=><span key={h} style={{fontFamily:"Raleway",fontSize:"10px",padding:"3px 9px",borderRadius:"10px",background:OT.tealL,color:OT.tealD,fontWeight:700}}>{h}</span>)}
                  </div>
                </div>
              );
            }
            if (info.typ === "aura_hinweis") {
              return (
                <div key={idx} style={{padding:"12px",background:"white",borderRadius:"12px",border:`1px solid ${OT.border}`}}>
                  <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.violet,fontWeight:700}}>🔮 Aura-Feld-Arbeit indiziert</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500,marginTop:"4px"}}>
                    Wechsle zur "Aura & Chirurgie" Karte für detaillierte Feinstoffarbeit
                  </div>
                </div>
              );
            }
            return null;
          })}
        </OCard>
      )}

      {/* KI-Antwort */}
      {kiGestellt && (
        <OCard style={{background:`linear-gradient(135deg,${OT.violetL} 0%,${OT.tealL} 100%)`,border:`1.5px solid ${OT.borderMid}`}}>
          <OLabel color={OT.violetD}>✦ KI-Analyse · Stiller Berater</OLabel>
          {kiLaed ? (
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{fontSize:"30px",marginBottom:"12px",animation:"pulse 1.5s infinite"}}>✦</div>
              <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.textMid,fontWeight:600}}>Energetische Analyse läuft...</div>
            </div>
          ) : (
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.9",whiteSpace:"pre-wrap",fontWeight:500}}>{kiAntwort}</div>
          )}
        </OCard>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ORGANSPRACHE-KARTE
// ════════════════════════════════════════════════════════════════
function OrganspracheKarte({ groqFetch }) {

export { HellsinnScanner };
