const BASE = "https://graph.facebook.com/v21.0";
const INSIGHT_FIELDS = "impressions,reach,clicks,ctr,cpc,cpm,spend,purchase_roas,action_values,actions,collaborative_ads_purchase_roas";

function token() { return process.env.META_ACCESS_TOKEN!; }
function accountId() { return process.env.META_AD_ACCOUNT_ID!; }

async function call(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set("access_token", token());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json;
}

export async function getAccount() {
  return call(`/${accountId()}`, { fields: "id,name,currency,account_status,amount_spent,balance" });
}

export async function getCampaigns(datePreset: string) {
  return call(`/${accountId()}/campaigns`, {
    fields: `id,name,status,objective,daily_budget,lifetime_budget,insights{${INSIGHT_FIELDS}}`,
    date_preset: datePreset,
    limit: "100",
  });
}

export async function getAdSets(campaignId: string, datePreset: string) {
  return call(`/${campaignId}/adsets`, {
    fields: `id,name,status,daily_budget,lifetime_budget,insights{${INSIGHT_FIELDS}}`,
    date_preset: datePreset,
    limit: "100",
  });
}

export async function getAds(adsetId: string, datePreset: string) {
  return call(`/${adsetId}/ads`, {
    fields: `id,name,status,creative{thumbnail_url,video_id,instagram_permalink_url,id},insights{${INSIGHT_FIELDS}}`,
    date_preset: datePreset,
    limit: "100",
  });
}

export async function getActiveBudgets() {
  const [camps, adsets] = await Promise.all([
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
  ]);
  return { campaigns: camps.data ?? [], adsets: adsets.data ?? [] };
}

export async function getYesterdayTopAds() {
  return call(`/${accountId()}/ads`, {
    fields: `id,name,status,creative{thumbnail_url,video_id,instagram_permalink_url,id},insights{${INSIGHT_FIELDS}}`,
    date_preset: "yesterday",
    limit: "200",
  });
}

export async function getCreative(creativeId: string) {
  return call(`/${creativeId}`, { fields: "thumbnail_url,video_id,instagram_permalink_url" });
}
