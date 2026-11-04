import type { RowDataPacket } from "mysql2/promise";
import { fail, handleDbError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { idFromParam } from "@/lib/master-data-api";

export async function getBookingDetail(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const id = idFromParam(params.id);
  if (id === null) return fail("Invalid booking id", 400);
  try {
    const [bookings, bills, serviceOrders, payments] = await Promise.all([
      query<RowDataPacket[]>(
        `SELECT b.booking_id, b.check_in, b.check_out,
                DATEDIFF(b.check_out, b.check_in) AS nights,
                b.no_of_guests, b.status, b.guest_id,
                g.full_name, g.phone, g.email, g.city, g.id_proof,
                r.room_no, r.floor_no, rt.type_name, rt.capacity,
                e.emp_id, e.emp_name
         FROM Bookings b
         JOIN Guests g ON g.guest_id = b.guest_id
         JOIN Rooms r ON r.room_no = b.room_no
         JOIN Room_Types rt ON rt.type_id = r.type_id
         JOIN Employees e ON e.emp_id = b.emp_id
         WHERE b.booking_id = ?`,
        [id],
      ),
      query<RowDataPacket[]>(
        "SELECT booking_id, full_name, room_no, status, room_charge, services_total, grand_total, paid, balance FROM booking_bills WHERE booking_id = ?",
        [id],
      ),
      query<RowDataPacket[]>(
        `SELECT o.order_id, o.service_id, s.service_name, s.price,
                o.quantity, (s.price * o.quantity) AS line_total, o.order_date
         FROM Service_Orders o
         JOIN Services s ON s.service_id = o.service_id
         WHERE o.booking_id = ? ORDER BY o.order_date`,
        [id],
      ),
      query<RowDataPacket[]>(
        "SELECT payment_id, amount, pay_date, method FROM Payments WHERE booking_id = ? ORDER BY pay_date, payment_id",
        [id],
      ),
    ]);

    if (!bookings[0]) return fail("Booking not found", 404);
    const row = bookings[0];
    return ok({
      booking: {
        booking_id: row.booking_id,
        dates: {
          check_in: row.check_in,
          check_out: row.check_out,
          nights: row.nights,
        },
        no_of_guests: row.no_of_guests,
        status: row.status,
        guest: {
          guest_id: row.guest_id,
          full_name: row.full_name,
          phone: row.phone,
          email: row.email,
          city: row.city,
          id_proof: row.id_proof,
        },
        room: {
          room_no: row.room_no,
          type_name: row.type_name,
          floor_no: row.floor_no,
          capacity: row.capacity,
        },
        employee: { emp_id: row.emp_id, emp_name: row.emp_name },
      },
      bill: bills[0],
      service_orders: serviceOrders,
      payments,
    });
  } catch (error) {
    return handleDbError(error);
  }
}
