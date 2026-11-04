# Hotel Management System

Next.js App Router application for the `hotel_db` MySQL 8 database defined in
[`db/schema.sql`](./db/schema.sql). The application does not modify the schema.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `.env.local`.
4. Import `db/schema.sql` into MySQL 8 if the database has not been initialized.
5. Start the app with `npm run dev`.

The schema script drops and recreates its objects; do not run it against data
you need to keep.

Visit [http://localhost:3000](http://localhost:3000). The dashboard's database
indicator and `GET /api/health` endpoint verify the configured connection.
