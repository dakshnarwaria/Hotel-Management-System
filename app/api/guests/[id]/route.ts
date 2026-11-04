import { guests } from "@/lib/resources/guests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export function GET(request: Request, context: Context) {
  return guests.getById(request, context, "id");
}

export function PUT(request: Request, context: Context) {
  return guests.update(request, context, "id");
}

export function DELETE(request: Request, context: Context) {
  return guests.remove(request, context, "id");
}
