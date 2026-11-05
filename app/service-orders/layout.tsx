import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Service Orders" };

export default function ServiceOrdersLayout({ children }: { children: ReactNode }) {
  return children;
}
