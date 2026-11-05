import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Rooms" };

export default function RoomsLayout({ children }: { children: ReactNode }) {
  return children;
}
