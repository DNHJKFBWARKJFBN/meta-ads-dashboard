import { NextRequest, NextResponse } from "next/server";
import { getAdDailyInsights } from "@/lib/meta-api";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const adId = p.get("ad_id");
  const since = p.get("since");
  const until = p.get("until");
  if (!adId || !since || !until) return NextResponse.json({ error: "ad_id, since, until required" }, { status: 400 });
  try {
    return NextResponse.json(await getAdDailyInsights(adId, since, until));
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
