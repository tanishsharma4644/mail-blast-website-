import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import { logsApi } from '../api/logs';
import { downloadTextFile, formatDate, toCSV } from '../utils/helpers';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', startDate: '', endDate: '' });

  const fetchLogs = async (customFilters = filters) => {
    const params = {
      page: 1,
      limit: 500,
      ...customFilters,
    };
    const { data } = await logsApi.list(params);
    setLogs(data.items || []);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onFilter = async (event) => {
    event.preventDefault();
    await fetchLogs(filters);
  };

  const onExport = () => {
    const csv = toCSV(
      logs.map((item) => ({
        leadEmail: item.leadEmail,
        campaign: item.campaignName,
        smtpUsed: item.smtpUsed,
        templateUsed: item.templateUsed,
        status: item.status,
        timestamp: formatDate(item.timestamp),
        errorMessage: item.errorMessage,
      })),
    );

    downloadTextFile(`logs-${Date.now()}.csv`, csv);
    toast.success('Logs exported as CSV');
  };

  return (
    <div className="space-y-4 h-screen flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Global Logs</h1>
        <button onClick={onExport} className="rounded-lg border border-app-border px-3 py-2 text-sm">Export CSV</button>
      </div>

      <form onSubmit={onFilter} className="grid gap-3 rounded-2xl border border-app-border bg-app-card p-4 md:grid-cols-4">
        <select
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
          className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm"
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
          className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm"
        />

        <button type="submit" className="rounded-lg bg-app-accent px-3 py-2 text-sm text-white">Apply</button>
      </form>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={[
            { key: 'leadEmail', header: 'Email' },
            { key: 'campaignName', header: 'Campaign' },
            { key: 'smtpUsed', header: 'SMTP Used' },
            { key: 'templateUsed', header: 'Template' },
            { key: 'status', header: 'Status', render: (value) => <Badge status={value} /> },
            { key: 'timestamp', header: 'Timestamp', render: (value) => formatDate(value) },
          ]}
          rows={logs}
          pageSize={15}
        />
      </div>
    </div>
  );
}
