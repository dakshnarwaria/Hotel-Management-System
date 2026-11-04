import type { RowDataPacket } from "mysql2/promise";
import type { ResultSetHeader } from "mysql2/promise";
import { fail, handleDbError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import {
  isEmail,
  isPhone,
  maxLen,
  nonNegativeNumber,
  oneOf,
  positiveInt,
  positiveNumber,
  required,
  trimmed,
} from "@/lib/validate";

type Values = Record<string, string | number | null>;
type Validation = { values: Values; errors: string[] };
type Config = {
  table: string;
  idColumn: string;
  insertColumns: string[];
  updateColumns: string[];
  selectById: string;
  list: (params: URLSearchParams) => Promise<RowDataPacket[]>;
  validate: (input: Record<string, unknown>) => Validation;
  duplicateMessage?: string;
  foreignKeyMessage?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readBody(request: Request) {
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? { body, error: null } : { body: null, error: "Request body must be an object" };
  } catch {
    return { body: null, error: "Request body must be valid JSON" };
  }
}

function idFromParam(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function createResourceHandlers(config: Config) {
  async function getRow(id: number) {
    const rows = await query<RowDataPacket[]>(config.selectById, [id]);
    return rows[0] ?? null;
  }

  async function list(request: Request) {
    try {
      return ok(await config.list(new URL(request.url).searchParams));
    } catch (error) {
      return handleDbError(error);
    }
  }

  async function create(request: Request) {
    const parsed = await readBody(request);
    if (!parsed.body) return fail(parsed.error ?? "Invalid request body");
    const { values, errors } = config.validate(parsed.body);
    if (errors.length) return fail(errors.join(", "));

    try {
      const placeholders = config.insertColumns.map(() => "?").join(", ");
      const columns = config.insertColumns.join(", ");
      const result = await query<ResultSetHeader>(
        `INSERT INTO ${config.table} (${columns}) VALUES (${placeholders})`,
        config.insertColumns.map((column) => values[column] ?? null),
      );
      const insertId =
        typeof result === "object" && result !== null && "insertId" in result
          ? Number(result.insertId)
          : 0;
      const saved = await getRow(insertId);
      if (!saved) return fail("The record was created but could not be loaded", 500);
      return ok(saved, 201);
    } catch (error) {
      return handleDbError(error, {
        duplicate: config.duplicateMessage,
        foreignKey: config.foreignKeyMessage,
      });
    }
  }

  async function getById(
    _request: Request,
    context: { params: Promise<Record<string, string>> },
    paramName: string,
  ) {
    const params = await context.params;
    const id = idFromParam(params[paramName] ?? "");
    if (id === null) return fail("Invalid id", 400);
    try {
      const row = await getRow(id);
      return row ? ok(row) : fail("Record not found", 404);
    } catch (error) {
      return handleDbError(error);
    }
  }

  async function update(
    request: Request,
    context: { params: Promise<Record<string, string>> },
    paramName: string,
  ) {
    const params = await context.params;
    const id = idFromParam(params[paramName] ?? "");
    if (id === null) return fail("Invalid id", 400);
    const parsed = await readBody(request);
    if (!parsed.body) return fail(parsed.error ?? "Invalid request body");
    const { values, errors } = config.validate(parsed.body);
    if (errors.length) return fail(errors.join(", "));

    try {
      const assignments = config.updateColumns
        .map((column) => `${column} = ?`)
        .join(", ");
      await query(
        `UPDATE ${config.table} SET ${assignments} WHERE ${config.idColumn} = ?`,
        [...config.updateColumns.map((column) => values[column] ?? null), id],
      );
      const saved = await getRow(id);
      return saved ? ok(saved) : fail("Record not found", 404);
    } catch (error) {
      return handleDbError(error, {
        duplicate: config.duplicateMessage,
        foreignKey: config.foreignKeyMessage,
      });
    }
  }

  async function remove(
    _request: Request,
    context: { params: Promise<Record<string, string>> },
    paramName: string,
  ) {
    const params = await context.params;
    const id = idFromParam(params[paramName] ?? "");
    if (id === null) return fail("Invalid id", 400);
    try {
      const existing = await getRow(id);
      if (!existing) return fail("Record not found", 404);
      await query(
        `DELETE FROM ${config.table} WHERE ${config.idColumn} = ?`,
        [id],
      );
      return ok({ deleted: true });
    } catch (error) {
      return handleDbError(error, {
        duplicate: config.duplicateMessage,
        foreignKey: config.foreignKeyMessage,
      });
    }
  }

  return { list, create, getById, update, remove };
}

function collect(
  checks: (string | null)[],
): string[] {
  return checks.filter((check): check is string => check !== null);
}

export const guestValidation = (input: Record<string, unknown>): Validation => {
  const full_name = trimmed(input.full_name);
  const phone = trimmed(input.phone);
  const email = trimmed(input.email);
  const city = trimmed(input.city);
  const id_proof = trimmed(input.id_proof);
  const errors = collect([
    required(full_name, "Name"),
    maxLen(full_name, 50, "Name"),
    required(phone, "Phone"),
    isPhone(phone),
    maxLen(email, 60, "Email"),
    isEmail(email),
    maxLen(city, 30, "City"),
    oneOf(id_proof, ["Aadhaar", "Passport", "Driving License", "Voter ID", "PAN"], "ID proof"),
  ]);
  return {
    values: { full_name, phone, email: email || null, city: city || null, id_proof: id_proof || null },
    errors,
  };
};

export const roomTypeValidation = (
  input: Record<string, unknown>,
): Validation => {
  const type_name = trimmed(input.type_name);
  const price_per_night = Number(String(input.price_per_night ?? "").trim());
  const capacity = Number(String(input.capacity ?? "").trim());
  return {
    values: { type_name, price_per_night, capacity },
    errors: collect([
      required(type_name, "Type name"),
      maxLen(type_name, 30, "Type name"),
      positiveNumber(input.price_per_night, "Price per night"),
      positiveInt(input.capacity, "Capacity"),
    ]),
  };
};

const employeeRoles = [
  "Manager",
  "Receptionist",
  "Housekeeping",
  "Chef",
  "Security",
  "Accountant",
] as const;

export const employeeValidation = (
  input: Record<string, unknown>,
): Validation => {
  const emp_name = trimmed(input.emp_name);
  const role = trimmed(input.role);
  const phone = trimmed(input.phone);
  const salaryValue = trimmed(input.salary);
  const salary = salaryValue === "" ? null : Number(salaryValue);
  return {
    values: { emp_name, role, phone: phone || null, salary },
    errors: collect([
      required(emp_name, "Name"),
      maxLen(emp_name, 50, "Name"),
      required(role, "Role"),
      oneOf(role, employeeRoles, "Role"),
      isPhone(phone),
      nonNegativeNumber(salaryValue, "Salary"),
    ]),
  };
};

export const serviceValidation = (
  input: Record<string, unknown>,
): Validation => {
  const service_name = trimmed(input.service_name);
  const price = Number(String(input.price ?? "").trim());
  return {
    values: { service_name, price },
    errors: collect([
      required(service_name, "Service name"),
      maxLen(service_name, 40, "Service name"),
      positiveNumber(input.price, "Price"),
    ]),
  };
};

export { idFromParam, readBody, isRecord };
