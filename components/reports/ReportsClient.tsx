"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Clipboard, Download, Printer } from "lucide-react";
import Button from "@/components/Button";
import DataTable, { type DataColumn } from "@/components/DataTable";
import ErrorCard from "@/components/ErrorCard";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { useList } from "@/hooks/useList";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ReportColumn, ReportDefinition } from "@/lib/reports";

type ReportRow = Record<string, unknown>;
type ResultSummary = { rowCount: number; reports: ReportDefinition[] };

export default function ReportsClient({
  initialReport,
}: {
  initialReport: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState(initialReport);
  const [sqlOpen, setSqlOpen] = useState(false);
  const {
    rows,
    summary,
    loading,
    error,
    refresh,
  } = useList<ReportRow, ResultSummary>(`/api/reports/${selectedId}`, {});
  const reports = summary?.reports ?? [];
  const report = reports.find((item) => item.id === selectedId);

  const columns = useMemo<DataColumn<ReportRow>[]>(
    () =>
      (report?.columns ?? []).map((column) => ({
        key: column.key,
        header: column.header,
        render: (row) => renderValue(row[column.key], column),
      })),
    [report],
  );

  const selectReport = useCallback(
    (id: string) => {
      setSelectedId(id);
      setSqlOpen(false);
      router.replace(`/reports?report=${encodeURIComponent(id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  async function copySql() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.sql);
      toast("SQL copied to clipboard", "success");
    } catch (copyError) {
      const message =
        copyError instanceof Error ? copyError.message : "Unable to copy SQL";
      toast(message, "error");
    }
  }

  function exportCsv() {
    if (!report) return;
    const headings = report.columns.map((column) => column.header);
    const csvRows = [
      headings,
      ...rows.map((row) =>
        report.columns.map((column) => csvValue(row[column.key])),
      ),
    ];
    const csv = csvRows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-${report.id}-${slug(report.title)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const reportCount = summary?.rowCount ?? rows.length;

  return (
    <div className="reports-page">
      <PageHeader eyebrow="Insights" title="Reports" />
      <div className="reports-layout">
        <aside className="reports-sidebar surface" aria-label="Available reports">
          <div className="reports-list-heading">
            <h2>Lab reports</h2>
            <span>{reports.length}</span>
          </div>
          {loading && reports.length === 0 ? (
            <div className="reports-loading">
              {Array.from({ length: 5 }, (_, index) => (
                <span className="skeleton-line" key={index} />
              ))}
            </div>
          ) : (
            <div className="report-options">
              {reports.map((item) => (
                <button
                  type="button"
                  className={`report-option${item.id === selectedId ? " active" : ""}`}
                  key={item.id}
                  onClick={() => selectReport(item.id)}
                  aria-current={item.id === selectedId ? "true" : undefined}
                >
                  <span className="report-number">{item.id}</span>
                  <span className="report-option-copy">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="reports-result">
          {report ? (
            <>
              <div className="report-print-heading">
                <h1>{report.title}</h1>
                <p>{formatDate(new Date())}</p>
              </div>
              <div className="surface report-detail-card">
                <div className="report-title-row">
                  <div>
                    <span className="eyebrow">Report {report.id}</span>
                    <h2>{report.title}</h2>
                    <p className="muted">{report.description}</p>
                  </div>
                  <div className="report-actions print-hide">
                    <Button variant="secondary" onClick={exportCsv} disabled={loading}>
                      <Download size={15} /> Export CSV
                    </Button>
                    <Button variant="secondary" onClick={() => window.print()}>
                      <Printer size={15} /> Print
                    </Button>
                  </div>
                </div>
                <div className="report-sql print-hide">
                  <div className="report-sql-heading">
                    <button
                      type="button"
                      className="sql-toggle"
                      onClick={() => setSqlOpen((open) => !open)}
                      aria-expanded={sqlOpen}
                    >
                      {sqlOpen ? "Hide SQL" : "View SQL"}
                    </button>
                    <Button variant="secondary" size="sm" onClick={copySql}>
                      <Clipboard size={14} /> Copy
                    </Button>
                  </div>
                  {sqlOpen && (
                    <pre className="report-sql-code">
                      <code>{report.sql}</code>
                    </pre>
                  )}
                </div>
                {error && <ErrorCard message={error} onRetry={refresh} />}
                <div className="report-row-count">
                  <span>{reportCount} rows</span>
                </div>
                <DataTable
                  columns={columns}
                  rows={rows}
                  loading={loading}
                  emptyMessage="This report returned no rows. Try another report."
                  rowKey={(row, index) =>
                    String(row.booking_id ?? row.guest_id ?? row.order_id ?? row.payment_id ?? row.room_no ?? index)
                  }
                />
              </div>
            </>
          ) : (
            <section className="surface report-not-found">
              <h2>{loading ? "Loading reports…" : "Report not found"}</h2>
              {!loading && !error && (
                <p className="muted">Choose one of the available reports to continue.</p>
              )}
              {error && <ErrorCard message={error} onRetry={refresh} />}
            </section>
          )}
        </section>
      </div>
    </div>
  );
}

function renderValue(value: unknown, column: ReportColumn) {
  if (value === null || value === undefined || value === "") return "—";
  if (column.type === "currency") return formatCurrency(String(value));
  if (column.type === "date") return formatDate(String(value));
  if (column.type === "number") {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString("en-IN") : String(value);
  }
  if (column.type === "badge") return <StatusBadge status={String(value)} />;
  return String(value);
}

function csvValue(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return "";
  return String(value);
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
