"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import { FormField, SelectField } from "@/components/FormField";
import Modal from "@/components/Modal";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/format";
import { positiveInt } from "@/lib/validate";

type ServiceOption = { service_id: number; service_name: string; price: number };
type Props = {
  open: boolean;
  bookingId: number;
  checkIn: string | Date;
  checkOut: string | Date;
  onClose: () => void;
  onAdded: () => void;
};

function dateValue(value: string | Date) {
  if (typeof value === "string") return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function todayValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function AddServiceModal({
  open,
  bookingId,
  checkIn,
  checkOut,
  onClose,
  onAdded,
}: Props) {
  const request = useApi();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [orderDate, setOrderDate] = useState(todayValue);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    async function loadServices() {
      try {
        const rows = await request<ServiceOption[]>("/api/services");
        if (active) setServices(rows);
      } catch {
        // useApi displays request errors as toasts.
      }
    }
    void loadServices();
    return () => {
      active = false;
    };
  }, [open, request]);

  const selectedService = services.find(
    (service) => String(service.service_id) === serviceId,
  );
  const lineTotal = useMemo(
    () => Number(selectedService?.price ?? 0) * Number(quantity || 0),
    [quantity, selectedService],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!serviceId) nextErrors.service_id = "Service is required";
    const quantityError = positiveInt(quantity, "Quantity");
    if (quantityError) nextErrors.quantity = quantityError;
    if (!orderDate) nextErrors.order_date = "Order date is required";
    else if (orderDate < dateValue(checkIn) || orderDate > dateValue(checkOut)) {
      nextErrors.order_date = "Order date must be between check-in and check-out dates";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await request(
        "/api/service-orders",
        {
          method: "POST",
          body: JSON.stringify({
            booking_id: bookingId,
            service_id: Number(serviceId),
            quantity: Number(quantity),
            order_date: orderDate,
          }),
        },
        "Service order added",
      );
      onClose();
      onAdded();
    } catch {
      // useApi displays request errors as toasts.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Add service" onClose={() => !saving && onClose()}>
      <form className="resource-form" onSubmit={(event) => void submit(event)} noValidate>
        <SelectField
          name="service_id"
          label="Service"
          required
          value={serviceId}
          error={errors.service_id}
          options={[
            { value: "", label: "Select a service" },
            ...services.map((service) => ({
              value: String(service.service_id),
              label: `${service.service_name} · ${formatCurrency(service.price)}`,
            })),
          ]}
          disabled={saving}
          onChange={(event) => setServiceId(event.target.value)}
        />
        <FormField
          name="quantity"
          label="Quantity"
          type="number"
          required
          min={1}
          step={1}
          value={quantity}
          error={errors.quantity}
          disabled={saving}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <FormField
          name="order_date"
          label="Order date"
          type="date"
          required
          min={dateValue(checkIn)}
          max={dateValue(checkOut)}
          value={orderDate}
          error={errors.order_date}
          disabled={saving}
          onChange={(event) => setOrderDate(event.target.value)}
        />
        <div className="line-total-preview">
          <span>Line total</span>
          <strong>{formatCurrency(lineTotal)}</strong>
        </div>
        <div className="form-actions">
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Add service</Button>
        </div>
      </form>
    </Modal>
  );
}
