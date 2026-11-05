import Link from "next/link";
import DataTable, { type DataColumn } from "@/components/DataTable";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { DashboardData } from "@/components/dashboard/types";

type Payment = DashboardData["recent_payments"][number];

const columns: DataColumn<Payment>[] = [
  { key: "date", header: "Date", render: (row) => formatShortDate(row.date) },
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
  { key: "method", header: "Method" },
  { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
];

export default function RecentPayments({
  rows,
}: {
  rows: DashboardData["recent_payments"];
}) {
  return (
    <section className="surface dashboard-card dashboard-table-card">
      <h2 className="dashboard-card-title">Recent payments</h2>
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="No payments recorded yet."
        rowKey={(row) => row.payment_id}
      />
    </section>
  );
}
