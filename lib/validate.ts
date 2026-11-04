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

export function positiveNumber(value: unknown, label: string): string | null {
  if (value == null || String(value).trim() === "") {
    return `${label} is required`;
  }
  const number = Number(String(value).trim());
  return Number.isFinite(number) && number > 0
    ? null
    : `${label} must be a number greater than 0`;
}

export function nonNegativeNumber(
  value: unknown,
  label: string,
): string | null {
  if (value == null || String(value).trim() === "") return null;
  const number = Number(String(value).trim());
  return Number.isFinite(number) && number >= 0
    ? null
    : `${label} must be a number greater than or equal to 0`;
}

export function positiveInt(value: unknown, label: string): string | null {
  if (value == null || String(value).trim() === "") {
    return `${label} is required`;
  }
  const number = Number(String(value).trim());
  return Number.isSafeInteger(number) && number > 0
    ? null
    : `${label} must be a positive integer`;
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
