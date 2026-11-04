import type { RowDataPacket } from "mysql2/promise";
import { query } from "@/lib/db";
import { createResourceHandlers, guestValidation } from "@/lib/master-data-api";

export const guests = createResourceHandlers({
  table: "Guests",
  idColumn: "guest_id",
  insertColumns: ["full_name", "phone", "email", "city", "id_proof"],
  updateColumns: ["full_name", "phone", "email", "city", "id_proof"],
  selectById: "SELECT guest_id, full_name, phone, email, city, id_proof FROM Guests WHERE guest_id = ?",
  validate: guestValidation,
  duplicateMessage: "A guest with this phone number already exists",
  list: (params) => {
    const search = params.get("search")?.trim() ?? "";
    if (!search) {
      return query<RowDataPacket[]>(
        "SELECT guest_id, full_name, phone, email, city, id_proof FROM Guests ORDER BY guest_id DESC",
      );
    }
    const pattern = `%${search}%`;
    return query<RowDataPacket[]>(
      "SELECT guest_id, full_name, phone, email, city, id_proof FROM Guests WHERE full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR city LIKE ? ORDER BY guest_id DESC",
      [pattern, pattern, pattern, pattern],
    );
  },
});
