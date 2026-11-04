import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { fail, handleDbError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { idFromParam } from "@/lib/master-data-api";
import { positiveInt } from "@/lib/validate";

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function createServiceOrder(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Request body must be valid JSON");
  }
  if (!isRecord(body)) return fail("Request body must be an object");
  const errors = [
    positiveInt(body.booking_id, "Booking"),
    positiveInt(body.service_id, "Service"),
    positiveInt(body.quantity, "Quantity"),
    isValidDate(body.order_date)
      ? null
      : "Order date must be a valid date (YYYY-MM-DD)",
  ].filter((error): error is string => error !== null);
  if (errors.length) return fail(errors.join(", "));

  const bookingId = Number(body.booking_id);
  const serviceId = Number(body.service_id);
  const quantity = Number(body.quantity);
  const orderDate = String(body.order_date);

  try {
    const bookings = await query<RowDataPacket[]>(
      `SELECT status, DATE_FORMAT(check_in, '%Y-%m-%d') AS check_in,
              DATE_FORMAT(check_out, '%Y-%m-%d') AS check_out
       FROM Bookings WHERE booking_id = ?`,
      [bookingId],
    );
    if (!bookings[0]) return fail("Booking not found", 404);
    if (bookings[0].status !== "Checked-In") {
      return fail("Services can only be added while the guest is checked in", 400);
    }
    const checkIn = String(bookings[0].check_in).slice(0, 10);
    const checkOut = String(bookings[0].check_out).slice(0, 10);
    if (orderDate < checkIn || orderDate > checkOut) {
      return fail("Order date must be between check-in and check-out dates", 400);
    }
    const result = await query<ResultSetHeader>(
      "INSERT INTO Service_Orders (booking_id, service_id, quantity, order_date) VALUES (?, ?, ?, ?)",
      [bookingId, serviceId, quantity, orderDate],
    );
    const rows = await query<RowDataPacket[]>(
      `SELECT o.order_id, o.booking_id, o.service_id, s.service_name,
              s.price, o.quantity, (s.price * o.quantity) AS line_total,
              o.order_date
       FROM Service_Orders o JOIN Services s ON s.service_id = o.service_id
       WHERE o.order_id = ?`,
      [result.insertId],
    );
    return rows[0] ? ok(rows[0], 201) : fail("Service order could not be loaded", 500);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function deleteServiceOrder(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const id = idFromParam(params.id);
  if (id === null) return fail("Invalid service order id", 400);
  try {
    const orders = await query<RowDataPacket[]>(
      `SELECT o.order_id, b.status FROM Service_Orders o
       JOIN Bookings b ON b.booking_id = o.booking_id
       WHERE o.order_id = ?`,
      [id],
    );
    if (!orders[0]) return fail("Service order not found", 404);
    if (orders[0].status !== "Checked-In") {
      return fail(
        "Service orders can only be removed while the guest is checked in",
        400,
      );
    }
    await query("DELETE FROM Service_Orders WHERE order_id = ?", [id]);
    return ok({ deleted: true });
  } catch (error) {
    return handleDbError(error);
  }
}
