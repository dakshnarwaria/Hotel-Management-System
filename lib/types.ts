export interface Guest {
  guest_id: number;
  full_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  id_proof: string | null;
}

export interface RoomType {
  type_id: number;
  type_name: string;
  price_per_night: number;
  capacity: number;
  rooms_count: number;
}

export interface Room {
  room_no: number;
  type_id: number;
  type_name: string;
  price_per_night: number;
  capacity: number;
  floor_no: number;
  status: "Available" | "Occupied" | "Maintenance";
}

export interface Employee {
  emp_id: number;
  emp_name: string;
  role: string;
  phone: string | null;
  salary: number | null;
  bookings_handled: number;
}

export interface Service {
  service_id: number;
  service_name: string;
  price: number;
  times_ordered: number;
}

export type ResourceRow = Guest | RoomType | Room | Employee | Service;
