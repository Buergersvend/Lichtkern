import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flower } from "../components/Decorations";
import { T } from "../config/theme.js";
import { uid } from "../config/helpers";
import { Card, Btn, TI, Select, SL, Pill } from "../components/UI.jsx";

const ENERGIE_OPTIONS = ["Operationen","Unfälle","Traumata","Chronische Erkrankungen","Burnout","Schwere Verluste"];
const THERAPIE_OPTIONS = ["Psychotherapie","Physiotherapie","Homöopathie","Osteopathie","Andere Energetik","Coaching","Keine bisherige Therapie"];
const LEBENSBEREICH_OPTIONS = ["Körper & Gesundheit","Beziehung & Familie","Beruf & Finanzen","Spiritualität","Persönlichkeit","Sinnfrage & Lebensweg"];
function OnboardingScreen({ onSave, onCancel }) {
  const ONBOARDING_STEPS = ["Person","Beschwerden","Vorgeschichte","Lebensbereiche","Ziele","Ahnen","Abschluss"];
  const [step, setStep] = useState(0);
  const [clientMode, setClientMode] = useState(null); // null | "self" | "together"
  const [form, setForm] = useState({
    // Person
    name:"", birthDate:"", contact:"", address:"",
    // Beschwerden
    complaints:"", symptoms:[], symptomFreeText:"",
    // Vorgeschichte
    previousTherapies:[], previousTherapiesFreeText:"", energeticHistory:[], energeticFreeText:"",
    // Lebensbereiche
    lifeareas:{}, lifeareaFreeText:"",
    // Ziele
    goals:"", expectations:"", sessionType:"first",
    // Ahnen
    ancestorThemes:"", familyPatterns:"", ancestorNotes:"",
    // Abschluss
    ownQuestions:"", consent:false,
    tags:"",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [mailEmail,setMailEmail] = useState("");
  const up = u => setForm(f=>({...f,...u}));

  // Mode selection
  if(!clientMode) return (
    <div style={{padding:"0 16px 96px"}}>
      <button onClick={onCancel} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"16px"}}>← Zurück</button>
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"26px 24px",marginBottom:"24px",background:T.bgSoft,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={200} opacity={0.09}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:"0 0 6px",fontWeight:700}}>Erstanamnese</h2>
          <p style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,margin:0,fontWeight:600}}>Vollständige Erstbefragung · 7 Bereiche</p>
        </div>
      </div>
      <SL>Wer füllt den Fragebogen aus?</SL>
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        {[
          {mode:"together",icon:"🤝",title:"Gemeinsam ausfüllen",sub:"Therapeut und Klient sitzen zusammen — du führst durch den Fragebogen"},
          {mode:"mail_text",icon:"✉️",title:"Per Mail versenden — Textformat",sub:"Öffnet dein Mailprogramm mit allen Fragen als lesbaren Text — Klient antwortet per Mail"},
          {mode:"mail_pdf",icon:"📄",title:"Per Mail versenden — PDF",sub:"Generiert einen druckbaren Leer-Fragebogen als PDF zum Herunterladen & Versenden"},
        ].map(opt=>(
          <div key={opt.mode} onClick={()=>setClientMode(opt.mode)} style={{background:T.bgCard,borderRadius:"18px",padding:"18px 20px",cursor:"pointer",border:`1.5px solid ${T.border}`,boxShadow:`0 3px 14px ${T.shadow}`,display:"flex",gap:"16px",alignItems:"center"}}>
            <span style={{fontSize:"32px",flexShrink:0}}>{opt.icon}</span>
            <div>
              <div style={{fontFamily:"Raleway",fontSize:"14px",fontWeight:700,color:T.text}}>{opt.title}</div>
              <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textSoft,fontWeight:500,marginTop:"4px"}}>{opt.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Mail modes: send questionnaire via email or PDF
  
  if(clientMode==="mail_text"||clientMode==="mail_pdf"){
    const sendMailText = () => {
      const subject = encodeURIComponent("Erstanamnese · Lichtkern");
      const body = encodeURIComponent(`Liebe/r Klient/in,

bitte fülle diesen Fragebogen vor unserer ersten Sitzung aus und sende ihn ausgefüllt zurück.

─── PERSÖNLICHE DATEN ───────────────────────
Name:
Geburtsdatum:
Kontakt (Email / Telefon):
Adresse:

─── AKTUELLE BESCHWERDEN ───────────────────
Was beschäftigt dich am meisten?


Symptome (bitte ankreuzen oder ergänzen):
□ Schmerzen  □ Schlafstörungen  □ Erschöpfung  □ Angstzustände
□ Depressionen  □ Verdauungsprobleme  □ Hautprobleme  □ Kopfschmerzen
□ Rückenschmerzen  □ Herzprobleme  □ Hormonstörungen  □ Immunschwäche
□ Weitere:

─── BISHERIGE THERAPIEN ────────────────────
□ Psychotherapie  □ Physiotherapie  □ Homöopathie  □ Osteopathie
□ Andere Energetik  □ Coaching  □ Keine bisherige Therapie
□ Weitere:

─── ENERGETISCHE VORGESCHICHTE ─────────────
□ Operationen  □ Unfälle  □ Traumata  □ Chronische Erkrankungen
□ Burnout  □ Schwere Verluste
□ Weitere:

─── LEBENSBEREICHE (Belastung 0–10) ────────
Körper & Gesundheit: /10
Beziehung & Familie: /10
Beruf & Finanzen: /10
Spiritualität: /10
Persönlichkeit: /10
Sinnfrage & Lebensweg: /10

─── ZIELE & ERWARTUNGEN ────────────────────
Was möchtest du in der Arbeit mit mir erreichen?


Was erwartest du von der ersten Sitzung?


─── AHNEN & FAMILIENMUSTER ─────────────────
Bekannte Ahnenthemen in deiner Familie:


Wiederkehrende Familienmuster:


─── EIGENE FRAGEN ──────────────────────────
Was möchtest du mich fragen?


───────────────────────────────────────────
✦ Lichtkern · powered by Human Resonanz
Deine Angaben werden vertraulich behandelt.`);
      window.location.href = `mailto:${mailEmail}?subject=${subject}&body=${body}`;
    };

    const sendMailPDF = () => {
      const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"/>
<title>Erstanamnese · Lichtkern</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Raleway,sans-serif;color:#0F3030;background:#F0FAFA;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{max-width:700px;margin:0 auto;padding:40px;}.no-print{text-align:right;margin-bottom:20px;}.section{background:white;border-radius:14px;padding:18px 20px;margin-bottom:14px;border:1.5px solid #B2E0DC;}.line{border-bottom:1px solid #B2E0DC;height:28px;margin:8px 0;}.check{display:inline-block;width:16px;height:16px;border:1.5px solid #B2E0DC;border-radius:3px;margin-right:6px;vertical-align:middle;}h3{font-family:Cinzel,serif;font-size:12px;color:#0F3030;margin:0 0 12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}p{font-size:12px;color:#2D6B68;font-weight:600;margin-bottom:6px;}@media print{.no-print{display:none;}}</style>
</head><body><div class="page">
<div class="no-print"><button onclick="window.print()" style="font-family:Raleway;font-weight:700;font-size:13px;padding:10px 24px;background:linear-gradient(135deg,#0D9488,#0F6B63);color:white;border:none;border-radius:12px;cursor:pointer;">🖨 PDF drucken / speichern</button></div>
<div style="background:linear-gradient(140deg,#CCFBF1,#FFFFFF,#EDE9FE);border-radius:20px;padding:28px;margin-bottom:20px;border:1.5px solid #B2E0DC;">
  <p style="font-size:9px;letter-spacing:3px;color:#6AABA7;text-transform:uppercase;margin-bottom:6px;font-weight:700;">ERSTANAMNESE</p>
  <h1 style="font-family:Cinzel,serif;font-size:24px;color:#0F3030;font-weight:700;margin-bottom:4px;">Lichtkern</h1>
  <p style="font-size:11px;color:#2D6B68;">powered by Human Resonanz · Vertraulicher Fragebogen</p>
</div>
<div class="section"><h3>Persönliche Daten</h3>
  <p>Name:</p><div class="line"></div>
  <p>Geburtsdatum:</p><div class="line"></div>
  <p>Kontakt (Email / Telefon):</p><div class="line"></div>
  <p>Adresse:</p><div class="line"></div><div class="line"></div>
</div>
<div class="section"><h3>Aktuelle Beschwerden</h3>
  <p>Was beschäftigt dich am meisten?</p>
  <div class="line"></div><div class="line"></div><div class="line"></div>
  <p style="margin-top:10px;">Symptome:</p>
  ${["Schmerzen","Schlafstörungen","Erschöpfung","Angstzustände","Depressionen","Verdauungsprobleme","Hautprobleme","Kopfschmerzen","Rückenschmerzen","Herzprobleme","Hormonstörungen","Immunschwäche"].map(s=>`<span class="check"></span>${s} &nbsp;&nbsp;`).join("")}
  <p style="margin-top:8px;">Weitere:</p><div class="line"></div>
</div>
<div class="section"><h3>Bisherige Therapien</h3>
  ${["Psychotherapie","Physiotherapie","Homöopathie","Osteopathie","Andere Energetik","Coaching","Keine bisherige Therapie"].map(s=>`<span class="check"></span>${s} &nbsp;&nbsp;`).join("")}
  <p style="margin-top:8px;">Weitere:</p><div class="line"></div>
</div>
<div class="section"><h3>Energetische Vorgeschichte</h3>
  ${["Operationen","Unfälle","Traumata","Chronische Erkrankungen","Burnout","Schwere Verluste"].map(s=>`<span class="check"></span>${s} &nbsp;&nbsp;`).join("")}
  <p style="margin-top:8px;">Weitere:</p><div class="line"></div>
</div>
<div class="section"><h3>Lebensbereiche (Belastung 0–10)</h3>
  ${["Körper & Gesundheit","Beziehung & Familie","Beruf & Finanzen","Spiritualität","Persönlichkeit","Sinnfrage & Lebensweg"].map(s=>`<p>${s}: <span style="display:inline-block;width:120px;border-bottom:1px solid #B2E0DC;margin-left:8px;">&nbsp;</span>/10</p>`).join("")}
</div>
<div class="section"><h3>Ziele & Erwartungen</h3>
  <p>Was möchtest du in der Arbeit mit mir erreichen?</p>
  <div class="line"></div><div class="line"></div><div class="line"></div>
  <p>Was erwartest du von der ersten Sitzung?</p>
  <div class="line"></div><div class="line"></div>
</div>
<div class="section"><h3>Ahnen & Familienmuster</h3>
  <p>Bekannte Ahnenthemen:</p><div class="line"></div><div class="line"></div>
  <p>Wiederkehrende Muster:</p><div class="line"></div><div class="line"></div>
</div>
<div class="section"><h3>Eigene Fragen</h3>
  <div class="line"></div><div class="line"></div><div class="line"></div>
</div>
<div style="border-top:1.5px solid #B2E0DC;margin-top:20px;padding-top:14px;text-align:center;">
  <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Human Resonanz</p>
  <p style="font-size:9px;color:#6AABA7;margin-top:4px;">Vertraulich · Nicht für Dritte bestimmt</p>
</div>
</div></body></html>`;
      const w=window.open("","_blank");
      if(w){w.document.write(html);w.document.close();}
    };

    return (
      <div style={{padding:"0 16px 96px"}}>
        <button onClick={()=>setClientMode(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"16px"}}>← Zurück</button>
        <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"22px 24px",marginBottom:"20px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
          <Flower size={180} opacity={0.09}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{fontFamily:"Cinzel",fontSize:"18px",color:T.text,fontWeight:700}}>{clientMode==="mail_text"?"✉️ Fragebogen per Mail":"📄 Fragebogen als PDF"}</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,marginTop:"3px",fontWeight:500}}>{clientMode==="mail_text"?"Klient erhält alle Fragen als Mailtext":"Leerer Fragebogen als druckbares PDF"}</div>
          </div>
        </div>

        {clientMode==="mail_text"&&(<>
          <SL>E-Mail Adresse des Klienten</SL>
          <div style={{marginBottom:"16px"}}><TI type="email" value={mailEmail} onChange={setMailEmail} placeholder="klient@beispiel.de"/></div>
          <div style={{background:"#EDFAF2",borderRadius:"14px",padding:"14px",marginBottom:"18px",border:"1.5px solid #4DC98A"}}>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:"#0A3B20",lineHeight:"1.7",fontWeight:500}}>
              Dein Mailprogramm öffnet sich mit dem vollständigen Fragebogen als Text. Klient füllt aus und antwortet per Mail — du überträgst die Angaben dann in Lichtkern.
            </div>
          </div>
          <Btn onClick={sendMailText} disabled={!mailEmail.trim()} style={{width:"100%",marginBottom:"8px"}}>
            ✉️ Mail öffnen & senden
          </Btn>
        </>)}

        {clientMode==="mail_pdf"&&(<>
          <div style={{background:"#EDFAF2",borderRadius:"14px",padding:"14px",marginBottom:"18px",border:"1.5px solid #4DC98A"}}>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:"#0A3B20",lineHeight:"1.7",fontWeight:500}}>
              Ein leerer, druckbarer Fragebogen öffnet sich als PDF. Speichere ihn und sende ihn per Mail an deinen Klienten. Klient füllt ihn aus, schickt ihn zurück — du überträgst die Angaben in Lichtkern.
            </div>
          </div>
          <Btn onClick={sendMailPDF} style={{width:"100%",marginBottom:"8px"}}>
            📄 Leeren Fragebogen öffnen
          </Btn>
        </>)}

        <Btn variant="soft" onClick={()=>setClientMode(null)} style={{width:"100%"}}>Zurück zur Auswahl</Btn>
      </div>
    );
  }

  // Together mode only now
  const isSelf = false;
  const bgStyle = {};

  // Preview & save
  if(showPreview) {
    const tags = form.tags.split(",").map(t=>t.trim()).filter(Boolean);
    const clientObj = {
      id:uid(), createdAt:new Date().toISOString(),
      name:form.name, contact:form.contact, address:form.address,
      birthDate:form.birthDate, notes:"",
      tags:[...tags,...(form.symptoms||[]),...(form.energeticHistory||[])].filter(Boolean),
      anamnesis:{...form},
    };

    const exportPDF = () => {
      const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"/>
<title>Anamnese · ${form.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Raleway,sans-serif;color:#0F3030;background:#F0FAFA;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{max-width:700px;margin:0 auto;padding:40px;}.no-print{text-align:right;margin-bottom:20px;}@media print{.no-print{display:none;}}</style>
</head><body><div class="page">
<div class="no-print"><button onclick="window.print()" style="font-family:Raleway;font-weight:700;font-size:13px;padding:10px 24px;background:linear-gradient(135deg,#0D9488,#0F6B63);color:white;border:none;border-radius:12px;cursor:pointer;">🖨 PDF drucken</button></div>
<div style="background:linear-gradient(140deg,#CCFBF1,#FFFFFF,#EDE9FE);border-radius:20px;padding:30px;margin-bottom:24px;border:1.5px solid #B2E0DC;">
  <p style="font-size:9px;letter-spacing:3px;color:#6AABA7;text-transform:uppercase;margin-bottom:6px;font-weight:700;">ERSTANAMNESE</p>
  <h1 style="font-family:Cinzel,serif;font-size:26px;color:#0F3030;font-weight:700;margin-bottom:4px;">${form.name}</h1>
  <p style="font-size:12px;color:#2D6B68;font-weight:500;">*${form.birthDate||"—"} · ${form.contact||"—"} · ${new Date().toLocaleDateString("de-DE")}</p>
</div>
${[
  ["Beschwerden & Symptome", form.complaints||"—"],
  ["Vorherige Therapien", [...(form.previousTherapies||[]),form.previousTherapiesFreeText].filter(Boolean).join(", ")||"—"],
  ["Energetische Vorgeschichte", [...(form.energeticHistory||[]),form.energeticFreeText].filter(Boolean).join(", ")||"—"],
  ["Lebensbereiche", Object.entries(form.lifeareas||{}).filter(([,v])=>v).map(([k])=>k).join(", ")||"—"],
  ["Ziele & Erwartungen", [form.goals,form.expectations].filter(Boolean).join("\n")||"—"],
  ["Ahnen & Familienmuster", [form.ancestorThemes,form.familyPatterns,form.ancestorNotes].filter(Boolean).join("\n")||"—"],
  ["Eigene Fragen", form.ownQuestions||"—"],
].map(([title,content])=>`<div style="background:white;border-radius:14px;padding:18px 20px;margin-bottom:14px;border:1.5px solid #B2E0DC;">
  <h3 style="font-family:Cinzel,serif;font-size:12px;color:#0F3030;margin:0 0 8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${title}</h3>
  <p style="font-size:13px;color:#0F3030;line-height:1.8;white-space:pre-wrap;font-weight:500;">${content}</p>
</div>`).join("")}
<div style="border-top:1.5px solid #B2E0DC;margin-top:24px;padding-top:14px;text-align:center;">
  <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Human Resonanz</p>
  <p style="font-size:9px;color:#6AABA7;margin-top:4px;">Vertrauliche Erstanamnese · Nicht für Dritte bestimmt</p>
</div>
</div></body></html>`;
      const w=window.open("","_blank");
      if(w){w.document.write(html);w.document.close();}
    };

    return (
      <div style={{padding:"0 16px 96px"}}>
        <button onClick={()=>setShowPreview(false)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"14px"}}>← Bearbeiten</button>
        <div style={{background:`linear-gradient(140deg,${T.tealL},#FFFFFF,${T.violetL})`,borderRadius:"20px",padding:"20px",marginBottom:"14px",border:`1.5px solid ${T.border}`}}>
          <div style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,fontWeight:700}}>{form.name||"—"}</div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"4px",fontWeight:500}}>
            {form.birthDate&&`*${form.birthDate} · `}{form.contact||""}
          </div>
        </div>
        {[
          {t:"Beschwerden",v:form.complaints},
          {t:"Vorherige Therapien",v:[...(form.previousTherapies||[]),form.previousTherapiesFreeText].filter(Boolean).join(", ")},
          {t:"Energetische Vorgeschichte",v:[...(form.energeticHistory||[]),form.energeticFreeText].filter(Boolean).join(", ")},
          {t:"Lebensbereiche",v:Object.entries(form.lifeareas||{}).filter(([,v])=>v).map(([k])=>k).join(", ")},
          {t:"Ziele",v:form.goals},
          {t:"Ahnenthemen",v:form.ancestorThemes},
          {t:"Familienmuster",v:form.familyPatterns},
          {t:"Eigene Fragen",v:form.ownQuestions},
        ].filter(x=>x.v).map(x=>(
          <Card key={x.t} style={{marginBottom:"10px",padding:"12px 14px"}}>
            <div style={{fontFamily:"Raleway",fontSize:"9px",fontWeight:800,color:T.textSoft,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"5px"}}>{x.t}</div>
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,lineHeight:"1.7",fontWeight:500}}>{x.v}</div>
          </Card>
        ))}

        {/* Consent */}
        <div style={{background:"#EDFAF2",borderRadius:"14px",padding:"14px",marginBottom:"18px",border:"1.5px solid #4DC98A",display:"flex",gap:"12px",alignItems:"flex-start"}}>
          <button onClick={()=>up({consent:!form.consent})} style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",cursor:"pointer",flexShrink:0,marginTop:"2px",background:form.consent?T.teal:"#CBD5E1",position:"relative",transition:"background 0.2s"}}>
            <div style={{position:"absolute",top:"3px",left:form.consent?"23px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
          </button>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:"#0A3B20",fontWeight:600,lineHeight:"1.6"}}>
            Ich stimme der Speicherung meiner Daten im Lichtkern-System zu. Meine Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
          </div>
        </div>

        <div style={{display:"flex",gap:"8px",flexDirection:"column"}}>
          <Btn onClick={()=>form.consent&&onSave(clientObj)} disabled={!form.consent} style={{width:"100%",fontSize:"14px",padding:"14px"}}>
            ✅ Als Klient speichern
          </Btn>
          <button onClick={exportPDF} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>
            📄 Anamnese als PDF
          </button>
          <Btn variant="soft" onClick={onCancel} style={{width:"100%"}}>Abbrechen</Btn>
        </div>
      </div>
    );
  }

  // Step content
  const StepWrap = ({children}) => (
    <div style={{padding:"0 16px 96px",...bgStyle}}>
      {/* Progress */}
      <div style={{padding:"12px 0 0"}}>
        <div style={{display:"flex",gap:"4px",marginBottom:"8px"}}>
          {ONBOARDING_STEPS.map((s,i)=>(
            <div key={s} style={{flex:1,height:"4px",borderRadius:"2px",background:i<step?T.teal:i===step?`linear-gradient(to right,${T.teal},${T.violet})`:T.border,transition:"all 0.3s"}}/>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <span style={{fontFamily:"Raleway",fontSize:"10px",color:T.textMid,fontWeight:700,letterSpacing:"1px"}}>{ONBOARDING_STEPS[step].toUpperCase()} · {step+1}/{ONBOARDING_STEPS.length}</span>
          {isSelf&&<span style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600}}>📱 Klient-Modus</span>}
        </div>
      </div>
      <div style={{background:`linear-gradient(140deg,${T.tealL},#FFFFFF,${T.violetL})`,borderRadius:"18px",padding:"18px 20px",marginBottom:"16px",border:`1.5px solid ${T.border}`}}>
        <div style={{fontFamily:"Cinzel",fontSize:"18px",color:T.text,fontWeight:700}}>{ONBOARDING_STEPS[step]}</div>
        <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,marginTop:"3px",fontWeight:500}}>
          {["Persönliche Angaben","Aktuelle Beschwerden","Medizinische Vorgeschichte","Lebensbereiche & Belastungen","Ziele & Erwartungen","Ahnen & Familienmuster","Eigene Fragen & Abschluss"][step]}
        </div>
      </div>
      {children}
      <div style={{display:"flex",gap:"8px",marginTop:"20px"}}>
        <Btn variant="soft" onClick={step===0?onCancel:()=>setStep(s=>s-1)} style={{flex:1}}>{step===0?"✕":"← Zurück"}</Btn>
        {step<ONBOARDING_STEPS.length-1
          ? <Btn onClick={()=>setStep(s=>s+1)} style={{flex:2}}>Weiter →</Btn>
          : <Btn onClick={()=>setShowPreview(true)} style={{flex:2}}>Vorschau & Speichern →</Btn>
        }
      </div>
    </div>
  );

  const MultiCheck = ({options,field,freeField,freePlaceholder}) => (
    <>
      <div style={{display:"flex",flexWrap:"wrap",gap:"7px",marginBottom:"10px"}}>
        {options.map(o=>{
          const sel=(form[field]||[]).includes(o);
          return <button key={o} onClick={()=>up({[field]:sel?(form[field]||[]).filter(x=>x!==o):[...(form[field]||[]),o]})} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:600,padding:"7px 14px",borderRadius:"16px",border:`1.5px solid ${sel?T.teal:T.border}`,background:sel?T.tealL:"white",color:sel?T.tealD:T.textMid,cursor:"pointer"}}>{o}</button>;
        })}
      </div>
      {freeField&&<TI value={form[freeField]||""} onChange={v=>up({[freeField]:v})} placeholder={freePlaceholder||"Weitere…"} multiline rows={2}/>}
    </>
  );

  if(step===0) return <StepWrap>
    <Card>
      <SL>Name *</SL><div style={{marginBottom:"12px"}}><TI value={form.name} onChange={v=>up({name:v})} placeholder="Vor- und Nachname"/></div>
      <SL>Geburtsdatum</SL><div style={{marginBottom:"12px"}}><TI type="date" value={form.birthDate} onChange={v=>up({birthDate:v})}/></div>
      <SL>Kontakt (Email / Telefon)</SL><div style={{marginBottom:"12px"}}><TI value={form.contact} onChange={v=>up({contact:v})} placeholder="email@beispiel.de oder +41 79 …"/></div>
      <SL>Adresse</SL><TI value={form.address} onChange={v=>up({address:v})} placeholder="Strasse, PLZ, Ort" multiline rows={2}/>
    </Card>
  </StepWrap>;

  if(step===1) return <StepWrap>
    <Card>
      <SL>Aktuelle Hauptbeschwerden</SL>
      <div style={{marginBottom:"12px"}}><TI value={form.complaints} onChange={v=>up({complaints:v})} placeholder="Was beschäftigt dich am meisten?" multiline rows={4}/></div>
      <SL>Symptome (Mehrfachauswahl)</SL>
      <MultiCheck options={["Schmerzen","Schlafstörungen","Erschöpfung","Angstzustände","Depressionen","Verdauungsprobleme","Hautprobleme","Kopfschmerzen","Rückenschmerzen","Herzprobleme","Hormonstörungen","Immunschwäche"]} field="symptoms" freeField="symptomFreeText" freePlaceholder="Weitere Symptome…"/>
    </Card>
  </StepWrap>;

  if(step===2) return <StepWrap>
    <Card>
      <SL>Bisherige Therapien & Behandlungen</SL>
      <div style={{marginBottom:"12px"}}><MultiCheck options={THERAPIE_OPTIONS} field="previousTherapies" freeField="previousTherapiesFreeText" freePlaceholder="Weitere Behandlungen…"/></div>
      <SL>Energetische Vorgeschichte</SL>
      <MultiCheck options={ENERGIE_OPTIONS} field="energeticHistory" freeField="energeticFreeText" freePlaceholder="Weitere relevante Ereignisse…"/>
    </Card>
  </StepWrap>;

  if(step===3) return <StepWrap>
    <Card>
      <SL>Welche Lebensbereiche belasten dich? (1–10)</SL>
      {LEBENSBEREICH_OPTIONS.map(area=>{
        const val=form.lifeareas?.[area]||0;
        return(
          <div key={area} style={{marginBottom:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.text,fontWeight:600}}>{area}</span>
              <span style={{fontFamily:"Raleway",fontSize:"11px",color:T.teal,fontWeight:800,background:T.tealL,padding:"1px 8px",borderRadius:"8px"}}>{val}/10</span>
            </div>
            <div style={{position:"relative",height:"9px"}}>
              <div style={{position:"absolute",inset:0,borderRadius:"5px",background:T.bgSoft,border:`1px solid ${T.border}`}}/>
              <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${val*10}%`,borderRadius:"5px",background:T.teal,transition:"width 0.1s"}}/>
              <input type="range" min="0" max="10" value={val} onChange={e=>up({lifeareas:{...form.lifeareas,[area]:+e.target.value}})} style={{position:"absolute",inset:0,width:"100%",opacity:0,cursor:"pointer",height:"9px"}}/>
            </div>
          </div>
        );
      })}
      <div style={{marginTop:"10px"}}><SL>Weiteres</SL><TI value={form.lifeareaFreeText||""} onChange={v=>up({lifeareaFreeText:v})} placeholder="Was möchtest du noch ergänzen?" multiline rows={2}/></div>
    </Card>
  </StepWrap>;

  if(step===4) return <StepWrap>
    <Card>
      <SL>Was möchtest du in der Arbeit mit mir erreichen?</SL>
      <div style={{marginBottom:"12px"}}><TI value={form.goals} onChange={v=>up({goals:v})} placeholder="Deine Ziele & Wünsche…" multiline rows={4}/></div>
      <SL>Was erwartest du von der ersten Sitzung?</SL>
      <TI value={form.expectations} onChange={v=>up({expectations:v})} placeholder="Deine Erwartungen…" multiline rows={3}/>
    </Card>
  </StepWrap>;

  if(step===5) return <StepWrap>
    <Card>
      <SL>Bekannte Ahnenthemen in deiner Familie</SL>
      <div style={{marginBottom:"12px"}}><TI value={form.ancestorThemes} onChange={v=>up({ancestorThemes:v})} placeholder="z.B. frühe Todesfälle, Kriege, Vertreibung, Sucht…" multiline rows={3}/></div>
      <SL>Wiederkehrende Familienmuster</SL>
      <div style={{marginBottom:"12px"}}><TI value={form.familyPatterns} onChange={v=>up({familyPatterns:v})} placeholder="z.B. Armut, Krankheit, Beziehungsprobleme…" multiline rows={3}/></div>
      <SL>Weitere Anmerkungen zu Ahnen & Herkunft</SL>
      <TI value={form.ancestorNotes} onChange={v=>up({ancestorNotes:v})} placeholder="Was möchtest du noch teilen?" multiline rows={2}/>
    </Card>
  </StepWrap>;

  if(step===6) return <StepWrap>
    <Card>
      <SL>Deine eigenen Fragen an mich</SL>
      <div style={{marginBottom:"12px"}}><TI value={form.ownQuestions} onChange={v=>up({ownQuestions:v})} placeholder="Was möchtest du mich fragen?" multiline rows={4}/></div>
      <SL>Tags / Themen für dein Profil</SL>
      <TI value={form.tags} onChange={v=>up({tags:v})} placeholder="z.B. Angst, Rücken, Ahnen (kommagetrennt)"/>
      <div style={{marginTop:"14px",background:T.bgSoft,borderRadius:"12px",padding:"12px",border:`1.5px solid ${T.border}`}}>
        <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:600,lineHeight:"1.7"}}>
          Im nächsten Schritt kannst du alles prüfen, als PDF exportieren und als Klient speichern.
        </div>
      </div>
    </Card>
  </StepWrap>;

  return null;
}

export { OnboardingScreen };
