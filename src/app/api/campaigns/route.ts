import { NextRequest, NextResponse } from "next/server";
import { getCampaigns, getAdSets, getAds } from "@/lib/meta-api";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const level = p.get("level") ?? "campaign";
  const datePreset = p.get("date_preset") ?? "last_30d";
  const campaignId = p.get("campaign_id");
  const adsetId = p.get("adset_id");

  try {
    if (level === "ad" && adsetId) {
      return NextResponse.json(await getAds(adsetId, datePreset));
    }
    if (level === "adset" && campaignId) {
      return NextResponse.json(await getAdSets(campaignId, datePreset));
    }
    return NextResponse.json(await getCampaigns(datePreset));
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
