import { fail, handleDbError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { REPORTS } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const report = REPORTS.find((item) => item.id === id);
    if (!report) return fail("Report not found", 404);
    const rows = await query(report.sql);
    return ok({
      rows,
      summary: { rowCount: rows.length, reports: REPORTS },
    });
  } catch (error) {
    return handleDbError(error);
  }
}
