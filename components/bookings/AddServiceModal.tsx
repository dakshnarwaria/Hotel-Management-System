"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import ErrorCard from "@/components/ErrorCard";
import { FormField, SelectField } from "@/components/FormField";
import Modal from "@/components/Modal";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/format";
import { positiveInt } from "@/lib/validate";

type ServiceOption = { service_id: number; service_name: string; price: number };
type BookingOption = {
  booking_id: number;
  full_name: string;
  room_no: number;
  check_in: string | Date;
  check_out: string | Date;
};
type Props = {
  open: boolean;
  bookingId?: number;
  checkIn?: string | Date;
  checkOut?: string | Date;
  onClose: () => void;
  onAdded: () => void;
};

function dateValue(value: string | Date) {
  if (typeof value === "string") return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function todayValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function AddServiceModal({
  open,
  bookingId,
  checkIn,
  checkOut,
  onClose,
  onAdded,
}: Props) {
  const request = useApi();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [orderDate, setOrderDate] = useState(todayValue);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsFailed, setOptionsFailed] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [optionsRetry, setOptionsRetry] = useState(0);
  const fixedBooking = bookingId !== undefined;

  useEffect(() => {
    if (!open) return;
    let active = true;
    async function loadOptions() {
      setLoadingOptions(true);
      setOptionsFailed(false);
      setOptionsError("");
      try {
        const [serviceRows, bookingResult] = await Promise.all([
          request<ServiceOption[]>("/api/services"),
          fixedBooking
            ? Promise.resolve(null)
            : request<{ bookings: BookingOption[] }>("/api/bookings?status=Checked-In"),
        ]);
        if (!active) return;
        setServices(serviceRows);
        const checkedIn = bookingResult?.bookings ?? [];
        setBookings(checkedIn);
        setSelectedId(
          fixedBooking
            ? String(bookingId)
            : (current) =>
                checkedIn.some((booking) => String(booking.booking_id) === current)
                  ? current
                  : String(checkedIn[0]?.booking_id ?? ""),
        );
        setOrderDate(todayValue());
      } catch (error) {
        if (active) {
          setOptionsFailed(true);
          setOptionsError(
            error instanceof Error ? error.message : "Could not load services",
          );
        }
      } finally {
        if (active) setLoadingOptions(false);
      }
    }
    void loadOptions();
    return () => {
      active = false;
    };
  }, [bookingId, fixedBooking, open, optionsRetry, request]);

  const activeBooking = fixedBooking
    ? null
    : bookings.find((booking) => String(booking.booking_id) === selectedId);
  const currentCheckIn = fixedBooking
    ? checkIn
    : activeBooking?.check_in;
  const currentCheckOut = fixedBooking
    ? checkOut
    : activeBooking?.check_out;

  const selectedService = services.find(
    (service) => String(service.service_id) === serviceId,
  );
  const lineTotal = useMemo(
    () => Number(selectedService?.price ?? 0) * Number(quantity || 0),
    [quantity, selectedService],
  );
  const gst = lineTotal * 0.18;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!fixedBooking && !selectedId) nextErrors.booking_id = "Booking is required";
    if (!serviceId) nextErrors.service_id = "Service is required";
    const quantityError = positiveInt(quantity, "Quantity");
    if (quantityError) nextErrors.quantity = quantityError;
    if (!orderDate) nextErrors.order_date = "Order date is required";
    else if (
      currentCheckIn &&
      currentCheckOut &&
      (orderDate < dateValue(currentCheckIn) || orderDate > dateValue(currentCheckOut))
    ) {
      nextErrors.order_date = "Order date must be between check-in and check-out dates";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await request(
        "/api/service-orders",
        {
          method: "POST",
          body: JSON.stringify({
            booking_id: fixedBooking ? Number(bookingId) : Number(selectedId),
            service_id: Number(serviceId),
            quantity: Number(quantity),
            order_date: orderDate,
          }),
        },
        "Service order added",
      );
      onClose();
      onAdded();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not record this service";
      if (message.toLowerCase().includes("date")) {
        setErrors((current) => ({ ...current, order_date: message }));
      } else if (message.toLowerCase().includes("quantity")) {
        setErrors((current) => ({ ...current, quantity: message }));
      }
    } finally {
      setSaving(false);
    }
  }

  if (!fixedBooking && !loadingOptions && !optionsFailed && bookings.length === 0) {
    return (
      <Modal open={open} title="Record service" onClose={() => !saving && onClose()}>
        <div className="service-empty-state">
          <p>No guests are checked in right now. Check a guest in from the Bookings page first.</p>
          <Link className="button button-primary button-sm" href="/bookings">
            Go to Bookings
          </Link>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} title="Record service" onClose={() => !saving && onClose()}>
      {loadingOptions ? (
        <p className="muted">Loading checked-in bookings and services…</p>
      ) : optionsFailed ? (
        <ErrorCard
          message={optionsError}
          onRetry={() => setOptionsRetry((current) => current + 1)}
        />
      ) : (
      <form className="resource-form" onSubmit={(event) => void submit(event)} noValidate>
        {!fixedBooking && (
          <SelectField
            name="booking_id"
            label="Booking"
            required
            value={selectedId}
            error={errors.booking_id}
            options={[
              { value: "", label: "Select a checked-in booking" },
              ...bookings.map((booking) => ({
                value: String(booking.booking_id),
                label: `#${booking.booking_id} · ${booking.full_name} · Room ${booking.room_no}`,
              })),
            ]}
            disabled={saving}
            onChange={(event) => setSelectedId(event.target.value)}
          />
        )}
        <SelectField
          name="service_id"
          label="Service"
          required
          value={serviceId}
          error={errors.service_id}
          options={[
            { value: "", label: "Select a service" },
            ...services.map((service) => ({
              value: String(service.service_id),
              label: `${service.service_name} · ${formatCurrency(service.price)}`,
            })),
          ]}
          disabled={saving || services.length === 0}
          onChange={(event) => setServiceId(event.target.value)}
        />
        <FormField
          name="quantity"
          label="Quantity"
          type="number"
          required
          min={1}
          step={1}
          value={quantity}
          error={errors.quantity}
          disabled={saving}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <FormField
          name="order_date"
          label="Order date"
          type="date"
          required
          min={currentCheckIn ? dateValue(currentCheckIn) : undefined}
          max={currentCheckOut ? dateValue(currentCheckOut) : undefined}
          value={orderDate}
          error={errors.order_date}
          disabled={saving}
          onChange={(event) => setOrderDate(event.target.value)}
        />
        <div className="line-total-preview">
          <div><span>Line total before GST</span><strong>{formatCurrency(lineTotal)}</strong></div>
          <div><span>GST (18%)</span><strong>{formatCurrency(gst)}</strong></div>
          <div><span>Total including GST</span><strong>{formatCurrency(lineTotal + gst)}</strong></div>
        </div>
        <div className="form-actions">
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Record service</Button>
        </div>
      </form>
      )}
    </Modal>
  );
}
