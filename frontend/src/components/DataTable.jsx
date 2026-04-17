import { useMemo, useState } from 'react';

export default function DataTable({
  columns,
  rows,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  rowKey = '_id',
  selectable = false,
  selectedRows = [],
  onToggleRow,
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(columns[0]?.key || '');
  const [sortDirection, setSortDirection] = useState('asc');

  const filtered = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    const searched = rows.filter((row) =>
      columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(lowerSearch)),
    );

    const sorted = [...searched].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === bVal) return 0;
      if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return sorted;
  }, [rows, columns, search, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="rounded-2xl border border-app-border bg-app-card p-4 flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          className="w-full max-w-sm rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
        <table className="w-full min-w-[700px] table-auto border-collapse text-left text-sm">
          <thead>
            <tr>
              {selectable && <th className="pb-3 pr-3 text-app-muted">Pick</th>}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="cursor-pointer pb-3 pr-3 text-xs uppercase tracking-wider text-app-muted"
                  onClick={() => toggleSort(column.key)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => (
              <tr key={row[rowKey]} className="border-t border-app-border">
                {selectable && (
                  <td className="py-3 pr-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row[rowKey])}
                      onChange={() => onToggleRow?.(row[rowKey])}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="py-3 pr-3 text-app-text">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-app-muted">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            className="rounded border border-app-border px-2 py-1 disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <button
            className="rounded border border-app-border px-2 py-1 disabled:opacity-50"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
