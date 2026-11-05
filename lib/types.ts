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
  display_status: "Available" | "Reserved" | "Occupied" | "Maintenance";
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

export interface Booking {
  booking_id: number;
  guest_id: number;
  full_name: string;
  phone: string;
  room_no: number;
  type_name: string;
  emp_id: number;
  emp_name: string;
  check_in: string | Date;
  check_out: string | Date;
  nights: number;
  room_rate: number;
  no_of_guests: number;
  status: "Confirmed" | "Checked-In" | "Checked-Out" | "Cancelled";
  can_check_in: boolean | number;
  room_charge: number;
  room_gst_rate: number;
  room_gst: number;
  services_total: number;
  services_gst_rate: number;
  services_gst: number;
  total_gst: number;
  grand_total: number;
  paid: number;
  balance: number;
}

export interface AvailableRoom {
  room_no: number;
  floor_no: number;
  type_name: string;
  capacity: number;
  price_per_night: number;
  nights: number;
  estimated_total: number;
}

export type ResourceRow = Guest | RoomType | Room | Employee | Service;
