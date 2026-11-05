# Viva demo script (5–7 minutes)

## Opening

“Hearth & Stay is a hotel-management system built with Next.js and MySQL 8. I’ll demonstrate how the interface uses normalized relational data, parameterized API queries, stored procedures, triggers, and views to support the main hotel workflows.”

## Screen order and talking points

1. **Dashboard (about 45 seconds).** Point out occupancy, today’s arrivals/departures, revenue, forecast, and recent payments. Explain that the widgets aggregate `Bookings`, `Payments`, and the `booking_bills` view. The dashboard reuses the room display-status rule used by Rooms.
2. **Rooms (about 30 seconds).** Show each room’s single display status and room type. Explain that `Rooms.type_id` is a foreign key and that a room’s stored status is distinct from its date-based booking display status.
3. **Create a booking (about 90 seconds).** Use all three steps: guest selection/creation, stay dates and guest count, then available-room and employee selection. Explain that the booking references a guest, room, and employee by foreign keys; the `book_room` procedure checks the start date and inserts the booking, while `trg_bookings_bi` checks capacity, maintenance, overlap, and calculates room-only `total_amount`.
4. **Check in (about 30 seconds).** Check in a Confirmed booking. Explain that the `check_in` procedure validates the transition and `trg_bookings_au` marks the room Occupied.
5. **Record a service (about 30 seconds).** Add an order while checked in. Explain that `Service_Orders` links a booking and service; the application enforces the active-stay rule. Mention that the checked-in trigger prevents orders on cancelled bookings.
6. **Record a payment (about 30 seconds).** Record a partial payment and show the Remaining amount. Explain that `record_payment` uses MySQL’s `CURDATE()` and `trg_payments_bi` prevents overpayment.
7. **Check out and show final bill (about 45 seconds).** Check out and show the bill. Explain that `check_out` changes booking status and returns the `booking_bills` view; `total_amount` remains room charge, while service and payment totals are aggregated by the view.
8. **Reports (about 45 seconds).** Select a report, expand View SQL, then export CSV. Explain that report SQL is a fixed server-side definition chosen by ID; the client never supplies SQL.

## Database caveat for this demo

The checked-in `db/schema.sql` creates a non-GST `booking_bills` view and contains no GST columns or GST patch. The current billing UI expects a GST-extended view. Before demonstrating GST breakdowns, confirm that the presentation database has the separately approved GST-enabled view. Do not claim that the checked-in schema calculates GST.

## Likely viva questions

1. **Why use 3NF?** To reduce duplicated facts and update anomalies. Guest, room type, employee, and service details are stored once and linked with keys.
2. **What does the booking trigger do?** It validates the room, capacity, maintenance state, and date overlap, then calculates the room charge.
3. **How is double booking prevented?** The booking trigger checks overlapping Confirmed and Checked-In stays for the selected room; the database remains the final authority.
4. **Why is `Bookings.total_amount` room-only?** It is calculated from nightly room price and stay duration. Services and payments are separate transactions and are combined in `booking_bills`.
5. **What is `booking_bills` for?** It presents each booking’s room charge, service totals, payments, grand total, and remaining amount in one queryable view.
6. **Why use foreign keys?** They prevent bookings, payments, and service orders from referencing records that do not exist.
7. **What does the payment trigger protect?** It rejects a payment that would make total payments exceed the bill amount.
8. **Why use stored procedures?** They group important state transitions and their validation in MySQL so the application invokes a consistent operation.
9. **How are reports protected?** The API accepts a report ID and looks up a fixed SQL definition; it does not execute SQL supplied by a user.
10. **What would you add next?** After resolving the GST-view/schema compatibility, I would add role-based access control and audit logging.
