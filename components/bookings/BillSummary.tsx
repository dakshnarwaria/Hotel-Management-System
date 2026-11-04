import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/format";

export type BillData = {
  booking_id: number;
  full_name: string;
  room_no: number;
  room_charge: number;
  services_total: number;
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
        <div><dt>Room charge</dt><dd>{formatCurrency(bill.room_charge)}</dd></div>
        <div><dt>Services total</dt><dd>{formatCurrency(bill.services_total)}</dd></div>
        <div className="bill-total"><dt>Grand total</dt><dd>{formatCurrency(bill.grand_total)}</dd></div>
        <div><dt>Paid</dt><dd>{formatCurrency(bill.paid)}</dd></div>
        <div className={bill.balance > 0 ? "bill-due" : ""}>
          <dt>Balance</dt><dd>{formatCurrency(bill.balance)}</dd>
        </div>
      </dl>
    </section>
  );
}
