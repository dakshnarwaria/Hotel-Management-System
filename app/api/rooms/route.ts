import { createRoom, listRooms } from "@/lib/resources/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = listRooms;
export const POST = createRoom;
