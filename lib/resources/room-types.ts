import type { RowDataPacket } from "mysql2/promise";
import { query } from "@/lib/db";
import { createResourceHandlers, roomTypeValidation } from "@/lib/master-data-api";

export const roomTypes = createResourceHandlers({
  insertColumns: ["type_name", "price_per_night", "capacity"],
  updateColumns: ["type_name", "price_per_night", "capacity"],
  insertSql: "INSERT INTO Room_Types (type_name, price_per_night, capacity) VALUES (?, ?, ?)",
  updateSql: "UPDATE Room_Types SET type_name = ?, price_per_night = ?, capacity = ? WHERE type_id = ?",
  deleteSql: "DELETE FROM Room_Types WHERE type_id = ?",
  selectById:
    "SELECT rt.type_id, rt.type_name, rt.price_per_night, rt.capacity, COUNT(r.room_no) AS rooms_count FROM Room_Types rt LEFT JOIN Rooms r ON r.type_id = rt.type_id WHERE rt.type_id = ? GROUP BY rt.type_id",
  validate: roomTypeValidation,
  duplicateMessage: "A room type with this name already exists",
  foreignKeyMessage: "This room type cannot be deleted because rooms are using it",
  list: () =>
    query<RowDataPacket[]>(
      "SELECT rt.type_id, rt.type_name, rt.price_per_night, rt.capacity, COUNT(r.room_no) AS rooms_count FROM Room_Types rt LEFT JOIN Rooms r ON r.type_id = rt.type_id GROUP BY rt.type_id ORDER BY rt.type_id DESC",
    ),
});
