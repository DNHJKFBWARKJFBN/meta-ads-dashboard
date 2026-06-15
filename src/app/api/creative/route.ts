import { NextRequest, NextResponse } from "next/server";
import { getCreative, getYesterdayTopAds } from "@/lib/meta-api";

export async function GET(req: NextRequest) {
  const creativeId = req.nextUrl.searchParams.get("creative_id");
  try {
    if (creativeId) {
      return NextResponse.json(await getCreative(creativeId));
    }
    return NextResponse.json(await getYesterdayTopAds());
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
