import React, { useState, useEffect, useCallback, useRef } from "react";
import { T } from "../config/theme.js";
import { TI, Btn } from "../components/UI.jsx";
import { Flower } from "../components/Decorations";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "../config/firebase.js";
import { getFirestore, doc, setDoc } from "firebase/firestore";
const db = getFirestore();

function LoginScreen({ onLogin }){
  const [mode, setMode]           = useState("login");
  const [dsgvo, setDsgvo]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [remember, setRemember] = useState(!!localStorage.getItem("rememberedEmail"));
  // useRef for inputs — prevents focus loss on every keystroke
  const refEmail    = useRef();
  const refPassword = useRef();
  const refName     = useRef();
 const refPraxis = useRef();
    useEffect(()=>{
      const saved=localStorage.getItem("rememberedEmail");
      if(saved&&refEmail.current)refEmail.current.value=saved;
    },[]);

  const errMap = {
    "auth/email-already-in-use": "Diese E-Mail ist bereits registriert.",
    "auth/invalid-email": "Ungültige E-Mail-Adresse.",
    "auth/weak-password": "Passwort muss mindestens 6 Zeichen haben.",
    "auth/user-not-found": "Kein Konto mit dieser E-Mail gefunden.",
    "auth/wrong-password": "Falsches Passwort.",
    "auth/invalid-credential": "E-Mail oder Passwort falsch.",
    "auth/too-many-requests": "Zu viele Versuche. Bitte später nochmal versuchen.",
  };

  const submit = async () => {
    const email    = refEmail.current?.value?.trim() || "";
    const password = refPassword.current?.value || "";
    const name     = refName.current?.value?.trim() || "";
    const praxis   = refPraxis.current?.value?.trim() || "";
    setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!dsgvo)        { setError("Bitte Datenschutzerklärung akzeptieren."); setLoading(false); return; }
        if (!name)         { setError("Bitte deinen Namen eingeben."); setLoading(false); return; }
        if (!email)        { setError("Bitte E-Mail eingeben."); setLoading(false); return; }
        if (!password)     { setError("Bitte Passwort eingeben."); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid, "data", "lk_settings"), {
          value: JSON.stringify({ theme:"kristallwasser", currency:"CHF", defaultDuration:"60", autoLock:"5", pinEnabled:false, praxisname:praxis, subtitle:"", therapistName:name, defaultFee:"", disclaimer:"", modules:[], setupDone:false })
        });
        await setDoc(doc(db, "users", cred.user.uid, "profile"), { name, praxis, email, createdAt: new Date().toISOString() });
        onLogin(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
       if(remember)localStorage.setItem("rememberedEmail",email);else localStorage.removeItem("rememberedEmail");
        onLogin(cred.user);
      }
    } catch (e) {
      setError(errMap[e.code] || "Ein Fehler ist aufgetreten. Bitte versuche es nochmal.");
    }
    setLoading(false);
  };

  const inp = { width:"100%", padding:"14px 16px", borderRadius:"14px", border:`1.5px solid ${T.border}`, fontFamily:"Raleway", fontSize:"16px", color:T.text, background:"#FAFFFE", outline:"none", boxSizing:"border-box", WebkitAppearance:"none" };

  return (
    <div style={{background:`linear-gradient(160deg, #E8FAF8 0%, #F0EFFE 100%)`, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative", overflow:"hidden"}}>
      <div style={{position:"fixed",top:"-100px",right:"-100px",width:"350px",height:"350px",borderRadius:"50%",background:`radial-gradient(circle,${T.tealL} 0%,transparent 70%)`,opacity:0.8,pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:"5%",left:"-80px",width:"280px",height:"280px",borderRadius:"50%",background:`radial-gradient(circle,${T.violetL} 0%,transparent 70%)`,opacity:0.6,pointerEvents:"none"}}/>
      <div style={{width:"100%", maxWidth:"400px", position:"relative", zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:"center", marginBottom:"36px"}}>
          <div style={{width:"80px",height:"80px",borderRadius:"50%",background:`linear-gradient(135deg,${T.teal},#6D3FCC)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",margin:"0 auto 16px",boxShadow:`0 8px 32px rgba(13,148,136,0.35)`,color:"white"}}>✦</div>
          <div style={{fontFamily:"Cinzel", fontSize:"28px", color:T.text, fontWeight:700, letterSpacing:"3px"}}>LICHTKERN</div>
          <div style={{fontFamily:"Raleway", fontSize:"11px", color:T.textSoft, letterSpacing:"3px", marginTop:"5px", fontWeight:600}}>POWERED BY HUMAN RESONANZ</div>
        </div>

        {/* Card */}
        <div style={{background:"rgba(255,255,255,0.92)", backdropFilter:"blur(12px)", borderRadius:"24px", padding:"28px", boxShadow:"0 12px 48px rgba(13,148,136,0.15)", border:`1px solid rgba(178,224,220,0.6)`}}>
          {/* Tabs */}
          <div style={{display:"flex", background:T.bgSoft, borderRadius:"12px", padding:"4px", marginBottom:"24px"}}>
            {["login","register"].map(m => (
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",fontFamily:"Raleway",fontWeight:700,fontSize:"14px",cursor:"pointer",background:mode===m?"white":"transparent",color:mode===m?T.teal:T.textMid,boxShadow:mode===m?`0 2px 10px rgba(13,148,136,0.15)`:"none",transition:"all 0.2s"}}>
                {m === "login" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:"14px"}}>
            {mode === "register" && <>
              <input ref={refName} style={inp} placeholder="Dein Name *" autoComplete="name" />
              <input ref={refPraxis} style={inp} placeholder="Praxisname (optional)" autoComplete="organization" />
            </>}
            <input ref={refEmail} style={inp} type="email" placeholder="E-Mail *" autoComplete="email" onKeyDown={e=>e.key==="Enter"&&refPassword.current?.focus()} />
            <div style={{position:"relative"}}>
              <input ref={refPassword} style={{...inp, paddingRight:"52px"}} type={pwVisible?"text":"password"} placeholder="Passwort *" autoComplete={mode==="register"?"new-password":"current-password"} onKeyDown={e=>e.key==="Enter"&&submit()} />
              <button onClick={()=>setPwVisible(!pwVisible)} style={{position:"absolute",right:"14px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"18px",opacity:0.45,padding:"4px"}}>{pwVisible?"🙈":"👁️"}</button>
            </div>
{mode==="login"&&<label style={{display:"flex",gap:"8px",alignItems:"center",cursor:"pointer",padding:"4px 0"}}><input type="checkbox" checked={remember} onChange={e=>{setRemember(e.target.checked);if(!e.target.checked)localStorage.removeItem("rememberedEmail");}} style={{accentColor:"#C9A84C",width:"15px",height:"15px",flexShrink:0}}/><span style={{fontFamily:"Raleway",fontSize:"12px",color:"rgba(245,240,232,0.6)"}}>Angemeldet bleiben</span></label>}
            {mode === "register" && (
              <label style={{display:"flex", gap:"10px", alignItems:"flex-start", cursor:"pointer", padding:"4px 0"}}>
                <input type="checkbox" checked={dsgvo} onChange={e=>setDsgvo(e.target.checked)} style={{marginTop:"3px", accentColor:T.teal, width:"16px", height:"16px", flexShrink:0}} />
                <span style={{fontFamily:"Raleway", fontSize:"12px", color:T.textMid, lineHeight:"1.6"}}>
                  Ich akzeptiere die <span style={{color:T.teal, fontWeight:700}}>Datenschutzerklärung</span> und willige in die Verarbeitung meiner Daten gemäß DSGVO ein.
                </span>
              </label>
            )}

            {error && (
              <div style={{background:"#FFF0F0", border:"1px solid #FFCCCC", borderRadius:"12px", padding:"12px 16px", fontFamily:"Raleway", fontSize:"13px", color:"#CC0000", display:"flex", gap:"8px", alignItems:"center"}}>
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <button style={{width:"100%",padding:"16px",borderRadius:"14px",background:loading?"#ccc":`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"white",border:"none",fontFamily:"Raleway",fontWeight:700,fontSize:"16px",cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":`0 6px 24px rgba(13,148,136,0.35)`,marginTop:"4px",letterSpacing:"0.5px",transition:"all 0.2s"}} onClick={submit} disabled={loading}>
              {loading ? "⏳ Bitte warten..." : mode === "login" ? "Anmelden" : "Konto erstellen →"}
            </button>
          </div>
        </div>

        <div style={{textAlign:"center", marginTop:"20px", fontFamily:"Raleway", fontSize:"11px", color:T.textSoft, letterSpacing:"1px"}}>
          ✦ Deine Daten sind sicher in Europa gespeichert
        </div>
      </div>
    </div>
  );
}

export { LoginScreen };
