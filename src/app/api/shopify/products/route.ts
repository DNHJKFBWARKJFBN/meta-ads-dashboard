import { NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify-api";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json({ products });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
