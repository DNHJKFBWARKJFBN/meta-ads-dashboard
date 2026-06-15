import { NextResponse } from "next/server";
import { getAccount } from "@/lib/meta-api";

export async function GET() {
  try {
    const account = await getAccount();
    return NextResponse.json({ ok: true, account });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
