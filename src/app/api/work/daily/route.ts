import { NextResponse } from "next/server";
import { getDailyProgress } from "@/lib/sheets";

export async function GET() {
  try {
    const rows = await getDailyProgress();
    return NextResponse.json({ rows });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
