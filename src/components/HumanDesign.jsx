import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flower } from "./Decorations";
import { T } from "../config/theme.js";

import { lvl, top2, dynGrad } from "../config/helpers";
import { Card, Btn, SL, TI, Pill, Select, LBar } from "./UI.jsx";
import { groqFetch } from "../config/groq.js";
const HD_GATE_CENTER = {
  64:'head',61:'head',63:'head',
  47:'ajna',24:'ajna',4:'ajna',17:'ajna',43:'ajna',11:'ajna',
  62:'throat',23:'throat',56:'throat',35:'throat',12:'throat',45:'throat',33:'throat',8:'throat',31:'throat',20:'throat',16:'throat',
  1:'g',13:'g',25:'g',46:'g',2:'g',15:'g',10:'g',7:'g',
  21:'heart',40:'heart',26:'heart',51:'heart',
  30:'sp',22:'sp',36:'sp',49:'sp',55:'sp',37:'sp',6:'sp',
  5:'sacral',14:'sacral',29:'sacral',59:'sacral',9:'sacral',3:'sacral',42:'sacral',27:'sacral',34:'sacral',
  48:'spleen',57:'spleen',44:'spleen',50:'spleen',32:'spleen',28:'spleen',18:'spleen',
  58:'root',38:'root',54:'root',53:'root',60:'root',19:'root',39:'root',41:'root',52:'root'
};
const HD_CHANNELS=[[4,63],[24,61],[47,64],[11,56],[17,62],[23,43],[1,8],[7,31],[10,20],[13,33],[21,45],[12,22],[35,36],[16,48],[20,57],[2,14],[5,15],[10,34],[29,46],[25,51],[26,44],[37,40],[27,50],[34,57],[6,59],[3,60],[9,52],[42,53],[18,58],[28,38],[32,54],[19,49],[30,41],[39,55]];
const HD_CENTER_CFG={
  head:   {label:'Kopf',       color:'#7C3AED',bg:'#EDE9FE',size:52,shape:'tri-down'},
  ajna:   {label:'Ajna',       color:'#2563EB',bg:'#DBEAFE',size:48,shape:'tri-up'},
  throat: {label:'Kehle',      color:'#D97706',bg:'#FEF3C7',size:44,shape:'rect'},
  g:      {label:'G / Selbst', color:'#F59E0B',bg:'#FEF9C3',size:46,shape:'diamond'},
  heart:  {label:'Herz',       color:'#DC2626',bg:'#FEE2E2',size:40,shape:'tri-down'},
  sp:     {label:'Solarplexus',color:'#EA580C',bg:'#FFEDD5',size:48,shape:'tri-up'},
  sacral: {label:'Sakral',     color:'#B91C1C',bg:'#FEE2E2',size:50,shape:'rect'},
  spleen: {label:'Milz',       color:'#16A34A',bg:'#DCFCE7',size:44,shape:'tri-up'},
  root:   {label:'Wurzel',     color:'#92400E',bg:'#FEF3C7',size:42,shape:'rect'}
};
const HD_TYPE_DESC={
  'Manifestor':    {strategy:'Informieren vor dem Handeln',signature:'Frieden',notself:'Wut',desc:'Manifestoren sind Initiatoren – sie haben die Fähigkeit, Dinge zu starten und andere zu bewegen. Ihre Energie ist bündelnd und fokussiert.'},
  'Generator':     {strategy:'Warten & auf Resonanz antworten',signature:'Befriedigung',notself:'Frustration',desc:'Generatoren sind die Lebenskraft der Welt. Ihre Sakralenergie ist zyklusartig und nachhaltig. Sie gedeihen, wenn sie auf echte Resonanz reagieren.'},
  'Manifesting Generator':{strategy:'Warten, informieren, dann handeln',signature:'Befriedigung',notself:'Frustration/Wut',desc:'Manifesting Generatoren verbinden Initiationskraft mit Sakralenergie. Sie sind schnell, multitaskingfähig und erschaffen Neues durch direkte Energie.'},
  'Projektor':     {strategy:'Warten auf Einladung',signature:'Erfolg',notself:'Bitterkeit',desc:'Projektoren haben die Fähigkeit, andere tiefgründig zu führen und zu leiten. Sie brauchen Anerkennung und Einladung, um ihre Weisheit optimal einzusetzen.'},
  'Reflektor':     {strategy:'Warten einen Mondmonat',signature:'Überraschung',notself:'Enttäuschung',desc:'Reflektoren sind Spiegel der Gemeinschaft. Sie sind selten und kostbar – ihre offenen Zentren reflektieren das Umfeld mit klarer Wahrheit.'}
};
const HD_AUTHORITY_DESC={
  'Emotional':   'Entscheidungen brauchen Zeit – erst wenn die emotionale Welle abklingt, wird Klarheit sichtbar.',
  'Sakral':      'Die Sakralkraft antwortet spontan mit Ja/Nein. Auf die körperliche Resonanz hören.',
  'Milz':        'Spontane, intuitive Eingebungen im Moment. Der erste Impuls trägt die Wahrheit.',
  'Ego':         'Entscheidungen aus dem Herzensimpuls – was will ich wirklich? Was lohnt sich?',
  'Selbst':      'Der Körper führt in die richtigen Orte und zu den richtigen Menschen.',
  'Mental':      'Entscheidungen durch Austausch und Reflexion mit vertrauten Menschen.',
  'Lunar':       'Entscheidungen erst nach einem vollständigen Mondzyklus (28-29 Tage).'
};

function hdCalcDefinedCenters(allGates){
  const s=new Set(allGates.map(Number));
  const def=new Set();
  HD_CHANNELS.forEach(([a,b])=>{if(s.has(a)&&s.has(b)){def.add(HD_GATE_CENTER[a]);def.add(HD_GATE_CENTER[b]);}});
  return def;
}
function hdDetermineType(def){
  if(def.size===0)return'Reflektor';
  const hasSacral=def.has('sacral'),hasThroat=def.has('throat'),hasHeart=def.has('heart'),hasSP=def.has('sp'),hasRoot=def.has('root');
  if(hasSacral&&hasThroat)return'Manifesting Generator';
  if(hasSacral)return'Generator';
  if(hasThroat&&(hasHeart||hasSP||hasRoot))return'Manifestor';
  return'Projektor';
}

// ─── BODYGRAPH SVG ────────────────────────────
function BodygraphSVG({pgates=[],dgates=[],size=260}){
  const allGates=[...pgates,...dgates].map(Number);
  const defined=hdCalcDefinedCenters(allGates);
  const pSet=new Set(pgates.map(Number));
  const dSet=new Set(dgates.map(Number));

  // Center positions in 200x380 viewBox
  const CP={
    head:   {x:100,y:30},
    ajna:   {x:100,y:95},
    throat: {x:100,y:158},
    g:      {x:63,y:220},
    heart:  {x:152,y:205},
    sp:     {x:158,y:298},
    sacral: {x:100,y:285},
    spleen: {x:48,y:298},
    root:   {x:100,y:360}
  };

  const cDef=(c)=>defined.has(c);
  const cc=(c)=>cDef(c)?HD_CENTER_CFG[c].color:'#CBD5E1';
  const cb=(c)=>cDef(c)?HD_CENTER_CFG[c].bg:'#F1F5F9';

  // Shape renderers
  function TriDown({cx,cy,s,c,fill,label}){
    const h=s*0.8;
    const pts=`${cx},${cy-h/2} ${cx+s/2},${cy+h/2} ${cx-s/2},${cy+h/2}`;
    return(<g>
      <polygon points={pts} fill={fill} stroke={c} strokeWidth="2"/>
      <text x={cx} y={cy+4} textAnchor="middle" style={{fontFamily:'Raleway',fontSize:'7px',fill:c,fontWeight:700}}>{label}</text>
    </g>);
  }
  function TriUp({cx,cy,s,c,fill,label}){
    const h=s*0.8;
    const pts=`${cx},${cy+h/2} ${cx+s/2},${cy-h/2} ${cx-s/2},${cy-h/2}`;
    return(<g>
      <polygon points={pts} fill={fill} stroke={c} strokeWidth="2"/>
      <text x={cx} y={cy+4} textAnchor="middle" style={{fontFamily:'Raleway',fontSize:'7px',fill:c,fontWeight:700}}>{label}</text>
    </g>);
  }
  function Rect({cx,cy,w,h,c,fill,label}){
    return(<g>
      <rect x={cx-w/2} y={cy-h/2} width={w} height={h} rx="5" fill={fill} stroke={c} strokeWidth="2"/>
      <text x={cx} y={cy+4} textAnchor="middle" style={{fontFamily:'Raleway',fontSize:'7px',fill:c,fontWeight:700}}>{label}</text>
    </g>);
  }
  function Diamond({cx,cy,s,c,fill,label}){
    const pts=`${cx},${cy-s/2} ${cx+s/2},${cy} ${cx},${cy+s/2} ${cx-s/2},${cy}`;
    return(<g>
      <polygon points={pts} fill={fill} stroke={c} strokeWidth="2"/>
      <text x={cx} y={cy+4} textAnchor="middle" style={{fontFamily:'Raleway',fontSize:'7px',fill:c,fontWeight:700}}>{label}</text>
    </g>);
  }

  // Channel lines
  function chanColor(a,b){
    const hasPboth=pSet.has(a)&&pSet.has(b);
    const hasDboth=dSet.has(a)&&dSet.has(b);
    if(hasPboth&&hasDboth)return'#7C3AED';
    if(hasPboth)return'#0D9488';
    if(hasDboth)return'#DC2626';
    if((pSet.has(a)||dSet.has(a))&&(pSet.has(b)||dSet.has(b)))return'#7C3AED';
    return null;
  }
  const CHAN_PATHS=[
    // Head-Ajna
    {a:4,b:63,x1:93,y1:52,x2:93,y2:80},{a:24,b:61,x1:100,y1:52,x2:100,y2:80},{a:47,b:64,x1:107,y1:52,x2:107,y2:80},
    // Ajna-Throat
    {a:17,b:62,x1:93,y1:112,x2:93,y2:142},{a:43,b:23,x1:100,y1:112,x2:100,y2:142},{a:11,b:56,x1:107,y1:112,x2:107,y2:142},
    // Throat-G
    {a:8,b:1,x1:80,y1:170,x2:75,y2:205},{a:31,b:7,x1:85,y1:172,x2:70,y2:207},{a:20,b:10,x1:90,y1:172,x2:65,y2:210},{a:33,b:13,x1:95,y1:172,x2:60,y2:213},
    // Throat-Heart
    {a:45,b:21,x1:118,y1:165,x2:138,y2:195},
    // Throat-SP
    {a:12,b:22,x1:118,y1:168,x2:148,y2:280},{a:35,b:36,x1:122,y1:168,x2:152,y2:280},
    // Throat-Spleen
    {a:16,b:48,x1:80,y1:168,x2:60,y2:282},{a:20,b:57,x1:78,y1:168,x2:56,y2:284},
    // G-Sacral
    {a:2,b:14,x1:68,y1:232,x2:82,y2:270},{a:5,b:15,x1:72,y1:234,x2:86,y2:270},{a:10,b:34,x1:76,y1:234,x2:90,y2:270},{a:29,b:46,x1:80,y1:234,x2:94,y2:270},
    // G-Heart
    {a:25,b:51,x1:78,y1:218,x2:138,y2:210},
    // Heart-Spleen
    {a:26,b:44,x1:143,y1:218,x2:62,y2:286},
    // Heart-SP
    {a:37,b:40,x1:155,y1:220,x2:152,y2:280},
    // Sacral-Spleen
    {a:27,b:50,x1:78,y1:290,x2:62,y2:290},{a:34,b:57,x1:82,y1:294,x2:64,y2:294},
    // Sacral-SP
    {a:6,b:59,x1:120,y1:290,x2:148,y2:290},
    // Sacral-Root
    {a:3,b:60,x1:93,y1:303,x2:93,y2:345},{a:9,b:52,x1:100,y1:303,x2:100,y2:345},{a:42,b:53,x1:107,y1:303,x2:107,y2:345},
    // Spleen-Root
    {a:18,b:58,x1:52,y1:312,x2:80,y2:348},{a:28,b:38,x1:56,y1:312,x2:84,y2:348},{a:32,b:54,x1:60,y1:312,x2:88,y2:348},
    // SP-Root
    {a:19,b:49,x1:152,y1:312,x2:120,y2:348},{a:30,b:41,x1:155,y1:312,x2:115,y2:348},{a:39,b:55,x1:158,y1:312,x2:110,y2:348},
  ];

  const scale=size/200;
  return(
    <svg viewBox="0 0 200 380" width={size} height={size*1.9} style={{display:'block',margin:'0 auto'}}>
      {/* Channel lines */}
      {CHAN_PATHS.map((ch,i)=>{
        const col=chanColor(ch.a,ch.b);
        if(!col)return null;
        return<line key={i} x1={ch.x1} y1={ch.y1} x2={ch.x2} y2={ch.y2} stroke={col} strokeWidth="3.5" strokeLinecap="round" opacity="0.85"/>;
      })}
      {/* Inactive channel lines (faint) */}
      {CHAN_PATHS.map((ch,i)=>{
        const col=chanColor(ch.a,ch.b);
        if(col)return null;
        return<line key={'g'+i} x1={ch.x1} y1={ch.y1} x2={ch.x2} y2={ch.y2} stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>;
      })}
      {/* Centers */}
      <TriDown cx={CP.head.x}   cy={CP.head.y}   s={44} c={cc('head')}   fill={cb('head')}   label="KOPF"/>
      <TriUp   cx={CP.ajna.x}   cy={CP.ajna.y}   s={40} c={cc('ajna')}   fill={cb('ajna')}   label="AJNA"/>
      <Rect    cx={CP.throat.x} cy={CP.throat.y} w={70} h={28} c={cc('throat')} fill={cb('throat')} label="KEHLE"/>
      <Diamond cx={CP.g.x}      cy={CP.g.y}      s={46} c={cc('g')}      fill={cb('g')}      label="G"/>
      <TriDown cx={CP.heart.x}  cy={CP.heart.y}  s={36} c={cc('heart')}  fill={cb('heart')}  label="HERZ"/>
      <Rect    cx={CP.sacral.x} cy={CP.sacral.y} w={74} h={32} c={cc('sacral')} fill={cb('sacral')} label="SAKRAL"/>
      <TriUp   cx={CP.spleen.x} cy={CP.spleen.y} s={38} c={cc('spleen')} fill={cb('spleen')} label="MILZ"/>
      <TriUp   cx={CP.sp.x}     cy={CP.sp.y}     s={38} c={cc('sp')}     fill={cb('sp')}     label="S.PLEXUS"/>
      <Rect    cx={CP.root.x}   cy={CP.root.y}   w={68} h={26} c={cc('root')}   fill={cb('root')}   label="WURZEL"/>
      {/* Gate dots */}
      {[...pSet].filter(g=>HD_GATE_CENTER[g]).map(g=>{
        const cp=CP[HD_GATE_CENTER[g]];
        return<circle key={'p'+g} cx={cp.x+(Math.random()*12-6)} cy={cp.y+(Math.random()*12-6)} r="3" fill={T.teal} opacity="0.7"/>;
      })}
    </svg>
  );
}

// ─── HD TAB COMPONENT ─────────────────────────
function HDTab({client,onSave}){
  const [form,setForm]=useState({
    hdBirthDate:client.hdBirthDate||'',
    hdBirthTime:client.hdBirthTime||'',
    hdBirthPlace:client.hdBirthPlace||'',
    hdType:client.hdType||'',
    hdProfile:client.hdProfile||'',
    hdAuthority:client.hdAuthority||'',
    hdPGates:client.hdPGates||'',  // comma-separated
    hdDGates:client.hdDGates||'',
  });
  const [editing,setEditing]=useState(!client.hdType&&!client.hdPGates);
  const [gateStep,setGateStep]=useState(0); // 0=Typ, 1=Tore
  const [aiLoading,setAiLoading]=useState(false);
  const [aiText,setAiText]=useState('');
  // gateMap: {gateNum: 'p'|'d'} 
  const initGateMap=()=>{
    const m={};
    (client.hdPGates||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(g=>{if(+g>=1&&+g<=64)m[+g]='p';});
    (client.hdDGates||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(g=>{if(+g>=1&&+g<=64)m[+g]=m[+g]==='p'?'b':'d';});
    return m;
  };
  const [gateMap,setGateMap]=useState(initGateMap);
  
  const pgates=Object.entries(gateMap).filter(([,v])=>v==='p'||v==='b').map(([k])=>+k);
  const dgates=Object.entries(gateMap).filter(([,v])=>v==='d'||v==='b').map(([k])=>+k);
  const allGates=[...new Set([...pgates,...dgates])];
  const defined=hdCalcDefinedCenters(allGates);
  const calcType=allGates.length>0?hdDetermineType(defined):'';
  const displayType=form.hdType||calcType||'—';
  const hasData=form.hdType||allGates.length>0;

  const tapGate=(g)=>{
    setGateMap(prev=>{
      const cur=prev[g];
      const next={...prev};
      // Zyklus: leer → Persönlichkeit (teal) → Beide (violett) → Design (rot) → leer
      if(!cur)next[g]='p';
      else if(cur==='p')next[g]='b';
      else if(cur==='b')next[g]='d';
      else delete next[g];
      return next;
    });
  };

  const save=()=>{
    const pg=pgates.join(',');
    const dg=dgates.join(',');
    onSave({...client,...form,hdPGates:pg,hdDGates:dg});
    setEditing(false);
  };
  
  const mybodygraphUrl=()=>{
    if(!form.hdBirthDate)return'https://www.mybodygraph.com';
    const [y,m,d]=(form.hdBirthDate||'').split('-');
    const [h,min]=(form.hdBirthTime||'00:00').split(':');
    const place=encodeURIComponent(form.hdBirthPlace||'');
    return`https://www.mybodygraph.com/chart?day=${d||''}&month=${m||''}&year=${y||''}&hour=${h||'0'}&minute=${min||'0'}&city=${place}`;
  };

  const genAI=async()=>{
    if(!hasData)return;
    setAiLoading(true);
    try{
      const _aiPrompt1=`Du bist ein erfahrener Human Design Analytiker in einer ganzheitlichen Heilpraxis. Analysiere diesen Klienten für die therapeutische Begleitung:

Klient: ${client.name}
HD-Typ: ${displayType}
Profil: ${form.hdProfile||'—'}
Autorität: ${form.hdAuthority||'—'}
Bewusste Tore (Persönlichkeit): ${pgates.join(', ')||'keine'}
Unbewusste Tore (Design): ${dgates.join(', ')||'keine'}
Definierte Zentren: ${[...defined].map(c=>HD_CENTER_CFG[c]?.label||c).join(', ')||'keine'}

Bitte gib:
1. **Kernthema** (2 Sätze): Was prägt diesen Menschen fundamental?
2. **Heilungsansätze** (3 konkrete Impulse für die Praxisarbeit): Welche Themen/Zentren verdienen besondere Aufmerksamkeit?
3. **Konditionierungsfelder** (offene Zentren): Was nimmt dieser Mensch von anderen auf – und was ist echt?
4. **Integrationsauftrag**: Ein kraftvoller Satz für die Arbeit mit diesem Klienten.

Warmherzig, präzise, ohne Heilversprechen.`;
      setAiText(await groqFetch(_aiPrompt1));
    }catch{setAiText('Netzwerkfehler.');}
    setAiLoading(false);
  };

  const sel=(label,opts,key)=>(
    <div style={{marginBottom:'10px'}}>
      <div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'4px'}}>{label}</div>
      <select value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} style={{width:'100%',padding:'10px',borderRadius:'10px',border:`1.5px solid ${T.border}`,fontFamily:'Raleway',fontSize:'13px',color:T.text,background:T.bgCard,outline:'none'}}>
        <option value=''>— wählen</option>
        {opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return(
    <div style={{paddingBottom:'20px'}}>
      {/* Header */}
      <div style={{background:T.bgSoft,borderRadius:'16px',padding:'18px',marginBottom:'16px',border:`1.5px solid ${T.border}`,position:'relative',overflow:'hidden'}}>
        <Flower size={160} opacity={0.12} color={T.violet}/>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontFamily:'Cinzel',fontSize:'13px',color:T.violetD,letterSpacing:'2px',marginBottom:'4px'}}>⚙ HUMAN DESIGN</div>
          <div style={{fontFamily:'Raleway',fontWeight:800,fontSize:'20px',color:T.text}}>{displayType}</div>
          {form.hdProfile&&<div style={{fontFamily:'Raleway',fontSize:'13px',color:T.textMid,fontWeight:600,marginTop:'2px'}}>Profil {form.hdProfile} · {form.hdAuthority||''}</div>}
          {form.hdBirthDate&&<div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textSoft,marginTop:'6px'}}>📅 {form.hdBirthDate}{form.hdBirthTime?' · '+form.hdBirthTime:''}{form.hdBirthPlace?' · '+form.hdBirthPlace:''}</div>}
          <div style={{display:'flex',gap:'6px',marginTop:'10px',flexWrap:'wrap'}}>
            {[...defined].map(c=><span key={c} style={{fontSize:'10px',padding:'3px 10px',borderRadius:'20px',background:'rgba(255,255,255,0.8)',color:HD_CENTER_CFG[c]?.color,fontFamily:'Raleway',fontWeight:700,border:`1px solid ${HD_CENTER_CFG[c]?.color}`}}>{HD_CENTER_CFG[c]?.label}</span>)}
          </div>
        </div>
      </div>

      {/* Bodygraph */}
      {allGates.length>0&&(
        <Card style={{marginBottom:'16px',padding:'16px'}}>
          <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'12px'}}>⚙ Bodygraph</div>
          <div style={{display:'flex',gap:'12px',alignItems:'flex-start'}}>
            <div style={{flex:'0 0 auto'}}>
              <BodygraphSVG pgates={pgates} dgates={dgates} size={160}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textSoft,fontWeight:600,marginBottom:'8px'}}>Legende</div>
              {[[T.teal,'Persönlichkeit (bewusst)'],[T.violetD,'Beide Seiten'],['#DC2626','Design (unbewusst)']].map(([col,lbl])=>(
                <div key={lbl} style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'5px'}}>
                  <div style={{width:'20px',height:'3px',borderRadius:'2px',background:col}}/>
                  <span style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:600}}>{lbl}</span>
                </div>
              ))}
              <div style={{marginTop:'12px',fontFamily:'Raleway',fontSize:'11px',color:T.textMid,fontWeight:600}}>Definierte Zentren: <strong>{defined.size}</strong>/9</div>
              <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid}}>Offene Zentren: <strong>{9-defined.size}</strong>/9</div>
            </div>
          </div>
        </Card>
      )}

      {/* Type info */}
      {form.hdType&&HD_TYPE_DESC[form.hdType]&&(
        <Card style={{marginBottom:'16px',background:T.bgSoft,border:`1.5px solid ${T.borderMid}`}}>
          <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.tealD,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'8px'}}>✦ Strategie & Signatur</div>
          <div style={{fontFamily:'Raleway',fontSize:'12px',color:T.text,lineHeight:'1.6',marginBottom:'8px'}}>{HD_TYPE_DESC[form.hdType].desc}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {[['Strategie',HD_TYPE_DESC[form.hdType].strategy,T.tealL,T.tealD],['Signatur',HD_TYPE_DESC[form.hdType].signature,T.bgSoft,T.tealD],['Not-Self',HD_TYPE_DESC[form.hdType].notself,'#FEE2E2','#DC2626'],form.hdAuthority?['Autorität',HD_AUTHORITY_DESC[form.hdAuthority]||form.hdAuthority,T.violetL,T.violetD]:null].filter(Boolean).map(([k,v,bg,col])=>(
              <div key={k} style={{background:bg,borderRadius:'10px',padding:'10px',border:`1px solid ${T.border}`}}>
                <div style={{fontFamily:'Raleway',fontSize:'9px',fontWeight:800,color:col,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'3px'}}>{k}</div>
                <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.text,fontWeight:600,lineHeight:'1.4'}}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit / Form */}
      {editing?(
        <div style={{marginBottom:'16px'}}>
          {/* Step indicator */}
          <div style={{display:'flex',gap:'6px',marginBottom:'14px'}}>
            {['① Geburt & Typ','② Tore eingeben'].map((s,i)=>(
              <button key={i} onClick={()=>setGateStep(i)} style={{flex:1,padding:'9px',borderRadius:'12px',border:`1.5px solid ${gateStep===i?T.teal:T.border}`,background:gateStep===i?T.teal:T.bgCard,fontFamily:'Raleway',fontSize:'11px',fontWeight:700,color:gateStep===i?'white':T.textMid,cursor:'pointer'}}>
                {s}
              </button>
            ))}
          </div>

          {gateStep===0&&(
            <Card style={{border:`1.5px solid ${T.borderMid}`,background:T.bgSoft}}>
              <SL color={T.tealD}>Geburtsdaten</SL>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'10px'}}>
                <div><div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:700,marginBottom:'4px'}}>Datum</div><TI value={form.hdBirthDate} onChange={v=>setForm({...form,hdBirthDate:v})} placeholder="1990-06-15"/></div>
                <div><div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:700,marginBottom:'4px'}}>Uhrzeit</div><TI value={form.hdBirthTime} onChange={v=>setForm({...form,hdBirthTime:v})} placeholder="14:30"/></div>
              </div>
              <div style={{marginBottom:'12px'}}><div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:700,marginBottom:'4px'}}>Geburtsort</div><TI value={form.hdBirthPlace} onChange={v=>setForm({...form,hdBirthPlace:v})} placeholder="München, Deutschland"/></div>
              
              {/* mybodygraph link */}
              <a href={mybodygraphUrl()} target="_blank" rel="noreferrer" style={{display:'block',background:T.bgSoft,borderRadius:'12px',padding:'14px',marginBottom:'12px',border:`1.5px solid ${T.borderMid}`,textDecoration:'none'}}>
                <div style={{fontFamily:'Raleway',fontWeight:800,fontSize:'13px',color:T.violetD,marginBottom:'3px'}}>🔗 Chart auf mybodygraph.com öffnen →</div>
                <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid}}>Öffnet deinen persönlichen HD-Chart{form.hdBirthDate?' mit den eingetragenen Daten':' (Daten erst oben eingeben)'}</div>
              </a>
              
              {sel('HD-Typ (aus Chart ablesen)',['Manifestor','Generator','Manifesting Generator','Projektor','Reflektor'],'hdType')}
              {sel('Profil',['1/3','1/4','2/4','2/5','3/5','3/6','4/6','4/1','5/1','5/2','6/2','6/3'],'hdProfile')}
              {sel('Autorität',['Emotional','Sakral','Milz','Ego','Selbst','Mental','Lunar'],'hdAuthority')}
              
              <Btn onClick={()=>setGateStep(1)} style={{width:'100%',marginTop:'4px'}}>Weiter → Tore eingeben</Btn>
            </Card>
          )}

          {gateStep===1&&(
            <Card style={{border:`1.5px solid ${T.borderMid}`,background:T.bgSoft}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <SL color={T.tealD}>Tore antippen</SL>
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  {[['p',T.teal,'Persönl.'],['d','#DC2626','Design'],['b',T.violet,'Beide']].map(([v,col,lbl])=>(
                    <div key={v} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'2px',background:col}}/>
                      <span style={{fontFamily:'Raleway',fontSize:'9px',color:T.textMid,fontWeight:600}}>{lbl}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid,marginBottom:'10px',lineHeight:'1.5',background:T.bgCard,borderRadius:'8px',padding:'8px',border:`1px dashed ${T.border}`}}>
                👆 <strong>1× tippen</strong> = Persönlichkeit · <strong>2× tippen</strong> = Beide · <strong>3× tippen</strong> = nur Design · <strong>4× tippen</strong> = entfernen
              </div>
              {/* Gate Grid 8x8 */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:'4px',marginBottom:'12px'}}>
                {Array.from({length:64},(_,i)=>i+1).map(g=>{
                  const st=gateMap[g];
                  const bg=st==='p'?T.teal:st==='d'?'#DC2626':st==='b'?T.violet:T.bgCard;
                  const col=st?'white':T.textSoft;
                  return(
                    <button key={g} onClick={()=>tapGate(g)} style={{aspectRatio:'1',borderRadius:'6px',border:`1px solid ${st?(st==='p'?T.tealD:st==='d'?'#B91C1C':T.violetD):'#E2E8F0'}`,background:bg,fontFamily:'Raleway',fontSize:'10px',fontWeight:st?800:500,color:col,cursor:'pointer',transition:'all 0.1s',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {g}
                    </button>
                  );
                })}
              </div>
              <div style={{display:'flex',gap:'6px',background:T.bgCard,borderRadius:'10px',padding:'10px',marginBottom:'12px',border:`1px solid ${T.border}`}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'Raleway',fontSize:'9px',color:T.teal,fontWeight:700,marginBottom:'3px'}}>PERSÖNLICHKEIT ({pgates.length})</div>
                  <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.text}}>{pgates.sort((a,b)=>a-b).join(', ')||'–'}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'Raleway',fontSize:'9px',color:'#DC2626',fontWeight:700,marginBottom:'3px'}}>DESIGN ({dgates.length})</div>
                  <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.text}}>{dgates.sort((a,b)=>a-b).join(', ')||'–'}</div>
                </div>
              </div>
              {allGates.length>0&&calcType&&(
                <div style={{background:T.bgSoft,borderRadius:'10px',padding:'10px',marginBottom:'12px',border:`1px solid ${T.borderMid}`,fontFamily:'Raleway',fontSize:'12px',color:T.tealD,fontWeight:700}}>
                  ⚙ Berechneter Typ: {calcType}
                </div>
              )}
              <div style={{display:'flex',gap:'8px'}}>
                <Btn variant="soft" onClick={()=>setGateStep(0)} style={{flex:1}}>← Zurück</Btn>
                <Btn onClick={save} style={{flex:2}}>✓ Speichern</Btn>
              </div>
            </Card>
          )}
        </div>
      ):(
        <Btn variant="soft" onClick={()=>setEditing(true)} style={{width:'100%',marginBottom:'16px'}}>✏ HD-Daten bearbeiten</Btn>
      )}

      {/* KI Analysis */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
         <SL>✦ Resonanz-Analyse</SL>
          <Btn onClick={genAI} disabled={!hasData||aiLoading} style={{padding:'8px 16px',fontSize:'11px',opacity:(!hasData||aiLoading)?0.5:1}}>
            {aiLoading?'…':'⚙ Analysieren'}
          </Btn>
        </div>
        {!hasData&&<div style={{fontFamily:'Raleway',fontSize:'12px',color:T.textSoft,fontStyle:'italic',padding:'12px 0'}}>Bitte zuerst HD-Daten eingeben.</div>}
        {aiText&&<div style={{background:T.bgSoft,borderRadius:'14px',padding:'16px',border:`1.5px solid ${T.borderMid}`,fontFamily:'Raleway',fontSize:'13px',color:T.text,lineHeight:'1.7',whiteSpace:'pre-wrap'}}>{aiText}</div>}
      </div>
    </div>
  );
}

export { HD_GATE_CENTER, HD_CHANNELS, HD_CENTER_CFG, HD_TYPE_DESC, HD_AUTHORITY_DESC, BodygraphSVG, HDTab };
