import { Plus } from "lucide-react";
import Button from "@/components/Button";
import { formatCurrency, formatDate } from "@/lib/format";

export type PaymentRow = {
  payment_id: number;
  amount: number;
  pay_date: string | Date;
  method: "Cash" | "Card" | "UPI";
};

export default function PaymentsCard({
  payments,
  paid,
  balance,
  status,
  onAdd,
}: {
  payments: PaymentRow[];
  paid: number;
  balance: number;
  status: string;
  onAdd: () => void;
}) {
  return (
    <section className="surface detail-card">
      <header className="detail-card-header">
        <div>
          <span className="eyebrow">Transaction history</span>
          <h2>Payments</h2>
        </div>
        {balance > 0 && status !== "Cancelled" && (
          <Button size="sm" onClick={onAdd}>
            <Plus size={15} /> Record payment
          </Button>
        )}
      </header>
      <div className="detail-table-scroll">
        <table className="data-table detail-table">
          <thead>
            <tr><th>Date</th><th>Method</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={3} className="empty-cell">No payments yet. Record one from this booking.</td></tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.payment_id}>
                  <td>{formatDate(payment.pay_date)}</td>
                  <td><span className={`method-badge method-${payment.method.toLowerCase()}`}>{payment.method}</span></td>
                  <td>{formatCurrency(payment.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr><th colSpan={2}>Paid total</th><th>{formatCurrency(paid)}</th></tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
