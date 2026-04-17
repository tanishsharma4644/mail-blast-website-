import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Megaphone, TriangleAlert } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { campaignsApi } from '../api/campaigns';
import { logsApi } from '../api/logs';
import { formatDate, formatPercent } from '../utils/helpers';
import Badge from '../components/Badge';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, successRate: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: campaignsData }, { data: logsData }, { data: statsData }] = await Promise.all([
        campaignsApi.list(),
        logsApi.list({ page: 1, limit: 10 }),
        logsApi.stats(),
      ]);

      setCampaigns(campaignsData.items || []);
      setLogs(logsData.items || []);
      setStats(statsData);
    };

    fetchData();
  }, []);

  const last7Days = useMemo(() => {
    const base = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), sent: 0 };
    });

    logs.forEach((log) => {
      if (log.status !== 'sent') return;
      const day = new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'short' });
      const match = base.find((item) => item.label === day);
      if (match) match.sent += 1;
    });

    return base;
  }, [logs]);

  const recentCampaignRows = campaigns.slice(0, 5).map((item) => ({
    ...item,
    createdAt: formatDate(item.createdAt),
  }));

  const recentLogRows = logs.slice(0, 10).map((item) => ({
    ...item,
    timestamp: formatDate(item.timestamp),
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Megaphone size={18} />} label="Total Campaigns" value={campaigns.length} trend="+8%" />
        <StatCard icon={<CheckCircle2 size={18} />} label="Total Sent" value={stats.sent} trend="+12%" />
        <StatCard icon={<TriangleAlert size={18} />} label="Total Failed" value={stats.failed} trend="-2%" />
        <StatCard icon={<Activity size={18} />} label="Success Rate" value={formatPercent(stats.successRate)} trend="+3%" />
      </section>

      <section className="rounded-2xl border border-app-border bg-app-card p-4">
        <h2 className="mb-4 text-lg font-semibold">Emails sent in last 7 days</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last7Days}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{ background: '#17171A', border: '1px solid rgba(255,255,255,0.07)' }}
              />
              <Line type="monotone" dataKey="sent" stroke="#6C63FF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-base font-semibold">Recent Campaigns</h3>
          <DataTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'status', header: 'Status', render: (value) => <Badge status={value} /> },
              { key: 'sentCount', header: 'Sent' },
              { key: 'failedCount', header: 'Failed' },
              { key: 'createdAt', header: 'Created' },
            ]}
            rows={recentCampaignRows}
            pageSize={5}
          />
        </div>

        <div>
          <h3 className="mb-3 text-base font-semibold">Recent Logs</h3>
          <DataTable
            columns={[
              { key: 'leadEmail', header: 'Email' },
              { key: 'campaignName', header: 'Campaign' },
              { key: 'status', header: 'Status', render: (value) => <Badge status={value} /> },
              { key: 'timestamp', header: 'Time' },
            ]}
            rows={recentLogRows}
            pageSize={10}
          />
        </div>
      </section>
    </div>
  );
}
