import type { RowDataPacket } from "mysql2/promise";
import { query } from "@/lib/db";
import { createResourceHandlers, serviceValidation } from "@/lib/master-data-api";

export const services = createResourceHandlers({
  table: "Services",
  idColumn: "service_id",
  insertColumns: ["service_name", "price"],
  updateColumns: ["service_name", "price"],
  selectById:
    "SELECT s.service_id, s.service_name, s.price, COALESCE(SUM(o.quantity), 0) AS times_ordered FROM Services s LEFT JOIN Service_Orders o ON o.service_id = s.service_id WHERE s.service_id = ? GROUP BY s.service_id",
  validate: serviceValidation,
  foreignKeyMessage: "This service cannot be deleted because it has been ordered",
  list: (params) => {
    const search = params.get("search")?.trim() ?? "";
    if (!search) {
      return query<RowDataPacket[]>(
        "SELECT s.service_id, s.service_name, s.price, COALESCE(SUM(o.quantity), 0) AS times_ordered FROM Services s LEFT JOIN Service_Orders o ON o.service_id = s.service_id GROUP BY s.service_id ORDER BY s.service_id DESC",
      );
    }
    const pattern = `%${search}%`;
    return query<RowDataPacket[]>(
      "SELECT s.service_id, s.service_name, s.price, COALESCE(SUM(o.quantity), 0) AS times_ordered FROM Services s LEFT JOIN Service_Orders o ON o.service_id = s.service_id WHERE s.service_name LIKE ? GROUP BY s.service_id ORDER BY s.service_id DESC",
      [pattern],
    );
  },
});
