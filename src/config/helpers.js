// src/config/helpers.js
import { T } from "./theme";
import { LEVELS } from "./constants";

// ─── GENERAL HELPERS ──────────────────────────
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
export const lvl = k => LEVELS.find(l => l.key === k);
export const top2 = (lv = {}) => Object.entries(lv).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).slice(0, 2);
export const dynGrad = (lv = {}) => {
  const t = top2(lv);
  if (!t.length) return `linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 45%,${T.violetL} 100%)`;
  const c1 = lvl(t[0][0])?.bg || T.tealL, c2 = t[1] ? (lvl(t[1][0])?.bg || "#FFF") : "#FFF";
  return `linear-gradient(140deg,${c1} 0%,#FFFFFF 45%,${c2} 100%)`;
};

// ─── DATE HELPERS ─────────────────────────────
export const toDateStr = d => d.toISOString().slice(0, 10);
export const todayStr = () => toDateStr(new Date());
export const parseDate = s => { const [y, m, d] = s.split("-"); return new Date(+y, +m - 1, +d); };
export const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return toDateStr(d); };

export const DE_DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const DE_DAYS_F = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
export const DE_MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export const getMondayOf = (dateStr) => {
  const d = parseDate(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
};

export const getWeekDays = (mondayStr) => Array.from({ length: 7 }, (_, i) => addDays(mondayStr, i));

export const getMonthDays = (dateStr) => {
  const d = parseDate(dateStr);
  const year = d.getFullYear(), month = d.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let start = new Date(first);
  const dow = first.getDay() === 0 ? 6 : first.getDay() - 1;
  start.setDate(start.getDate() - dow);
  const days = [];
  while (start <= last || days.length % 7 !== 0) {
    days.push(toDateStr(new Date(start)));
    start.setDate(start.getDate() + 1);
    if (days.length > 42) break;
  }
  return days;
};

export const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8–20
