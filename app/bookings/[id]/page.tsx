"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, LogOut, Printer, XCircle } from "lucide-react";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import AddServiceModal from "@/components/bookings/AddServiceModal";
import BillSummary, { type BillData } from "@/components/bookings/BillSummary";
import FinalBillModal from "@/components/bookings/FinalBillModal";
import PaymentsCard, { type PaymentRow } from "@/components/bookings/PaymentsCard";
import RecordPaymentModal from "@/components/bookings/RecordPaymentModal";
import ServiceOrdersCard, { type ServiceOrderRow } from "@/components/bookings/ServiceOrdersCard";
import { useApi } from "@/hooks/useApi";
import { floorLabel, formatDate } from "@/lib/format";

type BookingDetail = {
  booking_id: number;
  dates: { check_in: string | Date; check_out: string | Date; nights: number };
  no_of_guests: number;
  status: "Confirmed" | "Checked-In" | "Checked-Out" | "Cancelled";
  guest: {
    full_name: string;
    phone: string;
    email: string | null;
    city: string | null;
    id_proof: string | null;
  };
  room: { room_no: number; type_name: string; floor_no: number; capacity: number };
  employee: { emp_name: string };
};

type DetailResponse = {
  booking: BookingDetail;
  bill: BillData;
  service_orders: ServiceOrderRow[];
  payments: PaymentRow[];
};

function dateOnly(value: string | Date) {
  if (typeof value === "string") return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function todayLocal() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const request = useApi();
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [finalBill, setFinalBill] = useState<BillData | null>(null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    const data = await request<DetailResponse>(`/api/bookings/${id}`);
    setDetail(data);
  }, [id, request]);

  useEffect(() => {
    let active = true;
    async function fetchDetail() {
      try {
        const data = await request<DetailResponse>(`/api/bookings/${id}`);
        if (active) setDetail(data);
      } catch {
        if (active) setDetail(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void fetchDetail();
    return () => {
      active = false;
    };
  }, [id, request]);

  async function performAction(action: "check-in" | "check-out" | "cancel") {
    if (!detail) return;
    setActionLoading(true);
    try {
      if (action === "check-out") {
        const bill = await request<BillData>(
          `/api/bookings/${id}/${action}`,
          { method: "POST" },
          `Booking #${id} checked out`,
        );
        setFinalBill(bill);
      } else {
        await request(
          `/api/bookings/${id}/${action}`,
          { method: "POST" },
          action === "check-in" ? `Booking #${id} checked in` : `Booking #${id} cancelled`,
        );
      }
      await loadDetail();
      setCancelOpen(false);
    } catch {
      // useApi displays request errors as toasts.
    } finally {
      setActionLoading(false);
      setCancelLoading(false);
    }
  }

  const booking = detail?.booking;
  if (loading) {
    return (
      <section className="surface detail-loading" aria-label="Loading booking details">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
      </section>
    );
  }

  if (!detail || !booking) {
    return (
      <section className="surface setup-card">
        <span className="eyebrow">Reservation</span>
        <h1 className="page-title">Booking not found</h1>
        <p className="muted">This booking could not be loaded.</p>
        <Link href="/bookings" className="button button-secondary button-md back-link">
          <ArrowLeft size={16} /> Back to bookings
        </Link>
      </section>
    );
  }

  const checkInIsFuture = dateOnly(booking.dates.check_in) > todayLocal();

  return (
    <>
      <header className="detail-page-header">
        <div className="detail-title">
          <Link href="/bookings" className="back-link-inline">
            <ArrowLeft size={16} /> Bookings
          </Link>
          <div className="detail-title-row">
            <div>
              <span className="eyebrow">Reservation</span>
              <h1 className="page-title">Booking #{booking.booking_id}</h1>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </div>
        <div className="detail-header-actions print-hide">
          {booking.status === "Confirmed" && (
            <>
              <Button
                size="sm"
                disabled={checkInIsFuture || actionLoading}
                loading={actionLoading}
                title={checkInIsFuture ? "Check-in is only available on or after the check-in date" : "Check in guest"}
                onClick={() => void performAction("check-in")}
              >
                <CalendarClock size={15} /> Check-in
              </Button>
              <Button size="sm" variant="danger" onClick={() => setCancelOpen(true)}>
                <XCircle size={15} /> Cancel
              </Button>
            </>
          )}
          {booking.status === "Checked-In" && (
            <Button size="sm" loading={actionLoading} onClick={() => void performAction("check-out")}>
              <LogOut size={15} /> Check-out
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            <Printer size={15} /> Print invoice
          </Button>
        </div>
      </header>

      <div className="invoice-heading">Grand Oak Hotel</div>

      <div className="detail-grid">
        <section className="surface detail-card guest-stay-card">
          <header className="detail-card-header">
            <div><span className="eyebrow">Reservation information</span><h2>Guest &amp; stay</h2></div>
          </header>
          <div className="guest-detail-block">
            <strong>{booking.guest.full_name}</strong>
            <span>{booking.guest.phone}</span>
            <span>{booking.guest.email || "No email provided"}</span>
            <span>
              {[booking.guest.city, booking.guest.id_proof].filter(Boolean).join(" · ") || "Additional details not provided"}
            </span>
          </div>
          <dl className="stay-detail-list">
            <div><dt>Room</dt><dd>{booking.room.room_no} · {booking.room.type_name}</dd></div>
            <div><dt>Floor</dt><dd>{floorLabel(booking.room.floor_no)}</dd></div>
            <div><dt>Check-in</dt><dd>{formatDate(booking.dates.check_in)}</dd></div>
            <div><dt>Check-out</dt><dd>{formatDate(booking.dates.check_out)}</dd></div>
            <div><dt>Nights</dt><dd>{booking.dates.nights}</dd></div>
            <div><dt>Guests</dt><dd>{booking.no_of_guests} / capacity {booking.room.capacity}</dd></div>
            <div><dt>Handled by</dt><dd>{booking.employee.emp_name}</dd></div>
          </dl>
        </section>

        <BillSummary bill={detail.bill} />
        <ServiceOrdersCard
          bookingId={booking.booking_id}
          status={booking.status}
          orders={detail.service_orders}
          servicesTotal={detail.bill.services_total}
          onAdd={() => setServiceOpen(true)}
          onChanged={() => {
            setLoading(true);
            void loadDetail().catch(() => undefined).finally(() => setLoading(false));
          }}
        />
        <PaymentsCard
          payments={detail.payments}
          paid={detail.bill.paid}
          balance={detail.bill.balance}
          status={booking.status}
          onAdd={() => setPaymentOpen(true)}
        />
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel booking?"
        message={`Cancel booking #${booking.booking_id} for ${booking.guest.full_name}?`}
        loading={cancelLoading}
        onClose={() => {
          if (!cancelLoading) setCancelOpen(false);
        }}
        onConfirm={() => {
          setCancelLoading(true);
          void performAction("cancel");
        }}
      />
      <FinalBillModal bill={finalBill} onClose={() => setFinalBill(null)} />
      <AddServiceModal
        open={serviceOpen}
        bookingId={booking.booking_id}
        checkIn={booking.dates.check_in}
        checkOut={booking.dates.check_out}
        onClose={() => setServiceOpen(false)}
        onAdded={() => {
          setLoading(true);
          void loadDetail().catch(() => undefined).finally(() => setLoading(false));
        }}
      />
      <RecordPaymentModal
        open={paymentOpen}
        bookingId={booking.booking_id}
        balance={detail.bill.balance}
        onClose={() => setPaymentOpen(false)}
        onRecorded={() => {
          setLoading(true);
          void loadDetail().catch(() => undefined).finally(() => setLoading(false));
        }}
      />
    </>
  );
}
