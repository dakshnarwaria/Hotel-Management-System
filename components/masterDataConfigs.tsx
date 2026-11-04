import type { ReactNode } from "react";
import { Check, Wrench } from "lucide-react";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/format";
import {
  isEmail,
  isPhone,
  maxLen,
  nonNegativeNumber,
  oneOf,
  positiveInt,
  positiveNumber,
  required,
} from "@/lib/validate";
import type { DataColumn } from "@/components/DataTable";

export type FormValues = Record<string, string>;
export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "select";
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  options?: { value: string; label: string }[];
  readOnlyOnEdit?: boolean;
  hideWhen?: (row: Record<string, unknown> | null) => boolean;
  validate?: (value: string, values: FormValues) => string | null;
};

export type ResourceConfig = {
  title: string;
  endpoint: string;
  idKey: string;
  columns: DataColumn<Record<string, unknown>>[];
  fields: FieldConfig[];
  defaults: FormValues;
  validate: (values: FormValues, editing: boolean) => Record<string, string>;
  numberFields?: string[];
  roomOptions?: boolean;
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
  extraAction?: (
    row: Record<string, unknown>,
    onToggle: (row: Record<string, unknown>) => void,
    loading: boolean,
  ) => ReactNode;
};

const idProofs = [
  "Aadhaar",
  "Passport",
  "Driving License",
  "Voter ID",
  "PAN",
].map((value) => ({ value, label: value }));

const employeeRoles = [
  "Manager",
  "Receptionist",
  "Housekeeping",
  "Chef",
  "Security",
  "Accountant",
].map((value) => ({ value, label: value }));

const emptyOption = [{ value: "", label: "Select an option" }];

function errorsFor(
  values: FormValues,
  checks: Record<string, string | null>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, message] of Object.entries(checks)) {
    if (message) errors[field] = message;
  }
  return errors;
}

export const masterDataConfigs: Record<string, ResourceConfig> = {
  guests: {
    title: "Guests",
    endpoint: "/api/guests",
    idKey: "guest_id",
    defaults: { full_name: "", phone: "", email: "", city: "", id_proof: "" },
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true, maxLength: 50 },
      { name: "phone", label: "Phone", type: "tel", required: true, maxLength: 15 },
      { name: "email", label: "Email", type: "email", maxLength: 60 },
      { name: "city", label: "City", type: "text", maxLength: 30 },
      { name: "id_proof", label: "ID proof", type: "select", options: [emptyOption[0], ...idProofs] },
    ],
    columns: [
      { key: "full_name", header: "Name" },
      { key: "phone", header: "Phone" },
      { key: "email", header: "Email", render: (row) => display(row.email) },
      { key: "city", header: "City", render: (row) => display(row.city) },
      { key: "id_proof", header: "ID Proof", render: (row) => display(row.id_proof) },
    ],
    validate: (values) =>
      errorsFor(values, {
        full_name:
          required(values.full_name.trim(), "Name") ??
          maxLen(values.full_name.trim(), 50, "Name"),
        phone:
          required(values.phone.trim(), "Phone") ??
          isPhone(values.phone.trim()),
        email: maxLen(values.email.trim(), 60, "Email") ?? isEmail(values.email.trim()),
        city: maxLen(values.city.trim(), 30, "City"),
        id_proof: oneOf(values.id_proof.trim(), idProofs.map(({ value }) => value), "ID proof"),
      }),
  },
  "room-types": {
    title: "Room Types",
    endpoint: "/api/room-types",
    idKey: "type_id",
    defaults: { type_name: "", price_per_night: "", capacity: "" },
    fields: [
      { name: "type_name", label: "Type name", type: "text", required: true, maxLength: 30 },
      { name: "price_per_night", label: "Price per night", type: "number", required: true, placeholder: "e.g. 4500", validate: (value) => positiveNumber(value, "Price per night") },
      { name: "capacity", label: "Capacity", type: "number", required: true, validate: (value) => positiveInt(value, "Capacity") },
    ],
    numberFields: ["price_per_night", "capacity"],
    columns: [
      { key: "type_name", header: "Type" },
      { key: "price_per_night", header: "Price per night", render: (row) => formatCurrency(row.price_per_night as number) },
      { key: "capacity", header: "Capacity" },
      { key: "rooms_count", header: "Rooms" },
    ],
    validate: (values) =>
      errorsFor(values, {
        type_name: required(values.type_name.trim(), "Type name") ?? maxLen(values.type_name.trim(), 30, "Type name"),
        price_per_night: positiveNumber(values.price_per_night, "Price per night"),
        capacity: positiveInt(values.capacity, "Capacity"),
      }),
  },
  rooms: {
    title: "Rooms",
    endpoint: "/api/rooms",
    idKey: "room_no",
    roomOptions: true,
    defaults: { room_no: "", type_id: "", floor_no: "", status: "Available" },
    fields: [
      { name: "room_no", label: "Room number", type: "number", required: true, readOnlyOnEdit: true },
      { name: "type_id", label: "Room type", type: "select", required: true, options: emptyOption },
      { name: "floor_no", label: "Floor", type: "number", required: true, validate: (value) => positiveInt(value, "Floor") },
      { name: "status", label: "Status", type: "select", options: [{ value: "Available", label: "Available" }, { value: "Maintenance", label: "Maintenance" }], hideWhen: (row) => row?.status === "Occupied" },
    ],
    numberFields: ["room_no", "type_id", "floor_no"],
    filters: [
      {
        name: "status",
        label: "Status",
        options: [
          { value: "", label: "All statuses" },
          { value: "Available", label: "Available" },
          { value: "Occupied", label: "Occupied" },
          { value: "Maintenance", label: "Maintenance" },
        ],
      },
    ],
    columns: [
      { key: "room_no", header: "Room No" },
      { key: "type_name", header: "Type" },
      { key: "floor_no", header: "Floor" },
      { key: "capacity", header: "Capacity" },
      { key: "price_per_night", header: "Price per night", render: (row) => formatCurrency(row.price_per_night as number) },
      { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
    ],
    extraAction: (row, onToggle, loading) => {
      const occupied = row.status === "Occupied";
      const nextStatus =
        row.status === "Available" ? "Maintenance" : "Available";
      return (
        <Button
          key="room-status"
          variant="secondary"
          size="sm"
          loading={loading}
          disabled={occupied}
          title={
            occupied
              ? "Room status is managed automatically while a guest is checked in"
              : `Mark ${nextStatus.toLowerCase()}`
          }
          aria-label={
            occupied
              ? "Room status cannot be changed while occupied"
              : `Mark room ${nextStatus.toLowerCase()}`
          }
          onClick={() => onToggle(row)}
        >
          {nextStatus === "Maintenance" ? (
            <Wrench size={14} aria-hidden />
          ) : (
            <Check size={14} aria-hidden />
          )}
          {nextStatus}
        </Button>
      );
    },
    validate: (values, editing) =>
      errorsFor(values, {
        room_no: editing ? null : positiveInt(values.room_no, "Room number"),
        type_id: positiveInt(values.type_id, "Room type"),
        floor_no: positiveInt(values.floor_no, "Floor"),
      }),
  },
  employees: {
    title: "Employees",
    endpoint: "/api/employees",
    idKey: "emp_id",
    defaults: { emp_name: "", role: "", phone: "", salary: "" },
    fields: [
      { name: "emp_name", label: "Name", type: "text", required: true, maxLength: 50 },
      { name: "role", label: "Role", type: "select", required: true, options: [emptyOption[0], ...employeeRoles] },
      { name: "phone", label: "Phone", type: "tel", maxLength: 15 },
      { name: "salary", label: "Salary", type: "number", placeholder: "Optional" },
    ],
    numberFields: ["salary"],
    columns: [
      { key: "emp_name", header: "Name" },
      { key: "role", header: "Role" },
      { key: "phone", header: "Phone", render: (row) => display(row.phone) },
      { key: "salary", header: "Salary", render: (row) => row.salary == null ? "—" : formatCurrency(row.salary as number) },
      { key: "bookings_handled", header: "Bookings handled" },
    ],
    validate: (values) =>
      errorsFor(values, {
        emp_name: required(values.emp_name.trim(), "Name") ?? maxLen(values.emp_name.trim(), 50, "Name"),
        role: required(values.role.trim(), "Role") ?? oneOf(values.role.trim(), employeeRoles.map(({ value }) => value), "Role"),
        phone: isPhone(values.phone.trim()),
        salary: nonNegativeNumber(values.salary.trim(), "Salary"),
      }),
  },
  services: {
    title: "Services",
    endpoint: "/api/services",
    idKey: "service_id",
    defaults: { service_name: "", price: "" },
    fields: [
      { name: "service_name", label: "Service name", type: "text", required: true, maxLength: 40 },
      { name: "price", label: "Price", type: "number", required: true, validate: (value) => positiveNumber(value, "Price") },
    ],
    numberFields: ["price"],
    columns: [
      { key: "service_name", header: "Service" },
      { key: "price", header: "Price", render: (row) => formatCurrency(row.price as number) },
      { key: "times_ordered", header: "Times ordered" },
    ],
    validate: (values) =>
      errorsFor(values, {
        service_name: required(values.service_name.trim(), "Service name") ?? maxLen(values.service_name.trim(), 40, "Service name"),
        price: positiveNumber(values.price, "Price"),
      }),
  },
};

function display(value: unknown): string {
  return value == null || value === "" ? "—" : String(value);
}
