import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const shop = searchParams.get("shop") ?? process.env.SHOPIFY_SHOP ?? "bephor.myshopify.com";

  const storedState = req.cookies.get("shopify_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 403 });
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Shopify credentials not configured" }, { status: 500 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code received from Shopify" }, { status: 400 });
  }

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.json({ error: "Failed to get access token", details: tokenData }, { status: 500 });
  }

  // Show the token so the user can copy it to SHOPIFY_ACCESS_TOKEN env var
  return NextResponse.json({
    success: true,
    message: "Copy this token and add it as SHOPIFY_ACCESS_TOKEN in your .env.local and Vercel environment variables",
    access_token: tokenData.access_token,
    scope: tokenData.scope,
    shop,
  });
}
