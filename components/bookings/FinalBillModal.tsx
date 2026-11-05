"use client";

import Link from "next/link";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/format";
import type { BillData } from "@/components/bookings/BillSummary";

export default function FinalBillModal({
  bill,
  onClose,
}: {
  bill: BillData | null;
  onClose: () => void;
}) {
  return (
    <Modal open={Boolean(bill)} title="Final Bill" onClose={onClose}>
      {bill && (
        <div className="final-bill">
          <div className="final-bill-intro">
            <span className="eyebrow">Booking #{bill.booking_id}</span>
            <strong>{bill.full_name}</strong>
            <span>Room {bill.room_no}</span>
          </div>
          <dl>
            <div>
              <dt>
                Room charge
                {bill.nights != null && bill.room_rate != null
                  ? ` (${bill.nights} ${bill.nights === 1 ? "night" : "nights"} × ${formatCurrency(bill.room_rate)}/night)`
                  : ""}
              </dt>
              <dd>{formatCurrency(bill.room_charge)}</dd>
            </div>
            <div><dt>Room GST ({bill.room_gst_rate}%)</dt><dd>{formatCurrency(bill.room_gst)}</dd></div>
            <div><dt>Services total</dt><dd>{formatCurrency(bill.services_total)}</dd></div>
            <div><dt>Services GST ({bill.services_gst_rate}%)</dt><dd>{formatCurrency(bill.services_gst)}</dd></div>
            <div className="bill-grand"><dt>Grand total</dt><dd>{formatCurrency(bill.grand_total)}</dd></div>
            <div><dt>Paid</dt><dd>{formatCurrency(bill.paid)}</dd></div>
            <div className={`bill-balance${bill.balance > 0 ? " bill-due" : ""}`}>
              <dt>Remaining</dt><dd>{formatCurrency(bill.balance)}</dd>
            </div>
          </dl>
          <p className="bill-gst-note">
            GST: rooms 5% up to Rs 7,500 per night, 18% above; services 18%.
          </p>
          {bill.balance <= 0 && <StatusBadge status="Paid in full" />}
          {bill.balance > 0 && (
            <div className="balance-warning" role="status">
              <span>Remaining: {formatCurrency(bill.balance)}.</span>
              <Link
                href={`/bookings/${bill.booking_id}`}
                className="button button-primary button-sm"
              >
                Record payment
              </Link>
            </div>
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
