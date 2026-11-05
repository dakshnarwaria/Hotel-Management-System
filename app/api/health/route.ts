import { handleDbError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query<RowDataPacket[]>(
      "SELECT DATABASE() AS database_name, (SELECT COUNT(*) FROM Rooms) AS rooms_count",
    );
    return ok({
      database: rows[0]?.database_name ?? null,
      rooms_count: Number(rows[0]?.rooms_count ?? 0),
    });
  } catch (error) {
    return handleDbError(error);
  }
}
