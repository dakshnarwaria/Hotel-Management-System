import { createPayment, listPayments } from "@/lib/resources/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = listPayments;
export const POST = createPayment;
