import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const since = p.get("since") ?? undefined;
  const until = p.get("until") ?? undefined;

  const SHOP = process.env.SHOPIFY_SHOP!;
  const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

  const fields = [
    "id", "name", "created_at", "financial_status", "fulfillment_status",
    "total_price", "subtotal_price", "total_discounts", "total_shipping_price_set",
    "currency", "source_name", "referring_site", "landing_site", "landing_site_ref",
    "note", "tags", "line_items", "customer", "shipping_address", "discount_codes",
  ].join(",");

  const params = new URLSearchParams({ limit: "250", status: "any", fields });
  if (since) params.set("created_at_min", `${since}T00:00:00`);
  if (until) params.set("created_at_max", `${until}T23:59:59`);

  try {
    const results = [];
    let url: string | null = `https://${SHOP}/admin/api/2025-01/orders.json?${params}`;
    while (url) {
      const response: Response = await fetch(url, { headers: { "X-Shopify-Access-Token": TOKEN } });
      if (!response.ok) throw new Error(`Shopify API error ${response.status}`);
      const data = await response.json();
      results.push(...(data.orders ?? []));
      const link = response.headers.get("Link");
      url = link?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
    }
    return NextResponse.json({ orders: results });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
