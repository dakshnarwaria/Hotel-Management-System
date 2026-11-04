import type { RowDataPacket } from "mysql2/promise";
import { fail, handleDbError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import {
  idFromParam,
  isRecord,
  readBody,
} from "@/lib/master-data-api";
import {
  nonNegativeInt,
  oneOf,
  positiveInt,
} from "@/lib/validate";

const statuses = ["Available", "Occupied", "Maintenance"] as const;
const manualStatuses = ["Available", "Maintenance"] as const;

const roomSelect =
  `SELECT r.room_no, r.type_id, rt.type_name, rt.price_per_night,
          rt.capacity, r.floor_no, r.status,
          (SELECT b.booking_id FROM Bookings b
           WHERE b.room_no = r.room_no AND b.status = 'Checked-In'
           ORDER BY b.check_in LIMIT 1) AS current_booking_id,
          (SELECT g.full_name FROM Bookings b
           JOIN Guests g ON g.guest_id = b.guest_id
           WHERE b.room_no = r.room_no AND b.status = 'Checked-In'
           ORDER BY b.check_in LIMIT 1) AS current_guest,
          (SELECT b.check_out FROM Bookings b
           WHERE b.room_no = r.room_no AND b.status = 'Checked-In'
           ORDER BY b.check_in LIMIT 1) AS current_check_out,
          (SELECT b.booking_id FROM Bookings b
           WHERE b.room_no = r.room_no AND b.status = 'Confirmed'
             AND b.check_out > CURDATE()
           ORDER BY b.check_in LIMIT 1) AS next_booking_id,
          (SELECT g.full_name FROM Bookings b
           JOIN Guests g ON g.guest_id = b.guest_id
           WHERE b.room_no = r.room_no AND b.status = 'Confirmed'
             AND b.check_out > CURDATE()
           ORDER BY b.check_in LIMIT 1) AS next_guest,
          (SELECT b.check_in FROM Bookings b
           WHERE b.room_no = r.room_no AND b.status = 'Confirmed'
             AND b.check_out > CURDATE()
           ORDER BY b.check_in LIMIT 1) AS next_check_in,
          (SELECT b.check_out FROM Bookings b
           WHERE b.room_no = r.room_no AND b.status = 'Confirmed'
             AND b.check_out > CURDATE()
           ORDER BY b.check_in LIMIT 1) AS next_check_out
   FROM Rooms r JOIN Room_Types rt ON rt.type_id = r.type_id`;

function errors(values: (string | null)[]) {
  return values.filter((value): value is string => value !== null);
}

function roomValues(body: Record<string, unknown>, creating: boolean) {
  const room_no = Number(String(body.room_no ?? "").trim());
  const type_id = Number(String(body.type_id ?? "").trim());
  const floor_no = Number(String(body.floor_no ?? "").trim());
  const status =
    body.status == null && creating ? "Available" : String(body.status ?? "").trim();
  if (status === "Occupied") {
    return {
      values: { room_no, type_id, floor_no, status },
      errors: ["Occupied status is set automatically at check-in"],
    };
  }
  const validation = errors([
    ...(creating ? [positiveInt(body.room_no, "Room number")] : []),
    positiveInt(body.type_id, "Room type"),
    nonNegativeInt(body.floor_no, "Floor"),
    ...(body.status == null && !creating
      ? []
      : [
          oneOf(
            status,
            creating ? manualStatuses : statuses,
            "Status",
          ),
        ]),
  ]);
  return {
    values: {
      room_no,
      type_id,
      floor_no,
      status: body.status == null && !creating ? null : status,
    },
    errors: validation,
  };
}

async function getRoom(roomNo: number) {
  const rows = await query<RowDataPacket[]>(
    `${roomSelect} WHERE r.room_no = ?`,
    [roomNo],
  );
  return rows[0] ?? null;
}

async function hasUpcomingOrCurrentBooking(roomNo: number) {
  const rows = await query<RowDataPacket[]>(
    `SELECT booking_id FROM Bookings
     WHERE room_no = ? AND status IN ('Confirmed', 'Checked-In')
       AND check_out > CURDATE() LIMIT 1`,
    [roomNo],
  );
  return rows.length > 0;
}

export async function listRooms(request: Request) {
  const params = new URL(request.url).searchParams;
  const search = params.get("search")?.trim() ?? "";
  const status = params.get("status")?.trim() ?? "";
  const rawTypeId = params.get("type_id")?.trim() ?? "";
  const bookingInfo = params.get("booking_info")?.trim() ?? "";
  const availabilityOn = params.get("availability_on")?.trim() ?? "";
  const filters: string[] = [];
  const values: (string | number)[] = [];
  const validation: string[] = [];

  if (status) {
    const statusError = oneOf(status, statuses, "Status");
    if (statusError) validation.push(statusError);
    else {
      filters.push("r.status = ?");
      values.push(status);
    }
  }
  if (rawTypeId) {
    const typeError = positiveInt(rawTypeId, "Room type");
    if (typeError) validation.push(typeError);
    else {
      filters.push("r.type_id = ?");
      values.push(Number(rawTypeId));
    }
  }
  if (bookingInfo) {
    const choices = ["Free now", "Reserved", "Occupied"];
    const bookingInfoError = oneOf(bookingInfo, choices, "Booking info");
    if (bookingInfoError) validation.push(bookingInfoError);
    else if (bookingInfo === "Free now") {
      filters.push("r.status = 'Available' AND NOT EXISTS (SELECT 1 FROM Bookings bx WHERE bx.room_no = r.room_no AND bx.status = 'Checked-In')");
    } else if (bookingInfo === "Reserved") {
      filters.push("EXISTS (SELECT 1 FROM Bookings bx WHERE bx.room_no = r.room_no AND bx.status = 'Confirmed' AND bx.check_out > CURDATE())");
    } else {
      filters.push("EXISTS (SELECT 1 FROM Bookings bx WHERE bx.room_no = r.room_no AND bx.status = 'Checked-In')");
    }
  }
  if (availabilityOn) {
    const date = new Date(`${availabilityOn}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(availabilityOn) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== availabilityOn
    ) {
      validation.push("Availability date must be a valid date (YYYY-MM-DD)");
    }
  }
  if (validation.length) return fail(validation.join(", "));
  if (search) {
    filters.push("CAST(r.room_no AS CHAR) LIKE ?");
    values.push(`%${search}%`);
  }
  const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
  const availabilityColumns = availabilityOn
    ? `, CASE
         WHEN r.status = 'Maintenance' THEN 'Maintenance'
         WHEN EXISTS (SELECT 1 FROM Bookings ba
                      WHERE ba.room_no = r.room_no
                        AND ba.status IN ('Confirmed','Checked-In')
                        AND ba.check_in <= ? AND ba.check_out > ?)
           THEN 'Booked'
         ELSE 'Free'
       END AS availability_on_status,
       (SELECT ga.full_name FROM Bookings ba
        JOIN Guests ga ON ga.guest_id = ba.guest_id
        WHERE ba.room_no = r.room_no
          AND ba.status IN ('Confirmed','Checked-In')
          AND ba.check_in <= ? AND ba.check_out > ?
        ORDER BY ba.check_in LIMIT 1) AS availability_on_guest`
    : "";
  const select = availabilityOn
    ? roomSelect.replace(
        "FROM Rooms r JOIN Room_Types rt ON rt.type_id = r.type_id",
        `${availabilityColumns} FROM Rooms r JOIN Room_Types rt ON rt.type_id = r.type_id`,
      )
    : roomSelect;
  const queryValues = availabilityOn
    ? [availabilityOn, availabilityOn, availabilityOn, availabilityOn, ...values]
    : values;

  try {
    return ok(
      await query<RowDataPacket[]>(
        `${select}${where} ORDER BY r.room_no DESC`,
        queryValues,
      ),
    );
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getRoomById(
  _request: Request,
  context: { params: Promise<{ room_no: string }> },
) {
  const params = await context.params;
  const roomNo = idFromParam(params.room_no);
  if (roomNo === null) return fail("Invalid room number", 400);
  try {
    const room = await getRoom(roomNo);
    return room ? ok(room) : fail("Room not found", 404);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function createRoom(request: Request) {
  const parsed = await readBody(request);
  if (!parsed.body) return fail(parsed.error ?? "Invalid request body");
  const { values, errors: validation } = roomValues(parsed.body, true);
  if (validation.length) return fail(validation.join(", "));

  try {
    await query(
      "INSERT INTO Rooms (room_no, type_id, floor_no, status) VALUES (?, ?, ?, ?)",
      [
        values.room_no,
        values.type_id,
        values.floor_no,
        values.status ?? "Available",
      ],
    );
    const room = await getRoom(values.room_no);
    return room ? ok(room, 201) : fail("The room was created but could not be loaded", 500);
  } catch (error) {
    return handleDbError(error, {
      duplicate: "A room with this room number already exists",
    });
  }
}

async function changeRoomStatus(roomNo: number, status: unknown) {
  const statusValue = typeof status === "string" ? status.trim() : "";
  if (statusValue === "Occupied") {
    return fail("Occupied status is set automatically at check-in");
  }
  const statusError = oneOf(statusValue, manualStatuses, "Status");
  if (statusError) return fail(statusError);
  try {
    const current = await getRoom(roomNo);
    if (!current) return fail("Room not found", 404);
    if (current.status === "Occupied") {
      return fail("Room has a guest checked in", 400);
    }
    if (
      statusValue === "Maintenance" &&
      (await hasUpcomingOrCurrentBooking(roomNo))
    ) {
      return fail(
        "Room has upcoming or current bookings and cannot be set to Maintenance",
        400,
      );
    }
    await query("UPDATE Rooms SET status = ? WHERE room_no = ?", [
      statusValue,
      roomNo,
    ]);
    const room = await getRoom(roomNo);
    return room ? ok(room) : fail("Room not found", 404);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updateRoom(
  request: Request,
  context: { params: Promise<{ room_no: string }> },
) {
  const params = await context.params;
  const roomNo = idFromParam(params.room_no);
  if (roomNo === null) return fail("Invalid room number", 400);
  const parsed = await readBody(request);
  if (!parsed.body) return fail(parsed.error ?? "Invalid request body");
  const { values, errors: validation } = roomValues(parsed.body, false);
  if (validation.length) return fail(validation.join(", "));

  try {
    const current = await getRoom(roomNo);
    if (!current) return fail("Room not found", 404);
    if (values.status && current.status === "Occupied") {
      return fail("Room has a guest checked in", 400);
    }
    if (
      values.status === "Maintenance" &&
      (await hasUpcomingOrCurrentBooking(roomNo))
    ) {
      return fail(
        "Room has upcoming or current bookings and cannot be set to Maintenance",
        400,
      );
    }
    const assignments = ["type_id = ?", "floor_no = ?"];
    const params: (number | string)[] = [values.type_id, values.floor_no];
    if (values.status) {
      assignments.push("status = ?");
      params.push(values.status);
    }
    params.push(roomNo);
    await query(
      `UPDATE Rooms SET ${assignments.join(", ")} WHERE room_no = ?`,
      params,
    );
    const room = await getRoom(roomNo);
    return room ? ok(room) : fail("Room not found", 404);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function patchRoom(
  request: Request,
  context: { params: Promise<{ room_no: string }> },
) {
  const params = await context.params;
  const roomNo = idFromParam(params.room_no);
  if (roomNo === null) return fail("Invalid room number", 400);
  const parsed = await readBody(request);
  if (!parsed.body) return fail(parsed.error ?? "Invalid request body");
  if (
    !isRecord(parsed.body) ||
    Object.keys(parsed.body).length !== 1 ||
    !Object.prototype.hasOwnProperty.call(parsed.body, "status")
  ) {
    return fail("PATCH accepts only a status field");
  }
  return changeRoomStatus(roomNo, parsed.body.status);
}

export async function deleteRoom(
  _request: Request,
  context: { params: Promise<{ room_no: string }> },
) {
  const params = await context.params;
  const roomNo = idFromParam(params.room_no);
  if (roomNo === null) return fail("Invalid room number", 400);
  try {
    const existing = await getRoom(roomNo);
    if (!existing) return fail("Room not found", 404);
    await query("DELETE FROM Rooms WHERE room_no = ?", [roomNo]);
    return ok({ deleted: true });
  } catch (error) {
    return handleDbError(error);
  }
}
