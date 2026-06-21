import { NextResponse } from "next/server";
import { getAttendance } from "@/lib/sheets";

export async function GET() {
  try {
    const rows = await getAttendance();
    return NextResponse.json({ rows });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
