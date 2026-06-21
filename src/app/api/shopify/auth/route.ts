import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const shop = process.env.SHOPIFY_SHOP ?? "bephor.myshopify.com";
  const appUrl = process.env.SHOPIFY_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  if (!clientId) {
    return NextResponse.json({ error: "SHOPIFY_CLIENT_ID not set" }, { status: 500 });
  }

  const scopes = "read_orders,read_products,read_inventory,read_customers,read_analytics";
  const redirectUri = `${appUrl}/api/shopify/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });
  return response;
}
