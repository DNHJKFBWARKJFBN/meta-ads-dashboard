import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/lib/shopify-api";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const since = p.get("since") ?? undefined;
  const until = p.get("until") ?? undefined;
  try {
    const customers = await getCustomers(since, until);
    return NextResponse.json({ customers });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
