import { NextResponse } from "next/server";
import { pstDateString } from "@/lib/time";

let cached: { rate: number; date: string } | null = null;

export async function GET() {
  const today = pstDateString();
  if (cached && cached.date === today) {
    return NextResponse.json({ rate: cached.rate, date: cached.date });
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    const json = await res.json();
    const rate = json.rates?.KRW;
    if (!rate) throw new Error("KRW rate not found");
    cached = { rate, date: today };
    return NextResponse.json({ rate, date: today });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
