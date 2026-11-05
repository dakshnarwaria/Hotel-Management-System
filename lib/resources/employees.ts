import type { RowDataPacket } from "mysql2/promise";
import { query } from "@/lib/db";
import { createResourceHandlers, employeeValidation } from "@/lib/master-data-api";

export const employees = createResourceHandlers({
  insertColumns: ["emp_name", "role", "phone", "salary"],
  updateColumns: ["emp_name", "role", "phone", "salary"],
  insertSql: "INSERT INTO Employees (emp_name, role, phone, salary) VALUES (?, ?, ?, ?)",
  updateSql: "UPDATE Employees SET emp_name = ?, role = ?, phone = ?, salary = ? WHERE emp_id = ?",
  deleteSql: "DELETE FROM Employees WHERE emp_id = ?",
  selectById:
    "SELECT e.emp_id, e.emp_name, e.role, e.phone, e.salary, COUNT(b.booking_id) AS bookings_handled FROM Employees e LEFT JOIN Bookings b ON b.emp_id = e.emp_id WHERE e.emp_id = ? GROUP BY e.emp_id",
  validate: employeeValidation,
  foreignKeyMessage: "This employee cannot be deleted because bookings are assigned to them",
  list: (params) => {
    const search = params.get("search")?.trim() ?? "";
    if (!search) {
      return query<RowDataPacket[]>(
        "SELECT e.emp_id, e.emp_name, e.role, e.phone, e.salary, COUNT(b.booking_id) AS bookings_handled FROM Employees e LEFT JOIN Bookings b ON b.emp_id = e.emp_id GROUP BY e.emp_id ORDER BY e.emp_id DESC",
      );
    }
    const pattern = `%${search}%`;
    return query<RowDataPacket[]>(
      "SELECT e.emp_id, e.emp_name, e.role, e.phone, e.salary, COUNT(b.booking_id) AS bookings_handled FROM Employees e LEFT JOIN Bookings b ON b.emp_id = e.emp_id WHERE e.emp_name LIKE ? OR e.role LIKE ? GROUP BY e.emp_id ORDER BY e.emp_id DESC",
      [pattern, pattern],
    );
  },
});
