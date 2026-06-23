import { NextRequest, NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_SHOP!;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const API_VERSION = "2025-01";

interface OrderWithAttribution {
  id: number;
  created_at: string;
  cancelled_at: string | null;
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
  const fields = "id,created_at,cancelled_at,financial_status,total_price,source_name,referring_site,landing_site,tags,customer";
  const qs = new URLSearchParams({ limit: "250", status: "any", fields });
  if (since) qs.set("created_at_min", `${since}T00:00:00`);
  if (until) qs.set("created_at_max", `${until}T23:59:59`);
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

function getUTMSource(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get("utm_source")?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function detectChannel(order: OrderWithAttribution): string {
  const src = (order.source_name ?? "").toLowerCase();
  const ref = (order.referring_site ?? "").toLowerCase();
  const land = order.landing_site ?? "";

  // 1순위: UTM source (Shopify 어드민과 동일한 기준)
  const utm = getUTMSource(land);
  if (utm) {
    if (utm.includes("facebook") || utm.includes("fb")) return "Facebook";
    if (utm.includes("instagram") || utm === "ig") return "Instagram";
    if (utm.includes("tiktok")) return "TikTok";
    if (utm.includes("google")) return "Google";
    if (utm.includes("naver")) return "Naver";
    if (utm.includes("youtube")) return "YouTube";
    if (utm.includes("klaviyo") || utm.includes("mailchimp") || utm.includes("email")) return "Email";
    if (utm.includes("linktr") || utm.includes("linktree")) return "Linktree";
    return utm.charAt(0).toUpperCase() + utm.slice(1);
  }

  // 2순위: 유입 도메인
  if (ref) {
    if (ref.includes("facebook.com") || ref.includes("fb.com") || ref.includes("m.facebook")) return "Facebook";
    if (ref.includes("instagram.com")) return "Instagram";
    if (ref.includes("tiktok.com") || ref.includes("tiktokcdn")) return "TikTok";
    if (ref.includes("google.com") || ref.includes("google.co")) return "Google";
    if (ref.includes("naver.com")) return "Naver";
    if (ref.includes("youtube.com")) return "YouTube";
    if (ref.includes("klaviyo.com") || ref.includes("mailchimp")) return "Email";
    if (ref.includes("linktr.ee") || ref.includes("linktree")) return "Linktree";
    return "Referral";
  }

  // 3순위: source_name (플랫폼 직접 판매)
  if (src === "tiktok") return "TikTok Shop";
  if (src === "facebook") return "Facebook Shop";
  if (src === "instagram") return "Instagram Shop";
  if (src === "pos") return "POS";
  if (src === "iphone" || src === "android") return "Mobile";
  if (/^\d+$/.test(src)) return "App";
  if (src === "web" || src === "online_store" || !src || src === "undefined") return "Direct";
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
      if (order.financial_status === "voided" || order.cancelled_at) return;
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
