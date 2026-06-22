import { NextRequest, NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_SHOP!;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const API_VERSION = "2025-01";

function laOffset(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "shortOffset",
  }).formatToParts(new Date());
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-7";
  const m = tz.match(/GMT([+-])(\d+)/);
  if (!m) return "-07:00";
  return `${m[1]}${m[2].padStart(2, "0")}:00`;
}

interface OrderWithAttribution {
  id: number;
  created_at: string;
  financial_status: string;
  total_price: string;
  source_name: string | null;
  referring_site: string | null;
  landing_site: string | null;
  tags?: string;
  customer?: { orders_count: number };
}

async function fetchAllOrders(since?: string, until?: string): Promise<OrderWithAttribution[]> {
  const results: OrderWithAttribution[] = [];
  const fields = "id,created_at,financial_status,total_price,source_name,referring_site,landing_site,tags,customer";
  const qs = new URLSearchParams({ limit: "250", status: "any", fields });
  const tz = laOffset();
  if (since) qs.set("created_at_min", `${since}T00:00:00${tz}`);
  if (until) qs.set("created_at_max", `${until}T23:59:59${tz}`);
  let nextUrl: string | null = `https://${SHOP}/admin/api/${API_VERSION}/orders.json?${qs}`;
  while (nextUrl) {
    const response: Response = await fetch(nextUrl, { headers: { "X-Shopify-Access-Token": TOKEN } });
    if (!response.ok) throw new Error(`Shopify API error ${response.status}`);
    const data = await response.json();
    results.push(...(data.orders ?? []));
    const linkHeader: string | null = response.headers.get("Link");
    nextUrl = linkHeader?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }
  return results;
}

function detectChannel(order: OrderWithAttribution): string {
  const src = (order.source_name ?? "").toLowerCase();
  const ref = (order.referring_site ?? "").toLowerCase();
  const land = (order.landing_site ?? "").toLowerCase();
  const combined = `${src} ${ref} ${land}`;

  if (src === "tiktok" || combined.includes("tiktok")) return "TikTok";
  if (src === "facebook" || combined.includes("facebook") || combined.includes("fb.com")) return "Facebook";
  if (src === "instagram" || combined.includes("instagram")) return "Instagram";
  if (src === "google" || combined.includes("google")) return "Google";
  if (src === "email" || combined.includes("email") || combined.includes("klaviyo") || combined.includes("mailchimp")) return "Email";
  if (src === "naver" || combined.includes("naver")) return "Naver";
  if (combined.includes("linktr") || combined.includes("linktree")) return "Linktree";
  if (src === "web" && !ref) return "Direct";
  if (ref && !combined.includes("facebook") && !combined.includes("google") && !combined.includes("instagram")) return "Referral";
  if (src === "web" || src === "online_store") return "Organic";
  if (!src || src === "undefined") return "Direct";
  return src.charAt(0).toUpperCase() + src.slice(1);
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const since = p.get("since") ?? undefined;
  const until = p.get("until") ?? undefined;

  try {
    const orders = await fetchAllOrders(since, until);

    const channelMap: Record<string, {
      orders: number;
      revenue: number;
      newCustomers: number;
      returningCustomers: number;
      byDate: Record<string, { orders: number; revenue: number }>;
    }> = {};

    const freeSampleExcluded: Record<string, Record<string, number>> = {};

    orders.forEach((order) => {
      if (order.financial_status === "voided") return;
      const channel = detectChannel(order);
      if (!channelMap[channel]) {
        channelMap[channel] = { orders: 0, revenue: 0, newCustomers: 0, returningCustomers: 0, byDate: {} };
      }
      const rev = parseFloat(order.total_price || "0");
      channelMap[channel].orders += 1;
      channelMap[channel].revenue += rev;

      const ordersCount = order.customer?.orders_count ?? 1;
      if (ordersCount <= 1) channelMap[channel].newCustomers += 1;
      else channelMap[channel].returningCustomers += 1;

      const date = order.created_at.slice(0, 10);
      if (!channelMap[channel].byDate[date]) channelMap[channel].byDate[date] = { orders: 0, revenue: 0 };
      channelMap[channel].byDate[date].orders += 1;
      channelMap[channel].byDate[date].revenue += rev;

      const tags = (order.tags ?? "").split(",").map((t: string) => t.trim());
      if (!tags.includes("Free sample")) {
        if (!freeSampleExcluded[date]) freeSampleExcluded[date] = {};
        freeSampleExcluded[date][channel] = (freeSampleExcluded[date][channel] || 0) + 1;
      }
    });

    const channels = Object.entries(channelMap)
      .map(([channel, data]) => ({ channel, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ channels, totalOrders: orders.length, freeSampleExcluded });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
