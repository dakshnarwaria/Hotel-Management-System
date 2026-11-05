"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { useApi } from "@/hooks/useApi";

export type ServiceOrderRow = {
  order_id: number;
  service_id: number;
  service_name: string;
  price: number;
  quantity: number;
  line_total: number;
  order_date: string | Date;
};

type Props = {
  bookingId: number;
  status: string;
  orders: ServiceOrderRow[];
  servicesTotal: number;
  onAdd: () => void;
  onChanged: () => void;
};

export default function ServiceOrdersCard({
  bookingId,
  status,
  orders,
  servicesTotal,
  onAdd,
  onChanged,
}: Props) {
  const request = useApi();
  const [deleteTarget, setDeleteTarget] = useState<ServiceOrderRow | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      onChanged();
    } catch {
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="surface detail-card">
        <header className="detail-card-header">
          <div>
            <span className="eyebrow">Booking #{bookingId}</span>
            <h2>Service orders</h2>
          </div>
          <span
            title={
              status === "Checked-In"
                ? "Record a service during this stay"
                : "Check the guest in first. Services can only be added during the stay."
            }
          >
            <Button
              size="sm"
              disabled={status !== "Checked-In"}
              onClick={onAdd}
            >
              <Plus size={15} /> Record service
            </Button>
          </span>
        </header>
        <div className="detail-table-scroll">
          <table className="data-table detail-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Date</th>
                {status === "Checked-In" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={status === "Checked-In" ? 6 : 5} className="empty-cell">
                    No services ordered yet. Add one while the guest is checked in.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.order_id}>
                    <td>{order.service_name}</td>
                    <td>{order.quantity}</td>
                    <td>{formatCurrency(order.price)}</td>
                    <td>{formatCurrency(order.line_total)}</td>
                    <td>{formatDate(order.order_date)}</td>
                    {status === "Checked-In" && (
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          className="icon-action"
                          title="Remove service order"
                          aria-label={`Remove ${order.service_name} service order`}
                          onClick={() => setDeleteTarget(order)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={3}>Services total</th>
                <th>{formatCurrency(servicesTotal)}</th>
                <th colSpan={status === "Checked-In" ? 2 : 1} />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove service order?"
        message={`Remove ${deleteTarget?.service_name ?? "this service"} from this booking?`}
        loading={deleting}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={() => void removeOrder()}
      />
    </>
  );
}
