import {
  deleteRoom,
  getRoomById,
  patchRoom,
  updateRoom,
} from "@/lib/resources/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = getRoomById;
export const PUT = updateRoom;
export const PATCH = patchRoom;
export const DELETE = deleteRoom;
