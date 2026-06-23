import { NextRequest, NextResponse } from "next/server";
import { shopifyGraphQL } from "@/lib/shopify-graphql";

interface IntrospectionField { name: string; }
interface IntrospectionResult {
  __type: { fields: IntrospectionField[] };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const since = p.get("since");
  const until = p.get("until");
  const debug = p.get("debug") === "1";

  if (!since || !until) return NextResponse.json({ error: "since, until required" }, { status: 400 });

  // Debug mode: list available GraphQL root fields
  if (debug) {
    try {
      const result = await shopifyGraphQL<IntrospectionResult>(`{
        __type(name: "QueryRoot") {
          fields { name }
        }
      }`);
      const fields = result.__type?.fields?.map((f) => f.name) ?? [];
      const analyticsFields = fields.filter((f) =>
        f.toLowerCase().includes("analytic") ||
        f.toLowerCase().includes("shopifyql") ||
        f.toLowerCase().includes("report") ||
        f.toLowerCase().includes("session") ||
        f.toLowerCase().includes("visit")
      );
      return NextResponse.json({ all_fields_count: fields.length, analytics_related: analyticsFields });
    } catch (e: unknown) {
      return NextResponse.json({ introspection_error: (e as Error).message });
    }
  }

  // Try ShopifyQL inline query
  try {
    const gql = `{
      shopifyqlQuery(query: "FROM sessions SINCE ${since} UNTIL ${until} SHOW sessions GROUP BY day") {
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

    const data = await shopifyGraphQL<{
      shopifyqlQuery: {
        __typename: string;
        tableData?: { rowData: string[][]; columns: { name: string; dataType: string; displayName: string }[] };
        parseErrors?: { code: string; message: string }[];
      };
    }>(gql);

    const result = data.shopifyqlQuery;
    if (result.__typename === "ParseError") {
      return NextResponse.json({ error: result.parseErrors?.map((e) => e.message).join(", ") }, { status: 400 });
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

    return NextResponse.json({
      sessions: tableData.rowData.map((row) => ({
        date: row[dayIdx],
        count: parseInt(row[sessionsIdx] || "0"),
      })),
    });
  } catch (e: unknown) {
    return NextResponse.json({
      sessions: [],
      error: (e as Error).message,
      hint: "?debug=1 을 추가하면 사용 가능한 GraphQL 필드를 확인할 수 있어요",
    });
  }
}
