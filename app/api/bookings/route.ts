import { createBooking, listBookings } from "@/lib/booking-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = listBookings;
export const POST = createBooking;
