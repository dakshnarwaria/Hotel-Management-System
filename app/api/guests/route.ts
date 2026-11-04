import { guests } from "@/lib/resources/guests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = guests.list;
export const POST = guests.create;
