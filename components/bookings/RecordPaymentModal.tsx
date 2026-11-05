"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import { FormField, SelectField } from "@/components/FormField";
import Modal from "@/components/Modal";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { oneOf, positiveNumber } from "@/lib/validate";

type BookingChoice = Pick<
  Booking,
  "booking_id" | "full_name" | "room_no" | "status" | "balance"
>;
type Props = {
  open: boolean;
  bookingId?: number;
  balance?: number;
  onClose: () => void;
  onRecorded: () => void;
};

export default function RecordPaymentModal({
  open,
  bookingId,
  balance: initialBalance,
  onClose,
  onRecorded,
}: Props) {
  const request = useApi();
  const [bookings, setBookings] = useState<BookingChoice[]>([]);
  const [selectedId, setSelectedId] = useState(bookingId ? String(bookingId) : "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fixedBooking = bookingId !== undefined;

  useEffect(() => {
    if (!open || fixedBooking) return;
    let active = true;
    async function loadBookings() {
      try {
        const result = await request<{ bookings: Booking[] }>("/api/bookings");
        if (!active) return;
        const eligible = result.bookings
          .filter((booking) => booking.status !== "Cancelled" && booking.balance > 0)
          .map(({ booking_id, full_name, room_no, status, balance: due }) => ({
            booking_id,
            full_name,
            room_no,
            status,
            balance: due,
          }));
        setBookings(eligible);
        setSelectedId((current) =>
          eligible.some((booking) => String(booking.booking_id) === current)
            ? current
            : String(eligible[0]?.booking_id ?? ""),
        );
      } catch {
        // useApi displays request errors as toasts.
      }
    }
    void loadBookings();
    return () => {
      active = false;
    };
  }, [fixedBooking, open, request]);

  const selectedBooking = bookings.find(
    (booking) => String(booking.booking_id) === selectedId,
  );
  const availableBalance = fixedBooking
    ? initialBalance ?? 0
    : selectedBooking?.balance ?? 0;

  const bookingOptions = useMemo(
    () => [
      { value: "", label: "Select a booking" },
      ...bookings.map((booking) => ({
        value: String(booking.booking_id),
        label: `#${booking.booking_id} · ${booking.full_name} · Room ${booking.room_no} · Remaining ${formatCurrency(booking.balance)}`,
      })),
    ],
    [bookings],
  );

  function close() {
    if (saving) return;
    reset();
    onClose();
  }

  function reset() {
    setSelectedId(bookingId ? String(bookingId) : "");
    setAmount("");
    setMethod("");
    setErrors({});
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!selectedId) nextErrors.booking_id = "Booking is required";
    const amountError = positiveNumber(amount, "Amount");
    if (amountError) nextErrors.amount = amountError;
    else if (!/^\d+(?:\.\d{1,2})?$/.test(amount.trim())) {
      nextErrors.amount = "Amount must have at most 2 decimal places";
    } else if (Number(amount) > availableBalance) {
      nextErrors.amount = "Payment exceeds the remaining amount";
    }
    const methodRequired = method ? null : "Method is required";
    const methodError = methodRequired ?? oneOf(method, ["Cash", "Card", "UPI"], "Method");
    if (methodError) nextErrors.method = methodError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await request(
        "/api/payments",
        {
          method: "POST",
          body: JSON.stringify({
            booking_id: Number(selectedId),
            amount: Number(amount),
            method,
          }),
        },
        "Payment recorded successfully",
      );
      reset();
      onClose();
      onRecorded();
    } catch {
      // useApi displays request errors as toasts.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Record payment" onClose={close}>
      <form className="resource-form" onSubmit={(event) => void submit(event)} noValidate>
        <div className="payment-balance-banner">
          <span>Remaining</span>
          <strong>{formatCurrency(availableBalance)}</strong>
        </div>
        {!fixedBooking && (
          <SelectField
            name="booking_id"
            label="Booking"
            required
            value={selectedId}
            options={bookingOptions}
            error={errors.booking_id}
            disabled={saving}
            onChange={(event) => setSelectedId(event.target.value)}
          />
        )}
        {!fixedBooking && selectedBooking && (
          <p className="muted payment-booking-label">
            {selectedBooking.full_name} · Room {selectedBooking.room_no}
          </p>
        )}
        <div className="payment-amount-field">
          <FormField
            name="amount"
            label="Amount"
            type="number"
            required
            min={0.01}
            max={availableBalance}
            step="0.01"
            value={amount}
            error={errors.amount}
            disabled={saving}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={saving || availableBalance <= 0}
            onClick={() => setAmount(availableBalance.toFixed(2))}
          >
            Pay full remaining amount
          </Button>
        </div>
        <SelectField
          name="method"
          label="Method"
          required
          value={method}
          error={errors.method}
          options={[
            { value: "", label: "Select a method" },
            { value: "Cash", label: "Cash" },
            { value: "Card", label: "Card" },
            { value: "UPI", label: "UPI" },
          ]}
          disabled={saving}
          onChange={(event) => setMethod(event.target.value)}
        />
        <div className="form-actions">
          <Button type="button" variant="secondary" disabled={saving} onClick={close}>Cancel</Button>
          <Button type="submit" loading={saving}>Record payment</Button>
        </div>
      </form>
    </Modal>
  );
}
