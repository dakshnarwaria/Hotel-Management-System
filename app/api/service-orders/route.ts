import {
  createServiceOrder,
  listServiceOrders,
} from "@/lib/resources/service-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = listServiceOrders;
export const POST = createServiceOrder;
