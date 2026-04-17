export function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export function formatPercent(num) {
  if (Number.isNaN(Number(num))) return '0%';
  return `${Number(num).toFixed(2)}%`;
}

export function maskSecret(value = '') {
  if (!value) return '••••••••';
  if (value.length <= 4) return '••••';
  return `${value.slice(0, 2)}${'•'.repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`;
}

export function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers
      .map((header) => `"${String(row[header] ?? '').replaceAll('"', '""')}"`)
      .join(','),
  );
  return [headers.join(','), ...lines].join('\n');
}

export function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
