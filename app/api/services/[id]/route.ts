import { services } from "@/lib/resources/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export function GET(request: Request, context: Context) {
  return services.getById(request, context, "id");
}

export function PUT(request: Request, context: Context) {
  return services.update(request, context, "id");
}

export function DELETE(request: Request, context: Context) {
  return services.remove(request, context, "id");
}
