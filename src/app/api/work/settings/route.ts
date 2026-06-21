import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { setEdgeConfigValue } from "@/lib/edge-config-admin";

const DEFAULT_DAILY_PROGRESS_GID = "215731879";
const DEFAULT_ATTENDANCE_GID = "1744030131";

function extractGid(input: string): string {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/gid=(\d+)/);
  if (match) return match[1];
  throw new Error("올바른 구글시트 URL 또는 gid 값을 입력해주세요.");
}

export async function GET() {
  try {
    const [dailyProgressGid, attendanceGid] = await Promise.all([
      get<string>("dailyProgressGid"),
      get<string>("attendanceGid"),
    ]);
    return NextResponse.json({
      dailyProgressGid: dailyProgressGid || DEFAULT_DAILY_PROGRESS_GID,
      attendanceGid: attendanceGid || DEFAULT_ATTENDANCE_GID,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, value } = body as { type: "daily" | "attendance"; value: string };
    if (type !== "daily" && type !== "attendance") throw new Error("잘못된 요청입니다.");
    const gid = extractGid(value);
    const key = type === "daily" ? "dailyProgressGid" : "attendanceGid";
    await setEdgeConfigValue(key, gid);
    return NextResponse.json({ ok: true, gid });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
