"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardList, CreditCard, Trash2, TrendingUp } from "lucide-react";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable, { type DataColumn } from "@/components/DataTable";
import { FormField, SelectField } from "@/components/FormField";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import AddServiceModal from "@/components/bookings/AddServiceModal";
import { useApi } from "@/hooks/useApi";
import { useList } from "@/hooks/useList";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Service } from "@/lib/types";

type ServiceOrder = {
  order_id: number;
  order_date: string | Date;
  full_name: string;
  booking_id: number;
  room_no: number;
  booking_status: string;
  service_id: number;
  service_name: string;
  price: number;
  quantity: number;
  line_total: number;
};

type ServiceOrderSummary = {
  total_revenue: number;
  orders_count: number;
  top_service_name: string | null;
  top_service_quantity: number;
};

const emptySummary: ServiceOrderSummary = {
  total_revenue: 0,
  orders_count: 0,
  top_service_name: null,
  top_service_quantity: 0,
};

export default function ServiceOrdersPage() {
  const request = useApi();
  const [serviceId, setServiceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const {
    rows: orders,
    summary: listSummary,
    loading,
    refresh,
  } = useList<ServiceOrder, ServiceOrderSummary>("/api/service-orders", {
    ...(serviceId ? { service_id: serviceId } : {}),
    ...(from && to ? { from, to } : {}),
    ...(search ? { search } : {}),
  });
  const summary = listSummary ?? emptySummary;
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadServices() {
    if (servicesLoaded) return;
    setServicesLoaded(true);
    try {
      setServices(await request<Service[]>("/api/services"));
    } catch {
      setServicesLoaded(false);
    }
  }

  const columns = useMemo<DataColumn<ServiceOrder>[]>(
    () => [
      { key: "order_id", header: "ID" },
      { key: "order_date", header: "Date", render: (row) => formatDate(row.order_date) },
      { key: "full_name", header: "Guest" },
      {
        key: "booking_id",
        header: "Booking",
        render: (row) => (
          <Link className="table-link" href={`/bookings/${row.booking_id}`}>
            #{row.booking_id}
          </Link>
        ),
      },
      { key: "room_no", header: "Room" },
      { key: "service_name", header: "Service" },
      { key: "quantity", header: "Qty" },
      { key: "price", header: "Price", render: (row) => formatCurrency(row.price) },
      {
        key: "line_total",
        header: "Line total",
        render: (row) => <strong>{formatCurrency(row.line_total)}</strong>,
      },
    ],
    [],
  );

  async function removeOrder() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await request(
        `/api/service-orders/${deleteTarget.order_id}`,
        { method: "DELETE" },
        "Service order removed",
      );
      setDeleteTarget(null);
      refresh();
    } catch {
      // useApi displays request errors as toasts.
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Guest services"
        title="Service Orders"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <ClipboardList size={17} /> Record service
          </Button>
        }
      />

      <section className="payment-summary-grid service-summary-grid" aria-label="Service order totals">
        <article className="surface payment-summary-card">
          <span className="payment-summary-icon"><CreditCard size={19} /></span>
          <span>Total service revenue (before GST)</span>
          <strong>{formatCurrency(summary.total_revenue)}</strong>
        </article>
        <article className="surface payment-summary-card">
          <span className="payment-summary-icon"><ClipboardList size={19} /></span>
          <span>Orders count</span>
          <strong>{summary.orders_count}</strong>
        </article>
        <article className="surface payment-summary-card">
          <span className="payment-summary-icon"><TrendingUp size={19} /></span>
          <span>Top service by quantity</span>
          <strong>{summary.top_service_name ?? "—"}</strong>
          {summary.top_service_name && (
            <small className="muted">{summary.top_service_quantity} ordered</small>
          )}
        </article>
      </section>

      <section className="resource-toolbar service-order-toolbar" aria-label="Service order filters">
        <SearchInput
          onChange={setSearch}
          placeholder="Search guest or booking id..."
        />
        <SelectField
          name="service-filter"
          label="Service"
          className="filter-field-control"
          value={serviceId}
          options={[
            { value: "", label: "All services" },
            ...services.map((service) => ({
              value: String(service.service_id),
              label: service.service_name,
            })),
          ]}
          onFocus={() => void loadServices()}
          onChange={(event) => {
            setServiceId(event.target.value);
          }}
        />
        <FormField
          name="service-order-from"
          label="From"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <FormField
          name="service-order-to"
          label="To"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </section>

      <DataTable
        columns={columns}
        rows={orders}
        loading={loading}
        emptyMessage="No service orders match these filters."
        rowKey={(row) => row.order_id}
        actions={(row) =>
          row.booking_status === "Checked-In" ? (
            <Button
              variant="danger"
              size="sm"
              className="icon-action"
              title="Delete service order"
              aria-label={`Delete ${row.service_name} service order`}
              onClick={() => setDeleteTarget(row)}
            >
              <Trash2 size={15} />
            </Button>
          ) : (
            <span className="muted">—</span>
          )
        }
      />

      <AddServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={() => {
          setModalOpen(false);
          refresh();
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete service order?"
        message={`Delete service order #${deleteTarget?.order_id ?? ""}?`}
        loading={deleting}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={() => void removeOrder()}
      />
    </>
  );
}
