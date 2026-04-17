import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import CampaignBuilder from '../components/CampaignBuilder';

import { campaignsApi } from '../api/campaigns';
import { leadsApi } from '../api/leads';
import { templatesApi } from '../api/templates';
import { smtpApi } from '../api/smtp';
import { formatDate } from '../utils/helpers';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [smtpAccounts, setSmtpAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const fetchAll = async () => {
    const [campaignRes, leadsRes, templateRes, smtpRes] = await Promise.all([
      campaignsApi.list(),
      leadsApi.list({ page: 1, limit: 200 }),
      templatesApi.list(),
      smtpApi.list(),
    ]);

    setCampaigns(campaignRes.data.items || []);
    setLeads(leadsRes.data.items || []);
    setTemplates(templateRes.data.items || []);
    setSmtpAccounts(smtpRes.data.items || []);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onCreate = async (values) => {
    try {
      await campaignsApi.create(values);
      toast.success('Campaign created');
      setOpen(false);
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    }
  };

  const onStart = async (id) => {
    await campaignsApi.start(id);
    toast.success('Campaign started');
    fetchAll();
  };

  const onDelete = async (id) => {
    await campaignsApi.remove(id);
    toast.success('Campaign deleted');
    fetchAll();
  };

  const rows = campaigns.map((campaign) => ({
    ...campaign,
    leadCount: campaign.leadIds?.length || 0,
    createdAtFmt: formatDate(campaign.createdAt),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Campaigns</h1>
        <button onClick={() => setOpen(true)} className="rounded-lg bg-app-accent px-4 py-2 text-sm text-white">
          Create Campaign
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'status', header: 'Status', render: (value) => <Badge status={value} /> },
          { key: 'leadCount', header: 'Leads' },
          { key: 'sentCount', header: 'Sent' },
          { key: 'failedCount', header: 'Failed' },
          { key: 'createdAtFmt', header: 'Created' },
          {
            key: 'actions',
            header: 'Actions',
            render: (_v, row) => (
              <div className="flex gap-2">
                <button onClick={() => navigate(`/campaigns/${row._id}`)} className="rounded border border-app-border px-2 py-1 text-xs">
                  View
                </button>
                {row.status !== 'running' && (
                  <button onClick={() => onStart(row._id)} className="rounded border border-emerald-500/40 px-2 py-1 text-xs text-emerald-300">
                    Start
                  </button>
                )}
                <button onClick={() => onDelete(row._id)} className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-400">
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={rows}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Campaign Builder" width="max-w-4xl">
        <CampaignBuilder
          leads={leads}
          templates={templates}
          smtpAccounts={smtpAccounts}
          onSubmit={onCreate}
        />
      </Modal>
    </div>
  );
}
