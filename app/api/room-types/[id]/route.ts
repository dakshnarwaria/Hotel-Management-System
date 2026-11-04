import { roomTypes } from "@/lib/resources/room-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export function GET(request: Request, context: Context) {
  return roomTypes.getById(request, context, "id");
}

export function PUT(request: Request, context: Context) {
  return roomTypes.update(request, context, "id");
}

export function DELETE(request: Request, context: Context) {
  return roomTypes.remove(request, context, "id");
}
