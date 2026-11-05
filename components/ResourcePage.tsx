"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable from "@/components/DataTable";
import { FormField, SelectField } from "@/components/FormField";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import StatusBadge from "@/components/StatusBadge";
import GuestFormFields from "@/components/GuestFormFields";
import { masterDataConfigs, type FormValues } from "@/components/masterDataConfigs";
import { useApi } from "@/hooks/useApi";
import { useList } from "@/hooks/useList";

type Row = Record<string, unknown>;

export default function ResourcePage({ resource }: { resource: string }) {
  const config = masterDataConfigs[resource];
  const request = useApi();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [availabilityOn, setAvailabilityOn] = useState("");
  const [roomTypes, setRoomTypes] = useState<Row[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [quickStatusLoading, setQuickStatusLoading] = useState<number | null>(
    null,
  );

  const { rows, loading, refresh } = useList<Row>(config.endpoint, {
    ...filters,
    ...(search ? { search } : {}),
    ...(resource === "rooms" && availabilityOn
      ? { availability_on: availabilityOn }
      : {}),
  });

  useEffect(() => {
    if (!config.roomOptions || !modalOpen || roomTypes.length > 0) return;
    request<Row[]>("/api/room-types")
      .then(setRoomTypes)
      .catch(() => setRoomTypes([]));
  }, [config.roomOptions, modalOpen, request, roomTypes.length]);

  const fields = useMemo(() => {
    if (!config.roomOptions) return config.fields;
    return config.fields.map((field) =>
      field.name === "type_id"
        ? {
            ...field,
            options: [
              { value: "", label: "Select a room type" },
              ...roomTypes.map((roomType) => ({
                value: String(roomType.type_id),
                label: String(roomType.type_name),
              })),
            ],
          }
        : field,
    );
  }, [config.fields, config.roomOptions, roomTypes]);

  function openCreate() {
    setEditing(null);
    setFormValues({ ...config.defaults });
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    const values: FormValues = {};
    for (const field of config.fields) {
      values[field.name] =
        row[field.name] == null ? "" : String(row[field.name]);
    }
    setFormValues(values);
    setFieldErrors({});
    setModalOpen(true);
  }

  function updateField(name: string, value: string) {
    setFormValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = config.validate(formValues, Boolean(editing));
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const payload: Record<string, string | number | null> = {};
    for (const field of fields) {
      if (field.hideWhen?.(editing)) continue;
      const value = formValues[field.name]?.trim() ?? "";
      payload[field.name] =
        value === ""
          ? null
          : config.numberFields?.includes(field.name)
            ? Number(value)
            : value;
    }

    setSaving(true);
    try {
      const url = editing
        ? `${config.endpoint}/${encodeURIComponent(String(editing[config.idKey]))}`
        : config.endpoint;
      await request<Row>(
        url,
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
        `${config.title.slice(0, -1)} ${editing ? "updated" : "added"} successfully`,
      );
      setModalOpen(false);
      refresh();
    } catch {
      // useApi displays request errors as toasts.
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await request(
        `${config.endpoint}/${encodeURIComponent(String(deleting[config.idKey]))}`,
        { method: "DELETE" },
        `${config.title.slice(0, -1)} deleted successfully`,
      );
      setDeleting(null);
      refresh();
    } catch {
      // useApi displays request errors as toasts.
    } finally {
      setDeleteLoading(false);
    }
  }

  async function toggleRoomStatus(row: Row) {
    const roomNo = Number(row.room_no);
    if (
      !Number.isSafeInteger(roomNo) ||
      row.display_status === "Occupied" ||
      row.display_status === "Reserved"
    ) return;
    setQuickStatusLoading(roomNo);
    try {
      const status = row.status === "Available" ? "Maintenance" : "Available";
      await request(
        `${config.endpoint}/${roomNo}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
        `Room ${roomNo} marked ${status.toLowerCase()}`,
      );
      refresh();
    } catch {
      // useApi displays request errors as toasts.
    } finally {
      setQuickStatusLoading(null);
    }
  }

  const columns = useMemo(
    () => config.columns,
    [config.columns],
  );
  const dataKey = `${search}:${Object.values(filters).join(":")}:${availabilityOn}`;

  return (
    <>
      <PageHeader
        eyebrow="Property records"
        title={config.title}
        action={
          <Button onClick={openCreate}>
            <Plus size={17} aria-hidden />
            Add {config.title === "Room Types" ? "Room Type" : config.title.slice(0, -1)}
          </Button>
        }
      />

      <div className="resource-toolbar">
        <SearchInput
          onChange={setSearch}
          placeholder={`Search ${config.title.toLowerCase()}...`}
        />
        {config.filters?.map((filter) => (
          <label className="filter-field" key={filter.name}>
            <span className="sr-only">{filter.label}</span>
            <select
              value={filters[filter.name] ?? ""}
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  [filter.name]: event.target.value,
                }));
              }}
              aria-label={filter.label}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        {config.roomOptions && (
          <label className="filter-field">
            <span className="sr-only">Room type</span>
            <select
              value={filters.type_id ?? ""}
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  type_id: event.target.value,
                }));
              }}
              aria-label="Room type"
            >
              <option value="">All room types</option>
              {roomTypes.map((type) => (
                <option key={String(type.type_id)} value={String(type.type_id)}>
                  {String(type.type_name)}
                </option>
              ))}
            </select>
          </label>
        )}
        {config.roomOptions && (
          <div className="availability-date-filter">
            <label className="filter-field">
              <span className="sr-only">Availability on</span>
              <input
                type="date"
                aria-label="Availability on"
                value={availabilityOn}
                onChange={(event) => {
                  setAvailabilityOn(event.target.value);
                }}
              />
            </label>
            {availabilityOn && (
              <Button
                variant="secondary"
                size="sm"
                aria-label="Clear availability date"
                title="Clear availability date"
                onClick={() => {
                  setAvailabilityOn("");
                }}
              >
                <X size={14} />
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      <DataTable<Row>
        key={dataKey}
        columns={columns}
        rows={rows}
        loading={loading}
        emptyMessage={`No ${config.title.toLowerCase()} found.`}
        rowKey={(row) => String(row[config.idKey])}
        actions={(row) => (
          <div className="row-actions">
            {config.extraAction?.(
              row,
              toggleRoomStatus,
              quickStatusLoading === Number(row.room_no),
            )}
            <Button
              variant="secondary"
              size="sm"
              className="icon-action"
              title={`Edit ${config.title.slice(0, -1)}`}
              aria-label={`Edit ${config.title.slice(0, -1)}`}
              onClick={() => openEdit(row)}
            >
              <Pencil size={15} />
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="icon-action"
              title={`Delete ${config.title.slice(0, -1)}`}
              aria-label={`Delete ${config.title.slice(0, -1)}`}
              onClick={() => setDeleting(row)}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        title={`${editing ? "Edit" : "Add"} ${
          config.title === "Room Types" ? "Room Type" : config.title.slice(0, -1)
        }`}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
      >
        <form className="resource-form" onSubmit={submit} noValidate>
          {editing?.status === "Occupied" && (
            <div className="form-note">
              <StatusBadge status="Occupied" />
              <span>
                Room status is managed automatically while a guest is checked in.
              </span>
            </div>
          )}
          {(resource === "guests" ? [] : fields)
            .filter((field) => !field.hideWhen?.(editing))
            .map((field) => {
              const value = formValues[field.name] ?? "";
              const readOnly =
                Boolean(editing) && field.readOnlyOnEdit === true;
              if (field.type === "select") {
                return (
                  <SelectField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    required={field.required}
                    value={value}
                    options={field.options ?? []}
                    error={fieldErrors[field.name]}
                    disabled={saving}
                    onChange={(event) =>
                      updateField(field.name, event.target.value)
                    }
                  />
                );
              }
              return (
                <FormField
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  type={field.type}
                  required={field.required}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  value={value}
                  readOnly={readOnly}
                  min={
                    field.name === "floor_no"
                      ? 0
                      : field.type === "number"
                        ? 0
                        : undefined
                  }
                  max={field.name === "floor_no" ? 100 : undefined}
                  step={
                    field.name === "floor_no"
                      ? 1
                      : field.type === "number"
                        ? "any"
                        : undefined
                  }
                  helperText={field.name === "floor_no" ? "0 = Ground floor" : undefined}
                  error={fieldErrors[field.name]}
                  disabled={saving}
                  onChange={(event) =>
                    updateField(field.name, event.target.value)
                  }
                />
              );
            })}
          {resource === "guests" && (
            <GuestFormFields
              values={{
                full_name: formValues.full_name ?? "",
                phone: formValues.phone ?? "",
                email: formValues.email ?? "",
                city: formValues.city ?? "",
                id_proof: formValues.id_proof ?? "",
              }}
              errors={fieldErrors}
              disabled={saving}
              onChange={(field, value) => updateField(field, value)}
            />
          )}
          <div className="form-actions">
            <Button
              variant="secondary"
              type="button"
              disabled={saving}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Add record"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${config.title === "Room Types" ? "Room Type" : config.title.slice(0, -1)}?`}
        message={`Are you sure you want to delete ${
          String(deleting?.[config.idKey] ?? "this record")
        }? This action cannot be undone.`}
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleting(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
