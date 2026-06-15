import { NextRequest, NextResponse } from "next/server";
import { getInsights } from "@/lib/meta-api";

export async function GET(req: NextRequest) {
  try {
    const datePreset = req.nextUrl.searchParams.get("date_preset") || "last_30d";
    const data = await getInsights(datePreset);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
