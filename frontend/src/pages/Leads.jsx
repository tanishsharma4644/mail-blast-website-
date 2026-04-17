import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { leadsApi } from '../api/leads';
import { formatDate } from '../utils/helpers';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [emailsText, setEmailsText] = useState('');
  const [bulkStats, setBulkStats] = useState(null);

  const fetchLeads = async () => {
    const { data } = await leadsApi.list({ page: 1, limit: 100 });
    setLeads(data.items || []);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const onBulkImport = async () => {
    if (!csvFile) return;
    try {
      await leadsApi.bulk(csvFile);
      toast.success('CSV import complete');
      setCsvFile(null);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'CSV import failed');
    }
  };

  const onImportEmails = async () => {
    if (!emailsText.trim()) {
      toast.error('Paste emails first');
      return;
    }

    try {
      const { data } = await leadsApi.bulkPaste(emailsText);
      setBulkStats(data);
      toast.success(data.message || 'Emails imported');
      setEmailsText('');
      setOpen(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Email import failed');
    }
  };

  const onDeleteSelected = async () => {
    if (!selectedRows.length) return;
    try {
      await Promise.all(selectedRows.map((id) => leadsApi.delete(id)));
      toast.success('Selected leads deleted');
      setSelectedRows([]);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Leads</h1>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-lg border border-app-border bg-app-card px-3 py-2 text-sm text-app-muted">
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
            />
          </label>
          <button onClick={onBulkImport} className="rounded-lg border border-app-border px-3 py-2 text-sm">
            Upload
          </button>
          <button onClick={onDeleteSelected} className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400">
            Bulk Delete
          </button>
          <button onClick={() => setOpen(true)} className="rounded-lg bg-app-accent px-3 py-2 text-sm font-medium text-white">
            Add Emails
          </button>
        </div>
      </div>

      {bulkStats && (
        <div className="rounded-lg border border-app-border bg-app-card px-4 py-3 text-sm text-app-muted">
          Imported {bulkStats.insertedCount || 0} emails, skipped {bulkStats.skippedCount || 0} duplicate/invalid rows.
        </div>
      )}

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'company', header: 'Company' },
          { key: 'status', header: 'Status', render: (value) => <Badge status={value} /> },
          { key: 'createdAt', header: 'Created', render: (value) => formatDate(value) },
        ]}
        rows={leads}
        selectable
        selectedRows={selectedRows}
        onToggleRow={(id) => {
          setSelectedRows((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
        }}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Emails" width="max-w-3xl">
        <div className="space-y-3">
          <p className="text-sm text-app-muted">
            Paste only email addresses, one per line or separated by commas. You can paste 5,000+ emails at once.
          </p>
          <textarea
            rows={14}
            value={emailsText}
            onChange={(event) => setEmailsText(event.target.value)}
            placeholder={"john@example.com\njane@example.com\nsomeone@domain.com"}
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-app-border px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="button" onClick={onImportEmails} className="rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white">
              Import Emails
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
