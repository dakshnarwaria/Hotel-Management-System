import type { RowDataPacket } from "mysql2/promise";
import { fail, handleDbError, ok } from "@/lib/api";
import { query, withConnection } from "@/lib/db";
import {
  isMySqlDate,
  oneOf,
  positiveInt,
  positiveNumber,
  required,
} from "@/lib/validate";

const methods = ["Cash", "Card", "UPI"] as const;

function validDate(value: string) {
  return isMySqlDate(value);
}

export async function createPayment(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Request body must be valid JSON");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return fail("Request body must be an object");
  }
  const input = body as Record<string, unknown>;
  const amountString = String(input.amount ?? "").trim();
  const method = typeof input.method === "string" ? input.method.trim() : "";
  const errors = [
    required(input.booking_id, "Booking"),
    positiveInt(input.booking_id, "Booking"),
    positiveNumber(amountString, "Amount"),
    required(method, "Method"),
    oneOf(method, methods, "Method"),
  ].filter((error): error is string => error !== null);
  if (errors.length) return fail(errors.join(", "));
  const bookingId = Number(input.booking_id);
  const amount = Number(amountString);
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount must be greater than 0");

  try {
    const result = await withConnection(async (connection) => {
      const [bookingRows] = await connection.execute<RowDataPacket[]>(
        `SELECT b.status, bb.balance AS remaining
         FROM Bookings b
         LEFT JOIN booking_bills bb ON bb.booking_id = b.booking_id
         WHERE b.booking_id = ?`,
        [bookingId],
      );
      if (!bookingRows[0]) return { notFound: true as const };
      if (bookingRows[0].status === "Cancelled") {
        return { cancelled: true as const };
      }
      if (amount > Number(bookingRows[0].remaining ?? 0)) {
        return { overpayment: true as const };
      }
      await connection.query(
        "CALL record_payment(?,?,?,@pid)",
        [bookingId, amount, method],
      );
      const [idRows] = await connection.query<RowDataPacket[]>(
        "SELECT @pid AS id",
      );
      const paymentId = Number(idRows[0]?.id);
      if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
        throw new Error("Payment procedure did not return a payment id");
      }
      const [paymentRows] = await connection.execute<RowDataPacket[]>(
        "SELECT payment_id, booking_id, amount, pay_date, method FROM Payments WHERE payment_id = ?",
        [paymentId],
      );
      const [billRows] = await connection.execute<RowDataPacket[]>(
        `SELECT booking_id, full_name, room_no, status, room_charge,
                room_gst_rate, room_gst, services_total, services_gst_rate,
                services_gst, total_gst, grand_total, paid, balance
         FROM booking_bills WHERE booking_id = ?`,
        [bookingId],
      );
      return {
        payment: paymentRows[0] ?? null,
        bill: billRows[0] ?? null,
      } as const;
    });
    if ("notFound" in result) return fail("Booking not found", 404);
    if ("cancelled" in result) {
      return fail("Cannot record payments for a cancelled booking", 409);
    }
    if ("overpayment" in result) {
      return fail("Payment exceeds the remaining amount", 400);
    }
    if (!result.payment || !result.bill) {
      return fail("Payment was recorded but could not be loaded", 500);
    }
    return ok({ payment: result.payment, bill: result.bill }, 201);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function listPayments(request: Request) {
  const params = new URL(request.url).searchParams;
  const method = params.get("method")?.trim() ?? "";
  const from = params.get("from")?.trim() ?? "";
  const to = params.get("to")?.trim() ?? "";
  const search = params.get("search")?.trim() ?? "";
  const errors: string[] = [];
  if (method) {
    const methodError = oneOf(method, methods, "Method");
    if (methodError) errors.push(methodError);
  }
  if (Boolean(from) !== Boolean(to)) errors.push("Both from and to dates are required");
  if (from && !validDate(from)) errors.push("From must be a valid date (YYYY-MM-DD)");
  if (to && !validDate(to)) errors.push("To must be a valid date (YYYY-MM-DD)");
  if (from && to && validDate(from) && validDate(to) && to < from) {
    errors.push("To date must be on or after from date");
  }
  if (errors.length) return fail(errors.join(", "));

  const values = [
    method || null,
    method || null,
    from || null,
    from,
    to,
    search || null,
    `%${search}%`,
    `%${search}%`,
  ];
  try {
    const [payments, summaries] = await Promise.all([
      query<RowDataPacket[]>(
        `SELECT p.payment_id, p.booking_id, g.full_name, b.room_no,
                p.amount, p.pay_date, p.method
         FROM Payments p
         JOIN Bookings b ON b.booking_id = p.booking_id
         JOIN Guests g ON g.guest_id = b.guest_id
         WHERE (? IS NULL OR p.method = ?)
           AND (? IS NULL OR (p.pay_date >= ? AND p.pay_date <= ?))
           AND (? IS NULL OR g.full_name LIKE ? OR CAST(p.booking_id AS CHAR) LIKE ?)
         ORDER BY p.pay_date DESC, p.payment_id DESC`,
        values,
      ),
      query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(p.amount), 0) AS total_collected,
                COALESCE(SUM(CASE WHEN p.method = 'Cash' THEN p.amount ELSE 0 END), 0) AS cash,
                COALESCE(SUM(CASE WHEN p.method = 'Card' THEN p.amount ELSE 0 END), 0) AS card,
                COALESCE(SUM(CASE WHEN p.method = 'UPI' THEN p.amount ELSE 0 END), 0) AS upi
        FROM Payments p
        JOIN Bookings b ON b.booking_id = p.booking_id
        JOIN Guests g ON g.guest_id = b.guest_id
        WHERE (? IS NULL OR p.method = ?)
          AND (? IS NULL OR (p.pay_date >= ? AND p.pay_date <= ?))
          AND (? IS NULL OR g.full_name LIKE ? OR CAST(p.booking_id AS CHAR) LIKE ?)
          AND b.status <> 'Cancelled'`,
        values,
      ),
    ]);
    const summary = summaries[0];
    return ok({
      payments,
      summary: {
        total_collected: Number(summary?.total_collected ?? 0),
        Cash: Number(summary?.cash ?? 0),
        Card: Number(summary?.card ?? 0),
        UPI: Number(summary?.upi ?? 0),
      },
    });
  } catch (error) {
    return handleDbError(error);
  }
}
