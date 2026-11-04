import { employees } from "@/lib/resources/employees";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export function GET(request: Request, context: Context) {
  return employees.getById(request, context, "id");
}

export function PUT(request: Request, context: Context) {
  return employees.update(request, context, "id");
}

export function DELETE(request: Request, context: Context) {
  return employees.remove(request, context, "id");
}
