import { ok } from "@/lib/api";
import { REPORTS } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok(
    REPORTS.map(({ id, title, description, sql, columns }) => ({
      id,
      title,
      description,
      sql,
      columns,
    })),
  );
}
