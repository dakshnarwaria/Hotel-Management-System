import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesLayout({ children }: { children: ReactNode }) {
  return children;
}
