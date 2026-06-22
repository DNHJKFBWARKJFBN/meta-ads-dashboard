const SHOP = process.env.SHOPIFY_SHOP!;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const API_VERSION = "2025-01";
const BASE = `https://${SHOP}/admin/api/${API_VERSION}`;

function laOffset(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "shortOffset",
  }).formatToParts(new Date());
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-7";
  const m = tz.match(/GMT([+-])(\d+)/);
  if (!m) return "-07:00";
  return `${m[1]}${m[2].padStart(2, "0")}:00`;
}

function headers() {
  return { "X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json" };
}

export interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  subtotal_price: string;
  currency: string;
  line_items: { title: string; quantity: number; price: string }[];
  customer?: { first_name: string; last_name: string; email: string };
}

export interface ShopifyProduct {
  id: number;
  title: string;
  status: string;
  variants: { inventory_quantity: number; price: string; sku: string; title: string }[];
  image?: { src: string };
}

export interface ShopifyCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  orders_count: number;
  total_spent: string;
  default_address?: {
    city: string;
    province: string;
    country: string;
    country_code: string;
  };
}

async function fetchAll<T>(path: string, key: string, params: Record<string, string> = {}): Promise<T[]> {
  const results: T[] = [];
  const qs = new URLSearchParams({ limit: "250", ...params });
  let nextUrl: string | null = `${BASE}/${path}?${qs}`;
  while (nextUrl) {
    const response: Response = await fetch(nextUrl, { headers: headers() });
    if (!response.ok) throw new Error(`Shopify API error ${response.status}: ${await response.text()}`);
    const res = response;
    const data = await res.json();
    results.push(...(data[key] as T[]));
    const link = res.headers.get("Link");
    nextUrl = link?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }
  return results;
}

export async function getOrders(since?: string, until?: string): Promise<ShopifyOrder[]> {
  const tz = laOffset();
  const params: Record<string, string> = { status: "any" };
  if (since) params.created_at_min = `${since}T00:00:00${tz}`;
  if (until) params.created_at_max = `${until}T23:59:59${tz}`;
  return fetchAll<ShopifyOrder>("orders.json", "orders", params);
}

export async function getProducts(): Promise<ShopifyProduct[]> {
  return fetchAll<ShopifyProduct>("products.json", "products", { status: "active" });
}

export async function getCustomers(since?: string, until?: string): Promise<ShopifyCustomer[]> {
  const tz = laOffset();
  const params: Record<string, string> = {};
  if (since) params.created_at_min = `${since}T00:00:00${tz}`;
  if (until) params.created_at_max = `${until}T23:59:59${tz}`;
  return fetchAll<ShopifyCustomer>("customers.json", "customers", params);
}
