import { NextRequest, NextResponse } from "next/server";
import { getDailyInsights } from "@/lib/meta-api";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const since = p.get("since");
  const until = p.get("until");
  if (!since || !until) return NextResponse.json({ error: "since and until required" }, { status: 400 });
  try {
    return NextResponse.json(await getDailyInsights(since, until));
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
