import { DatePreset } from "@/types/meta";

export const ACCOUNT_TIMEZONE = "Asia/Seoul";

export function pstDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ACCOUNT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function formatMD(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}.${d}일`;
}

export function resolveDateRange(
  preset: DatePreset,
  customRange: { since: string; until: string } | null
): { since: string; until: string } | null {
  const today = pstDateString();
  switch (preset) {
    case "today":
      return { since: today, until: today };
    case "yesterday": {
      const y = shiftDate(today, -1);
      return { since: y, until: y };
    }
    case "last_7d":
      return { since: shiftDate(today, -7), until: shiftDate(today, -1) };
    case "last_14d":
      return { since: shiftDate(today, -14), until: shiftDate(today, -1) };
    case "last_30d":
      return { since: shiftDate(today, -30), until: shiftDate(today, -1) };
    case "this_month": {
      const [y, m] = today.split("-");
      return { since: `${y}-${m}-01`, until: today };
    }
    case "last_month": {
      const [y, m] = today.split("-");
      const lastDayPrevMonth = shiftDate(`${y}-${m}-01`, -1);
      const [ly, lm] = lastDayPrevMonth.split("-");
      return { since: `${ly}-${lm}-01`, until: lastDayPrevMonth };
    }
    case "custom":
      return customRange;
    default:
      return null;
  }
}

export function formatDateRangeLabel(range: { since: string; until: string } | null): string {
  if (!range) return "";
  return range.since === range.until
    ? formatMD(range.since)
    : `${formatMD(range.since)}~${formatMD(range.until)}`;
}
