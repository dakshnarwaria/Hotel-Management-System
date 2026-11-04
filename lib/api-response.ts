import { NextResponse } from "next/server";

type ApiResponse<T> =
  | { ok: true; data: T; error: null }
  | { ok: false; data: null; error: string };

export function apiSuccess<T>(data: T, status = 200) {
  const body: ApiResponse<T> = { ok: true, data, error: null };
  return NextResponse.json(body, { status });
}

export function apiError(error: string, status = 500) {
  const body: ApiResponse<never> = { ok: false, data: null, error };
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "sqlState" in error &&
    error.sqlState === "45000" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return apiError(error.message, 400);
  }

  console.error("API request failed:", error);
  return apiError("Internal server error");
}
