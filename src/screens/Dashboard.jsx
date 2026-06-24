import React, { useState, useEffect, useRef, useCallback } from "react";
import { todayStr } from '../config/helpers';
import { db, auth } from "../config/firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { groqFetch } from "../config/groq.js";

const GOLD = "#C9A84C";
const DARK = "#0F0F0F";
const DARK2 = "#1A1A1A";
const DARK3 = "#242424";
const LOGO = "/logo-siegel.png";
const FALLBACK = "Vertraue dem Fluss deiner Energie — sie führt dich dorthin, wo Heilung möglich ist.";

/* ─── SUPERNOVA EFFECT ─────────────────────────── */
function useSupernova(canvasRef, logoRef) {
  const particles = useRef([]);
  const rings = useRef([]);
  const rays = useRef([]);
  const starfield = useRef([]);
  const glow = useRef({ opacity: 0, radius: 0 });
  const coreGlow = useRef({ opacity: 0 });
  const running = useRef(false);
  const dims = useRef({ w: 0, h: 0, cx: 0, cy: 0 });

  const animate = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const { w, h, cx, cy } = dims.current;
    ctx.clearRect(0, 0, w, h);

    // Starfield
    for (let i = starfield.current.length - 1; i >= 0; i--) {
      const s = starfield.current[i];
      s.twinkle += s.speed;
      s.life--;
      if (s.life <= 0) { starfield.current.splice(i, 1); continue; }
      const a = (s.life / s.maxLife) * (0.3 + Math.sin(s.twinkle) * 0.2);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${a})`;
      ctx.fill();
    }

    // Core glow
    if (glow.current.opacity > 0) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glow.current.radius);
      g.addColorStop(0, `rgba(201,168,76,${glow.current.opacity})`);
      g.addColorStop(0.4, `rgba(201,168,76,${glow.current.opacity * 0.3})`);
      g.addColorStop(1, "rgba(201,168,76,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, glow.current.radius, 0, Math.PI * 2);
      ctx.fill();
      glow.current.radius += 1.5;
      glow.current.opacity *= 0.975;
      if (glow.current.opacity < 0.01) glow.current.opacity = 0;
    }

    // Center afterglow
    if (coreGlow.current.opacity > 0) {
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      cg.addColorStop(0, `rgba(255,240,200,${coreGlow.current.opacity * 0.4})`);
      cg.addColorStop(1, "rgba(201,168,76,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();
      coreGlow.current.opacity *= 0.97;
      if (coreGlow.current.opacity < 0.01) coreGlow.current.opacity = 0;
    }

    // Rays
    for (let i = rays.current.length - 1; i >= 0; i--) {
      const r = rays.current[i];
      if (r.length < r.maxLength) r.length += r.speed;
      else r.opacity -= 0.015;
      if (r.opacity <= 0) { rays.current.splice(i, 1); continue; }
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(r.angle);
      const lg = ctx.createLinearGradient(0, 0, r.length, 0);
      lg.addColorStop(0, `rgba(201,168,76,${r.opacity})`);
      lg.addColorStop(1, "rgba(201,168,76,0)");
      ctx.strokeStyle = lg;
      ctx.lineWidth = r.width;
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(25 + r.length, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Shockwave rings
    for (let i = rings.current.length - 1; i >= 0; i--) {
      const r = rings.current[i];
      r.radius += r.speed;
      r.opacity -= 0.008;
      if (r.opacity <= 0 || r.radius > r.maxRadius) { rings.current.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(cx, cy, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(201,168,76,${r.opacity})`;
      ctx.lineWidth = r.width;
      ctx.stroke();
    }

    // Particles
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      if (p.trail && p.life > 10) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        const ta = (p.life / p.maxLife) * 0.3;
        ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${ta})`;
        ctx.lineWidth = p.size * (p.life / p.maxLife) * 0.6;
        ctx.stroke();
      }
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.988; p.vy *= 0.988;
      if (p.ember) {
        p.vx += (Math.random() - 0.5) * 0.2;
        p.vy += (Math.random() - 0.5) * 0.2;
      }
      p.life--;
      if (p.life <= 0) { particles.current.splice(i, 1); continue; }
      const al = p.life / p.maxLife;
      const sz = p.size * al;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${al})`;
      ctx.fill();
      if (sz > 2) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${al * 0.1})`;
        ctx.fill();
      }
    }

    const alive = particles.current.length > 0 || rings.current.length > 0 || rays.current.length > 0 || starfield.current.length > 0 || glow.current.opacity > 0 || coreGlow.current.opacity > 0;
    if (alive) {
      requestAnimationFrame(animate);
    } else {
      running.current = false;
    }
  }, [canvasRef]);

  const fire = useCallback(() => {
    const cv = canvasRef.current;
    const logo = logoRef.current;
    if (!cv || !logo) return;

    const rect = cv.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cv.width = rect.width * dpr;
    cv.height = rect.height * dpr;
    cv.style.width = rect.width + "px";
    cv.style.height = rect.height + "px";
    const ctx2 = cv.getContext("2d");
    ctx2.setTransform(1, 0, 0, 1, 0, 0);
    ctx2.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const cx = w / 2, cy = h / 2;
    dims.current = { w, h, cx, cy };

    // Reset
    particles.current = [];
    rings.current = [];
    rays.current = [];
    starfield.current = [];

    // Logo squeeze + release
    logo.style.transition = "transform 0.12s cubic-bezier(0.4,0,1,1)";
    logo.style.transform = "scale(0.82)";
    setTimeout(() => {
      logo.style.transition = "transform 0.5s cubic-bezier(0,0.8,0.2,1.2)";
      logo.style.transform = "scale(1.12)";
      setTimeout(() => {
        logo.style.transition = "transform 0.4s ease-out";
        logo.style.transform = "scale(1)";
      }, 500);
    }, 120);

    // Screen shake
    const container = cv.parentElement;
    container.style.animation = "none";
    void container.offsetWidth;
    container.style.animation = "lk-shake 0.4s ease-out";

    // Spawn particles (100 main + 30 embers)
    for (let i = 0; i < 100; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 7;
      const sz = 1 + Math.random() * 3.5;
      const l = 50 + Math.floor(Math.random() * 60);
      const t = Math.random();
      particles.current.push({
        x: cx, y: cy,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        size: sz, life: l, maxLife: l,
        r: t < 0.6 ? 201 : t < 0.85 ? 255 : 255,
        g: t < 0.6 ? 168 : t < 0.85 ? 200 : 255,
        b: t < 0.6 ? 76 : t < 0.85 ? 120 : 220,
        trail: sz > 2.2
      });
    }
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 15 + Math.random() * 35;
      particles.current.push({
        x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d,
        vx: Math.cos(a) * (0.2 + Math.random() * 0.8),
        vy: Math.sin(a) * (0.2 + Math.random() * 0.8),
        size: 0.8 + Math.random() * 1.3,
        life: 80 + Math.floor(Math.random() * 50), maxLife: 130,
        r: 201, g: 168, b: 76, ember: true
      });
    }

    // Shockwave rings (5)
    for (let i = 0; i < 5; i++) {
      rings.current.push({ radius: 15, maxRadius: 160 + i * 60, opacity: 0.6 - i * 0.1, width: 2.5 - i * 0.4, speed: 3.5 + i * 1.2 });
    }

    // Light rays (16)
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 / 16) * i + (Math.random() - 0.5) * 0.3;
      rays.current.push({ angle: a, length: 0, maxLength: 80 + Math.random() * 100, opacity: 0.35 + Math.random() * 0.25, width: 1 + Math.random() * 1.5, speed: 5 + Math.random() * 3 });
    }

    // Starfield (60)
    for (let i = 0; i < 60; i++) {
      starfield.current.push({
        x: Math.random() * w, y: Math.random() * h,
        size: 0.4 + Math.random() * 1.2,
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.04,
        life: 70 + Math.floor(Math.random() * 70), maxLife: 140
      });
    }

    glow.current = { opacity: 0.6, radius: 40 };
    coreGlow.current = { opacity: 1 };

    if (!running.current) {
      running.current = true;
      requestAnimationFrame(animate);
    }
  }, [canvasRef, logoRef, animate]);

  return fire;
}

/* ─── CATEGORY TILES ───────────────────────────── */
const CATEGORIES = [
  { id: "praxis", label: "Praxis", sub: "Klienten · Termine · Abrechnung", icon: "◈", items: [
    { id: "clients", label: "Klienten", icon: "◈" },
    { id: "calendar", label: "Kalender", icon: "◷" },
    { id: "billing", label: "Abrechnung", icon: "◈" },
  ]},
  { id: "resonanz", label: "Resonanz", sub: "HD · Numerologie · Analyse", icon: "✦", items: [
    { id: "humandesign", label: "Human Design", icon: "⬡" },
    { id: "synergy", label: "Numerologie", icon: "✧" },
    { id: "oracle", label: "Resonanz-Analyse", icon: "✦" },
    { id: "gentree", label: "Resonanzkarte", icon: "⊛" },
  ]},
  { id: "analyse", label: "Analyse", sub: "Analytics · Verlauf", icon: "⊕", items: [
    { id: "analytics", label: "Analytics", icon: "⊕" },
    { id: "history", label: "Verlauf", icon: "◎" },
  ]},
];

function CategoryTile({ cat, onNav, open, onToggle }) {
  const [hover, setHover] = useState(false);
  const [itemHover, setItemHover] = useState(null);
  return (
    <div>
      <button
        onClick={onToggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: open ? "rgba(201,168,76,0.1)" : hover ? "rgba(201,168,76,0.07)" : DARK2,
          borderTop:    `1px solid ${open || hover ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.15)"}`,
          borderLeft:   `1px solid ${open || hover ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.15)"}`,
          borderRight:  `1px solid ${open || hover ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.15)"}`,
          borderBottom: open ? "1px solid rgba(201,168,76,0.08)" : `1px solid ${hover ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.15)"}`,
          borderRadius: open ? "14px 14px 0 0" : "14px",
          padding: "20px 12px",
          textAlign: "center",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          transition: "all 0.25s",
        }}
      >
        <span style={{ fontSize: "26px", color: open || hover ? GOLD : "rgba(201,168,76,0.45)", transition: "all 0.25s" }}>{cat.icon}</span>
        <span style={{ fontFamily: "Raleway", fontSize: "13px", color: open || hover ? "rgba(245,240,232,0.95)" : "rgba(245,240,232,0.7)", fontWeight: 600, letterSpacing: "0.5px", transition: "all 0.25s" }}>{cat.label}</span>
        <span style={{ fontFamily: "Raleway", fontSize: "10px", color: "rgba(245,240,232,0.25)" }}>{cat.sub}</span>
      </button>
      <div style={{
        overflow: "hidden",
        maxHeight: open ? "240px" : "0",
        transition: "max-height 0.3s ease",
        background: "#161616",
        border: open ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
        borderTop: "none",
        borderRadius: "0 0 14px 14px",
      }}>
        {cat.items.map(item => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            onMouseEnter={() => setItemHover(item.id)}
            onMouseLeave={() => setItemHover(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 16px",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              borderBottom: "1px solid rgba(201,168,76,0.06)",
              background: itemHover === item.id ? "rgba(201,168,76,0.1)" : "transparent",
              color: itemHover === item.id ? GOLD : "rgba(245,240,232,0.65)",
              cursor: "pointer",
              fontFamily: "Raleway",
              fontSize: "12px",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: "14px", opacity: 0.7 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── DASHBOARD ────────────────────────────────── */
function Dashboard({ clients, sessions, appointments, onNav, settings }) {
  const [impuls, setImpuls] = useState("");
  const [impulsLoading, setImpulsLoading] = useState(true);
  const [impulsDate, setImpulsDate] = useState(todayStr);
  const [openCategory, setOpenCategory] = useState(null);
  const canvasRef = useRef(null);
  const logoRef = useRef(null);
  const fireSupernova = useSupernova(canvasRef, logoRef);

  const today = todayStr();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Guten Morgen" : hour < 17 ? "Guten Tag" : "Guten Abend";
  const name = settings?.therapistName ? settings.therapistName.split(" ")[0] : "";
  const praxis = settings?.praxisname || "";

  // Next appointment
  const nextAppt = (appointments || [])
    .filter(a => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0];

  // Last activity (last 3 sessions)
  const recentSessions = (sessions || [])
    .filter(s => s.clientId).slice(0, 3)
    .map(s => {
      const client = (clients || []).find(c => c.id === s.clientId || c.clientId === s.clientId);
      const daysDiff = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 86400000);
      return { ...s, clientName: client?.name || s.clientName || "Unbekannt", initials: (client?.name || "??").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2), daysAgo: daysDiff };
    });

  // Visibility change for daily refresh
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") setImpulsDate(todayStr()); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

 // Load Resonanz-Impuls
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (!user) { setImpuls(FALLBACK); setImpulsLoading(false); return; }
    
    async function ladeImpuls() {
      const currentDay = todayStr();
      try {
        const ref = doc(db, "users", user.uid, "data", "resonanz_impuls");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.datum === currentDay && data.text && data.text !== FALLBACK) {
            setImpuls(data.text);
            setImpulsLoading(false);
            return;
          }
        }
        console.log("[Impuls] Groq wird aufgerufen...");
        const text = await groqFetch([{
          role: "user",
          content: "Generiere einen einzigen kurzen Resonanz-Impuls für Energetiker und Heiler. Maximal 2 Sätze. Tiefgründig, poetisch, inspirierend. Keine Anführungszeichen, keine Erklärung, nur den Impuls selbst."
        }]);
        console.log("[Impuls] Groq Antwort:", text);
        if (!text || text.startsWith("Fehler") || text.length < 10) {
          console.warn("[Impuls] Groq ungültig, zeige Fallback");
          setImpuls(FALLBACK);
          setImpulsLoading(false);
          return;
        }
        await setDoc(ref, { datum: currentDay, text });
        setImpuls(text);
      } catch (e) {
        console.error("[Impuls] Fehler:", e);
        setImpuls(FALLBACK);
      } finally {
        setImpulsLoading(false);
      }
    }
    
    setImpulsLoading(true);
    ladeImpuls();
  });
  
  return () => unsubscribe();
}, [impulsDate]);  return (
    <div style={{ minHeight: "100vh", background: DARK, padding: "0 20px 120px" }}>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", padding: "32px 0 20px", borderBottom: "1px solid rgba(201,168,76,0.2)", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
        {/* Supernova Canvas */}
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} />
        {/* Whiteout flash */}
        <div id="lk-flash" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "radial-gradient(circle at 50% 40%, rgba(255,240,200,0.9) 0%, rgba(201,168,76,0.3) 40%, transparent 70%)", opacity: 0, pointerEvents: "none", zIndex: 2, transition: "opacity 0.08s" }} />

        <div style={{ position: "relative", zIndex: 3 }}>
          <img
            ref={logoRef}
            src={LOGO}
            onClick={() => {
              fireSupernova();
              // Flash
              const flash = document.getElementById("lk-flash");
              if (flash) {
                flash.style.transition = "opacity 0.06s";
                flash.style.opacity = "1";
                setTimeout(() => { flash.style.transition = "opacity 0.7s ease-out"; flash.style.opacity = "0"; }, 60);
              }
            }}
            style={{ width: "80px", height: "80px", objectFit: "contain", marginBottom: "12px", cursor: "pointer", transition: "transform 0.3s" }}
          />
          <div style={{ fontFamily: "Raleway", fontSize: "9px", letterSpacing: "5px", color: GOLD, marginBottom: "4px" }}>HUMAN RESONANZ</div>
          <div style={{ fontFamily: "Cinzel", fontSize: "26px", letterSpacing: "6px", color: "#F5F0E8", fontWeight: 700, textShadow: "0 0 30px rgba(201,168,76,0.2)" }}>LICHTKERN</div>
          <div style={{ fontFamily: "Raleway", fontSize: "8px", letterSpacing: "3px", color: "rgba(245,240,232,0.3)", marginTop: "4px" }}>POWERED BY HUMAN RESONANZ</div>
        </div>
      </div>

      {/* ── Begrüßung ── */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontFamily: "Cinzel", fontSize: "14px", color: GOLD, letterSpacing: "2px", marginBottom: "6px" }}>{greeting}{name ? `, ${name}` : ""} ✦</div>
        {praxis && <div style={{ fontFamily: "Raleway", fontSize: "11px", color: "rgba(245,240,232,0.45)", letterSpacing: "2px" }}>— {praxis} —</div>}
      </div>

      {/* ── 3 Kategorie-Kacheln ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "24px", alignItems: "start" }}>
        {CATEGORIES.map(cat => (
          <CategoryTile
            key={cat.id}
            cat={cat}
            onNav={onNav}
            open={openCategory === cat.id}
            onToggle={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
          />
        ))}
      </div>

      {/* ── Nächster Termin ── */}
      <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px" }}>
        <div style={{ fontFamily: "Raleway", fontSize: "9px", color: "rgba(201,168,76,0.5)", letterSpacing: "3px", fontWeight: 700, marginBottom: "8px" }}>NÄCHSTER TERMIN</div>
        {nextAppt ? (
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ fontFamily: "Cinzel", fontSize: "20px", color: GOLD, fontWeight: 600 }}>{nextAppt.startTime}</div>
            <div>
              <div style={{ fontFamily: "Raleway", fontSize: "14px", color: "rgba(245,240,232,0.85)", fontWeight: 600 }}>{nextAppt.clientName || nextAppt.title || "Termin"}</div>
              <div style={{ fontFamily: "Raleway", fontSize: "12px", color: "rgba(245,240,232,0.35)", marginTop: "1px" }}>
                {nextAppt.date === today ? "Heute" : nextAppt.date}{nextAppt.type ? ` · ${nextAppt.type}` : ""}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: "Raleway", fontSize: "13px", color: "rgba(245,240,232,0.25)", fontStyle: "italic" }}>Keine anstehenden Termine</div>
        )}
      </div>

      {/* ── Letzte Aktivität ── */}
      {recentSessions.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontFamily: "Raleway", fontSize: "9px", color: "rgba(245,240,232,0.25)", letterSpacing: "3px", fontWeight: 700, marginBottom: "10px" }}>LETZTE AKTIVITÄT</div>
          {recentSessions.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontFamily: "Raleway", fontSize: "11px", fontWeight: 600, flexShrink: 0 }}>{s.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "Raleway", fontSize: "12px", color: "rgba(245,240,232,0.75)", fontWeight: 600 }}>{s.clientName}</div>
                <div style={{ fontFamily: "Raleway", fontSize: "11px", color: "rgba(245,240,232,0.3)" }}>Sitzung{s.category ? ` · ${s.category}` : ""}</div>
              </div>
              <div style={{ fontFamily: "Raleway", fontSize: "10px", color: "rgba(245,240,232,0.2)", flexShrink: 0 }}>
                {s.daysAgo === 0 ? "Heute" : s.daysAgo === 1 ? "Gestern" : `vor ${s.daysAgo}d`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Resonanz-Impuls (ganz unten) ── */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.15)", paddingTop: "20px" }}>
        <div style={{ fontFamily: "Raleway", fontSize: "9px", letterSpacing: "3px", color: "rgba(201,168,76,0.5)", marginBottom: "12px", textAlign: "center" }}>✦ RESONANZ-IMPULS</div>
        {impulsLoading ? (
          <div style={{ textAlign: "center", fontFamily: "Raleway", fontSize: "11px", color: "rgba(245,240,232,0.2)", letterSpacing: "1px" }}>wird empfangen ...</div>
        ) : (
          <div style={{ fontFamily: "Cinzel", fontSize: "13px", color: "rgba(245,240,232,0.7)", lineHeight: "1.8", textAlign: "center", fontStyle: "italic", padding: "0 12px" }}>{impuls}</div>
        )}
        <div style={{ textAlign: "center", marginTop: "12px", fontFamily: "Raleway", fontSize: "9px", color: "rgba(201,168,76,0.3)", letterSpacing: "2px" }}>— täglich neu —</div>
      </div>

    </div>
  );
}

export { Dashboard };
export default Dashboard;
