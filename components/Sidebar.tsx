"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  BriefcaseBusiness,
  ClipboardList,
  LayoutDashboard,
  Tags,
  Users,
  Utensils,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Guests", href: "/guests", icon: Users },
  { label: "Room Types", href: "/room-types", icon: Tags },
  { label: "Rooms", href: "/rooms", icon: BedDouble },
  { label: "Bookings", href: "/bookings", icon: ClipboardList },
  { label: "Employees", href: "/employees", icon: BriefcaseBusiness },
  { label: "Services", href: "/services", icon: Utensils },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-mark">
          <BedDouble size={21} />
        </span>
        <span>
          <strong>Hearth &amp; Stay</strong>
          <small>HOTEL MANAGEMENT</small>
        </span>
      </Link>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link${active ? " active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggle />
        <p>Thoughtful stays, simply managed.</p>
      </div>
    </aside>
  );
}
