import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Services" };

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return children;
}
