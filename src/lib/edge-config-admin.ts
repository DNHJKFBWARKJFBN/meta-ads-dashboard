export async function setEdgeConfigValue(key: string, value: string): Promise<void> {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const apiToken = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!edgeConfigId || !apiToken) throw new Error("Edge Config가 연결되어 있지 않습니다.");

  const url = new URL(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`);
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ operation: "upsert", key, value }] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`설정 저장 실패 (${res.status}): ${text}`);
  }
}
