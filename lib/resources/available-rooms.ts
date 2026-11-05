import type { RowDataPacket } from "mysql2/promise";
import { fail, handleDbError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { positiveInt } from "@/lib/validate";
import { isValidDate } from "@/lib/booking-api";

export async function listAvailableRooms(request: Request) {
  const params = new URL(request.url).searchParams;
  const checkIn = params.get("check_in")?.trim() ?? "";
  const checkOut = params.get("check_out")?.trim() ?? "";
  const guests = params.get("guests")?.trim() ?? "";
  const errors: string[] = [];
  if (!checkIn) errors.push("Check-in is required");
  else if (!isValidDate(checkIn)) errors.push("Check-in must be a valid date (YYYY-MM-DD)");
  if (!checkOut) errors.push("Check-out is required");
  else if (!isValidDate(checkOut)) errors.push("Check-out must be a valid date (YYYY-MM-DD)");
  if (checkIn && checkOut && isValidDate(checkIn) && isValidDate(checkOut) && checkOut <= checkIn) {
    errors.push("Check-out must be after check-in");
  }
  if (!guests) errors.push("Number of guests is required");
  else {
    const guestsError = positiveInt(guests, "Number of guests");
    if (guestsError) errors.push(guestsError);
  }
  if (errors.length) return fail(errors.join(", "));

  try {
    const dateRows = await query<RowDataPacket[]>(
      "SELECT ? >= CURDATE() AS valid_check_in",
      [checkIn],
    );
    if (Number(dateRows[0]?.valid_check_in) !== 1) {
      return fail("Check-in date cannot be in the past");
    }
    const nights = Math.round(
      (Date.parse(`${checkOut}T00:00:00Z`) -
        Date.parse(`${checkIn}T00:00:00Z`)) /
        86_400_000,
    );
    const rooms = await query<RowDataPacket[]>(
      `SELECT r.room_no, r.floor_no, rt.type_name, rt.capacity,
              rt.price_per_night, ? AS nights,
              (? * rt.price_per_night) AS estimated_total
       FROM Rooms r
       JOIN Room_Types rt ON rt.type_id = r.type_id
       WHERE r.status <> 'Maintenance'
         AND rt.capacity >= ?
         AND NOT EXISTS (
           SELECT 1 FROM Bookings b
           WHERE b.room_no = r.room_no
             AND b.status IN ('Confirmed', 'Checked-In')
             AND b.check_in < ?
             AND b.check_out > ?
         )
       ORDER BY rt.price_per_night, r.room_no`,
      [nights, nights, Number(guests), checkOut, checkIn],
    );
    return ok(rooms);
  } catch (error) {
    return handleDbError(error);
  }
}
