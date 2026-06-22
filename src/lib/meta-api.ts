const BASE = "https://graph.facebook.com/v21.0";
const INSIGHT_BASE = "impressions,reach,clicks,ctr,cpc,cpm,spend,inline_link_clicks,landing_page_views,purchase_roas,action_values,actions";

let _cachedToken: string | null = null;

async function getLongLivedToken(): Promise<string> {
  if (_cachedToken) return _cachedToken;

  const raw = process.env.META_ACCESS_TOKEN!;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    _cachedToken = raw;
    return raw;
  }

  try {
    const url = new URL("https://graph.facebook.com/oauth/access_token");
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("fb_exchange_token", raw);
    const res = await fetch(url.toString());
    const json = await res.json();
    _cachedToken = json.access_token ?? raw;
  } catch {
    _cachedToken = raw;
  }

  return _cachedToken!;
}

function accountId() { return process.env.META_AD_ACCOUNT_ID!; }

async function call(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set("access_token", await getLongLivedToken());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json;
}

export async function getAccount() {
  return call(`/${accountId()}`, { fields: "id,name,currency,account_status,amount_spent,balance" });
}

function insightField(datePreset?: string | null, since?: string | null, until?: string | null) {
  if (since && until) {
    return `insights.time_range(${JSON.stringify({ since, until })}){${INSIGHT_BASE}}`;
  }
  return `insights.date_preset(${datePreset || "last_30d"}){${INSIGHT_BASE}}`;
}

function activeFilter(activeOnly?: boolean): Record<string, string> {
  return activeOnly
    ? { filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]) }
    : {};
}

export async function getCampaigns(datePreset: string, since?: string | null, until?: string | null, activeOnly?: boolean) {
  return call(`/${accountId()}/campaigns`, {
    fields: `id,name,status,objective,daily_budget,lifetime_budget,${insightField(datePreset, since, until)}`,
    limit: "100",
    ...activeFilter(activeOnly),
  });
}

export async function getAdSets(campaignId: string, datePreset: string, since?: string | null, until?: string | null, activeOnly?: boolean) {
  return call(`/${campaignId}/adsets`, {
    fields: `id,name,status,daily_budget,lifetime_budget,${insightField(datePreset, since, until)}`,
    limit: "100",
    ...activeFilter(activeOnly),
  });
}

export async function getAds(adsetId: string, datePreset: string, since?: string | null, until?: string | null, activeOnly?: boolean) {
  return call(`/${adsetId}/ads`, {
    fields: `id,name,status,creative{thumbnail_url,video_id,instagram_permalink_url,id},${insightField(datePreset, since, until)}`,
    limit: "100",
    ...activeFilter(activeOnly),
  });
}

export async function getActiveBudgets() {
  const [camps, adsets, ads] = await Promise.all([
    call(`/${accountId()}/campaigns`, {
      fields: "id,name,status,daily_budget,lifetime_budget",
      filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]),
      limit: "200",
    }),
    call(`/${accountId()}/adsets`, {
      fields: "id,name,status,campaign_id,daily_budget,lifetime_budget",
      filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]),
      limit: "200",
    }),
    call(`/${accountId()}/ads`, {
      fields: "id",
      filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]),
      limit: "200",
    }),
  ]);
  return { campaigns: camps.data ?? [], adsets: adsets.data ?? [], ads: ads.data ?? [] };
}

export async function getYesterdayTopAds() {
  return call(`/${accountId()}/ads`, {
    fields: `id,name,status,creative{thumbnail_url,video_id,instagram_permalink_url,id},insights.date_preset(yesterday){${INSIGHT_BASE}}`,
    date_preset: "yesterday",
    limit: "200",
  });
}

export async function getCreative(creativeId: string) {
  return call(`/${creativeId}`, { fields: "thumbnail_url,video_id,instagram_permalink_url" });
}

function objectiveFilter(objective?: string | null): Record<string, string> {
  if (!objective) return {};
  return {
    filtering: JSON.stringify([{ field: "campaign.objective", operator: "IN", value: [objective] }]),
  };
}

function dateParams(datePreset?: string | null, since?: string | null, until?: string | null): Record<string, string> {
  if (since && until) return { time_range: JSON.stringify({ since, until }) };
  return { date_preset: datePreset || "last_7d" };
}

export async function getAgeGenderInsights(objective?: string | null, datePreset?: string | null, since?: string | null, until?: string | null) {
  return call(`/${accountId()}/insights`, {
    fields: "spend,impressions,reach,clicks",
    breakdowns: "age,gender",
    limit: "200",
    ...dateParams(datePreset, since, until),
    ...objectiveFilter(objective),
  });
}

export async function getRegionInsights(objective?: string | null, datePreset?: string | null, since?: string | null, until?: string | null) {
  return call(`/${accountId()}/insights`, {
    fields: "spend,impressions,reach,clicks",
    breakdowns: "region",
    limit: "200",
    ...dateParams(datePreset, since, until),
    ...objectiveFilter(objective),
  });
}

export async function getDailyInsights(since: string, until: string) {
  return call(`/${accountId()}/insights`, {
    fields: INSIGHT_BASE,
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    limit: "100",
  });
}

export async function getAdDailyInsights(adId: string, since: string, until: string) {
  return call(`/${adId}/insights`, {
    fields: INSIGHT_BASE,
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    limit: "100",
  });
}
