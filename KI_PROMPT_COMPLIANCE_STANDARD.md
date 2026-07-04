# 🛡️ KI-PROMPT-COMPLIANCE-STANDARD — Human Resonanz · v2.0

> **Verbindlich ab 04.07.2026** · löst v1.0 vom 25.06.2026 vollständig ab
> Gilt für alle user-sichtbaren KI-Prompts über alle Produkte (Lichtkern, Lernwelt, Homepage, künftige Features)
> Zweck: Eigenständige, dokumentierte Prüfung jedes KI-Prompts auf HeilprG-/HWG-/UWG-/DSGVO-Risiken — ohne Anwalt für jeden Einzelfall.
> Adressat: Sven (Eigenprüfung). Anwalt (Dubiel/Ruch) nur für große Mandate, nicht für laufende Prompt-Pflege.
> Ablage: Rechtliches & Compliance · Referenz-Implementierung: Repo Lichtkern, Stand Commits `6cdb21f`–`c742d5d` (04.07.2026)

---

## 1 · Grundsatz

Ein KI-Prompt **steuert, was die KI dem Nutzer sagt**. Er ist damit so haftungsrelevant wie eine schriftliche Aussage des Unternehmens selbst. Jeder Prompt, der heilkunde-, gesundheits- oder befähigungsnahe Themen berührt, durchläuft vor dem Einsatz das **Fünf-Punkte-Raster**. Bestehen = Einsatz erlaubt. Durchfallen = entschärfen, dann erneut prüfen.

Seit 04.07. gilt zusätzlich: **Ein sanierter Prompt genügt nicht.** Die KI kann trotz sauberem Prompt driften, und ungefilterte Ausgaben können persistiert und an anderen Stellen (History, Wissensbasis, PDF) wieder auftauchen. Compliance ist erst erreicht, wenn das **Drei-Teile-Muster** (Abschnitt 5) vollständig umgesetzt ist.

Dieses Dokument ist eine strukturierte Selbstprüfung, **kein Rechtsgutachten**. Es macht Entscheidungen systematisch und dokumentierbar — und dokumentierte Sorgfalt ist im Streitfall der beste Schutz gegen den Vorwurf der Fahrlässigkeit.

---

## 2 · Das Fünf-Punkte-Raster

Jeder Prompt wird gegen diese fünf Fragen geprüft. **Eine einzige Verletzung = Prompt nicht freigeben.**
(Punkt 5 ist neu ab 04.07.2026 — DSGVO-Dimension, prüft den Payload, nicht den Prompt-Text.)

| # | Prüffrage | Bei „Ja" / Fehlen |
|---|---|---|
| **1** | **Heilversprechen?** Verspricht oder suggeriert der Prompt Heilung, Linderung, Therapie, Diagnose oder eine Symptom→Ursache-Deutung? Enthalten Output-Sektionen Begriffe wie „Heilungsimpulse/Heilungsansätze"? | ❌ Formulierung entfernen / umschreiben |
| **2** | **Befähigungs-Anmaßung?** Suggeriert er eine Lizenz, amtliche Berechtigung, Ausbildungs-/Zertifizierungsbefugnis — oder eine **heilkundliche Rollen­zuschreibung** („Therapeut in einer Heilpraxis", „therapeutische Begleitung", „Fallarbeit")? | ❌ entfernen / auf Begleiter-Rolle bzw. „Kompetenz/Abschlussstufe" umstellen |
| **3** | **Pseudowissenschaft als Wirkversprechen?** Werden quasi-wissenschaftliche Begriffe (Quanten-, Frequenz-, „wissenschaftlich erwiesen") als belegte Wirkung dargestellt? | ❌ entschärfen / als symbolisch kennzeichnen |
| **4** | **Verweisgrenze vorhanden?** Steht **im Prompt selbst** die Anweisung: keine medizinischen Aussagen + der Pflicht-Verweissatz (Abschnitt 4.3)? | ⚠️ Wenn nein: ergänzen |
| **5** | **Payload anonymisiert?** Gehen Klarname, Geburtsname oder freie Notizfelder an die US-API? Gilt für **alle** Personen im Payload (Klient UND Referenzperson → „Anonym" / „Anonym B"). | ❌ Payload minimieren. Geburtsdatum allein ist ok (fachlich nötig, ohne Namen nicht identifizierend). UI/Druck behalten Klarnamen bewusst — für den Menschen, nicht für die API. |

**Wichtig zu Punkt 2:** Raster-Verletzungen stecken oft nicht in einzelnen Reizwörtern, sondern in der **Rollen- und Kontextbeschreibung**. Deshalb ist der Inhalts-Grep (Abschnitt 7.1) Pflicht — ein reiner Wort-Grep findet Punkt-2-Inhalte nicht.

---

## 3 · Reizwort-Liste (Trigger für genaue Prüfung)

Taucht eines dieser Wörter im Prompt oder in statischen Datenwerten auf, die in den Prompt einfließen → Raster zwingend anwenden:

**Heilkunde (Punkt 1):** heilen, Heilung, Heiler, Therapie, therapieren, behandeln, Behandlung, Diagnose, diagnostizieren, Symptom, Krankheit, Beschwerden lindern, Schmerz, Heilpflanze, Dosierung, Fernheilung, Fern-Anwendung

**Wirkaussagen (Punkt 1, neu 04.07.):** wirkte, reduzierte, einwirkten, spürbar verändert — jede Formulierung, die eine Wirkung **der Methode auf ein Körpersymptom** behauptet

**Befähigung (Punkt 2):** Lizenz, lizenziert, Ausbildungsleitung, ausbilden, Lehrerlaubnis, zertifiziert (amtlich), Approbation, Praxiserlaubnis, Heilpraxis, therapeutische Begleitung, Fallarbeit

**Pseudowissenschaft (Punkt 3):** Quanten-/Quantenheilung, Frequenztherapie, „wissenschaftlich erwiesen/bewiesen", „medizinisch belegt", Aura-Chirurgie, Zellheilung

**Heilkunde-Vokabular (Graubereich — Punkt 1 + 4):** Praxis (im Heilkunde-Sinn), Praxisarbeit, Patient, Klientenbehandlung, Anamnese, Befund, somatisch

**DSGVO (Punkt 5):** name, birthName, Notizfeld/notes im API-Payload

---

## 4 · Der sanierte Prompt-Standard

**Referenz-Implementierung: `Session.jsx` → `_aiPrompt3`** (Resonanz-Zusammenfassung, saniert 04.07., Commit `4181dd5`). Jeder neue oder überarbeitete Prompt folgt diesem Bauplan:

### 4.1 Pflicht-Bausteine

1. **Begleiter-Rolle** — nie Therapeut/Heiler/Analytiker, nie Heilpraxis-Kontext. Formulierung: „erfahrener Begleiter".
2. **Seelisch-symbolische Ebene** — explizit im Prompt verankert: Deutung auf symbolischer Ebene, keine medizinische oder körperliche Aussageebene.
3. **Wahrnehmungs-Framing** — Beobachtungen werden **dem Klienten zugeschrieben, nie der Technik**. Muster: „Der Klient nahm wahr, dass …" statt „Die Methode bewirkte, dass …". Erlaubt: „gemeinsam nach Wegen suchen". Verboten: Methode↔Körpersymptom-Kausalität.
4. **Verbotsliste im Prompt** — explizite Negativ-Anweisung mindestens für: *wirkte, reduzierte, einwirkten, spürbar verändert*.
5. **Pflicht-Verweissatz** (4.3) — fest oder bedingt, je nach Fläche.
6. **Markdown-Verbot** — keine Sternchen/Formatierung im Output (Anzeige rendert kein Markdown).

### 4.2 Etablierte Ersetzungsregeln

| Statt … | … verwenden |
|---|---|
| energetisch (als Wirkung) | seelisch-symbolisch / auf symbolischer Ebene |
| Heiler / Leiter / Therapeut (Rolle) | Begleiter / erfahrener Begleiter |
| Heilung / heilen | Begleitung / Selbstwahrnehmung / persönliche Entwicklung / Ganzwerdung |
| Heilungsimpulse / Heilungsansätze (Output-Sektion) | Impulse zur Selbstwahrnehmung |
| Praxis (Heilkunde) / Heilpraxis | Begleitung / Alltag |
| Anamnese (Formular) | **Aufnahmebogen** |
| Anamnese (erste Sitzung) | **Erstgespräch** |
| Anamnese (Technik-Kategorie) | **Bestandsaufnahme** |
| Praxisanleitung / Indikationen / Schrittanleitung | Betrachtung / Selbstwahrnehmung / Selbstreflexion |
| Heilpflanze | wirksame Pflanze |
| Patient / Klientenbehandlung | Mensch / Begleitung |
| Lehrerlizenz / Lizenz | Geprüfte Kompetenz / Abschlussstufe |
| Fernheilung | Verbindung über Distanz / Arbeit auf Distanz |
| „Methode wirkte / reduzierte X" | „Der Klient nahm wahr, dass …" / „gemeinsam nach Wegen suchen" |
| Symptom X bedeutet Ursache Y | symbolische Betrachtung, keine Deutung |
| „Therapeut und Klient …" (UI-Text) | „Du und dein Klient …" |

**Terminologie-Dreiklang (Beschluss 04.07.):** Aufnahmebogen = Dokument · Erstgespräch = erste Sitzung · Bestandsaufnahme = Technik-Kategorie. Drei Begriffe für drei Dinge — nicht mischen.

### 4.3 Pflicht-Verweissatz (wortgleich)

> **„Bei körperlichen oder gesundheitlichen Beschwerden gehört die Abklärung zu Arzt, Heilpraktiker oder Therapeut."**

- Gehört **in den Prompt selbst**, nicht nur in UI-Disclaimer — die KI trägt ihn als Verhaltensregel.
- **Fest** (Satz erscheint immer im Output) bei Flächen mit Körper-/Gesundheitsbezug (Session-Zusammenfassung, Numerologie-Analyse, OracleAgent).
- **Bedingt** (nur bei Gesundheitsthemen) bei rein symbolischen Flächen zulässig.
- **Ausnahme dokumentiert (Beschluss 04.07.):** ResonanzKarte — kein Verweissatz im Kartentext selbst; statischer Print-/UI-Disclaimer + Filter + Wirkverbot genügen.
- Der Satz enthält „Heilpraktiker" und „gesundheitlich…" → deshalb die Filter-Ausnahmen in Abschnitt 6.

---

## 5 · Drei-Teile-Muster + Senken-Regel

**Ein Prompt allein ist keine Sicherung.** Jede KI-Fläche braucht alle drei Teile:

| Teil | Was | Warum |
|---|---|---|
| **① Prompt** | Sanierter Prompt nach Abschnitt 4 | Steuert das Sollverhalten |
| **② Runtime-Filter** | `reizwortFilter.js` auf jede KI-Antwort **am State-Eingang** | Fängt Drift ab, bevor irgendein Konsument die Antwort sieht |
| **③ Senken-Prüfung** | Alle Persistenz- und Weitergabepfade prüfen | Ungefilterte Ausgaben dürfen nirgends gespeichert oder weitergereicht werden |

### Senken-Regel (Kern-Lektion 04.07.)

**Filter nur an der Anzeige ist ein Loch.** Der Filter gehört an den **State-Eingang** (dort, wo die API-Antwort in den State geschrieben wird) — dann sind automatisch alle Konsumenten versorgt.

- **Positiv-Beispiel Session:** Filter am State-Eingang → History, Knowledge und PDFModal konsumieren nur die gefilterte `aiSummary` ✓
- **Negativ-Beispiel (gefixt):** ResonanzKarte speicherte die rohe Antwort in die Persistenz, obwohl die Anzeige filterte → **Speicher-Guard `if (!istReizwort)`** ergänzt
- **BeziehungsResonanz:** zwei Senken (`setRefData` + `onSave`) — beide einzeln abgesichert
- **HumanDesign:** keine Persistenz → Anzeige-Filter genügt (dokumentierte Ausnahme)

**Checkliste Senken pro Komponente:** State-Set · Firestore-Save · localStorage · Weitergabe an andere Komponenten (Props/Context) · PDF-/Druck-Erzeugung · History/Wissensbasis.

---

## 6 · reizwortFilter.js (zentrale Instanz)

- **Ein zentrales Modul** — kein komponentenlokaler Filter-Code. Änderungen wirken automatisch für alle Konsumenten (so wurde am 04.07. nebenbei ein latenter Bestands-Bug im HeilungsGuide behoben).
- Substring-Match auf Reizwort-Liste; bei Treffer wird die Antwort blockiert/ersetzt.
- **`REIZWORT_AUSNAHMEN = ["heilpraktiker", "heilungsversprechen"]`** — Pflicht, sonst blockt der Substring-Match („heil") den eigenen Pflicht-Verweissatz und Formulierungen wie „ohne Heilungsversprechen".
- **„symptom" bleibt in der Liste** (Beschluss 04.07., Option A — konservativ). Live-Tests zeigten keine False-Positive-Blocks. Status: **beobachten**; bei gehäuften False Positives Ausnahme- oder Kontextlogik erwägen.
- Der Filter strippt zusätzlich Markdown-Sternchen (`**`).

---

## 7 · Pflicht-Prüfverfahren

### 7.1 Inhalts-Grep (vor jedem Komponenten-Abhaken)

Wort-Grep nach Reizwörtern findet keine Raster-Punkt-2-Inhalte (Rollenbeschreibungen, Kontexte). Deshalb zusätzlich immer:

```
"eut|Klient|Fallarbeit|Praxis|Symptom|somat|Diagnos|Befund"
```

(PS: `Get-ChildItem … | Select-String` — kein `-Recurse` auf Select-String in PowerShell 5.1.)

Wirksamkeitsnachweis: Dieser Grep fand am 04.07. den kompletten OrganspracheKarte-Lehrgang und alle vier Prio-2-Prompt-Fails, die der Wort-Grep übersehen hatte.

**Gilt auch für statische Datenkataloge**, die in Prompts einfließen (ORGAN_MAP-Fall, Numerology-Archetypen): Datenwerte sind Prompt-Inhalt.

### 7.2 Live-Gegentest (nach Deploy, vor Abhaken)

Je Fläche mindestens **eine echte Anfrage** in der Live-Umgebung, bewertet gegen das Fünf-Punkte-Raster. Vorher Vercel-Deployment-Timestamp gegen Testzeitpunkt prüfen.

### 7.3 Pflicht-Workflow zusammengefasst

1. Reizwort-Scan (Liste Abschnitt 3) + Inhalts-Grep (7.1) — auch auf einfließende Datenwerte
2. Fünf-Punkte-Raster einzeln beantworten
3. Verletzungen mit Ersetzungsregeln (4.2) beheben; Prompt nach Bauplan (4.1) aufbauen
4. Drei-Teile-Muster prüfen: Filter am State-Eingang? Alle Senken abgesichert?
5. Payload prüfen (Raster-Punkt 5) — alle Personen anonymisiert?
6. Deploy → Live-Gegentest (7.2)
7. Änderung + Datum dokumentieren (Commit-Message reicht)
8. Nur bei echter Unsicherheit / hohem kommerziellem Risiko: Anwalt (Ruch/Dubiel)

---

## 8 · Baseline (Nachweis-Samples, Stand 04.07.2026)

### 8.1 Vorher/Nachher — Resonanz-Zusammenfassung (Session, Schritt 5/5)

**Vorher (Raster 2/4 ✗):**
> „wirkten auf Körperpunkte ein, um Druck und erhöhten Herzschlag zu reduzieren … spürbar, wie sich der Körper veränderte"
> → Wirkaussage Methode↔Körpersymptom (Punkt 1 ✗), keine Verweisgrenze (Punkt 4 ✗)

**Nachher (Raster 4/4 ✓):**
> „konnten wir gemeinsam nach Wegen suchen … Der Klient nahm wahr, dass er sich ruhiger fühlte" + Pflicht-Verweissatz
> → Wahrnehmung dem Klienten zugeschrieben, nie der Methode

### 8.2 Vorher/Nachher — Prio-2-Prompt-Muster (Numerology, ResonanzKarte, BeziehungsResonanz, HumanDesign)

**Vorher (identisches Muster in allen vier):** Rolle „Therapeut/Analytiker in einer Heilpraxis … therapeutische Begleitung" (Punkt 2 ✗) · Output-Sektionen „Heilungsimpulse/Heilungsansätze" (Punkt 1 ✗) · keine Verweisgrenze (Punkt 4 ✗) · kein Filter · Klarnamen im Payload (Punkt 5 ✗)

**Nachher:** Begleiter-Framing · „Impulse zur Selbstwahrnehmung" · Verweisgrenze · zentraler Filter · Payload anonym (inkl. Referenzperson „Anonym B")

### 8.3 Referenzbeispiel v1 (25.06., weiterhin gültig)

**Vorher:** „Du bist Leiter der Human Resonanz Akademie und vermittelst professionelles energetisches Heiler-Wissen."
**Nachher:** „Du bist ein erfahrener Begleiter der Human Resonanz Lernwelt. Du vermittelst Wissen über energetische Selbstwahrnehmung, Bewusstseinsarbeit und persönliche Entwicklung — auf einer seelisch-symbolischen Ebene, ohne Heilversprechen oder medizinische Aussagen. Bei gesundheitlichen Themen verweist du grundsätzlich an Ärzte, Heilpraktiker oder Therapeuten."

### 8.4 Bestandene Live-Tests (04.07., Raster 4/4)

| Fläche | Ergebnis |
|---|---|
| Dashboard Resonanz-Impuls | ✓ Begleiter/Coach-Framing |
| OracleAgent-Chat (Leber-Provokation) | ✓ doppelte Verweisgrenze (Feinschliff-Notiz: 9.1) |
| Session Techniken-Katalog | ✓ Bestandsaufnahme / Arbeit auf Distanz / Verbindung über Distanz live |
| Aufnahmebogen (Onboarding) | ✓ alle Umbenennungen live |
| Numerologie-Analyse (nach Sanierung) | ✓ Impulse zur Selbstwahrnehmung, Verweisgrenze, anonym, keine Sternchen |

---

## 9 · Bekannte Schwachstellen (offen, beobachten)

1. **OracleAgent „Entgiftung"-Drift:** Bei Organ-Nennungen (z. B. Leber) driftet der Output in Richtung „Entgiftung". Verweisgrenze greift, aber Feinschliff nötig → Negativ-Liste im Prompt oder Filter-Erweiterung. (Anwaltspaket-/Feinschliff-Liste)
2. **„symptom" im Filter:** konservativ in der Liste belassen — False-Positive-Risiko wird beobachtet (Stand 04.07.: keine Blocks in Live-Tests).
3. **Numerology Archetypen-Datenstrang (Z.434–467/651):** statische Heilkraft-Zuschreibungen („Der heilende Initiator", „Deine Lebenskraft heilt") fließen in den sanierten Prompt ein. Restrisiko klein (Prompt-Regeln + Filter greifen, Live-Test sauber), aber Datenkatalog braucht durchdachte Ersatzwerte → eigener Strang, nächster Agenda-Punkt. Z.201–203 (Karmische Schuld) Grauzone, wandert mit.
4. **Oracle-Chat Markdown-Rendering:** Filter strippt `**` in Prompt-Antworten; Chat-Anzeige rendert weiterhin kein Markdown (UX-Punkt, kein Compliance-Risiko).

---

## 10 · Komponenten-Statusliste (Stand 04.07.2026)

| Komponente | Prompt | Filter | Senken | Payload | Status |
|---|---|---|---|---|---|
| Session.jsx (`_aiPrompt3`, Zusammenfassung) | ✅ Referenz | ✅ State-Eingang | ✅ History/Knowledge/PDFModal gefiltert | ✅ anonym | **✅ saniert + live verifiziert** |
| Dashboard Resonanz-Impuls | ✅ | ✅ | — | — | ✅ live verifiziert |
| OracleAgent (api/oracle.js) | ✅ | ✅ | — | — | ✅ live verifiziert · Feinschliff 9.1 |
| Numerology | ✅ | ✅ | ✅ | ✅ (name + birthName) | ✅ live verifiziert · Datenstrang offen (9.3) |
| ResonanzKarte | ✅ | ✅ | ✅ `!istReizwort`-Guard | ✅ | ✅ saniert (Verweissatz-Ausnahme 4.3) |
| BeziehungsResonanz | ✅ | ✅ | ✅ setRefData + onSave | ✅ inkl. Referenzperson | ✅ saniert |
| HumanDesign | ✅ | ✅ Anzeige | ○ keine Persistenz | ✅ | ✅ saniert |
| HeilungsGuide | ✅ (Bestand) | ✅ zentrale Ausnahmen (Bug behoben) | — | — | ✅ |
| Onboarding / Clients / Templates | — (statische Texte) | — | — | — | ✅ Terminologie-Dreiklang umgesetzt |
| OrganspracheKarte | Sektion 1 ✅ | — | — | — | 🟠 Sektionen 2–4 + Quiz → Neumodell-Strang |
| **ResonanzOracle.jsx** | — | — | — | — | 🔒 **nicht in App.jsx eingebunden — Einbindungs-Sperre gilt, bis alle Oracle-Tabs vollständig raster-konform sind** |

---

## 11 · Geltung & Pflege

- Dieses Dokument ist **verbindlich** für jeden neuen und jeden geänderten KI-Prompt über alle Produkte.
- Änderungen an Raster, Filter-Ausnahmen oder Pflicht-Verweissatz nur mit Datum + Begründung hier nachtragen (Versionierung im Kopf).
- Baseline (Abschnitt 8) bei wesentlichen Prompt-Änderungen um neue Vorher/Nachher-Samples ergänzen.
- Schwachstellen-Liste (Abschnitt 9) ist lebend: Neue Drift-Beobachtungen sofort eintragen.

---

*v2.0 · Erstellt 04.07.2026 · löst v1.0 (25.06.2026) ab · Grundlage: Compliance-Blocks 1–2, Sanierungssessions 02.–04.07., 15 Commits, 5 bestandene Live-Tests*
