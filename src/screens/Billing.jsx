import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flower } from "../components/Decorations";
import { T } from "../config/theme.js";
import { APPT_TYPES, DE_MONTHS, DE_DAYS } from "../config/constants.js";
import { Card, Btn, Pill, SL, TI, Select } from "../components/UI.jsx";

const PAY_STATUS = {
open: { label:"Offen", color:"#C0392B", bg:"#3a1a1a", border:"#cc4444", icon:"🧾" },
  partial: { label:"Teilbezahlt", color:"#7C4A00", bg:"#FEF3C7", border:"#F59E0B", icon:"⚠️" },
  paid:    { label:"Bezahlt",     color:"#0A3B20", bg:"#DCFCE7", border:"#4ADE80", icon:"✅" },
};

function Billing({ sessions, clients, settings, onUpdateSession }) {
  const [view,setView]     = useState("overview"); // overview | list | detail
  const [detail,setDetail] = useState(null);
  const [filterMonth,setFilterMonth] = useState("all");
  const [filterStatus,setFilterStatus] = useState("all");
  const currency = settings?.currency || "CHF";

  // Enrich sessions with client info
  const enriched = sessions.map(s => ({
    ...s,
    clientObj: clients.find(c=>c.id===s.clientId),
    feeNum: parseFloat(s.fee||0)||0,
    ps: PAY_STATUS[s.payStatus||"open"],
  }));

  // Month options
  const months = [...new Set(sessions.map(s=>s.createdAt?.slice(0,7)).filter(Boolean))].sort().reverse();

  // Filtered
  const filtered = enriched.filter(s => {
    if(filterMonth!=="all" && !s.createdAt?.startsWith(filterMonth)) return false;
    if(filterStatus!=="all" && (s.payStatus||"open")!==filterStatus) return false;
    return true;
  });

  // Stats
  const totalRevenue   = enriched.filter(s=>s.payStatus==="paid").reduce((a,s)=>a+s.feeNum,0);
  const totalOpen      = enriched.filter(s=>s.payStatus==="open"||s.payStatus==="partial").reduce((a,s)=>a+s.feeNum,0);
  const totalSessions  = enriched.filter(s=>s.feeNum>0).length;

  // Monthly chart data (last 6 months)
  const monthlyData = {};
  const now = new Date();
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    monthlyData[key]={label:DE_MONTHS[d.getMonth()].slice(0,3),paid:0,open:0};
  }
  enriched.forEach(s=>{
    const key=s.createdAt?.slice(0,7);
    if(monthlyData[key]){
      if(s.payStatus==="paid") monthlyData[key].paid+=s.feeNum;
      else if(s.feeNum>0) monthlyData[key].open+=s.feeNum;
    }
  });
  const chartData=Object.values(monthlyData);
  const maxBar=Math.max(...chartData.map(m=>m.paid+m.open),1);

  // CSV export
  const exportCSV = () => {
    const rows = [
      ["Datum","Klient","Rechnungs-Nr.","Betrag",`Währung (${currency})`,"Status","Thema"],
      ...filtered.map(s=>[
        s.createdAt?.slice(0,10)||"",
        s.clientName||"",
        s.invoiceNr||"",
        s.feeNum||"",
        currency,
        s.ps?.label||"Offen",
        (s.goal||"").replace(/,/g," "),
      ])
    ];
    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`lichtkern_abrechnung_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Update pay status inline
  const updateStatus = async (session, status) => {
    await onUpdateSession({...session, payStatus:status});
  };

  // ── Detail view ──
  if(detail) {
    const s = enriched.find(x=>x.id===detail);
    if(!s) { setDetail(null); return null; }
    const [editFee,setEditFee]       = useState(s.fee||"");
    const [editStatus,setEditStatus] = useState(s.payStatus||"open");
    const [editInvNr,setEditInvNr]   = useState(s.invoiceNr||"");
    const [editInvDate,setEditInvDate] = useState(s.invoiceDate||"");
    const [saving,setSaving]         = useState(false);
    const save = async () => { setSaving(true); await onUpdateSession({...s,fee:editFee,payStatus:editStatus,invoiceNr:editInvNr,invoiceDate:editInvDate}); setSaving(false); setDetail(null); };
    const ps = PAY_STATUS[editStatus]||PAY_STATUS.open;

    return (
      <div style={{padding:"0 16px 96px"}}>
        <button onClick={()=>setDetail(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"12px"}}>← Zurück</button>

        <div style={{background:ps.bg,borderRadius:"20px",padding:"20px",marginBottom:"14px",border:`1.5px solid ${ps.border}`}}>
          <div style={{fontFamily:"Cinzel",fontSize:"18px",color:T.text,fontWeight:700}}>{s.clientName||"—"}</div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"3px",fontWeight:500}}>{s.createdAt?.slice(0,10)} · {s.goal||"Kein Thema"}</div>
          <div style={{marginTop:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"20px"}}>{ps.icon}</span>
            <span style={{fontFamily:"Raleway",fontSize:"14px",fontWeight:700,color:ps.color}}>{ps.label}</span>
          </div>
        </div>

        <Card style={{marginBottom:"12px"}}>
          <SL>Honorar</SL>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
            <div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:600,marginBottom:"4px"}}>Betrag ({currency})</div>
              <TI value={editFee} onChange={setEditFee} placeholder="120"/>
            </div>
            <div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:600,marginBottom:"4px"}}>Status</div>
              <select value={editStatus} onChange={e=>setEditStatus(e.target.value)} style={{width:"100%",background:T.bgCard,border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"11px 14px",color:T.text,fontFamily:"Raleway",fontSize:"13px",fontWeight:500,outline:"none",appearance:"none"}}>
                {Object.entries(PAY_STATUS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>
          <SL>Rechnung</SL>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            <TI value={editInvNr} onChange={setEditInvNr} placeholder="RG-2024-001"/>
            <TI type="date" value={editInvDate} onChange={setEditInvDate}/>
          </div>
        </Card>

        <Btn onClick={save} disabled={saving} style={{width:"100%",marginBottom:"8px"}}>
          {saving?"Speichert…":"💾 Speichern"}
        </Btn>
      </div>
    );
  }

  return (
    <div style={{padding:"0 16px 96px"}}>
      {/* Hero */}
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"22px 24px",marginBottom:"16px",background:`linear-gradient(140deg,${T.teal} 0%,${T.bgCard} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>  <Flower size={200} opacity={0.09}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,margin:"0 0 12px",fontWeight:700}}>Abrechnung</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
            {[
              {label:"Einnahmen",  value:`${totalRevenue.toFixed(0)} ${currency}`, bg:"#DCFCE7", border:"#4ADE80", color:"#0A3B20"},
              {label:"Offen",      value:`${totalOpen.toFixed(0)} ${currency}`,    bg:"#FEE2E2", border:"#FCA5A5", color:"#9B1C1C"},
              {label:"Sitzungen",  value:totalSessions,                             bg:T.tealL,   border:T.borderMid, color:T.tealD},
            ].map((s,i)=>(
              <div key={i} style={{background:s.bg,borderRadius:"14px",border:`1.5px solid ${s.border}`,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontFamily:"Cinzel",fontSize:"16px",color:s.color,fontWeight:700}}>{s.value}</div>
                <div style={{fontFamily:"Raleway",fontSize:"9px",color:s.color,marginTop:"3px",fontWeight:700,opacity:0.85}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly bar chart */}
      <Card style={{marginBottom:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <SL>Einnahmen pro Monat</SL>
          <button onClick={exportCSV} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"6px 12px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>
            📥 CSV
          </button>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:"6px",height:"80px",marginBottom:"6px"}}>
          {chartData.map((m,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",height:"100%",justifyContent:"flex-end"}}>
              <div style={{fontFamily:"Raleway",fontSize:"9px",color:T.teal,fontWeight:700}}>{m.paid>0?m.paid.toFixed(0):""}</div>
              <div style={{width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",height:`${Math.max(((m.paid+m.open)/maxBar)*100,4)}%`}}>
                {m.open>0&&<div style={{width:"100%",background:"#FEE2E2",flex:m.open/(m.paid+m.open||1)}}/>}
                {m.paid>0&&<div style={{width:"100%",background:T.teal,borderRadius:"4px 4px 0 0",flex:m.paid/(m.paid+m.open||1)}}/>}
              </div>
              <div style={{fontFamily:"Raleway",fontSize:"8px",color:T.textSoft,fontWeight:700}}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:"12px",justifyContent:"center"}}>
          {[{c:T.teal,l:"Bezahlt"},{c:"#FCA5A5",l:"Offen"}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"5px"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"2px",background:x.c}}/>
              <span style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600}}>{x.l}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}}>
        <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{background:T.bgCard,border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"10px 12px",color:T.text,fontFamily:"Raleway",fontSize:"12px",fontWeight:600,outline:"none",appearance:"none"}}>
          <option value="all">Alle Monate</option>
          {months.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{background:T.bgCard,border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"10px 12px",color:T.text,fontFamily:"Raleway",fontSize:"12px",fontWeight:600,outline:"none",appearance:"none"}}>
          <option value="all">Alle Status</option>
          {Object.entries(PAY_STATUS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
      </div>

      {/* Session list */}
      {filtered.length===0
        ? <div style={{textAlign:"center",padding:"48px 0"}}>
            <div style={{fontSize:"36px",opacity:0.3,marginBottom:"10px"}}>💰</div>
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.textMid,fontWeight:600}}>Keine Einträge</div>
          </div>
        : <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {filtered.map(s=>{
              const ps=s.ps||PAY_STATUS.open;
              return (
                <div key={s.id} style={{background:ps.bg,borderRadius:"16px",padding:"13px 14px",border:`1.5px solid ${ps.border}`,display:"flex",alignItems:"center",gap:"12px",cursor:"pointer"}} onClick={()=>setDetail(s.id)}>
                  <div style={{fontSize:"20px",flexShrink:0}}>{ps.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.clientName||"—"}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:500,marginTop:"2px"}}>{s.createdAt?.slice(0,10)} {s.invoiceNr?`· ${s.invoiceNr}`:""}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"Cinzel",fontSize:"15px",color:ps.color,fontWeight:700}}>{s.feeNum>0?`${s.feeNum} ${currency}`:"—"}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"9px",color:ps.color,fontWeight:700,marginTop:"2px"}}>{ps.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
      }

      {/* Year total */}
      {(() => {
        const year = new Date().getFullYear();
        const yearTotal = enriched.filter(s=>s.createdAt?.startsWith(year+"")&&s.payStatus==="paid").reduce((a,s)=>a+s.feeNum,0);
        return yearTotal>0 ? (
          <div style={{marginTop:"16px",background:T.bgSoft,borderRadius:"16px",padding:"14px 16px",border:`1.5px solid ${T.border}`,textAlign:"center"}}>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"4px"}}>Jahreseinnahmen {year}</div>
            <div style={{fontFamily:"Cinzel",fontSize:"26px",color:T.tealD,fontWeight:700}}>{yearTotal.toFixed(2)} {currency}</div>
          </div>
        ) : null;
      })()}
    </div>
  );
}

export { Billing };
