// scripts/setup-einladungscodes.js
// Einmalig ausführen: node scripts/setup-einladungscodes.js
// Voraussetzung: scripts/serviceAccount.json muss vorhanden sein (Firebase Console → Project Settings → Service Accounts → Generate new private key)
const admin = require("firebase-admin");
const fs    = require("fs");
const path  = require("path");

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccount.json"), "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const CODES = [
  "Herzklang", "Lichtanker", "Seelenfunke", "Resonanzherz", "Urvertrauen",
  "Goldfaden", "Wegbegleiter", "Sternenlicht", "Innenleuchten", "Klangwurzel",
  "Mondsilber", "Lebensstrom", "Herzoeffnung", "Seelenpfad", "Lichtweber",
  "Klarsicht", "Erdkraft", "Sonnenkern", "Stillepunkt", "Wandlungskraft",
];

async function setup() {
  const batch = db.batch();
  for (const code of CODES) {
    const ref = db.collection("einladungscodes").doc(code.toLowerCase());
    batch.set(ref, { code, used: false, usedBy: null, usedAt: null });
  }
  await batch.commit();
  console.log(`\n✓ ${CODES.length} Einladungscodes angelegt:\n`);
  CODES.forEach(c => console.log(`  ${c.toLowerCase().padEnd(20)} → ${c}`));
  process.exit(0);
}

setup().catch(e => { console.error("Fehler:", e.message); process.exit(1); });
