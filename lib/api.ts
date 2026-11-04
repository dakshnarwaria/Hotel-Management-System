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
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    if (code === "ER_DUP_ENTRY") {
      return fail(messages.duplicate ?? "A record with these values already exists", 409);
    }
    if (code === "ER_ROW_IS_REFERENCED_2" || code === "ER_ROW_IS_REFERENCED") {
      return fail(
        messages.foreignKey ??
          "This record cannot be deleted because it is in use",
        409,
      );
    }
    if (code === "ER_NO_REFERENCED_ROW_2") {
      return fail("The selected related record does not exist", 400);
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "sqlState" in error &&
    error.sqlState === "45000" &&
    "sqlMessage" in error &&
    typeof error.sqlMessage === "string"
  ) {
    return fail(error.sqlMessage, 400);
  }

  console.error("Database request failed:", error);
  return fail("Internal server error", 500);
}
