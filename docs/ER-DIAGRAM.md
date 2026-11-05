# Hotel database ER diagram

This diagram matches the eight tables and foreign keys in `db/schema.sql`.

```mermaid
erDiagram
    Guests {
        INT guest_id PK
        VARCHAR(50) full_name
        VARCHAR(15) phone UK
        VARCHAR(60) email
        VARCHAR(30) city
        VARCHAR(30) id_proof
    }

    Room_Types {
        INT type_id PK
        VARCHAR(30) type_name UK
        DECIMAL(10,2) price_per_night
        INT capacity
    }

    Rooms {
        INT room_no PK
        INT type_id FK
        INT floor_no
        VARCHAR(15) status
    }

    Employees {
        INT emp_id PK
        VARCHAR(50) emp_name
        VARCHAR(30) role
        VARCHAR(15) phone
        DECIMAL(10,2) salary
    }

    Bookings {
        INT booking_id PK
        INT guest_id FK
        INT room_no FK
        INT emp_id FK
        DATE check_in
        DATE check_out
        INT no_of_guests
        VARCHAR(15) status
        DECIMAL(10,2) total_amount
    }

    Payments {
        INT payment_id PK
        INT booking_id FK
        DECIMAL(10,2) amount
        DATE pay_date
        VARCHAR(10) method
    }

    Services {
        INT service_id PK
        VARCHAR(40) service_name
        DECIMAL(10,2) price
    }

    Service_Orders {
        INT order_id PK
        INT booking_id FK
        INT service_id FK
        INT quantity
        DATE order_date
    }

    Guests ||--o{ Bookings : makes
    Rooms ||--o{ Bookings : assigned_to
    Employees ||--o{ Bookings : handles
    Room_Types ||--o{ Rooms : classifies
    Bookings ||--o{ Payments : receives
    Bookings ||--o{ Service_Orders : includes
    Services ||--o{ Service_Orders : ordered_as
```

`Service_Orders.booking_id` uses `ON DELETE CASCADE`; the other foreign keys use MySQL's default restrictive behavior. The diagram lists the schema's column types and uniqueness/primary/foreign keys; nullability and CHECK rules remain defined in `db/schema.sql`.
