const SHOP = process.env.SHOPIFY_SHOP!;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const API_VERSION = "2025-01";
const GRAPHQL_URL = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

export async function shopifyGraphQL<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify GraphQL error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e: { message: string }) => e.message).join(", "));
  return json.data as T;
}

export interface ShopifyQLColumn {
  name: string;
  dataType: string;
  displayName: string;
}

export interface ShopifyQLTableData {
  rowData: string[][];
  columns: ShopifyQLColumn[];
}

export async function runShopifyQL(qlQuery: string): Promise<ShopifyQLTableData | null> {
  const gql = `
    query ShopifyQL($query: String!) {
      shopifyqlQuery(query: $query) {
        __typename
        ... on TableResponse {
          tableData {
            rowData
            columns {
              name
              dataType
              displayName
            }
          }
        }
        ... on ParseError {
          parseErrors {
            code
            message
          }
        }
      }
    }
  `;

  const data = await shopifyGraphQL<{
    shopifyqlQuery: {
      __typename: string;
      tableData?: ShopifyQLTableData;
      parseErrors?: { code: string; message: string }[];
    };
  }>(gql, { query: qlQuery });

  const result = data.shopifyqlQuery;
  if (result.__typename === "ParseError") {
    throw new Error(`ShopifyQL parse error: ${result.parseErrors?.map((e) => e.message).join(", ")}`);
  }
  return result.tableData ?? null;
}
