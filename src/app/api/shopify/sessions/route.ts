import { NextRequest, NextResponse } from "next/server";
import { runShopifyQL } from "@/lib/shopify-graphql";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const since = p.get("since");
  const until = p.get("until");

  if (!since || !until) return NextResponse.json({ error: "since, until required" }, { status: 400 });

  try {
    const query = `FROM sessions SINCE ${since} UNTIL ${until} GROUP BY day`;
    const tableData = await runShopifyQL(query);
    if (!tableData) return NextResponse.json({ sessions: [] });

    const dayIdx = tableData.columns.findIndex((c) => c.name === "day");
    const sessionsIdx = tableData.columns.findIndex((c) =>
      c.name === "sessions_count" || c.name === "sessions" || c.name.includes("session")
    );

    if (dayIdx === -1 || sessionsIdx === -1) {
      return NextResponse.json({ sessions: [], columns: tableData.columns });
    }

    const sessions = tableData.rowData.map((row) => ({
      date: row[dayIdx],
      count: parseInt(row[sessionsIdx] || "0"),
    }));

    return NextResponse.json({ sessions });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
