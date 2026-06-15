import { NextResponse } from "next/server";
import { getAccount } from "@/lib/meta-api";

export async function GET() {
  try {
    const data = await getAccount();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
