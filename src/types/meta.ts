export type DatePreset = "today" | "yesterday" | "last_7d" | "last_14d" | "last_30d" | "this_month" | "last_month" | "custom";

export interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaInsight {
  impressions: string;
  reach: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  spend: string;
  inline_link_clicks?: string;
  purchase_roas?: MetaAction[];
  action_values?: MetaAction[];
  actions?: MetaAction[];
  collaborative_ads_purchase_roas?: MetaAction[];
  date_start: string;
  date_stop: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  insights?: { data: MetaInsight[] };
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  campaign_id?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  insights?: { data: MetaInsight[] };
}

export interface MetaCreative {
  thumbnail_url?: string;
  video_id?: string;
  instagram_permalink_url?: string;
  id?: string;
}

export interface MetaAd {
  id: string;
  name: string;
  status: string;
  adset_id?: string;
  creative?: MetaCreative;
  insights?: { data: MetaInsight[] };
}

export interface RowMetrics {
  spend: number;
  revenue: number;
  roas: number;
  clicks: number;
  ctr: number;
  impressions: number;
  reach: number;
  cpc: number;
  cpm: number;
  conversions: number;
  cvr: number;
  lpv: number;
  lpvr: number;
}

export function getBudgetAmount(item: { daily_budget?: string; lifetime_budget?: string }): number {
  const daily = parseFloat(item.daily_budget ?? "0");
  if (daily > 0) return daily / 100;
  return parseFloat(item.lifetime_budget ?? "0") / 100;
}

export function isDailyBudget(item: { daily_budget?: string; lifetime_budget?: string }): boolean {
  return parseFloat(item.daily_budget ?? "0") > 0;
}

const PURCHASE_TYPES = ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"];
const ADD_TO_CART_TYPES = ["omni_add_to_cart", "add_to_cart", "offsite_conversion.fb_pixel_add_to_cart"];

export function getRevenue(insight: MetaInsight): number {
  const sources = [
    ...(insight.action_values ?? []),
  ];
  for (const t of PURCHASE_TYPES) {
    const found = sources.find((a) => a.action_type === t);
    if (found) return parseFloat(found.value);
  }
  return 0;
}

export function getConversions(insight: MetaInsight): number {
  const sources = insight.actions ?? [];
  for (const t of PURCHASE_TYPES) {
    const found = sources.find((a) => a.action_type === t);
    if (found) return parseInt(found.value);
  }
  return 0;
}

export function getAddToCart(insight: MetaInsight): number {
  const sources = insight.actions ?? [];
  for (const t of ADD_TO_CART_TYPES) {
    const found = sources.find((a) => a.action_type === t);
    if (found) return parseInt(found.value);
  }
  return 0;
}

export function getAddToCartValue(insight: MetaInsight): number {
  const sources = insight.action_values ?? [];
  for (const t of ADD_TO_CART_TYPES) {
    const found = sources.find((a) => a.action_type === t);
    if (found) return parseFloat(found.value);
  }
  return 0;
}

export function getRoas(insight: MetaInsight): number {
  const collab = insight.collaborative_ads_purchase_roas?.[0];
  if (collab) return parseFloat(collab.value);
  const std = insight.purchase_roas?.[0];
  if (std) return parseFloat(std.value);
  const spend = parseFloat(insight.spend || "0");
  const revenue = getRevenue(insight);
  if (spend > 0 && revenue > 0) return revenue / spend;
  return 0;
}

export function insightToMetrics(insight: MetaInsight): RowMetrics {
  const spend = parseFloat(insight.spend || "0");
  const revenue = getRevenue(insight);
  const roas = getRoas(insight);
  const clicks = parseInt(insight.inline_link_clicks || "0");
  const impressions = parseInt(insight.impressions || "0");
  const reach = parseInt(insight.reach || "0");
  const conversions = getConversions(insight);
  const lpvAction = insight.actions?.find((a) => a.action_type === "landing_page_view");
  const lpv = lpvAction ? parseInt(lpvAction.value) : 0;
  return {
    spend,
    revenue,
    roas,
    clicks,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    impressions,
    reach,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: parseFloat(insight.cpm || "0"),
    conversions,
    cvr: clicks > 0 ? (conversions / clicks) * 100 : 0,
    lpv,
    lpvr: clicks > 0 ? (lpv / clicks) * 100 : 0,
  };
}
