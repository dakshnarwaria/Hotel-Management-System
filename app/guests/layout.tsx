import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Guests" };

export default function GuestsLayout({ children }: { children: ReactNode }) {
  return children;
}
