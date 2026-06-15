import { NextResponse } from "next/server";
import { getActiveBudgets } from "@/lib/meta-api";

export async function GET() {
  try {
    return NextResponse.json(await getActiveBudgets());
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
