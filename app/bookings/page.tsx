"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, CalendarClock, LogOut, XCircle } from "lucide-react";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable from "@/components/DataTable";
import { FormField } from "@/components/FormField";
import Modal from "@/components/Modal";
import NewBookingModal from "@/components/bookings/NewBookingModal";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import StatusBadge from "@/components/StatusBadge";
import { useApi } from "@/hooks/useApi";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Booking } from "@/lib/types";

type Counts = Record<"All" | Booking["status"], number>;
type BookingList = { bookings: Booking[]; counts: Counts };
type Bill = {
  booking_id: number;
  full_name: string;
  room_no: number;
  status: string;
  room_charge: number;
  services_total: number;
  grand_total: number;
  paid: number;
  balance: number;
};

const tabs: { label: keyof Counts; status: string }[] = [
  { label: "All", status: "" },
  { label: "Confirmed", status: "Confirmed" },
  { label: "Checked-In", status: "Checked-In" },
  { label: "Checked-Out", status: "Checked-Out" },
  { label: "Cancelled", status: "Cancelled" },
];

function dateOnly(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function todayLocal() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function BookingsPage() {
  const request = useApi();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [counts, setCounts] = useState<Counts>({
    All: 0,
    Confirmed: 0,
    "Checked-In": 0,
    "Checked-Out": 0,
    Cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [finalBill, setFinalBill] = useState<Bill | null>(null);

  const searchChanged = useCallback((value: string) => {
    setLoading(true);
    setSearch(value);
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (from && to) {
        params.set("from", from);
        params.set("to", to);
      }
      const queryString = params.size ? `?${params.toString()}` : "";
      const result = await request<BookingList>(`/api/bookings${queryString}`);
      setBookings(result.bookings);
      setCounts(result.counts);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [from, request, search, status, to]);

  useEffect(() => {
    let active = true;
    async function fetchBookings() {
      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        if (from && to) {
          params.set("from", from);
          params.set("to", to);
        }
        const queryString = params.size ? `?${params.toString()}` : "";
        const result = await request<BookingList>(`/api/bookings${queryString}`);
        if (active) {
          setBookings(result.bookings);
          setCounts(result.counts);
        }
      } catch {
        if (active) setBookings([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    void fetchBookings();
    return () => {
      active = false;
    };
  }, [from, request, search, status, to]);

  async function checkIn(booking: Booking) {
    setActionLoading(booking.booking_id);
    try {
      await request(
        `/api/bookings/${booking.booking_id}/check-in`,
        { method: "POST" },
        `Booking #${booking.booking_id} checked in`,
      );
      setLoading(true);
      await loadBookings();
    } catch {
      // useApi displays request errors as toasts.
    } finally {
      setActionLoading(null);
    }
  }

  async function checkOut(booking: Booking) {
    setActionLoading(booking.booking_id);
    try {
      const bill = await request<Bill>(
        `/api/bookings/${booking.booking_id}/check-out`,
        { method: "POST" },
        `Booking #${booking.booking_id} checked out`,
      );
      setFinalBill(bill);
      setLoading(true);
      await loadBookings();
    } catch {
      // useApi displays request errors as toasts.
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
      setLoading(true);
      await loadBookings();
    } catch {
      // useApi displays request errors as toasts.
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
        header: "Balance",
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
            onClick={() => {
              setLoading(true);
              setStatus(tab.status);
            }}
          >
            {tab.label}
            <span>{counts[tab.label]}</span>
          </button>
        ))}
      </div>

      <div className="resource-toolbar booking-toolbar">
        <SearchInput
          onChange={searchChanged}
          placeholder="Search guest, phone or room..."
        />
        <FormField
          name="from"
          label="From"
          type="date"
          value={from}
          onChange={(event) => {
            setLoading(true);
            setFrom(event.target.value);
          }}
        />
        <FormField
          name="to"
          label="To"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => {
            setLoading(true);
            setTo(event.target.value);
          }}
        />
      </div>

      <DataTable<Booking>
        columns={columns}
        rows={bookings}
        loading={loading}
        emptyMessage="No bookings match these filters."
        rowKey={(row) => row.booking_id}
        actions={(booking) => {
          const isFuture = dateOnly(booking.check_in) > todayLocal();
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
                    disabled={isFuture}
                    title={
                      isFuture
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

      <Modal
        open={Boolean(finalBill)}
        title="Final Bill"
        onClose={() => setFinalBill(null)}
      >
        {finalBill && (
          <div className="final-bill">
            <div className="final-bill-intro">
              <span className="eyebrow">Booking #{finalBill.booking_id}</span>
              <strong>{finalBill.full_name}</strong>
              <span>Room {finalBill.room_no}</span>
            </div>
            <dl>
              <div><dt>Room charge</dt><dd>{formatCurrency(finalBill.room_charge)}</dd></div>
              <div><dt>Services total</dt><dd>{formatCurrency(finalBill.services_total)}</dd></div>
              <div className="bill-grand"><dt>Grand total</dt><dd>{formatCurrency(finalBill.grand_total)}</dd></div>
              <div><dt>Paid</dt><dd>{formatCurrency(finalBill.paid)}</dd></div>
              <div className="bill-balance"><dt>Balance</dt><dd>{formatCurrency(finalBill.balance)}</dd></div>
            </dl>
            {finalBill.balance > 0 && (
              <div className="balance-warning" role="status">
                Balance due: {formatCurrency(finalBill.balance)}. Payments are
                added in Phase 4.
              </div>
            )}
          </div>
        )}
      </Modal>

      <NewBookingModal
        open={newBookingOpen}
        onClose={() => setNewBookingOpen(false)}
        onCreated={() => {
          setNewBookingOpen(false);
          setLoading(true);
          void loadBookings();
        }}
      />
    </>
  );
}
