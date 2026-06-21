import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const shortToken = searchParams.get("token") || process.env.META_ACCESS_TOKEN;

  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: "META_APP_ID, META_APP_SECRET를 .env.local에 추가하세요." },
      { status: 400 }
    );
  }

  if (!shortToken) {
    return NextResponse.json(
      { error: "META_ACCESS_TOKEN이 없습니다." },
      { status: 400 }
    );
  }

  const url = new URL("https://graph.facebook.com/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortToken);

  const res = await fetch(url.toString());
  const json = await res.json();

  if (json.error) {
    return NextResponse.json({ error: json.error.message }, { status: 400 });
  }

  const expiresInDays = Math.round((json.expires_in ?? 0) / 86400);

  return NextResponse.json({
    access_token: json.access_token,
    token_type: json.token_type,
    expires_in_days: expiresInDays,
    instruction: ".env.local의 META_ACCESS_TOKEN 값을 위 access_token으로 교체하세요.",
  });
}
