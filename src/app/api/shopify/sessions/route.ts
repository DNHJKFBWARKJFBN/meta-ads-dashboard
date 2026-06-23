import { NextRequest, NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_SHOP!;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const API_VERSION = "2025-01";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const since = p.get("since");
  const until = p.get("until");

  if (!since || !until) return NextResponse.json({ error: "since, until required" }, { status: 400 });

  // Try 1: ShopifyQL via REST analytics endpoint
  try {
    const analyticsRes = await fetch(
      `https://${SHOP}/admin/api/${API_VERSION}/analytics.json?` +
        new URLSearchParams({ report_type: "sessions", since, until }),
      { headers: { "X-Shopify-Access-Token": TOKEN } }
    );
    if (analyticsRes.ok) {
      const data = await analyticsRes.json();
      return NextResponse.json({ sessions: data.sessions ?? data, source: "analytics_rest" });
    }
  } catch {
    // continue
  }

  // Try 2: Reports endpoint — list reports and find sessions
  try {
    const reportsRes = await fetch(
      `https://${SHOP}/admin/api/${API_VERSION}/reports.json?fields=id,name,category&since_id=0&limit=250`,
      { headers: { "X-Shopify-Access-Token": TOKEN } }
    );
    if (reportsRes.ok) {
      const data = await reportsRes.json();
      const reports: { id: number; name: string; category: string }[] = data.reports ?? [];
      const sessionReport = reports.find(
        (r) =>
          r.name.toLowerCase().includes("session") ||
          r.name.toLowerCase().includes("visit") ||
          r.category?.toLowerCase().includes("traffic")
      );
      if (sessionReport) {
        // Found a session report — try fetching it
        const repRes = await fetch(
          `https://${SHOP}/admin/api/${API_VERSION}/reports/${sessionReport.id}/report.json?` +
            new URLSearchParams({ since, until }),
          { headers: { "X-Shopify-Access-Token": TOKEN } }
        );
        if (repRes.ok) {
          const repData = await repRes.json();
          return NextResponse.json({ sessions: repData, source: `report:${sessionReport.name}` });
        }
      }
      // Return available report names for debugging
      return NextResponse.json({
        sessions: [],
        debug_reports: reports.slice(0, 20).map((r) => `[${r.category}] ${r.name}`),
        error: "세션 관련 report를 찾지 못했습니다.",
      });
    }
  } catch {
    // continue
  }

  return NextResponse.json({
    sessions: [],
    error: "Shopify 세션 API에 접근할 수 없습니다. (read_analytics 권한 확인 필요)",
    unavailable: true,
  });
}
