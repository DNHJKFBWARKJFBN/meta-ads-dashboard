export type DatePreset = "today" | "yesterday" | "last_7d" | "last_14d" | "last_30d" | "this_month" | "last_month";

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
  cpc: number;
}

export function getRevenue(insight: MetaInsight): number {
  const sources = [
    ...(insight.action_values ?? []),
  ];
  const types = ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"];
  for (const t of types) {
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
  return {
    spend,
    revenue,
    roas,
    clicks: parseInt(insight.clicks || "0"),
    ctr: parseFloat(insight.ctr || "0"),
    impressions: parseInt(insight.impressions || "0"),
    cpc: parseFloat(insight.cpc || "0"),
  };
}
