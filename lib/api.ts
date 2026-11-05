import { NextResponse } from "next/server";

type ApiResult<T> =
  | { ok: true; data: T; error: null }
  | { ok: false; data: null; error: string };

export function ok<T>(data: T, status = 200) {
  const result: ApiResult<T> = { ok: true, data, error: null };
  return NextResponse.json(result, { status });
}

export function fail(error: string, status = 400) {
  const result: ApiResult<never> = { ok: false, data: null, error };
  return NextResponse.json(result, { status });
}

export function handleDbError(
  error: unknown,
  messages: { duplicate?: string; foreignKey?: string } = {},
) {
  console.error("Database request failed:", error);

  const record =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : {};
  const code = typeof record.code === "string" ? record.code : "";
  const sqlState = typeof record.sqlState === "string" ? record.sqlState : "";
  const sqlMessage =
    typeof record.sqlMessage === "string"
      ? record.sqlMessage
      : typeof record.message === "string"
        ? record.message
        : "";

  if (sqlState === "45000") {
    const status =
      sqlMessage === "Booking not found"
        ? 404
        : /already booked|under maintenance|closed bookings|only .* can be|payment exceeds|cancelled booking/i.test(
              sqlMessage,
            )
          ? 409
          : 400;
    return fail(sqlMessage || "The requested operation was rejected", status);
  }
  if (code === "ER_DUP_ENTRY") {
    return fail(
      messages.duplicate ?? "A record with these values already exists",
      409,
    );
  }
  if (code === "ER_ROW_IS_REFERENCED_2" || code === "ER_ROW_IS_REFERENCED") {
    return fail(
      messages.foreignKey ?? "This record cannot be deleted because it is in use",
      409,
    );
  }
  if (code === "ER_NO_REFERENCED_ROW_2") {
    return fail("The selected related record does not exist", 400);
  }
  if (code === "ER_CHECK_CONSTRAINT_VIOLATED") {
    return fail("One or more values do not meet the required constraints", 400);
  }
  if (code === "ER_DATA_TOO_LONG") {
    return fail("A value is too long", 400);
  }
  if (code === "ER_BAD_NULL_ERROR") {
    return fail("A required field is missing", 400);
  }
  if (
    code === "ECONNREFUSED" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "ER_ACCESS_DENIED_ERROR"
  ) {
    return fail(
      "Cannot connect to the database. Check that MySQL is running and the .env.local values are correct",
      503,
    );
  }
  return fail("Internal server error", 500);
}
