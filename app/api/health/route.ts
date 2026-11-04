import { apiSuccess, handleApiError } from "@/lib/api-response";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await query("SELECT 1 AS database_ready");
    return apiSuccess({ database: "connected" });
  } catch (error) {
    return handleApiError(error);
  }
}
