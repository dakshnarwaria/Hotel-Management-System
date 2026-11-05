import type { DataColumn } from "@/components/DataTable";

type Props<T> = {
  columns: DataColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  rowKey?: (row: T, index: number) => string | number;
};

export default function PrintableTable<T>({
  columns,
  rows,
  emptyMessage = "No rows",
  rowKey,
}: Props<T>) {
  return (
    <div className="printable-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="printable-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={rowKey?.(row, index) ?? index}>
                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {column.render
                      ? column.render(row)
                      : String(
                          (row as Record<string, unknown>)[
                            String(column.key)
                          ] ?? "—",
                        )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
