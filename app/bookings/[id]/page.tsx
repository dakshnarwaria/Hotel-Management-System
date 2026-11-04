import Link from "next/link";

export default async function BookingDetailsPlaceholder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <section className="surface setup-card">
      <span className="eyebrow">Booking #{id}</span>
      <h1 className="page-title">Booking details coming in Phase 4</h1>
      <p className="muted">
        The booking list and stay actions are available in this phase.
      </p>
      <Link href="/bookings" className="button button-secondary button-md back-link">
        Back to bookings
      </Link>
    </section>
  );
}
