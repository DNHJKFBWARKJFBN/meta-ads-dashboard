import { NextRequest, NextResponse } from "next/server";
import { getOrders } from "@/lib/shopify-api";

interface OrderWithAttribution {
  id: number;
  created_at: string;
  financial_status: string;
  total_price: string;
  source_name: string | null;
  referring_site: string | null;
  landing_site: string | null;
  customer?: { orders_count: number };
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
    const rawOrders = await getOrders(since, until);

    // Re-fetch with attribution fields
    const SHOP = process.env.SHOPIFY_SHOP!;
    const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
    const fields = "id,created_at,financial_status,total_price,source_name,referring_site,landing_site,customer";
    const params = new URLSearchParams({ limit: "250", status: "any", fields });
    if (since) params.set("created_at_min", `${since}T00:00:00`);
    if (until) params.set("created_at_max", `${until}T23:59:59`);

    const res = await fetch(`https://${SHOP}/admin/api/2025-01/orders.json?${params}`, {
      headers: { "X-Shopify-Access-Token": TOKEN },
    });
    const json = await res.json();
    const orders: OrderWithAttribution[] = json.orders ?? [];

    // Aggregate by channel
    const channelMap: Record<string, {
      orders: number;
      revenue: number;
      newCustomers: number;
      returningCustomers: number;
      byDate: Record<string, { orders: number; revenue: number }>;
    }> = {};

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
    });

    const totalOrders = rawOrders.length;
    const channels = Object.entries(channelMap)
      .map(([channel, data]) => ({ channel, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ channels, totalOrders });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
