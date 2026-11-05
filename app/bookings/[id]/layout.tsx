import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Booking details" };

export default function BookingDetailsLayout({ children }: { children: ReactNode }) {
  return children;
}
