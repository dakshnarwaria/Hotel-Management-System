"use client";

import {
  BedDouble,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import PageHeader from "@/components/PageHeader";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/format";
import EmployeeBars from "@/components/dashboard/EmployeeBars";
import KpiCard from "@/components/dashboard/KpiCard";
import OccupancyForecast from "@/components/dashboard/OccupancyForecast";
import PaymentsByMethod from "@/components/dashboard/PaymentsByMethod";
import RecentPayments from "@/components/dashboard/RecentPayments";
import RevenueByRoomType from "@/components/dashboard/RevenueByRoomType";
import RevenueTrend from "@/components/dashboard/RevenueTrend";
import RoomStatusDonut from "@/components/dashboard/RoomStatusDonut";
import StatusBars from "@/components/dashboard/StatusBars";
import TodayLists from "@/components/dashboard/TodayLists";
import TopPending from "@/components/dashboard/TopPending";
import TopServices from "@/components/dashboard/TopServices";
import type { DashboardData } from "@/components/dashboard/types";

type Range = DashboardData["range"];

const rangeOptions: { value: Range; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
];

export default function DashboardClient() {
  const request = useApi();
  const [range, setRange] = useState<Range>("30");
  const [data, setData] = useState<DashboardData | null>(null);
  const [requestState, setRequestState] = useState<{
    key: string;
    loading: boolean;
    error: string | null;
  }>({ key: "", loading: true, error: null });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestId = useRef(0);

  const refresh = useCallback(() => {
    setRefreshVersion((current) => current + 1);
  }, []);
  const requestKey = `${range}:${refreshVersion}`;
  const loading = requestState.key !== requestKey || requestState.loading;
  const error = requestState.key === requestKey ? requestState.error : null;

  useEffect(() => {
    const id = ++requestId.current;
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const result = await request<DashboardData>(
          `/api/dashboard?range=${range}`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted || id !== requestId.current) return;
        setData(result);
        setRequestState({ key: requestKey, loading: false, error: null });
        setLastUpdated(
          new Intl.DateTimeFormat("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date()),
        );
      } catch (requestError) {
        if (controller.signal.aborted || id !== requestId.current) return;
        setRequestState({
          key: requestKey,
          loading: false,
          error:
            requestError instanceof Error
              ? requestError.message
              : "Unable to load the dashboard.",
        });
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [range, refreshVersion, request, requestKey]);

  const headerAction = (
    <div className="dashboard-toolbar">
      {lastUpdated && (
        <span className="muted dashboard-updated">Last updated {lastUpdated}</span>
      )}
      <label className="dashboard-range-label">
        <span className="sr-only">Revenue range</span>
        <select
          className="dashboard-range-select"
          value={range}
          onChange={(event) => setRange(event.target.value as Range)}
        >
          {rangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <Button variant="secondary" onClick={refresh} loading={loading}>
        {!loading && <RefreshCw size={15} />}
        Refresh
      </Button>
    </div>
  );

  return (
    <div className="dashboard-page">
      <PageHeader eyebrow="Hotel operations" title="Dashboard" action={headerAction} />
      {data && (
        <p className="schema-note">
          The checked-in <code>booking_bills</code> view does not expose GST fields.
          This dashboard uses the view&apos;s totals and leaves GST reporting unavailable
          until the view is extended.
        </p>
      )}
      {error && (
        <section className="surface dashboard-error" role="alert">
          <div>
            <h2>Dashboard unavailable</h2>
            <p>{error}</p>
          </div>
          <Button variant="secondary" onClick={refresh}>
            Retry
          </Button>
        </section>
      )}
      {!data && loading ? (
        <DashboardSkeleton />
      ) : data ? (
        <div className={`dashboard-content${loading ? " is-refreshing" : ""}`}>
          <div className="dashboard-kpis">
            <KpiCard
              title="Occupancy"
              value={`${data.rooms.occupancy_percent.toFixed(1)}%`}
              description={`${data.rooms.occupied} of ${Math.max(0, data.rooms.total - data.rooms.maintenance)} non-maintenance rooms occupied`}
              icon={BedDouble}
            />
            <KpiCard
              title="In-house guests"
              value={String(data.today.in_house)}
              description="Checked-in bookings"
              icon={Users}
            />
            <KpiCard
              title="Arrivals today"
              value={String(data.today.arrivals_expected)}
              description="Confirmed check-ins"
              icon={CalendarCheck}
            />
            <KpiCard
              title="Departures today"
              value={String(data.today.departures_due)}
              description="Guests due to check out"
              icon={CalendarClock}
            />
            <KpiCard
              title="Total collected"
              value={formatCurrency(data.money.total_collected)}
              description={`This month: ${formatCurrency(data.money.collected_this_month)}`}
              icon={CreditCard}
            />
            <KpiCard
              title="Remaining to collect"
              value={formatCurrency(data.money.total_remaining)}
              description="Non-cancelled bookings"
              icon={Wallet}
              highlight={data.money.total_remaining > 0}
            />
            <KpiCard
              title="Total billed"
              value={formatCurrency(data.money.total_billed)}
              description="booking_bills total; GST split unavailable"
              icon={CircleDollarSign}
            />
            <KpiCard
              title="GST collected"
              value={data.money.total_gst === null ? "Unavailable" : formatCurrency(data.money.total_gst)}
              description="Not exposed by booking_bills"
              icon={CalendarDays}
            />
          </div>

          <div className="dashboard-grid dashboard-grid-two">
            <RoomStatusDonut rooms={data.rooms} />
            <OccupancyForecast rows={data.occupancy_forecast} />
          </div>
          <div className="dashboard-grid dashboard-grid-two">
            <RevenueTrend
              rows={data.revenue_trend}
              startDay={data.revenue_trend_range.start_day}
              endDay={data.revenue_trend_range.end_day}
            />
            <PaymentsByMethod rows={data.payments_by_method} />
          </div>
          <div className="dashboard-grid dashboard-grid-three">
            <RevenueByRoomType rows={data.revenue_by_room_type} />
            <StatusBars rows={data.bookings_by_status} />
            <EmployeeBars rows={data.bookings_by_employee} />
          </div>
          <div className="dashboard-grid dashboard-grid-two">
            <TopServices rows={data.top_services} />
            <TopPending rows={data.top_pending} />
          </div>
          <div className="dashboard-grid dashboard-grid-three dashboard-tables">
            <TodayLists
              arrivals={data.arrivals_today}
              departures={data.departures_today}
            />
            <RecentPayments rows={data.recent_payments} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-label="Loading dashboard">
      <div className="dashboard-kpis">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="surface dashboard-skeleton-card" key={index}>
            <span className="skeleton-line" />
            <span className="skeleton-line" />
            <span className="skeleton-line" />
          </div>
        ))}
      </div>
      <div className="dashboard-grid dashboard-grid-two">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="surface dashboard-skeleton-chart" key={index}>
            <span className="skeleton-line" />
            <span className="skeleton-chart-block" />
          </div>
        ))}
      </div>
    </div>
  );
}
