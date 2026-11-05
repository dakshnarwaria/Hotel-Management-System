import Link from "next/link";
import DataTable, { type DataColumn } from "@/components/DataTable";
import { formatCurrency } from "@/lib/format";
import type { DashboardData } from "@/components/dashboard/types";

type PendingBooking = DashboardData["top_pending"][number];

const columns: DataColumn<PendingBooking>[] = [
  {
    key: "booking_id",
    header: "Booking",
    render: (row) => (
      <Link className="table-link" href={`/bookings/${row.booking_id}`}>
        #{row.booking_id}
      </Link>
    ),
  },
  { key: "full_name", header: "Guest" },
  { key: "room_no", header: "Room" },
  {
    key: "balance",
    header: "Remaining",
    render: (row) => formatCurrency(row.balance),
  },
];

export default function TopPending({
  rows,
}: {
  rows: DashboardData["top_pending"];
}) {
  return (
    <section className="surface dashboard-card dashboard-table-card">
      <h2 className="dashboard-card-title">Top pending balances</h2>
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="No pending balances. New unpaid stays will appear here."
        rowKey={(row) => row.booking_id}
      />
    </section>
  );
}
