import type { RowDataPacket } from "mysql2/promise";
import { fail, handleDbError, ok } from "@/lib/api";
import { query, withConnection } from "@/lib/db";
import { positiveInt } from "@/lib/validate";

export const bookingSelect = `
  SELECT b.booking_id, b.guest_id, g.full_name, g.phone, b.room_no,
         rt.type_name, b.emp_id, e.emp_name, b.check_in, b.check_out,
         DATEDIFF(b.check_out, b.check_in) AS nights, b.no_of_guests,
         b.status, bb.room_charge, bb.services_total, bb.grand_total,
         bb.paid, bb.balance
  FROM Bookings b
  JOIN Guests g ON g.guest_id = b.guest_id
  JOIN Rooms r ON r.room_no = b.room_no
  JOIN Room_Types rt ON rt.type_id = r.type_id
  JOIN Employees e ON e.emp_id = b.emp_id
  JOIN booking_bills bb ON bb.booking_id = b.booking_id`;

const bookingStatuses = ["Confirmed", "Checked-In", "Checked-Out", "Cancelled"];

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function dateDiffError(start: string, end: string): string | null {
  return end > start ? null : "Check-out must be after check-in";
}

function validParamDate(value: string, label: string) {
  return isValidDate(value) ? null : `${label} must be a valid date (YYYY-MM-DD)`;
}

function routeId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function listBookings(request: Request) {
  const params = new URL(request.url).searchParams;
  const status = params.get("status")?.trim() ?? "";
  const search = params.get("search")?.trim() ?? "";
  const from = params.get("from")?.trim() ?? "";
  const to = params.get("to")?.trim() ?? "";
  const errors: string[] = [];

  if (status && status !== "All" && !bookingStatuses.includes(status)) {
    errors.push(`Status must be one of: ${bookingStatuses.join(", ")}`);
  }
  if (Boolean(from) !== Boolean(to)) {
    errors.push("Both from and to dates are required");
  }
  if (from) {
    const error = validParamDate(from, "From");
    if (error) errors.push(error);
  }
  if (to) {
    const error = validParamDate(to, "To");
    if (error) errors.push(error);
  }
  if (from && to && isValidDate(from) && isValidDate(to) && to < from) {
    errors.push("To date must be on or after from date");
  }
  if (errors.length) return fail(errors.join(", "));

  const filters: string[] = [];
  const values: (string | number)[] = [];
  if (status && status !== "All") {
    filters.push("b.status = ?");
    values.push(status);
  }
  if (search) {
    const pattern = `%${search}%`;
    filters.push(
      "(g.full_name LIKE ? OR g.phone LIKE ? OR CAST(b.room_no AS CHAR) LIKE ?)",
    );
    values.push(pattern, pattern, pattern);
  }
  if (from && to) {
    filters.push("b.check_in <= ? AND b.check_out >= ?");
    values.push(to, from);
  }

  try {
    const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const [bookings, counts] = await Promise.all([
      query<RowDataPacket[]>(
        `${bookingSelect}${where} ORDER BY b.booking_id DESC`,
        values,
      ),
      query<RowDataPacket[]>(
        `SELECT
          COUNT(*) AS all_count,
          COALESCE(SUM(status = 'Confirmed'), 0) AS confirmed,
          COALESCE(SUM(status = 'Checked-In'), 0) AS checked_in,
          COALESCE(SUM(status = 'Checked-Out'), 0) AS checked_out,
          COALESCE(SUM(status = 'Cancelled'), 0) AS cancelled
         FROM Bookings`,
      ),
    ]);
    const countRow = counts[0];
    return ok({
      bookings,
      counts: {
        All: Number(countRow?.all_count ?? 0),
        Confirmed: Number(countRow?.confirmed ?? 0),
        "Checked-In": Number(countRow?.checked_in ?? 0),
        "Checked-Out": Number(countRow?.checked_out ?? 0),
        Cancelled: Number(countRow?.cancelled ?? 0),
      },
    });
  } catch (error) {
    return handleDbError(error);
  }
}

type CreateBookingInput = {
  guest_id: number;
  room_no: number;
  emp_id: number;
  check_in: string;
  check_out: string;
  no_of_guests: number;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function createBooking(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return fail("Request body must be valid JSON");
  }
  if (!isObject(input)) return fail("Request body must be an object");

  const errors = [
    positiveInt(input.guest_id, "Guest"),
    positiveInt(input.room_no, "Room number"),
    positiveInt(input.emp_id, "Employee"),
    positiveInt(input.no_of_guests, "Number of guests"),
    validParamDate(String(input.check_in ?? ""), "Check-in"),
    validParamDate(String(input.check_out ?? ""), "Check-out"),
  ].filter((error): error is string => error !== null);
  const checkIn = String(input.check_in ?? "");
  const checkOut = String(input.check_out ?? "");
  if (isValidDate(checkIn) && isValidDate(checkOut)) {
    const diffError = dateDiffError(checkIn, checkOut);
    if (diffError) errors.push(diffError);
  }
  if (errors.length) return fail(errors.join(", "));

  const values: CreateBookingInput = {
    guest_id: Number(input.guest_id),
    room_no: Number(input.room_no),
    emp_id: Number(input.emp_id),
    check_in: checkIn,
    check_out: checkOut,
    no_of_guests: Number(input.no_of_guests),
  };

  try {
    const booking = await withConnection(async (connection) => {
      const [dateRows] = await connection.execute<RowDataPacket[]>(
        "SELECT ? >= CURDATE() AS valid_check_in",
        [values.check_in],
      );
      if (Number(dateRows[0]?.valid_check_in) !== 1) {
        throw new BookingInputError("Check-in date cannot be in the past");
      }
      await connection.query(
        "CALL book_room(?,?,?,?,?,?,@new_id)",
        [
          values.guest_id,
          values.room_no,
          values.emp_id,
          values.check_in,
          values.check_out,
          values.no_of_guests,
        ],
      );
      const [idRows] = await connection.query<RowDataPacket[]>(
        "SELECT @new_id AS id",
      );
      const id = Number(idRows[0]?.id);
      if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Booking procedure did not return a booking id");
      }
      const [savedRows] = await connection.execute<RowDataPacket[]>(
        `${bookingSelect} WHERE b.booking_id = ?`,
        [id],
      );
      return savedRows[0] ?? null;
    });
    if (!booking) return fail("The booking was created but could not be loaded", 500);
    return ok(booking, 201);
  } catch (error) {
    if (error instanceof BookingInputError) return fail(error.message, 400);
    return handleDbError(error);
  }
}

class BookingInputError extends Error {}

type Action = "check_in" | "check_out" | "cancel";

export async function bookingAction(
  request: Request,
  context: { params: Promise<{ id: string }> },
  action: Action,
) {
  const params = await context.params;
  const id = routeId(params.id);
  if (id === null) return fail("Invalid booking id", 400);

  try {
    const result = await withConnection(async (connection) => {
      const [existing] = await connection.execute<RowDataPacket[]>(
        "SELECT booking_id, check_in FROM Bookings WHERE booking_id = ?",
        [id],
      );
      if (!existing[0]) return { notFound: true as const };

      if (action === "check_in") {
        const [dateRows] = await connection.execute<RowDataPacket[]>(
          "SELECT check_in <= CURDATE() AS allowed FROM Bookings WHERE booking_id = ?",
          [id],
        );
        if (Number(dateRows[0]?.allowed) !== 1) {
          return {
            error: "Check-in is only allowed on or after the booking's check-in date",
          } as const;
        }
        await connection.query("CALL check_in(?)", [id]);
      } else if (action === "check_out") {
        const [rows] = await connection.query<RowDataPacket[][]>(
          "CALL check_out(?)",
          [id],
        );
        return { bill: rows[0]?.[0] ?? null } as const;
      } else {
        await connection.query("CALL cancel_booking(?)", [id]);
      }

      const [updated] = await connection.execute<RowDataPacket[]>(
        `${bookingSelect} WHERE b.booking_id = ?`,
        [id],
      );
      return { booking: updated[0] ?? null } as const;
    });
    if ("notFound" in result) return fail("Booking not found", 404);
    if ("error" in result && result.error) return fail(result.error, 400);
    if ("bill" in result) {
      return result.bill ? ok(result.bill) : fail("Final bill not found", 404);
    }
    return result.booking ? ok(result.booking) : fail("Booking not found", 404);
  } catch (error) {
    return handleDbError(error);
  }
}

export { isValidDate };
