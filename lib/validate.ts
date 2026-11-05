export function required(value: unknown, label: string): string | null {
  if (value == null || String(value).trim() === "") {
    return `${label} is required`;
  }
  return null;
}

export function maxLen(
  value: unknown,
  n: number,
  label: string,
): string | null {
  if (value == null || String(value).trim() === "") return null;
  return String(value).trim().length > n
    ? `${label} must be ${n} characters or fewer`
    : null;
}

export function isPhone(value: unknown, label = "Phone"): string | null {
  if (value == null || String(value).trim() === "") return null;
  return /^\d{10,15}$/.test(String(value).trim())
    ? null
    : `${label} must contain 10 to 15 digits`;
}

export function isEmail(value: unknown, label = "Email"): string | null {
  if (value == null || String(value).trim() === "") return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
    ? null
    : `${label} must be a valid email address`;
}

export function isMySqlDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const year = Number(value.slice(0, 4));
  if (year < 1000 || year > 9999) return false;
  const date = new Date(
    Date.UTC(year, Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10))),
  );
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function positiveNumber(value: unknown, label: string): string | null {
  if (value == null || String(value).trim() === "") {
    return `${label} is required`;
  }
  const raw = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) {
    return `${label} must be a number with at most 2 decimal places`;
  }
  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0) {
    return `${label} must be greater than 0`;
  }
  return number <= 99_999_999.99
    ? null
    : `${label} must not exceed 99,999,999.99`;
}

export function nonNegativeNumber(
  value: unknown,
  label: string,
): string | null {
  if (value == null || String(value).trim() === "") return null;
  const raw = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) {
    return `${label} must be a number with at most 2 decimal places`;
  }
  const number = Number(raw);
  if (!Number.isFinite(number) || number < 0) {
    return `${label} must be greater than or equal to 0`;
  }
  return number <= 99_999_999.99
    ? null
    : `${label} must not exceed 99,999,999.99`;
}

export function positiveInt(value: unknown, label: string): string | null {
  if (value == null || String(value).trim() === "") {
    return `${label} is required`;
  }
  const number = Number(String(value).trim());
  return Number.isSafeInteger(number) && number > 0 && number <= 2_147_483_647
    ? null
    : `${label} must be a positive whole number no greater than 2,147,483,647`;
}

export function nonNegativeInt(value: unknown, label: string): string | null {
  if (value == null || String(value).trim() === "") {
    return `${label} is required`;
  }
  const number = Number(String(value).trim());
  if (!Number.isSafeInteger(number) || number < 0 || number > 100) {
    return `${label} must be 0 (Ground) or a positive whole number`;
  }
  return null;
}

export function oneOf(
  value: unknown,
  list: readonly string[],
  label: string,
): string | null {
  if (value == null || String(value).trim() === "") return null;
  return list.includes(String(value).trim())
    ? null
    : `${label} must be one of: ${list.join(", ")}`;
}

export function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
