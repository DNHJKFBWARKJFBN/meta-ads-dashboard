import { NextRequest, NextResponse } from "next/server";
import { shopifyGraphQL } from "@/lib/shopify-graphql";

interface ShopifyQLColumn { name: string; dataType: string; displayName: string; }
interface ShopifyQLResult {
  shopifyqlQuery: {
    __typename: string;
    tableData?: { rowData: string[][]; columns: ShopifyQLColumn[] };
    parseErrors?: { code: string; message: string }[];
  };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const since = p.get("since");
  const until = p.get("until");

  if (!since || !until) return NextResponse.json({ error: "since, until required" }, { status: 400 });

  // Use inline string instead of GraphQL variables — ShopifyQL requires this
  const gql = `{
    shopifyqlQuery(query: "FROM sessions SINCE ${since} UNTIL ${until} GROUP BY day") {
      __typename
      ... on TableResponse {
        tableData {
          rowData
          columns { name dataType displayName }
        }
      }
      ... on ParseError {
        parseErrors { code message }
      }
    }
  }`;

  try {
    const data = await shopifyGraphQL<ShopifyQLResult>(gql);
    const result = data.shopifyqlQuery;

    if (result.__typename === "ParseError") {
      return NextResponse.json({
        error: result.parseErrors?.map((e) => e.message).join(", "),
      }, { status: 400 });
    }

    const tableData = result.tableData;
    if (!tableData) return NextResponse.json({ sessions: [] });

    const dayIdx = tableData.columns.findIndex((c) => c.name === "day");
    const sessionsIdx = tableData.columns.findIndex((c) =>
      c.name === "sessions_count" || c.name === "sessions" || c.name.includes("session")
    );

    if (dayIdx === -1 || sessionsIdx === -1) {
      return NextResponse.json({ sessions: [], columns: tableData.columns.map((c) => c.name) });
    }

    const sessions = tableData.rowData.map((row) => ({
      date: row[dayIdx],
      count: parseInt(row[sessionsIdx] || "0"),
    }));

    return NextResponse.json({ sessions });
  } catch (e: unknown) {
    const msg = (e as Error).message;
    // If shopifyqlQuery field doesn't exist, return plan limitation error
    if (msg.includes("shopifyqlQuery") || msg.includes("doesn't exist")) {
      return NextResponse.json({
        error: "세션 데이터는 Shopify Plus 플랜에서 지원됩니다 (ShopifyQL 필요)",
        unavailable: true,
      });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
