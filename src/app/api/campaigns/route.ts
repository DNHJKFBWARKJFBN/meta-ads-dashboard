import { NextRequest, NextResponse } from "next/server";
import { getCampaigns, getAdSets, getAds } from "@/lib/meta-api";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const level = p.get("level") ?? "campaign";
  const datePreset = p.get("date_preset") ?? "last_30d";
  const since = p.get("since");
  const until = p.get("until");
  const campaignId = p.get("campaign_id");
  const adsetId = p.get("adset_id");
  const activeOnly = p.get("active_only") === "true";

  try {
    if (level === "ad" && adsetId) {
      return NextResponse.json(await getAds(adsetId, datePreset, since, until, activeOnly));
    }
    if (level === "adset" && campaignId) {
      return NextResponse.json(await getAdSets(campaignId, datePreset, since, until, activeOnly));
    }
    return NextResponse.json(await getCampaigns(datePreset, since, until, activeOnly));
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
