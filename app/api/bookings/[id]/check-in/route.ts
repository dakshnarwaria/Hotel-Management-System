import { bookingAction } from "@/lib/booking-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export function POST(request: Request, context: Context) {
  return bookingAction(request, context, "check_in");
}
