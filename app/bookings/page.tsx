"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, CalendarClock, LogOut, XCircle } from "lucide-react";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable from "@/components/DataTable";
import ErrorCard from "@/components/ErrorCard";
import { FormField } from "@/components/FormField";
import NewBookingModal from "@/components/bookings/NewBookingModal";
import FinalBillModal from "@/components/bookings/FinalBillModal";
import type { BillData } from "@/components/bookings/BillSummary";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import StatusBadge from "@/components/StatusBadge";
import { useApi } from "@/hooks/useApi";
import { useList } from "@/hooks/useList";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Booking } from "@/lib/types";

type Counts = Record<"All" | Booking["status"], number>;
const tabs: { label: keyof Counts; status: string }[] = [
  { label: "All", status: "" },
  { label: "Confirmed", status: "Confirmed" },
  { label: "Checked-In", status: "Checked-In" },
  { label: "Checked-Out", status: "Checked-Out" },
  { label: "Cancelled", status: "Cancelled" },
];

export default function BookingsPage() {
  const request = useApi();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { rows: bookings, summary, loading, error, refresh } = useList<Booking, Counts>(
    "/api/bookings",
    {
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
      ...(from && to ? { from, to } : {}),
    },
  );
  const counts = summary ?? {
    All: 0,
    Confirmed: 0,
    "Checked-In": 0,
    "Checked-Out": 0,
    Cancelled: 0,
  };
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [finalBill, setFinalBill] = useState<BillData | null>(null);

  async function checkIn(booking: Booking) {
    setActionLoading(booking.booking_id);
    try {
      await request(
        `/api/bookings/${booking.booking_id}/check-in`,
        { method: "POST" },
        `Booking #${booking.booking_id} checked in`,
      );
    } catch {
    } finally {
      setActionLoading(null);
    }
  }

  async function checkOut(booking: Booking) {
    setActionLoading(booking.booking_id);
    try {
      const bill = await request<BillData>(
        `/api/bookings/${booking.booking_id}/check-out`,
        { method: "POST" },
        `Booking #${booking.booking_id} checked out`,
      );
      setFinalBill(bill);
    } catch {
    } finally {
      setActionLoading(null);
    }
  }

  async function cancelBooking() {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await request(
        `/api/bookings/${cancelTarget.booking_id}/cancel`,
        { method: "POST" },
        `Booking #${cancelTarget.booking_id} cancelled`,
      );
      setCancelTarget(null);
    } catch {
    } finally {
      setCancelLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      { key: "booking_id", header: "ID" },
      {
        key: "full_name",
        header: "Guest",
        render: (row: Booking) => (
          <span className="booking-primary-cell">
            <strong>{row.full_name}</strong>
            <small>{row.phone}</small>
          </span>
        ),
      },
      {
        key: "room_no",
        header: "Room",
        render: (row: Booking) => (
          <span className="booking-primary-cell">
            <strong>{row.room_no}</strong>
            <small>{row.type_name}</small>
          </span>
        ),
      },
      {
        key: "check_in",
        header: "Stay",
        render: (row: Booking) => (
          <span className="booking-primary-cell">
            <strong>
              {formatDate(row.check_in)} – {formatDate(row.check_out)}
            </strong>
            <small>{row.nights} {row.nights === 1 ? "night" : "nights"}</small>
          </span>
        ),
      },
      { key: "no_of_guests", header: "Guests" },
      {
        key: "status",
        header: "Status",
        render: (row: Booking) => <StatusBadge status={row.status} />,
      },
      {
        key: "grand_total",
        header: "Total",
        render: (row: Booking) => formatCurrency(row.grand_total),
      },
      {
        key: "balance",
        header: "Remaining",
        render: (row: Booking) => (
          <strong className={row.balance > 0 ? "balance-due" : ""}>
            {formatCurrency(row.balance)}
          </strong>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        eyebrow="Reservations"
        title="Bookings"
        action={
          <Button onClick={() => setNewBookingOpen(true)}>
            <CalendarCheck size={17} />
            New Booking
          </Button>
        }
      />

      <div className="booking-tabs" role="tablist" aria-label="Booking status">
        {tabs.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={status === tab.status}
            className={status === tab.status ? "active" : ""}
            key={tab.label}
            onClick={() => setStatus(tab.status)}
          >
            {tab.label}
            <span>{counts[tab.label]}</span>
          </button>
        ))}
      </div>

      <div className="resource-toolbar booking-toolbar">
        <SearchInput
          onChange={setSearch}
          placeholder="Search guest, phone or room..."
        />
        <FormField
          name="from"
          label="From"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <FormField
          name="to"
          label="To"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => setTo(event.target.value)}
        />
      </div>

      {error && <ErrorCard message={error} onRetry={refresh} />}
      <DataTable<Booking>
        columns={columns}
        rows={bookings}
        loading={loading}
        emptyMessage="No bookings match these filters. Clear the filters or choose New Booking to start."
        rowKey={(row) => row.booking_id}
        actions={(booking) => {
          const checkInUnavailable = !Boolean(booking.can_check_in);
          const busy = actionLoading === booking.booking_id;
          return (
            <div className="row-actions booking-actions">
              <Link
                className="button button-secondary button-sm"
                href={`/bookings/${booking.booking_id}`}
                title="View booking"
              >
                View <ArrowRight size={14} />
              </Link>
              {booking.status === "Confirmed" && (
                <>
                  <Button
                    size="sm"
                    loading={busy}
                    disabled={checkInUnavailable || busy}
                    title={
                      checkInUnavailable
                        ? "Check-in is only available on or after the check-in date"
                        : "Check in guest"
                    }
                    onClick={() => void checkIn(booking)}
                  >
                    <CalendarClock size={14} />
                    Check-in
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setCancelTarget(booking)}
                  >
                    <XCircle size={14} />
                    Cancel
                  </Button>
                </>
              )}
              {booking.status === "Checked-In" && (
                <Button
                  size="sm"
                  loading={busy}
                  onClick={() => void checkOut(booking)}
                >
                  <LogOut size={14} />
                  Check-out
                </Button>
              )}
            </div>
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel booking?"
        message={`Cancel booking #${cancelTarget?.booking_id ?? ""} for ${cancelTarget?.full_name ?? "this guest"}?`}
        loading={cancelLoading}
        onClose={() => {
          if (!cancelLoading) setCancelTarget(null);
        }}
        onConfirm={() => void cancelBooking()}
      />

      <FinalBillModal bill={finalBill} onClose={() => setFinalBill(null)} />

      <NewBookingModal
        open={newBookingOpen}
        onClose={() => setNewBookingOpen(false)}
        onCreated={() => {
          setNewBookingOpen(false);
        }}
      />
    </>
  );
}
