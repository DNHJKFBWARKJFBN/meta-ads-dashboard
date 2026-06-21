import { get } from "@vercel/edge-config";

const SPREADSHEET_ID = "13mGz0351JArLHtoiHNLYP2nXzAIHCBNTMH4pTQMrHRg";
const DEFAULT_DAILY_PROGRESS_GID = "215731879";
const DEFAULT_ATTENDANCE_GID = "1744030131";

async function resolveGid(key: string, fallback: string): Promise<string> {
  try {
    const value = await get<string>(key);
    return value && /^\d+$/.test(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += char; i++; continue;
    }
    if (char === '"') { inQuotes = true; i++; continue; }
    if (char === ',') { row.push(field); field = ""; i++; continue; }
    if (char === '\r') { i++; continue; }
    if (char === '\n') { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += char; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

async function fetchSheetRows(gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`시트를 불러오지 못했습니다 (${res.status})`);
  const text = await res.text();
  return parseCsv(text);
}

export interface DailyProgressRow { checked: boolean; date: string; tasks: string; }

export async function getDailyProgress(): Promise<DailyProgressRow[]> {
  const gid = await resolveGid("dailyProgressGid", DEFAULT_DAILY_PROGRESS_GID);
  const rows = await fetchSheetRows(gid);
  return rows
    .filter((r) => /^(TRUE|FALSE)$/i.test((r[0] ?? "").trim()) && (r[1] ?? "").trim() !== "")
    .map((r) => ({
      checked: r[0].trim().toUpperCase() === "TRUE",
      date: r[1].trim(),
      tasks: (r[2] ?? "").trim(),
    }));
}

export interface AttendanceRow { date: string; checkIn: string; checkOut: string; totalHours: string; checked: boolean; }

export async function getAttendance(): Promise<AttendanceRow[]> {
  const gid = await resolveGid("attendanceGid", DEFAULT_ATTENDANCE_GID);
  const rows = await fetchSheetRows(gid);
  return rows
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test((r[0] ?? "").trim()))
    .map((r) => ({
      date: r[0].trim(),
      checkIn: (r[1] ?? "").trim(),
      checkOut: (r[2] ?? "").trim(),
      totalHours: (r[3] ?? "").trim(),
      checked: (r[4] ?? "").trim().toUpperCase() === "TRUE",
    }));
}
