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

export { auth, db, fsGet, fsSet, fsDelete, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword };
