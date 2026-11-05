import Link from "next/link";
import DataTable, { type DataColumn } from "@/components/DataTable";
import { formatCurrency } from "@/lib/format";
import type { TodayBooking } from "@/components/dashboard/types";

const columns: DataColumn<TodayBooking>[] = [
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
    key: "type_name",
    header: "Room type",
    sortable: false,
  },
  {
    key: "remaining",
    header: "Remaining",
    render: (row) => formatCurrency(row.remaining),
  },
];

export default function TodayLists({
  arrivals,
  departures,
}: {
  arrivals: TodayBooking[];
  departures: TodayBooking[];
}) {
  return (
    <>
      <section className="surface dashboard-card dashboard-table-card">
        <h2 className="dashboard-card-title">Arrivals today</h2>
        <DataTable
          columns={columns}
          rows={arrivals}
          emptyMessage="No arrivals today"
          rowKey={(row) => row.booking_id}
        />
      </section>
      <section className="surface dashboard-card dashboard-table-card">
        <h2 className="dashboard-card-title">Departures today</h2>
        <DataTable
          columns={columns}
          rows={departures}
          emptyMessage="No departures today"
          rowKey={(row) => row.booking_id}
        />
      </section>
    </>
  );
}
