export type DashboardData = {
  range: "7" | "30" | "90" | "all";
  rooms: {
    total: number;
    available: number;
    reserved: number;
    occupied: number;
    maintenance: number;
    occupancy_percent: number;
  };
  today: {
    arrivals_expected: number;
    departures_due: number;
    in_house: number;
    upcoming_7_days: number;
  };
  money: {
    total_billed: number;
    total_collected: number;
    total_remaining: number;
    total_gst: number | null;
    service_revenue: number;
    collected_this_month: number;
  };
  revenue_by_room_type: {
    type_name: string;
    bookings: number;
    revenue: number;
  }[];
  payments_by_method: { method: string; txns: number; total: number }[];
  revenue_trend: { day: string; total: number }[];
  revenue_trend_range: { start_day: string; end_day: string };
  bookings_by_status: { status: string; count: number }[];
  bookings_by_employee: { emp_name: string; bookings_handled: number }[];
  top_services: {
    service_name: string;
    total_quantity: number;
    revenue: number;
  }[];
  occupancy_forecast: {
    day: string;
    rooms_booked: number;
    occupancy_percent: number;
  }[];
  arrivals_today: TodayBooking[];
  departures_today: TodayBooking[];
  recent_payments: {
    payment_id: number;
    full_name: string;
    booking_id: number;
    method: string;
    amount: number;
    date: string;
  }[];
  top_pending: {
    booking_id: number;
    full_name: string;
    room_no: number;
    grand_total: number;
    paid: number;
    balance: number;
  }[];
};

export type TodayBooking = {
  booking_id: number;
  full_name: string;
  room_no: number;
  type_name: string;
  nights: number;
  remaining: number;
};
