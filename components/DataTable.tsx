"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Button from "@/components/Button";

export type DataColumn<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
};

type Props<T> = {
  columns: DataColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
  rowKey?: (row: T, index: number) => string | number;
};

export default function DataTable<T>({
  columns,
  rows,
  loading = false,
  emptyMessage = "Nothing to show yet.",
  actions,
  rowKey,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const column = columns.find((item) => String(item.key) === sortKey);
    if (!column) return rows;
    return [...rows].sort((a, b) => {
      const left = getValue(a, column.key);
      const right = getValue(b, column.key);
      const comparison =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left ?? "").localeCompare(String(right ?? ""), undefined, {
              numeric: true,
              sensitivity: "base",
            });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [columns, rows, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / 10));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * 10;
  const visibleRows = sortedRows.slice(start, start + 10);
  const from = sortedRows.length === 0 ? 0 : start + 1;
  const to = Math.min(start + visibleRows.length, sortedRows.length);

  function sortBy(key: string) {
    setPage(0);
    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  return (
    <div className="table-card surface">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => {
                const key = String(column.key);
                return (
                  <th key={key} scope="col">
                    {column.sortable === false ? (
                      column.header
                    ) : (
                      <button
                        type="button"
                        className="sort-button"
                        onClick={() => sortBy(key)}
                        aria-label={`Sort by ${column.header}`}
                      >
                        {column.header}
                        {sortKey !== key ? (
                          <ArrowUpDown size={14} />
                        ) : sortDirection === "asc" ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )}
                      </button>
                    )}
                  </th>
                );
              })}
              {actions && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <td key={String(column.key)}>
                      <span className="skeleton-line" />
                    </td>
                  ))}
                  {actions && (
                    <td>
                      <span className="skeleton-line" />
                    </td>
                  )}
                </tr>
              ))
            ) : visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="empty-cell"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => (
                <tr key={rowKey?.(row, start + index) ?? start + index}>
                  {columns.map((column) => (
                    <td key={String(column.key)}>
                      {column.render
                        ? column.render(row)
                        : String(getValue(row, column.key) ?? "—")}
                    </td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <footer className="table-footer">
        <span>
          Showing {from} to {to} of {sortedRows.length}
        </span>
        <div className="pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === 0 || loading}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span>
            Page {currentPage + 1} of {pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage >= pageCount - 1 || loading}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </footer>
    </div>
  );
}

function getValue<T>(row: T, key: keyof T | string): unknown {
  return (row as Record<string, unknown>)[String(key)];
}
