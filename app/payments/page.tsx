"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import DataTable, { type DataColumn } from "@/components/DataTable";
import { FormField, SelectField } from "@/components/FormField";
import PageHeader from "@/components/PageHeader";
import RecordPaymentModal from "@/components/bookings/RecordPaymentModal";
import SearchInput from "@/components/SearchInput";
import { useList } from "@/hooks/useList";
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

export default function PaymentsPage() {
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const { rows: payments, summary: listSummary, loading, refresh } =
    useList<Payment, Summary>("/api/payments", {
      ...(method ? { method } : {}),
      ...(from && to ? { from, to } : {}),
      ...(search ? { search } : {}),
    });
  const summary = listSummary ?? {
    total_collected: 0,
    Cash: 0,
    Card: 0,
    UPI: 0,
  };
  const [modalOpen, setModalOpen] = useState(false);

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
          onChange={setSearch}
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
          onChange={(event) => setMethod(event.target.value)}
        />
        <FormField
          name="payment-from"
          label="From"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <FormField
          name="payment-to"
          label="To"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </section>

      <DataTable
        columns={columns}
        rows={payments}
        loading={loading}
        emptyMessage="No payments match these filters."
        rowKey={(row) => row.payment_id}
      />

      <RecordPaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRecorded={() => {
          refresh();
        }}
      />
    </>
  );
}
