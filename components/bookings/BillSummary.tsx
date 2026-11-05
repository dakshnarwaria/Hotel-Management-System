import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/format";

export type BillData = {
  booking_id: number;
  full_name: string;
  room_no: number;
  nights?: number;
  room_rate?: number;
  room_charge: number;
  room_gst_rate: number;
  room_gst: number;
  services_total: number;
  services_gst_rate: number;
  services_gst: number;
  total_gst: number;
  grand_total: number;
  paid: number;
  balance: number;
};

export default function BillSummary({ bill }: { bill: BillData }) {
  return (
    <section className="surface detail-card">
      <header className="detail-card-header">
        <div>
          <span className="eyebrow">Invoice summary</span>
          <h2>Bill summary</h2>
        </div>
        {bill.balance <= 0 && <StatusBadge status="Paid in full" />}
      </header>
      <dl className="bill-summary-list">
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
        <div className="bill-total"><dt>Grand total</dt><dd>{formatCurrency(bill.grand_total)}</dd></div>
        <div><dt>Paid</dt><dd>{formatCurrency(bill.paid)}</dd></div>
        <div className={bill.balance > 0 ? "bill-due" : ""}>
          <dt>Remaining</dt><dd>{formatCurrency(bill.balance)}</dd>
        </div>
      </dl>
      <p className="bill-gst-note">
        GST: rooms 5% up to Rs 7,500 per night, 18% above; services 18%.
      </p>
    </section>
  );
}
