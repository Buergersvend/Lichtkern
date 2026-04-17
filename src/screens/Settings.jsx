import React, { useState, useEffect, useCallback, useRef } from "react";
import { T } from "../config/theme.js";
import { Card, Btn, TI, SL, Select, Pill } from "../components/UI.jsx";
import { db, auth } from "../config/firebase.js";
import { doc, setDoc, getDoc } from "firebase/firestore";

function PinLock({ mode, onSuccess, onSetup }) {
  const [pin,setPin]       = useState("");
  const [confirm,setConfirm] = useState("");
  const [step,setStep]     = useState("enter");
  const [error,setError]   = useState("");
  const isSetup = mode === "setup";

  const handleDigit = async (d) => {
    if(isSetup) {
      if(step==="enter") {
        const next = pin+d;
        setPin(next);
        if(next.length===4){ setStep("confirm"); }
      } else {
        const next = confirm+d;
        setConfirm(next);
        if(next.length===4){
          if(next===pin){ onSetup(pin); }
          else { setError("PINs stimmen nicht überein"); setConfirm(""); setTimeout(()=>setError(""),1500); }
        }
      }
    } else {
      const next = pin+d;
      setPin(next);
      if(next.length===4){
        try {
          const stored = await fsGet("pin_user", "lk_pin");
          if(stored && stored.value === next){ onSuccess(); }
          else { setError("Falsche PIN"); setPin(""); setTimeout(()=>setError(""),1500); }
        } catch { setError("Fehler"); setPin(""); }
      }
    }
  };

  const handleDel = () => {
    if(isSetup && step==="confirm") setConfirm(c=>c.slice(0,-1));
    else setPin(p=>p.slice(0,-1));
  };

  const current = isSetup && step==="confirm" ? confirm : pin;
  const label = isSetup
    ? (step==="enter" ? "PIN festlegen (4 Stellen)" : "PIN wiederholen")
    : "PIN eingeben";

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <div style={{width:"72px",height:"72px",borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},${T.violetL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`,marginBottom:"20px"}}>
        🔒
      </div>
      <div style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,fontWeight:700,marginBottom:"6px"}}>Lichtkern</div>
      <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.textMid,fontWeight:600,marginBottom:"32px"}}>{label}</div>

      <div style={{display:"flex",gap:"16px",marginBottom:"12px"}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:"18px",height:"18px",borderRadius:"50%",
            background:current.length>i?T.gold:T.bgSoft,
            border:`2px solid ${current.length>i?T.gold:T.border}`,
            transition:"all 0.15s"}}/>
        ))}
      </div>

      {error && <div style={{fontFamily:"Raleway",fontSize:"12px",color:"#C0392B",fontWeight:700,marginBottom:"12px"}}>{error}</div>}
      {!error && <div style={{height:"20px",marginBottom:"12px"}}/>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",width:"220px"}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
          <button key={i} onClick={()=>d===""?null:d==="⌫"?handleDel():handleDigit(String(d))}
            style={{height:"60px",borderRadius:"50%",border:`1.5px solid ${d===""?"transparent":T.border}`,
              background:d===""?"transparent":T.bgCard,
              fontFamily:"Raleway",fontSize:d==="⌫"?"20px":"22px",fontWeight:700,
              color:T.text,cursor:d===""?"default":"pointer",
              boxShadow:d===""?"none":`0 2px 8px ${T.shadow}`,
              transition:"all 0.1s"}}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsRow({label,children}){
  return(<div style={{marginBottom:"16px"}}><SL>{label}</SL>{children}</div>);
}

function SettingsScreen({ settings, onSave, onClose, clients, sessions, appointments, genTrees, reminders, templates, onImport, onLogout }) {
  const [form,setForm] = useState({...settings});
  const [pinMode,setPinMode] = useState(null);
  const [pinEnabled,setPinEnabled] = useState(!!settings.pinEnabled);
  const [saved,setSaved]   = useState(false);
  const [importMsg,setImportMsg] = useState("");
  const [netzwerk, setNetzwerk] = useState({ sichtbar:false, name:"", methoden:[], stadt:"", plz:"", kurztext:"", website:"" });
  const [netzwerkSaved, setNetzwerkSaved] = useState(false);
  const up = u => setForm(f=>({...f,...u}));

  const save = async () => {
    await onSave({...form, pinEnabled});
    setSaved(true);
    setTimeout(()=>setSaved(false),1800);
  };

  useEffect(() => {
    if(!auth.currentUser) return;
    getDoc(doc(db,"netzwerk_profile",auth.currentUser.uid)).then(d=>{ if(d.exists()) setNetzwerk(d.data()); });
  },[]);

  const saveNetzwerk = async () => {
    if(!auth.currentUser) return;
    await setDoc(doc(db,"netzwerk_profile",auth.currentUser.uid),{...netzwerk, uid:auth.currentUser.uid, aktualisiert:new Date()},{merge:true});
    setNetzwerkSaved(true);
    setTimeout(()=>setNetzwerkSaved(false),2000);
  };

  const handlePinSetup = async (pin) => {
    try{ await fsSet("pin_user","lk_pin", pin); }catch{}
    setPinEnabled(true);
    await onSave({...form, pinEnabled:true});
    setPinMode(null);
  };

  const disablePin = async () => {
    if(!window.confirm("PIN-Schutz wirklich deaktivieren?")) return;
    try{ await fsDelete("pin_user","lk_pin"); }catch{}
    setPinEnabled(false);
    await onSave({...form, pinEnabled:false});
  };

  if(pinMode) return <PinLock mode="setup" onSuccess={()=>setPinMode(null)} onSetup={handlePinSetup}/>;

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:T.bg,zIndex:200,overflowY:"auto",paddingBottom:"40px",paddingLeft:typeof window!=="undefined"&&window.innerWidth>=900?"260px":"0"}}>
      <div style={{padding:"16px 24px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1.5px solid ${T.border}`,background:T.bg,position:"sticky",top:0,zIndex:10}}>
        <div style={{fontFamily:"Cinzel",fontSize:"18px",color:T.text,fontWeight:700}}>⚙️ Einstellungen</div>
        <button onClick={onClose} style={{fontFamily:"Raleway",fontSize:"20px",color:T.textSoft,background:"none",border:"none",cursor:"pointer"}}>✕</button>
      </div>

      <div style={{padding:"20px 24px"}}>

        <div style={{background:`linear-gradient(135deg,${T.gold},${T.violetL})`,borderRadius:"16px",padding:"14px 16px",marginBottom:"16px",border:`1.5px solid ${T.borderMid}`,display:"flex",gap:"12px",alignItems:"center"}}>
          <div style={{fontSize:"24px",flexShrink:0}}>✦</div>
          <div>
            <div style={{fontFamily:"Cinzel",fontSize:"13px",color:T.text,fontWeight:700}}>Lichtkern · Human Resonanz</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:500,marginTop:"3px"}}>Markenname & Branding sind fest verankert und können nicht geändert werden.</div>
          </div>
        </div>

       

        <div style={{background:T.bgCard,borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.goldD}>Praxis & Person</SL>
          <SettingsRow label="Praxisname">
            <TI value={form.praxisname||""} onChange={v=>up({praxisname:v})} placeholder="z.B. Praxis Sonnenlicht"/>
          </SettingsRow>
          <SettingsRow label="Untertitel">
            <TI value={form.subtitle||""} onChange={v=>up({subtitle:v})} placeholder="z.B. Energetische Heilarbeit"/>
          </SettingsRow>
          <SettingsRow label="Therapeuten-Name">
            <TI value={form.therapistName||""} onChange={v=>up({therapistName:v})} placeholder="Dein vollständiger Name"/>
          </SettingsRow>
        </div>

        <div style={{background:T.bgCard,borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.goldD}>Rechnungsangaben</SL>
          <SettingsRow label="Adresse">
            <TI value={form.invoiceAddress||""} onChange={v=>up({invoiceAddress:v})} placeholder="Straße, Nr."/>
          </SettingsRow>
          <SettingsRow label="PLZ & Ort">
            <TI value={form.invoiceCity||""} onChange={v=>up({invoiceCity:v})} placeholder="8000 Zürich"/>
          </SettingsRow>
          <SettingsRow label="Steuernummer (optional)">
            <TI value={form.invoiceTax||""} onChange={v=>up({invoiceTax:v})} placeholder="DE 123 456 789"/>
          </SettingsRow>
          <SettingsRow label="IBAN (optional)">
            <TI value={form.invoiceIban||""} onChange={v=>up({invoiceIban:v})} placeholder="CH56 0483 5012 3456 7800 9"/>
          </SettingsRow>
          <SettingsRow label="Fusszeile (optional)">
            <TI value={form.invoiceFooter||""} onChange={v=>up({invoiceFooter:v})} placeholder="Kein Arztersatz. Zahlung innert 30 Tagen."/>
          </SettingsRow>
        </div>

        <div style={{background:T.bgCard,borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.goldD}>Sitzungs-Standards</SL>
          <SettingsRow label="Standard-Sitzungsdauer">
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
              {["30","45","60","75","90","120"].map(d=>(
                <button key={d} onClick={()=>up({defaultDuration:d})}
                  style={{padding:"8px 16px",borderRadius:"20px",border:`1.5px solid ${form.defaultDuration===d?T.gold:T.border}`,
                    background:form.defaultDuration===d?T.gold:T.bgCard,
                    fontFamily:"Raleway",fontSize:"12px",fontWeight:700,
                    color:form.defaultDuration===d?"white":T.textMid,cursor:"pointer"}}>
                  {d} Min
                </button>
              ))}
            </div>
          </SettingsRow>
        </div>

        <div style={{background:T.bgCard,borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.goldD}>Honorar & Währung</SL>
          <SettingsRow label="Währung">
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {["CHF","EUR","USD","GBP"].map(c=>(
                <button key={c} onClick={()=>up({currency:c})}
                  style={{padding:"8px 18px",borderRadius:"20px",border:`1.5px solid ${form.currency===c?T.gold:T.border}`,
                    background:form.currency===c?T.gold:T.bgCard,
                    fontFamily:"Raleway",fontSize:"12px",fontWeight:700,
                    color:form.currency===c?"white":T.textMid,cursor:"pointer"}}>
                  {c}
                </button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow label="Standard-Honorar pro Sitzung">
            <TI value={form.defaultFee||""} onChange={v=>up({defaultFee:v})} placeholder={`z.B. 120 ${form.currency||"CHF"}`}/>
          </SettingsRow>
        </div>

        <div style={{background:T.bgCard,borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.goldD}>Disclaimer (PDF-Footer)</SL>
          <TI value={form.disclaimer||""} onChange={v=>up({disclaimer:v})}
            placeholder="Keine medizinische Diagnose. Kein Ersatz für ärztliche Behandlung."
            multiline rows={3}/>
        </div>

        <div style={{background:T.bgCard,borderRadius:"18px",padding:"16px",marginBottom:"24px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.goldD}>🔒 Sicherheit</SL>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
            <div>
              <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,fontWeight:700}}>PIN-Schutz</div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,marginTop:"2px"}}>App beim Öffnen sperren</div>
            </div>
            <button onClick={pinEnabled?disablePin:()=>setPinMode("setup")}
              style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",cursor:"pointer",
                background:pinEnabled?T.gold:T.bgSoft,position:"relative",transition:"background 0.2s"}}>
              <div style={{position:"absolute",top:"3px",left:pinEnabled?"23px":"3px",width:"18px",height:"18px",
                borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
            </button>
          </div>

          {pinEnabled && (
            <div style={{paddingTop:"12px"}}>
              <button onClick={()=>setPinMode("change")}
                style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:"white",
                  background:T.gold,border:`1.5px solid ${T.borderMid}`,
                  borderRadius:"10px",padding:"8px 18px",cursor:"pointer"}}>
                🔑 PIN ändern
              </button>
            </div>
          )}

          <div style={{marginTop:"14px"}}>
            <SL>Auto-Lock nach</SL>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {[["1","1 Min"],["5","5 Min"],["15","15 Min"],["30","30 Min"],["0","Nie"]].map(([v,l])=>(
                <button key={v} onClick={()=>up({autoLock:v})}
                  style={{padding:"7px 14px",borderRadius:"20px",border:`1.5px solid ${form.autoLock===v?T.gold:T.border}`,
                    background:form.autoLock===v?T.gold:T.bgCard,
                    fontFamily:"Raleway",fontSize:"11px",fontWeight:700,
                    color:form.autoLock===v?"white":T.textMid,cursor:"pointer"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Btn onClick={save} style={{width:"100%",fontSize:"14px",padding:"14px",marginBottom:"12px"}}>
          {saved ? "✅ Gespeichert!" : "Einstellungen speichern"}
        </Btn>

        {onLogout && (
         <button onClick={()=>{if(window.confirm("Wirklich abmelden?"))onLogout();}} style={{width:"100%",fontFamily:"Raleway",fontWeight:600,fontSize:"12px",padding:"10px",borderRadius:"12px",border:`1px solid ${T.border}`,background:"transparent",color:T.textSoft,cursor:"pointer",marginBottom:"12px",letterSpacing:"0.5px"}}>
            🚪 Abmelden
          </button>
        )}

        <div style={{background:T.bgCard,borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.goldD}>🗄 Export & Backup</SL>

          <div style={{marginBottom:"14px"}}>
            <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text,marginBottom:"4px"}}>Vollständiges Backup (JSON)</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,marginBottom:"8px"}}>Alle Daten — Klienten, Sitzungen, Abrechnung, Bäume, Einstellungen</div>
            <button onClick={()=>{
              const data={version:"1.0",exportedAt:new Date().toISOString(),clients,sessions,appointments,genTrees,reminders,templates,settings};
              const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
              const url=URL.createObjectURL(blob);
              const a=document.createElement("a");a.href=url;a.download=`lichtkern_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
            }} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"12px",padding:"10px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>
              💾 JSON Backup herunterladen
            </button>
          </div>

          <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text,marginBottom:"8px"}}>CSV-Exporte</div>
          <div style={{display:"flex",flexDirection:"column",gap:"7px",marginBottom:"14px"}}>
            <button onClick={()=>{
              const rows=[["ID","Name","Geburtsdatum","Kontakt","Adresse","Tags","Erstellt"],
                ...(clients||[]).map(c=>[c.id,c.name||"",c.birthDate||"",c.contact||"",c.address||"",(c.tags||[]).join("; "),c.createdAt?.slice(0,10)||""])];
              const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
              const blob=new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});
              const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`lichtkern_klienten_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
            }} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:T.bgCard,color:T.textMid,cursor:"pointer",textAlign:"left"}}>
              📋 Klienten exportieren
            </button>
            <button onClick={()=>{
              const rows=[["Datum","Klient","Typ","Thema","Ebenen","Techniken","Ergebnis","Integrationsauftrag"],
                ...(sessions||[]).map(s=>[s.createdAt?.slice(0,10)||"",s.clientName||"",s.type||"",s.goal||"",Object.entries(s.levels||{}).filter(([,v])=>v>0).map(([k,v])=>`${k}:${v}%`).join("; "),(s.techniques||[]).join("; "),s.outcome||"",s.homework||""])];
              const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
              const blob=new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});
              const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`lichtkern_sitzungen_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
            }} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:T.bgCard,color:T.textMid,cursor:"pointer",textAlign:"left"}}>
              ✦ Sitzungen exportieren
            </button>
            <button onClick={()=>{
              const cur=settings?.currency||"CHF";
              const rows=[["Datum","Klient","Rechnungs-Nr.","Betrag","Währung","Status","Thema"],
                ...(sessions||[]).filter(s=>s.fee).map(s=>[s.createdAt?.slice(0,10)||"",s.clientName||"",s.invoiceNr||"",s.fee||"",cur,s.payStatus==="paid"?"Bezahlt":s.payStatus==="partial"?"Teilbezahlt":"Offen",s.goal||""])];
              const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
              const blob=new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});
              const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`lichtkern_abrechnung_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
            }} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:T.bgCard,color:T.textMid,cursor:"pointer",textAlign:"left"}}>
              💰 Abrechnung exportieren
            </button>
          </div>

          <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text,marginBottom:"6px"}}>PDF-Gesamtbericht pro Klient</div>
          <select id="pdfClientSelect" style={{width:"100%",background:T.bgCard,border:`1.5px solid ${T.border}`,borderRadius:"10px",padding:"10px 12px",color:T.text,fontFamily:"Raleway",fontSize:"12px",fontWeight:500,outline:"none",appearance:"none",marginBottom:"8px"}}>
            <option value="">— Klient wählen —</option>
            {(clients||[]).map(cl=><option key={cl.id} value={cl.id}>{cl.name}</option>)}
          </select>
          <button onClick={()=>{
            const sel=document.getElementById("pdfClientSelect")?.value;
            if(!sel)return;
            const cl=(clients||[]).find(c=>c.id===sel);
            if(!cl)return;
            const cs=(sessions||[]).filter(s=>s.clientId===sel).sort((a,b)=>a.createdAt?.localeCompare(b.createdAt));
            const html=`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"/>
<title>Gesamtbericht · ${cl.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Raleway,sans-serif;color:#0F3030;background:#F0FAFA;-webkit-print-color-adjust:exact;}.page{max-width:700px;margin:0 auto;padding:40px;}.no-print{text-align:right;margin-bottom:20px;}.card{background:white;border-radius:14px;padding:18px 20px;margin-bottom:16px;border:1.5px solid #B2E0DC;page-break-inside:avoid;}h3{font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 10px;font-weight:700;}p{font-size:12px;color:#2D6B68;font-weight:500;line-height:1.8;}@media print{.no-print{display:none;}}</style>
</head><body><div class="page">
<div class="no-print"><button onclick="window.print()" style="font-family:Raleway;font-weight:700;font-size:13px;padding:10px 24px;background:linear-gradient(135deg,#A87D3A,#8B6914);color:white;border:none;border-radius:12px;cursor:pointer;">🖨 PDF drucken</button></div>
<div style="background:linear-gradient(140deg,#F0DFA0,#FFFFFF,#EDE9FE);border-radius:20px;padding:28px;margin-bottom:20px;border:1.5px solid #C9A84C;">
  <p style="font-size:9px;letter-spacing:3px;color:#8B6914;text-transform:uppercase;margin-bottom:6px;font-weight:700;">GESAMTBERICHT</p>
  <h1 style="font-family:Cinzel,serif;font-size:26px;color:#0F3030;font-weight:700;margin-bottom:4px;">${cl.name}</h1>
  <p style="font-size:12px;color:#2D6B68;font-weight:500;">${cs.length} Sitzung${cs.length!==1?"en":""} · Exportiert: ${new Date().toLocaleDateString("de-DE")}</p>
</div>
${cs.map((s,i)=>{
  const lvlStr=Object.entries(s.levels||{}).filter(([,v])=>v>0).map(([k,v])=>k+" "+v+"%").join(", ");
  const techStr=(s.techniques||[]).join(", ");
  const feeStr=s.fee?(s.fee+" "+(settings?.currency||"CHF")+" · "+(s.payStatus==="paid"?"Bezahlt":s.payStatus==="partial"?"Teilbezahlt":"Offen")):"";
  return "<div class=\"card\">"
  +"<h3>"+(i+1)+". "+(s.type==="first"?"Erstsitzung":s.type==="followup"?"Folgesitzung":"Abschluss")+" · "+new Date(s.createdAt).toLocaleDateString("de-DE")+"</h3>"
  +(s.goal?"<p><strong>Thema:</strong> "+s.goal+"</p>":"")
  +(lvlStr?"<p><strong>Ebenen:</strong> "+lvlStr+"</p>":"")
  +(techStr?"<p><strong>Techniken:</strong> "+techStr+"</p>":"")
  +(s.outcome?"<p><strong>Ergebnis:</strong> "+s.outcome+"</p>":"")
  +(s.homework?"<p><strong>Integrationsauftrag:</strong> "+s.homework+"</p>":"")
  +(feeStr?"<p><strong>Honorar:</strong> "+feeStr+"</p>":"")
  +"</div>";
}).join("")}
<div style="border-top:1.5px solid #C9A84C;margin-top:20px;padding-top:14px;text-align:center;">
  <p style="font-family:Cinzel,serif;font-size:11px;color:#A87D3A;font-weight:700;">✦ Lichtkern · powered by Human Resonanz</p>
</div></div></body></html>`;
            const w=window.open("","_blank");if(w){w.document.write(html);w.document.close();}
          }} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:T.bgCard,color:T.textMid,cursor:"pointer"}}>
            📄 Gesamtbericht erstellen
          </button>

          <div style={{marginTop:"16px",paddingTop:"14px",borderTop:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",position:"relative"}}>
              <span style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text}}>🌐 HR Netzwerk</span>
              <span onMouseEnter={()=>setNetzwerk(n=>({...n,_tip:true}))} onMouseLeave={()=>setNetzwerk(n=>({...n,_tip:false}))} style={{cursor:"help",width:"16px",height:"16px",borderRadius:"50%",background:T.gold,color:"#000",fontSize:"10px",fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>i</span>
              {netzwerk._tip&&<div style={{position:"absolute",top:"22px",left:"0",zIndex:99,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"10px 12px",width:"260px",fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,lineHeight:"1.6",boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>Werde auf der öffentlichen Praktiker-Karte auf <span style={{color:T.gold}}>human-resonanz.de</span> sichtbar. Interessierte Klienten finden dich direkt — mehr Reichweite, mehr Buchungen.</div>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
              <button onClick={()=>setNetzwerk(n=>({...n,sichtbar:!n.sichtbar}))} style={{width:"42px",height:"24px",borderRadius:"12px",border:"none",cursor:"pointer",background:netzwerk.sichtbar?T.gold:"#4B5563",position:"relative"}}>
                <span style={{position:"absolute",top:"3px",left:netzwerk.sichtbar?"20px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"white",transition:"left 0.2s"}}/>
              </button>
              <span style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft}}>Im Human Resonanz Netzwerk sichtbar</span>
            </div>
            {netzwerk.sichtbar && <>
              <TI label="Anzeigename" placeholder="z.B. Maria Muster" value={netzwerk.name} onChange={v=>setNetzwerk(n=>({...n,name:v}))}/>
              <TI label="Stadt" placeholder="z.B. München" value={netzwerk.stadt} onChange={v=>setNetzwerk(n=>({...n,stadt:v}))}/>
              <TI label="PLZ" placeholder="z.B. 80331" value={netzwerk.plz} onChange={v=>setNetzwerk(n=>({...n,plz:v}))}/>
              <TI label="Kurztext (max. 200 Zeichen)" placeholder="Ich begleite Menschen auf ihrem Weg..." value={netzwerk.kurztext} onChange={v=>setNetzwerk(n=>({...n,kurztext:v.slice(0,200)}))}/>
              <div style={{marginBottom:"8px"}}>
                <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,marginBottom:"6px"}}>Methoden (mehrere wählbar)</div>
                <select onChange={e=>{const v=e.target.value;if(v&&!netzwerk.methoden.includes(v))setNetzwerk(n=>({...n,methoden:[...n.methoden,v]}));e.target.value="";}} style={{width:"100%",background:T.bgCard,border:`1.5px solid ${T.borderMid}`,borderRadius:"8px",padding:"8px",color:T.textSoft,fontFamily:"Raleway",fontSize:"11px"}}>
                  <option value="">+ Methode hinzufügen...</option>
                  {["Humanenergetik","Coaching","Energetik","Human Design","Therapie","Heilpraktiker","Astrologie","Numerologie","Reiki","Atemarbeit","Familienaufstellung","Quantenheilung","Sonstiges"].filter(m=>!netzwerk.methoden.includes(m)).map(m=>(<option key={m} value={m}>{m}</option>))}
                </select>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"8px"}}>
                  {netzwerk.methoden.map(m=>(
                    <span key={m} style={{display:"flex",alignItems:"center",gap:"4px",background:T.bgSoft,border:`1px solid ${T.borderMid}`,borderRadius:"20px",padding:"4px 10px",fontFamily:"Raleway",fontSize:"11px",color:T.textSoft}}>
                      {m}
                      <span onClick={()=>setNetzwerk(n=>({...n,methoden:n.methoden.filter(x=>x!==m)}))} style={{cursor:"pointer",color:T.textMid,fontWeight:"700",marginLeft:"2px"}}>×</span>
                    </span>
                  ))}
                </div>
                <div style={{display:"flex",gap:"6px",marginTop:"8px"}}>
                  <input id="methodeInput" placeholder="Eigene Methode..." style={{flex:1,background:T.bgCard,border:`1.5px solid ${T.borderMid}`,borderRadius:"8px",padding:"7px 10px",color:T.textSoft,fontFamily:"Raleway",fontSize:"11px"}}/>
                  <button onClick={()=>{const inp=document.getElementById("methodeInput");const v=inp.value.trim();if(v&&!netzwerk.methoden.includes(v)){setNetzwerk(n=>({...n,methoden:[...n.methoden,v]}));inp.value="";}}} style={{background:T.bgSoft,border:`1px solid ${T.borderMid}`,borderRadius:"8px",padding:"7px 14px",color:T.textSoft,fontFamily:"Raleway",fontSize:"11px",cursor:"pointer"}}>+ Hinzufügen</button>
                </div>
              </div>
              <TI label="Website (optional)" placeholder="https://..." value={netzwerk.website} onChange={v=>setNetzwerk(n=>({...n,website:v}))}/>
            </>}
            <button onClick={saveNetzwerk} style={{marginTop:"8px",width:"100%",fontFamily:"Raleway",fontSize:"11px",padding:"9px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:"transparent",color:T.text,cursor:"pointer"}}>
              {netzwerkSaved?"✅ Gespeichert":"🌐 Netzwerk-Profil speichern"}
            </button>
          </div>

          <div style={{marginTop:"16px",paddingTop:"14px",borderTop:`1px solid ${T.border}`}}>
            <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text,marginBottom:"4px"}}>🔁 Backup wiederherstellen</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,marginBottom:"8px"}}>JSON-Backup importieren — überschreibt alle aktuellen Daten</div>
            <label style={{display:"block",width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px",borderRadius:"10px",border:`1.5px dashed ${T.border}`,background:T.bgCard,color:T.text,cursor:"pointer",textAlign:"center"}}>
              📂 JSON-Datei auswählen
              <input type="file" accept=".json" style={{display:"none"}} onChange={async e=>{
                const file=e.target.files?.[0];if(!file)return;
                try{
                  const txt=await file.text();
                  const data=JSON.parse(txt);
                  if(!data.version)throw new Error("Ungültiges Format");
                  if(!window.confirm("Alle aktuellen Daten werden überschrieben. Fortfahren?"))return;
                  await onImport(data);
                  setImportMsg("✅ Import erfolgreich!");
                  setTimeout(()=>setImportMsg(""),3000);
                }catch(err){setImportMsg("❌ Fehler: "+err.message);setTimeout(()=>setImportMsg(""),4000);}
                e.target.value="";
              }}/>
            </label>
            {importMsg&&<div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:importMsg.startsWith("✅")?T.goldD:"#9B1C1C",marginTop:"8px",textAlign:"center"}}>{importMsg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export { PinLock, SettingsRow, SettingsScreen };
