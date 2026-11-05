import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { fail, handleDbError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { idFromParam } from "@/lib/master-data-api";
import { isMySqlDate, positiveInt } from "@/lib/validate";

function isValidDate(value: unknown): value is string {
  return isMySqlDate(value);
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
      return fail("Services can only be added while the guest is checked in", 409);
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

export async function listServiceOrders(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawServiceId = params.get("service_id")?.trim() ?? "";
  const from = params.get("from")?.trim() ?? "";
  const to = params.get("to")?.trim() ?? "";
  const search = params.get("search")?.trim() ?? "";
  const errors: string[] = [];

  if (rawServiceId) {
    const serviceError = positiveInt(rawServiceId, "Service");
    if (serviceError) errors.push(serviceError);
  }
  if (Boolean(from) !== Boolean(to)) errors.push("Both from and to dates are required");
  if (from && !isValidDate(from)) errors.push("From must be a valid date (YYYY-MM-DD)");
  if (to && !isValidDate(to)) errors.push("To must be a valid date (YYYY-MM-DD)");
  if (from && to && isValidDate(from) && isValidDate(to) && to < from) {
    errors.push("To date must be on or after from date");
  }
  if (errors.length) return fail(errors.join(", "));

  const values = [
    rawServiceId || null,
    rawServiceId ? Number(rawServiceId) : null,
    from || null,
    from,
    to,
    search || null,
    `%${search}%`,
    `%${search}%`,
  ];

  try {
    const [orders, summaries, topServices] = await Promise.all([
      query<RowDataPacket[]>(
        `SELECT o.order_id, o.order_date, g.full_name, b.booking_id,
                b.room_no, b.status AS booking_status, o.service_id,
                s.service_name, s.price, o.quantity,
                (s.price * o.quantity) AS line_total
         FROM Service_Orders o
         JOIN Services s ON s.service_id = o.service_id
         JOIN Bookings b ON b.booking_id = o.booking_id
         JOIN Guests g ON g.guest_id = b.guest_id
         WHERE (? IS NULL OR o.service_id = ?)
           AND (? IS NULL OR (o.order_date >= ? AND o.order_date <= ?))
           AND (? IS NULL OR g.full_name LIKE ? OR CAST(b.booking_id AS CHAR) LIKE ?)
         ORDER BY o.order_date DESC, o.order_id DESC`,
        values,
      ),
      query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(s.price * o.quantity), 0) AS total_revenue,
                COUNT(*) AS orders_count
         FROM Service_Orders o
         JOIN Services s ON s.service_id = o.service_id
         JOIN Bookings b ON b.booking_id = o.booking_id
         JOIN Guests g ON g.guest_id = b.guest_id
         WHERE (? IS NULL OR o.service_id = ?)
           AND (? IS NULL OR (o.order_date >= ? AND o.order_date <= ?))
           AND (? IS NULL OR g.full_name LIKE ? OR CAST(b.booking_id AS CHAR) LIKE ?)`,
        values,
      ),
      query<RowDataPacket[]>(
        `SELECT s.service_name, SUM(o.quantity) AS quantity
         FROM Service_Orders o
         JOIN Services s ON s.service_id = o.service_id
         JOIN Bookings b ON b.booking_id = o.booking_id
         JOIN Guests g ON g.guest_id = b.guest_id
         WHERE (? IS NULL OR o.service_id = ?)
           AND (? IS NULL OR (o.order_date >= ? AND o.order_date <= ?))
           AND (? IS NULL OR g.full_name LIKE ? OR CAST(b.booking_id AS CHAR) LIKE ?)
         GROUP BY s.service_id, s.service_name
         ORDER BY quantity DESC, s.service_name
         LIMIT 1`,
        values,
      ),
    ]);

    return ok({
      orders,
      summary: {
        total_revenue: Number(summaries[0]?.total_revenue ?? 0),
        orders_count: Number(summaries[0]?.orders_count ?? 0),
        top_service_name: topServices[0]?.service_name ?? null,
        top_service_quantity: Number(topServices[0]?.quantity ?? 0),
      },
    });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function deleteServiceOrder(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let params: { id: string };
  try {
    params = await context.params;
  } catch (error) {
    return handleDbError(error);
  }
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
        409,
      );
    }
    await query("DELETE FROM Service_Orders WHERE order_id = ?", [id]);
    return ok({ deleted: true });
  } catch (error) {
    return handleDbError(error);
  }
}
