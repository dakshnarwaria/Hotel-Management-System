"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import DataTable, { type DataColumn } from "@/components/DataTable";
import { FormField, SelectField } from "@/components/FormField";
import PageHeader from "@/components/PageHeader";
import RecordPaymentModal from "@/components/bookings/RecordPaymentModal";
import SearchInput from "@/components/SearchInput";
import { useApi } from "@/hooks/useApi";
import { formatCurrency, formatDate } from "@/lib/format";

type Payment = {
  payment_id: number;
  booking_id: number;
  full_name: string;
  room_no: number;
  amount: number;
  pay_date: string | Date;
  method: "Cash" | "Card" | "UPI";
};

type Summary = {
  total_collected: number;
  Cash: number;
  Card: number;
  UPI: number;
};

type PaymentResponse = { payments: Payment[]; summary: Summary };

export default function PaymentsPage() {
  const request = useApi();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_collected: 0,
    Cash: 0,
    Card: 0,
    UPI: 0,
  });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const searchChanged = useCallback((value: string) => {
    setHasLoaded(false);
    setSearch(value);
  }, []);

  const loadPayments = useCallback(async () => {
    setHasLoaded(false);
    try {
      const params = new URLSearchParams();
      if (method) params.set("method", method);
      if (from && to) {
        params.set("from", from);
        params.set("to", to);
      }
      if (search) params.set("search", search);
      const suffix = params.size ? `?${params.toString()}` : "";
      const result = await request<PaymentResponse>(`/api/payments${suffix}`);
      setPayments(result.payments);
      setSummary(result.summary);
    } finally {
      setHasLoaded(true);
    }
  }, [from, method, request, search, to]);

  useEffect(() => {
    let active = true;
    async function fetchPayments() {
      setHasLoaded(false);
      try {
        const params = new URLSearchParams();
        if (method) params.set("method", method);
        if (from && to) {
          params.set("from", from);
          params.set("to", to);
        }
        if (search) params.set("search", search);
        const suffix = params.size ? `?${params.toString()}` : "";
        const result = await request<PaymentResponse>(`/api/payments${suffix}`);
        if (!active) return;
        setPayments(result.payments);
        setSummary(result.summary);
      } catch {
        if (active) {
          setPayments([]);
          setSummary({ total_collected: 0, Cash: 0, Card: 0, UPI: 0 });
        }
      } finally {
        if (active) setHasLoaded(true);
      }
    }
    void fetchPayments();
    return () => {
      active = false;
    };
  }, [from, method, request, search, to]);

  const columns = useMemo<DataColumn<Payment>[]>(
    () => [
      { key: "payment_id", header: "ID" },
      { key: "pay_date", header: "Date", render: (row) => formatDate(row.pay_date) },
      { key: "full_name", header: "Guest" },
      {
        key: "booking_id",
        header: "Booking",
        render: (row) => (
          <Link className="table-link" href={`/bookings/${row.booking_id}`}>
            #{row.booking_id}
          </Link>
        ),
      },
      { key: "room_no", header: "Room" },
      {
        key: "method",
        header: "Method",
        render: (row) => (
          <span className={`method-badge method-${row.method.toLowerCase()}`}>
            {row.method}
          </span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        action={
          <button
            type="button"
            className="button button-primary button-md"
            onClick={() => setModalOpen(true)}
          >
            <CreditCard size={17} /> Record payment
          </button>
        }
      />

      <section className="payment-summary-grid" aria-label="Payment totals">
        <article className="surface payment-summary-card">
          <span className="payment-summary-icon"><Wallet size={19} /></span>
          <span>Total collected</span>
          <strong>{formatCurrency(summary.total_collected)}</strong>
        </article>
        {(["Cash", "Card", "UPI"] as const).map((item) => (
          <article className={`surface payment-summary-card payment-summary-${item.toLowerCase()}`} key={item}>
            <span className="payment-summary-icon"><CreditCard size={19} /></span>
            <span>{item}</span>
            <strong>{formatCurrency(summary[item])}</strong>
          </article>
        ))}
      </section>

      <section className="resource-toolbar payment-toolbar" aria-label="Payment filters">
        <SearchInput
          onChange={searchChanged}
          placeholder="Search guest or booking..."
        />
        <SelectField
          name="payment-method-filter"
          label="Method"
          className="filter-field-control"
          value={method}
          options={[
            { value: "", label: "All methods" },
            { value: "Cash", label: "Cash" },
            { value: "Card", label: "Card" },
            { value: "UPI", label: "UPI" },
          ]}
          onChange={(event) => {
            setHasLoaded(false);
            setMethod(event.target.value);
          }}
        />
        <FormField
          name="payment-from"
          label="From"
          type="date"
          value={from}
          onChange={(event) => {
            setHasLoaded(false);
            setFrom(event.target.value);
          }}
        />
        <FormField
          name="payment-to"
          label="To"
          type="date"
          value={to}
          onChange={(event) => {
            setHasLoaded(false);
            setTo(event.target.value);
          }}
        />
      </section>

      <DataTable
        columns={columns}
        rows={payments}
        loading={!hasLoaded}
        emptyMessage="No payments match these filters."
        rowKey={(row) => row.payment_id}
      />

      <RecordPaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRecorded={() => {
          void loadPayments().catch(() => undefined);
        }}
      />
    </>
  );
}
