export type ReportColumnType =
  | "currency"
  | "date"
  | "number"
  | "text"
  | "badge";

export type ReportColumn = {
  key: string;
  header: string;
  type?: ReportColumnType;
};

export type ReportDefinition = {
  id: string;
  title: string;
  description: string;
  sql: string;
  columns: ReportColumn[];
};

export const REPORTS: ReportDefinition[] = [
  {
    id: "1",
    title: "All guests",
    description: "Guest contact and identity information.",
    sql: "SELECT * FROM Guests",
    columns: [
      { key: "guest_id", header: "ID", type: "number" },
      { key: "full_name", header: "Guest", type: "text" },
      { key: "phone", header: "Phone", type: "text" },
      { key: "email", header: "Email", type: "text" },
      { key: "city", header: "City", type: "text" },
      { key: "id_proof", header: "ID proof", type: "text" },
    ],
  },
  {
    id: "2",
    title: "Available rooms",
    description: "Available rooms with their type, capacity, and nightly price.",
    sql: `SELECT r.room_no, rt.type_name, rt.price_per_night, rt.capacity, r.floor_no
FROM Rooms r
JOIN Room_Types rt ON rt.type_id = r.type_id
WHERE r.status = 'Available'
ORDER BY rt.price_per_night, r.room_no`,
    columns: [
      { key: "room_no", header: "Room", type: "number" },
      { key: "type_name", header: "Room type", type: "text" },
      { key: "price_per_night", header: "Price / night", type: "currency" },
      { key: "capacity", header: "Capacity", type: "number" },
      { key: "floor_no", header: "Floor", type: "number" },
    ],
  },
  {
    id: "3",
    title: "Current and upcoming bookings",
    description: "Checked-in and confirmed bookings with guest and room details.",
    sql: `SELECT b.booking_id, g.full_name, b.room_no, rt.type_name, b.check_in, b.check_out,
       b.no_of_guests, b.status
FROM Bookings b
JOIN Guests g ON g.guest_id = b.guest_id
JOIN Rooms r ON r.room_no = b.room_no
JOIN Room_Types rt ON rt.type_id = r.type_id
WHERE b.status IN ('Checked-In', 'Confirmed')
ORDER BY b.check_in, b.booking_id`,
    columns: [
      { key: "booking_id", header: "Booking", type: "number" },
      { key: "full_name", header: "Guest", type: "text" },
      { key: "room_no", header: "Room", type: "number" },
      { key: "type_name", header: "Room type", type: "text" },
      { key: "check_in", header: "Check-in", type: "date" },
      { key: "check_out", header: "Check-out", type: "date" },
      { key: "no_of_guests", header: "Guests", type: "number" },
      { key: "status", header: "Status", type: "badge" },
    ],
  },
  {
    id: "4",
    title: "Revenue per room type",
    description: "Room-charge revenue and booking counts, excluding cancelled bookings.",
    sql: `SELECT rt.type_name, COUNT(b.booking_id) AS bookings,
       COALESCE(SUM(b.total_amount), 0) AS revenue
FROM Bookings b
JOIN Rooms r ON r.room_no = b.room_no
JOIN Room_Types rt ON rt.type_id = r.type_id
WHERE b.status <> 'Cancelled'
GROUP BY rt.type_id, rt.type_name
ORDER BY revenue DESC`,
    columns: [
      { key: "type_name", header: "Room type", type: "text" },
      { key: "bookings", header: "Bookings", type: "number" },
      { key: "revenue", header: "Room revenue", type: "currency" },
    ],
  },
  {
    id: "5",
    title: "Remaining balance by booking",
    description:
      "Open balances from booking_bills. The checked-in schema omits GST columns, so GST cannot be reported until that view is extended.",
    sql: `SELECT booking_id, full_name, room_charge, services_total,
       grand_total, paid, balance
FROM booking_bills
WHERE balance > 0 AND status <> 'Cancelled'
ORDER BY balance DESC`,
    columns: [
      { key: "booking_id", header: "Booking", type: "number" },
      { key: "full_name", header: "Guest", type: "text" },
      { key: "room_charge", header: "Room charge", type: "currency" },
      { key: "services_total", header: "Services", type: "currency" },
      { key: "grand_total", header: "Total", type: "currency" },
      { key: "paid", header: "Paid", type: "currency" },
      { key: "balance", header: "Remaining", type: "currency" },
    ],
  },
  {
    id: "6",
    title: "Repeat guests",
    description: "Guests with more than one booking.",
    sql: `SELECT g.guest_id, g.full_name, COUNT(b.booking_id) AS visits
FROM Guests g
JOIN Bookings b ON b.guest_id = g.guest_id
GROUP BY g.guest_id, g.full_name
HAVING COUNT(b.booking_id) > 1
ORDER BY visits DESC, g.full_name`,
    columns: [
      { key: "guest_id", header: "Guest ID", type: "number" },
      { key: "full_name", header: "Guest", type: "text" },
      { key: "visits", header: "Bookings", type: "number" },
    ],
  },
  {
    id: "7",
    title: "Service charges per booking",
    description: "Service-order quantities and extended costs by booking.",
    sql: `SELECT so.order_id, so.order_date, b.booking_id, g.full_name,
       s.service_name, so.quantity, s.price, s.price * so.quantity AS cost
FROM Service_Orders so
JOIN Bookings b ON b.booking_id = so.booking_id
JOIN Guests g ON g.guest_id = b.guest_id
JOIN Services s ON s.service_id = so.service_id
ORDER BY b.booking_id, so.order_date, so.order_id`,
    columns: [
      { key: "order_id", header: "Order", type: "number" },
      { key: "order_date", header: "Date", type: "date" },
      { key: "booking_id", header: "Booking", type: "number" },
      { key: "full_name", header: "Guest", type: "text" },
      { key: "service_name", header: "Service", type: "text" },
      { key: "quantity", header: "Qty", type: "number" },
      { key: "price", header: "Price", type: "currency" },
      { key: "cost", header: "Cost", type: "currency" },
    ],
  },
  {
    id: "8",
    title: "Payments by method",
    description: "Transaction counts and payment totals for each method.",
    sql: `SELECT method, COUNT(*) AS txns, SUM(amount) AS total
FROM Payments
GROUP BY method
ORDER BY total DESC`,
    columns: [
      { key: "method", header: "Method", type: "text" },
      { key: "txns", header: "Transactions", type: "number" },
      { key: "total", header: "Total", type: "currency" },
    ],
  },
  {
    id: "9",
    title: "Rooms without current or upcoming bookings",
    description: "Rooms not linked to any checked-in or confirmed booking.",
    sql: `SELECT r.room_no, rt.type_name, r.floor_no, r.status
FROM Rooms r
JOIN Room_Types rt ON rt.type_id = r.type_id
WHERE r.room_no NOT IN (
  SELECT b.room_no
  FROM Bookings b
  WHERE b.status IN ('Checked-In', 'Confirmed')
)
ORDER BY r.room_no`,
    columns: [
      { key: "room_no", header: "Room", type: "number" },
      { key: "type_name", header: "Room type", type: "text" },
      { key: "floor_no", header: "Floor", type: "number" },
      { key: "status", header: "Room status", type: "badge" },
    ],
  },
  {
    id: "10",
    title: "Bookings handled by employee",
    description: "Booking counts for each employee, including employees with none.",
    sql: `SELECT e.emp_id, e.emp_name, COUNT(b.booking_id) AS bookings_handled
FROM Employees e
LEFT JOIN Bookings b ON b.emp_id = e.emp_id
GROUP BY e.emp_id, e.emp_name
ORDER BY bookings_handled DESC, e.emp_name`,
    columns: [
      { key: "emp_id", header: "Employee ID", type: "number" },
      { key: "emp_name", header: "Employee", type: "text" },
      { key: "bookings_handled", header: "Bookings handled", type: "number" },
    ],
  },
  {
    id: "11",
    title: "Highest-value booking",
    description: "Guest or guests attached to the highest room-charge booking.",
    sql: `SELECT g.full_name, g.city, b.total_amount
FROM Bookings b
JOIN Guests g ON g.guest_id = b.guest_id
WHERE b.total_amount = (SELECT MAX(total_amount) FROM Bookings)
ORDER BY g.full_name`,
    columns: [
      { key: "full_name", header: "Guest", type: "text" },
      { key: "city", header: "City", type: "text" },
      { key: "total_amount", header: "Booking value", type: "currency" },
    ],
  },
];
