"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BedDouble,
  BriefcaseBusiness,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  LayoutDashboard,
  Menu,
  Tags,
  Users,
  Utensils,
  X,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Guests", href: "/guests", icon: Users },
  { label: "Room Types", href: "/room-types", icon: Tags },
  { label: "Rooms", href: "/rooms", icon: BedDouble },
  { label: "Bookings", href: "/bookings", icon: ClipboardList },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Employees", href: "/employees", icon: BriefcaseBusiness },
  { label: "Services", href: "/services", icon: Utensils },
  { label: "Service Orders", href: "/service-orders", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: FileBarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const trigger = triggerRef.current;
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key !== "Tab") return;
      const items = sidebarRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!sidebarRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [mobileOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="mobile-menu-toggle"
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        aria-controls="primary-navigation"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={18} aria-hidden />
        <span>Menu</span>
      </button>
      {mobileOpen && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        id="primary-navigation"
        className={`sidebar${mobileOpen ? " mobile-open" : ""}`}
        aria-label="Primary navigation"
      >
        <button
          ref={closeRef}
          type="button"
          className="mobile-nav-close"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        >
          <X size={19} aria-hidden />
        </button>
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
              onClick={() => setMobileOpen(false)}
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
    </>
  );
}
