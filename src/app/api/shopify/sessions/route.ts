import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    error: "세션 데이터는 Shopify Plus 플랜에서만 지원됩니다 (ShopifyQL 필요)",
    unavailable: true,
  });
}
