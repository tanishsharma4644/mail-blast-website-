import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Spinner from '../components/Spinner';
import { useCampaign } from '../hooks/useCampaign';
import { campaignsApi } from '../api/campaigns';
import { logsApi } from '../api/logs';
import { formatDate, formatPercent } from '../utils/helpers';

export default function CampaignDetail() {
  const { id } = useParams();
  const { campaign, loading, refresh } = useCampaign(id, { autoRefresh: true, intervalMs: 3000 });
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    const { data } = await logsApi.list({ campaignId: id, page: 1, limit: 200 });
    setLogs(data.items || []);
  };

  useEffect(() => {
    if (!id) return;
    fetchLogs();
    const interval = setInterval(() => {
      if (campaign?.status === 'running') {
        fetchLogs();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, campaign?.status]);

  const onStop = async () => {
    try {
      await campaignsApi.stop(id);
      toast.success('Stop signal sent');
      await refresh();
      fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to stop campaign');
    }
  };

  if (loading || !campaign) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner label="Loading campaign" />
      </div>
    );
  }

  const total = campaign.totalCount || 0;
  const sent = campaign.sentCount || 0;
  const failed = campaign.failedCount || 0;
  const successRate = total ? (sent / total) * 100 : 0;
  const progress = total ? ((sent + failed) / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-app-border bg-app-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{campaign.name}</h1>
            <p className="mt-1 text-xs text-app-muted">Started: {formatDate(campaign.startedAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={campaign.status} />
            {campaign.status === 'running' && (
              <button onClick={onStop} className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-400">
                Stop Campaign
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-app-bg">
          <div className="h-full rounded-full bg-app-accent" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-app-border bg-app-card p-3">
          <p className="text-xs text-app-muted">Total Leads</p>
          <p className="mt-1 text-lg font-bold">{total}</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-card p-3">
          <p className="text-xs text-app-muted">Sent</p>
          <p className="mt-1 text-lg font-bold text-emerald-300">{sent}</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-card p-3">
          <p className="text-xs text-app-muted">Failed</p>
          <p className="mt-1 text-lg font-bold text-red-300">{failed}</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-card p-3">
          <p className="text-xs text-app-muted">Success %</p>
          <p className="mt-1 text-lg font-bold">{formatPercent(successRate)}</p>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'leadEmail', header: 'Lead Email' },
          { key: 'smtpUsed', header: 'SMTP Used' },
          { key: 'templateUsed', header: 'Template' },
          { key: 'status', header: 'Status', render: (value) => <Badge status={value} /> },
          { key: 'errorMessage', header: 'Error' },
          { key: 'timestamp', header: 'Timestamp', render: (value) => formatDate(value) },
        ]}
        rows={logs}
        pageSize={12}
      />
    </div>
  );
}
