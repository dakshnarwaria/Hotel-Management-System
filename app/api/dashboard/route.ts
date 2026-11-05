import type { RowDataPacket } from "mysql2/promise";
import { handleDbError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { ROOM_DISPLAY_STATUS_SQL } from "@/lib/roomStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Range = "7" | "30" | "90" | "all";

type StatusRow = RowDataPacket & { status: string; count: number };
type RoomStatusRow = RowDataPacket & { display_status: string; total: number };
type DashboardRow = RowDataPacket & Record<string, number | string | null>;

const BOOKING_STATUSES = [
  "Confirmed",
  "Checked-In",
  "Checked-Out",
  "Cancelled",
] as const;

function getRangeDays(range: Range) {
  return range === "7" ? 6 : range === "30" ? 29 : 89;
}

export async function GET(request: Request) {
  const requestedRange = new URL(request.url).searchParams.get("range");
  const range: Range =
    requestedRange === "7" ||
    requestedRange === "30" ||
    requestedRange === "90" ||
    requestedRange === "all"
      ? requestedRange
      : "30";
  const days = getRangeDays(range);
  const rangeFilter =
    range === "all"
      ? ""
      : "AND b.check_in >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND b.check_in <= CURDATE()";
  const paymentRangeFilter =
    range === "all"
      ? ""
      : "WHERE p.pay_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND p.pay_date <= CURDATE()";
  const revenueRangeParams = range === "all" ? [] : [days];
  const paymentRangeParams = range === "all" ? [] : [days];
  const trendDays = range === "all" ? 89 : days;

  try {
    const [
      roomStatusRows,
      todayRows,
      moneyRows,
      revenueByRoomType,
      paymentsByMethod,
      revenueTrend,
      revenueTrendRange,
      bookingStatusRows,
      bookingsByEmployee,
      topServices,
      occupancyForecast,
      arrivalsToday,
      departuresToday,
      recentPayments,
      topPending,
    ] = await Promise.all([
      query<RoomStatusRow[]>(
        `SELECT display_status, COUNT(*) AS total
         FROM (SELECT (${ROOM_DISPLAY_STATUS_SQL}) AS display_status FROM Rooms r) room_status
         GROUP BY display_status`,
      ),
      query<DashboardRow[]>(
        `SELECT
           SUM(status = 'Confirmed' AND check_in = CURDATE()) AS arrivals_expected,
           SUM(status = 'Checked-In' AND check_out = CURDATE()) AS departures_due,
           SUM(status = 'Checked-In') AS in_house,
           SUM(status = 'Confirmed' AND check_in BETWEEN CURDATE() + INTERVAL 1 DAY
             AND CURDATE() + INTERVAL 7 DAY) AS upcoming_7_days
         FROM Bookings`,
      ),
      query<DashboardRow[]>(
        `SELECT COALESCE(SUM(grand_total), 0) AS total_billed,
           COALESCE(SUM(paid), 0) AS total_collected,
           COALESCE(SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END), 0) AS total_remaining,
           NULL AS total_gst,
           COALESCE(SUM(services_total), 0) AS service_revenue,
           (SELECT COALESCE(SUM(amount), 0) FROM Payments
            WHERE YEAR(pay_date) = YEAR(CURDATE()) AND MONTH(pay_date) = MONTH(CURDATE()))
             AS collected_this_month
         FROM booking_bills
         WHERE status <> 'Cancelled'`,
      ),
      query<DashboardRow[]>(
        `SELECT rt.type_name, COUNT(b.booking_id) AS bookings,
           COALESCE(SUM(b.total_amount), 0) AS revenue
         FROM Room_Types rt
         LEFT JOIN Rooms r ON r.type_id = rt.type_id
         LEFT JOIN Bookings b ON b.room_no = r.room_no AND b.status <> 'Cancelled' ${rangeFilter}
         GROUP BY rt.type_id, rt.type_name
         ORDER BY revenue DESC, rt.type_name`,
        revenueRangeParams,
      ),
      query<DashboardRow[]>(
        `SELECT p.method, COUNT(*) AS txns, COALESCE(SUM(p.amount), 0) AS total
         FROM Payments p
         ${paymentRangeFilter}
         GROUP BY p.method
         ORDER BY total DESC`,
        paymentRangeParams,
      ),
      query<DashboardRow[]>(
        `SELECT DATE_FORMAT(p.pay_date, '%Y-%m-%d') AS day, SUM(p.amount) AS total
         FROM Payments p
         WHERE p.pay_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
           AND p.pay_date <= CURDATE()
         GROUP BY p.pay_date
         ORDER BY p.pay_date`,
        [trendDays],
      ),
      query<DashboardRow[]>(
        `SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), '%Y-%m-%d') AS start_day,
           DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS end_day`,
        [trendDays],
      ),
      query<StatusRow[]>(
        `SELECT status, COUNT(*) AS count
         FROM Bookings
         GROUP BY status`,
      ),
      query<DashboardRow[]>(
        `SELECT e.emp_name, COUNT(b.booking_id) AS bookings_handled
         FROM Employees e
         LEFT JOIN Bookings b
           ON b.emp_id = e.emp_id AND b.status <> 'Cancelled'
         WHERE e.role IN ('Receptionist', 'Manager')
         GROUP BY e.emp_id, e.emp_name
         ORDER BY bookings_handled DESC, e.emp_name`,
      ),
      query<DashboardRow[]>(
        `SELECT s.service_name, SUM(so.quantity) AS total_quantity,
           SUM(s.price * so.quantity) AS revenue
         FROM Service_Orders so
         JOIN Services s ON s.service_id = so.service_id
         GROUP BY s.service_id, s.service_name
         ORDER BY revenue DESC, s.service_name
         LIMIT 5`,
      ),
      query<DashboardRow[]>(
        `WITH RECURSIVE forecast_days AS (
           SELECT CURDATE() AS forecast_day
           UNION ALL
           SELECT forecast_day + INTERVAL 1 DAY
           FROM forecast_days
           WHERE forecast_day < CURDATE() + INTERVAL 13 DAY
         )
         SELECT DATE_FORMAT(d.forecast_day, '%Y-%m-%d') AS day,
           COUNT(DISTINCT b.room_no) AS rooms_booked,
           CASE WHEN capacity.rooms_available = 0 THEN 0
             ELSE ROUND(COUNT(DISTINCT b.room_no) / capacity.rooms_available * 100, 1)
           END AS occupancy_percent
         FROM forecast_days d
         CROSS JOIN (
           SELECT COUNT(*) AS rooms_available
           FROM Rooms
           WHERE status <> 'Maintenance'
         ) capacity
         LEFT JOIN Bookings b
           ON b.status IN ('Confirmed', 'Checked-In')
           AND b.check_in <= d.forecast_day
           AND b.check_out > d.forecast_day
         GROUP BY d.forecast_day, capacity.rooms_available
         ORDER BY d.forecast_day`,
      ),
      query<DashboardRow[]>(
        `SELECT b.booking_id, g.full_name, b.room_no, rt.type_name,
           DATEDIFF(b.check_out, b.check_in) AS nights, bb.balance AS remaining
         FROM Bookings b
         JOIN Guests g ON g.guest_id = b.guest_id
         JOIN Rooms r ON r.room_no = b.room_no
         JOIN Room_Types rt ON rt.type_id = r.type_id
         JOIN booking_bills bb ON bb.booking_id = b.booking_id
         WHERE b.status = 'Confirmed' AND b.check_in = CURDATE()
         ORDER BY b.booking_id
         LIMIT 10`,
      ),
      query<DashboardRow[]>(
        `SELECT b.booking_id, g.full_name, b.room_no, rt.type_name,
           DATEDIFF(b.check_out, b.check_in) AS nights, bb.balance AS remaining
         FROM Bookings b
         JOIN Guests g ON g.guest_id = b.guest_id
         JOIN Rooms r ON r.room_no = b.room_no
         JOIN Room_Types rt ON rt.type_id = r.type_id
         JOIN booking_bills bb ON bb.booking_id = b.booking_id
         WHERE b.status = 'Checked-In' AND b.check_out = CURDATE()
         ORDER BY b.booking_id
         LIMIT 10`,
      ),
      query<DashboardRow[]>(
        `SELECT p.payment_id, g.full_name, b.booking_id, p.method, p.amount,
           p.pay_date AS date
         FROM Payments p
         JOIN Bookings b ON b.booking_id = p.booking_id
         JOIN Guests g ON g.guest_id = b.guest_id
         ORDER BY p.pay_date DESC, p.payment_id DESC
         LIMIT 8`,
      ),
      query<DashboardRow[]>(
        `SELECT bb.booking_id, bb.full_name, bb.room_no, bb.grand_total, bb.paid, bb.balance
         FROM booking_bills bb
         WHERE bb.status IN ('Checked-In', 'Checked-Out') AND bb.balance > 0
         ORDER BY bb.balance DESC, bb.booking_id
         LIMIT 5`,
      ),
    ]);

    const roomCounts = {
      total: 0,
      available: 0,
      reserved: 0,
      occupied: 0,
      maintenance: 0,
    };
    for (const row of roomStatusRows) {
      roomCounts.total += row.total;
      if (row.display_status === "Available") roomCounts.available = row.total;
      if (row.display_status === "Reserved") roomCounts.reserved = row.total;
      if (row.display_status === "Occupied") roomCounts.occupied = row.total;
      if (row.display_status === "Maintenance") roomCounts.maintenance = row.total;
    }

    const today = todayRows[0] ?? {};
    const money = moneyRows[0] ?? {};
    const statuses = new Map(
      bookingStatusRows.map((row) => [row.status, row.count]),
    );

    return ok({
      range,
      rooms: {
        ...roomCounts,
        occupancy_percent:
          roomCounts.total === roomCounts.maintenance
            ? 0
            : Math.round(
                (roomCounts.occupied /
                  (roomCounts.total - roomCounts.maintenance)) *
                  1000,
              ) / 10,
      },
      today: {
        arrivals_expected: Number(today.arrivals_expected ?? 0),
        departures_due: Number(today.departures_due ?? 0),
        in_house: Number(today.in_house ?? 0),
        upcoming_7_days: Number(today.upcoming_7_days ?? 0),
      },
      money: {
        total_billed: Number(money.total_billed ?? 0),
        total_collected: Number(money.total_collected ?? 0),
        total_remaining: Number(money.total_remaining ?? 0),
        total_gst: null,
        service_revenue: Number(money.service_revenue ?? 0),
        collected_this_month: Number(money.collected_this_month ?? 0),
      },
      revenue_by_room_type: revenueByRoomType,
      payments_by_method: paymentsByMethod,
      revenue_trend: revenueTrend,
      revenue_trend_range: revenueTrendRange[0],
      bookings_by_status: BOOKING_STATUSES.map((status) => ({
        status,
        count: statuses.get(status) ?? 0,
      })),
      bookings_by_employee: bookingsByEmployee,
      top_services: topServices,
      occupancy_forecast: occupancyForecast,
      arrivals_today: arrivalsToday,
      departures_today: departuresToday,
      recent_payments: recentPayments,
      top_pending: topPending,
    });
  } catch (error) {
    return handleDbError(error);
  }
}
