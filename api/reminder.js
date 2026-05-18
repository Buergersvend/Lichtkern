import admin from "firebase-admin";
import nodemailer from "nodemailer";

/* ─── Firebase Admin Init ──────────────────────────────────────────── */
if (!admin.apps.length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(sa),
  });
}
const db = admin.firestore();

/* ─── SMTP Transport ───────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host: "smtp.ionos.de",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* ─── Helpers ──────────────────────────────────────────────────────── */
function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0]; // "2026-05-19"
}

function formatDateDE(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function extractEmail(contact) {
  if (!contact) return null;
  const match = contact.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  return match ? match[0] : null;
}

/* ─── E-Mail Templates ─────────────────────────────────────────────── */
function clientEmailHTML(clientName, appt, praxisName, therapistName) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#FFFDF7;font-family:'Segoe UI',Tahoma,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:11px;letter-spacing:4px;color:#B8A060;margin-bottom:4px;">HUMAN RESONANZ</div>
    <div style="font-size:22px;font-weight:700;color:#2A2215;">Terminerinnerung</div>
  </div>
  <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid rgba(184,160,96,0.25);margin-bottom:20px;">
    <p style="font-size:15px;color:#2A2215;margin:0 0 16px;">Hallo ${clientName},</p>
    <p style="font-size:14px;color:#5A4D3A;line-height:1.6;margin:0 0 16px;">
      dies ist eine freundliche Erinnerung an deinen Termin morgen:
    </p>
    <div style="background:rgba(184,160,96,0.08);border-radius:12px;padding:16px;border:1px solid rgba(184,160,96,0.2);margin-bottom:16px;">
      <div style="font-size:24px;font-weight:700;color:#B8A060;margin-bottom:4px;">${appt.startTime} Uhr</div>
      <div style="font-size:14px;color:#2A2215;font-weight:600;">${formatDateDE(appt.date)}</div>
      ${appt.title ? `<div style="font-size:13px;color:#5A4D3A;margin-top:6px;">${appt.title}</div>` : ""}
      ${appt.endTime ? `<div style="font-size:12px;color:#8A7D6B;margin-top:4px;">bis ${appt.endTime} Uhr</div>` : ""}
    </div>
    <p style="font-size:13px;color:#8A7D6B;line-height:1.5;margin:0;">
      Falls du den Termin nicht wahrnehmen kannst, melde dich bitte rechtzeitig${therapistName ? ` bei ${therapistName}` : ""}.
    </p>
  </div>
  <div style="text-align:center;font-size:10px;color:rgba(138,125,107,0.5);letter-spacing:1px;">
    ${praxisName || "HUMAN RESONANZ"} · Automatische Terminerinnerung
  </div>
</div>
</body></html>`;
}

function practitionerEmailHTML(therapistName, tomorrowAppts) {
  const rows = tomorrowAppts.map(a => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid rgba(184,160,96,0.15);font-size:14px;font-weight:700;color:#B8A060;">${a.startTime}</td>
      <td style="padding:10px 12px;border-bottom:1px solid rgba(184,160,96,0.15);font-size:14px;color:#2A2215;">${a.clientName || a.title || "Termin"}</td>
      <td style="padding:10px 12px;border-bottom:1px solid rgba(184,160,96,0.15);font-size:12px;color:#8A7D6B;">${a.endTime ? a.startTime + " – " + a.endTime : ""}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#FFFDF7;font-family:'Segoe UI',Tahoma,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:11px;letter-spacing:4px;color:#B8A060;margin-bottom:4px;">LICHTKERN</div>
    <div style="font-size:22px;font-weight:700;color:#2A2215;">Deine Termine morgen</div>
  </div>
  <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid rgba(184,160,96,0.25);margin-bottom:20px;">
    <p style="font-size:15px;color:#2A2215;margin:0 0 16px;">Hallo ${therapistName || ""},</p>
    <p style="font-size:14px;color:#5A4D3A;line-height:1.6;margin:0 0 16px;">
      Du hast morgen <strong>${tomorrowAppts.length} Termin${tomorrowAppts.length !== 1 ? "e" : ""}</strong>:
    </p>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <th style="text-align:left;padding:8px 12px;font-size:11px;color:#8A7D6B;border-bottom:1.5px solid rgba(184,160,96,0.3);">Zeit</th>
        <th style="text-align:left;padding:8px 12px;font-size:11px;color:#8A7D6B;border-bottom:1.5px solid rgba(184,160,96,0.3);">Klient</th>
        <th style="text-align:left;padding:8px 12px;font-size:11px;color:#8A7D6B;border-bottom:1.5px solid rgba(184,160,96,0.3);">Dauer</th>
      </tr>
      ${rows}
    </table>
  </div>
  <div style="text-align:center;font-size:10px;color:rgba(138,125,107,0.5);letter-spacing:1px;">
    LICHTKERN · Automatische Terminerinnerung
  </div>
</div>
</body></html>`;
}

/* ─── Main Handler ─────────────────────────────────────────────────── */
export default async function handler(req, res) {
  // Verify cron secret (optional but recommended)
  // Vercel Cron sends Authorization header automatically

  const tomorrow = getTomorrowStr();
  let totalSent = 0;
  let errors = [];

  try {
    // Get all users
    const usersSnap = await db.collection("users").listDocuments();

    for (const userRef of usersSnap) {
      const uid = userRef.id;

      try {
        // Load appointments
        const apptsDoc = await db.collection("users").doc(uid).collection("data").doc("lk_appts").get();
        if (!apptsDoc.exists) continue;
        const allAppts = JSON.parse(apptsDoc.data().value || "[]");

        // Filter tomorrow's active appointments
        const tomorrowAppts = allAppts.filter(a =>
          a.date === tomorrow && a.status !== "cancelled"
        ).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

        if (tomorrowAppts.length === 0) continue;

        // Load settings (for practitioner name + email)
        let settings = {};
        try {
          const settingsDoc = await db.collection("users").doc(uid).collection("data").doc("lk_settings").get();
          if (settingsDoc.exists) settings = JSON.parse(settingsDoc.data().value || "{}");
        } catch {}

        // Load clients (for client emails)
        let clients = [];
        try {
          const clientsDoc = await db.collection("users").doc(uid).collection("data").doc("lk_clients").get();
          if (clientsDoc.exists) clients = JSON.parse(clientsDoc.data().value || "[]");
        } catch {}

        const praxisName = settings.praxisname || "";
        const therapistName = settings.therapistName || "";
        const practitionerEmail = settings.practitionerEmail || process.env.SMTP_USER;

        // Send individual client emails
        for (const appt of tomorrowAppts) {
          try {
            // Find client email
            let clientEmail = null;
            if (appt.clientId) {
              const client = clients.find(c => c.id === appt.clientId);
              if (client) {
                clientEmail = client.email || extractEmail(client.contact);
              }
            }

            if (clientEmail) {
              await transporter.sendMail({
                from: `"${praxisName || 'Human Resonanz'}" <${process.env.SMTP_USER}>`,
                to: clientEmail,
                subject: `Terminerinnerung: ${formatDateDE(appt.date)} um ${appt.startTime} Uhr`,
                html: clientEmailHTML(
                  appt.clientName || "Liebe/r Klient/in",
                  appt,
                  praxisName,
                  therapistName
                ),
              });
              totalSent++;
            }
          } catch (e) {
            errors.push(`Client mail error (${appt.clientName}): ${e.message}`);
          }
        }

        // Send practitioner summary email
        if (practitionerEmail) {
          try {
            await transporter.sendMail({
              from: `"Lichtkern" <${process.env.SMTP_USER}>`,
              to: practitionerEmail,
              subject: `${tomorrowAppts.length} Termin${tomorrowAppts.length !== 1 ? "e" : ""} morgen – ${formatDateDE(tomorrow)}`,
              html: practitionerEmailHTML(therapistName, tomorrowAppts),
            });
            totalSent++;
          } catch (e) {
            errors.push(`Practitioner mail error: ${e.message}`);
          }
        }

      } catch (e) {
        errors.push(`User ${uid}: ${e.message}`);
      }
    }

    return res.status(200).json({
      ok: true,
      tomorrow,
      sent: totalSent,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
