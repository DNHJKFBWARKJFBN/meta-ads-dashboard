const BASE_URL = "https://graph.facebook.com/v21.0";

function getToken() {
  return process.env.META_ACCESS_TOKEN;
}

function getAccountId() {
  return process.env.META_AD_ACCOUNT_ID;
}

export async function fetchMetaAPI(endpoint: string, params: Record<string, string> = {}) {
  const token = getToken();
  if (!token) throw new Error("META_ACCESS_TOKEN이 설정되지 않았습니다.");

  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("access_token", token);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  const json = await res.json();

  if (json.error) throw new Error(json.error.message);
  return json;
}

export async function getAdAccount() {
  const accountId = getAccountId();
  if (!accountId) throw new Error("META_AD_ACCOUNT_ID가 설정되지 않았습니다.");
  return fetchMetaAPI(`/${accountId}`, { fields: "id,name,currency,account_status,amount_spent,balance" });
}

export async function getInsights(datePreset = "last_30d") {
  const accountId = getAccountId();
  if (!accountId) throw new Error("META_AD_ACCOUNT_ID가 설정되지 않았습니다.");
  return fetchMetaAPI(`/${accountId}/insights`, {
    fields: "impressions,reach,clicks,ctr,cpc,cpm,spend,actions,purchase_roas",
    date_preset: datePreset,
    time_increment: "1",
  });
}

export async function getCampaigns() {
  const accountId = getAccountId();
  if (!accountId) throw new Error("META_AD_ACCOUNT_ID가 설정되지 않았습니다.");
  return fetchMetaAPI(`/${accountId}/campaigns`, {
    fields: "id,name,status,objective,daily_budget,lifetime_budget,insights{impressions,clicks,spend,ctr,cpc,purchase_roas}",
    date_preset: "last_30d",
  });
}
