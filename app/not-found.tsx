import Link from "next/link";

export default function NotFound() {
  return (
    <section className="surface error-boundary">
      <span className="eyebrow">404</span>
      <h1 className="page-title">Page not found</h1>
      <p className="muted">The page may have moved or the address may be incorrect.</p>
      <Link href="/dashboard" className="button button-primary button-md">
        Return to dashboard
      </Link>
    </section>
  );
}
