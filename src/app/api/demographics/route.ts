import { NextRequest, NextResponse } from "next/server";
import { getAgeGenderInsights, getRegionInsights } from "@/lib/meta-api";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const objective = p.get("objective") ?? undefined;
  const datePreset = p.get("date_preset") ?? undefined;
  const since = p.get("since") ?? undefined;
  const until = p.get("until") ?? undefined;
  try {
    const [ageGender, region] = await Promise.all([
      getAgeGenderInsights(objective, datePreset, since, until),
      getRegionInsights(objective, datePreset, since, until),
    ]);
    return NextResponse.json({
      ageGender: ageGender.data ?? [],
      region: region.data ?? [],
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
