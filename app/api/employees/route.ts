import { employees } from "@/lib/resources/employees";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = employees.list;
export const POST = employees.create;
