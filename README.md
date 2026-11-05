# Hearth & Stay — Hotel Management System

Hearth & Stay is a hotel operations application for managing guests, rooms, bookings, staff, services, payments, and reporting. It uses a Next.js interface backed by a MySQL 8 database and stored procedures. The dashboard summarizes occupancy and revenue, while the reports page exposes a fixed set of lab queries. Database rules enforce important booking and payment constraints.

## Features

- Guest, room type, room, employee, and service management
- Booking creation, check-in, check-out, cancellation, and bill display
- Service orders and payments
- Dashboard KPIs, charts, daily lists, and pending balances
- Eleven fixed SQL reports with CSV export and print support
- Responsive layout with light and dark themes

## Tech stack

- Next.js App Router, React, TypeScript (strict)
- MySQL 8 with `mysql2`
- Tailwind CSS 4 and Recharts

## Folder structure

```text
app/                 Next.js pages, layouts, error boundaries, and API routes
components/          Shared UI, booking flows, dashboard widgets, and reports
db/                  MySQL schema and large sample-data script
docs/                Demo script and ER diagram
hooks/               Shared API and list-fetching hooks
lib/                 Database access, validation, report SQL, and helpers
```

## Database

The checked-in `db/schema.sql` creates the `hotel_db` database and eight tables:

- `Guests` → guests referenced by `Bookings`
- `Room_Types` → room categories referenced by `Rooms`
- `Rooms` → rooms referenced by `Bookings`
- `Employees` → staff referenced by `Bookings`
- `Bookings` → stay records referenced by `Payments` and `Service_Orders`
- `Payments` → payments against a booking
- `Services` → services referenced by `Service_Orders`
- `Service_Orders` → services ordered for a booking

The schema defines three views: `available_rooms` filters rooms whose stored status is Available; `current_stays` joins checked-in stays to their guest, room type, and employee; `booking_bills` adds service totals and payments to each booking. `Bookings.total_amount` is the room charge only.

The schema defines six triggers: `trg_bookings_bi` validates room existence, capacity, maintenance status, date overlap, and calculates room charge; `trg_bookings_ai` synchronizes a directly inserted checked-in booking to Occupied; `trg_bookings_bu` blocks edits to closed stays, rechecks overlap, and recalculates room charge; `trg_bookings_au` synchronizes room status after booking status changes; `trg_payments_bi` blocks payments above the bill; `trg_service_orders_bi` blocks service orders on cancelled bookings.

The five stored procedures are `book_room` (validates and creates a booking), `check_in` (checks in a confirmed booking), `check_out` (checks out a checked-in booking and returns its bill), `cancel_booking` (cancels a confirmed booking), and `record_payment` (records a payment using MySQL's current date).

**GST policy and schema status:** the requested billing policy is 5% GST on rooms priced up to Rs 7,500 per night, 18% above Rs 7,500 per night, and 18% on services. This policy is **not implemented in the checked-in `db/schema.sql`**: its `booking_bills` view exposes only `room_charge`, `services_total`, `grand_total`, `paid`, and `balance`, and `trg_payments_bi` checks the pre-GST bill. The billing API/UI expects GST columns, so the checked-in schema alone is not compatible with the GST billing flow. There is no `db/patch_gst.sql` in this checkout; use an approved GST migration before demonstrating GST or running the full payment flow. Do not edit the database scripts as part of this phase.

## Setup (Windows)

1. Install Node.js (LTS) and MySQL 8.
2. Clone this repository and open its folder in PowerShell.
3. In MySQL Workbench, open `db/schema.sql` and run all statements. **This script drops and recreates the application's tables and objects. Do not run it against data you need to keep.**
4. Open `db/seed_large.sql` in Workbench and run all statements to load sample data.
5. Copy `.env.example` to `.env.local` and enter your MySQL connection details and password.
6. Run `npm install`.
7. Run `npm run dev`.
8. Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production server after building |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |

### Troubleshooting

| Symptom | What to check |
|---|---|
| Cannot connect to database | Confirm MySQL is running and `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `.env.local` are correct. |
| `Unknown column total_gst` | `booking_bills` in the checked-in schema is the older non-GST view. On a fresh database, run `db/schema.sql`; on an existing database, use the approved `db/patch_gst.sql` if one has been provided. That patch is not included in this checkout, so GST billing needs a separately approved database migration first. |
| Port 3306 is busy | Check whether another MySQL service is using the port; configure `DB_PORT` if your MySQL instance uses another port. |
| Blank tables | Ensure `db/seed_large.sql` ran against `hotel_db`, then check the API response and terminal output for database errors. |

## API overview

All responses use `{ ok, data, error }`.

| Route | Methods |
|---|---|
| `/api/health` | GET |
| `/api/dashboard` | GET |
| `/api/reports` | GET |
| `/api/reports/[id]` | GET |
| `/api/guests`, `/api/guests/[id]` | GET, POST; GET, PUT, DELETE |
| `/api/room-types`, `/api/room-types/[id]` | GET, POST; GET, PUT, DELETE |
| `/api/rooms`, `/api/rooms/[room_no]` | GET, POST; GET, PUT, PATCH, DELETE |
| `/api/rooms/available` | GET |
| `/api/bookings`, `/api/bookings/[id]` | GET, POST; GET |
| `/api/bookings/[id]/check-in` | POST |
| `/api/bookings/[id]/check-out` | POST |
| `/api/bookings/[id]/cancel` | POST |
| `/api/payments` | GET, POST |
| `/api/employees`, `/api/employees/[id]` | GET, POST; GET, PUT, DELETE |
| `/api/services`, `/api/services/[id]` | GET, POST; GET, PUT, DELETE |
| `/api/service-orders`, `/api/service-orders/[id]` | GET, POST; DELETE |

## Business rules

- Overlapping Confirmed or Checked-In bookings for the same room are rejected.
- Guest count cannot exceed the room type's capacity.
- Rooms under Maintenance cannot be booked.
- Payments cannot exceed the remaining bill amount.
- Service orders are accepted by the application only while the booking is Checked-In.
- Only Confirmed bookings can be cancelled.

## Demo and data model

- Viva demo: [docs/DEMO.md](./docs/DEMO.md)
- Entity-relationship diagram: [docs/ER-DIAGRAM.md](./docs/ER-DIAGRAM.md)

## License

License: not specified.
