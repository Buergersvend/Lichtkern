import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

// ─── FIREBASE CONFIG ──────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDPxV2D36zoCawfSM4C-x3jlcW-Pu5L1n4",
  authDomain: "lichtkern-43757.firebaseapp.com",
  projectId: "lichtkern-43757",
  storageBucket: "lichtkern-43757.firebasestorage.app",
  messagingSenderId: "72774063015",
  appId: "1:72774063015:web:4e9457a91d6ad49f1f5c82",
  measurementId: "G-8PLHVC81YQ"
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db   = getFirestore(firebaseApp);

// ─── GROQ KI-API (sicher via Serverless Proxy) ────
// Der API-Key liegt nur auf dem Vercel-Server – nie im Browser sichtbar!
const _GROQ_PLACEHOLDER = null; // Key nur serverseitig in /api/ki.js
const groqFetch = async (prompt) => {
  const r = await fetch("/api/ki", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.text || "Fehler.";
};

// ─── FIRESTORE STORAGE (ersetzt window.storage) ──
const fsGet = async (userId, key) => {
  try {
    const snap = await getDoc(doc(db, "users", userId, "data", key));
    if (snap.exists()) return { value: snap.data().value };
    return null;
  } catch { return null; }
};
const fsSet = async (userId, key, value) => {
  try { await setDoc(doc(db, "users", userId, "data", key), { value }); } catch {}
};
const fsDelete = async (userId, key) => {
  try { await deleteDoc(doc(db, "users", userId, "data", key)); } catch {}
};

// ─── KRISTALLWASSER TOKENS ───────────────────
const T = {
  bg:"#F0FAFA", bgCard:"#FFFFFF", bgSoft:"#E6F7F7", bgSofter:"#F5FDFD",
  border:"#B2E0DC", borderMid:"#7EC8C2",

export { auth, db, groqFetch, fsGet, fsSet, fsDelete, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword };
