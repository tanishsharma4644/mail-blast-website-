import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import Modal from '../components/Modal';
import { smtpApi } from '../api/smtp';
import { maskSecret } from '../utils/helpers';

export default function SMTP() {
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingLimit, setEditingLimit] = useState('');

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { label: '', email: '', appPassword: '', dailyLimit: 1000 },
  });

  const fetchAccounts = async () => {
    const { data } = await smtpApi.list();
    setAccounts(data.items || []);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const onSubmit = async (values) => {
    try {
      await smtpApi.create(values);
      toast.success('SMTP account added');
      reset();
      setOpen(false);
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add account');
    }
  };

  const onToggle = async (id) => {
    await smtpApi.toggle(id);
    fetchAccounts();
  };

  const onDelete = async (id) => {
    await smtpApi.delete(id);
    toast.success('SMTP account deleted');
    fetchAccounts();
  };

  const onUpdateLimit = async (id) => {
    try {
      const limit = parseInt(editingLimit, 10);
      if (limit < 1 || limit > 100000) {
        toast.error('Limit must be between 1 and 100000');
        return;
      }
      await smtpApi.updateLimit(id, limit);
      toast.success('Daily limit updated');
      setEditingId(null);
      setEditingLimit('');
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update limit');
    }
  };

  const onResetCounter = async (id) => {
    try {
      await smtpApi.resetCounter(id);
      toast.success('Email counter reset');
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not reset counter');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">SMTP Accounts</h1>
        <button onClick={() => setOpen(true)} className="rounded-lg bg-app-accent px-4 py-2 text-sm text-white">Add Account</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <article key={account.id || account._id} className="rounded-2xl border border-app-border bg-app-card p-4">
            <h3 className="font-semibold">{account.label}</h3>
            <p className="text-sm text-app-muted">{account.email}</p>
            <p className="mt-2 text-xs text-app-muted">Password: {maskSecret(account.appPassword)}</p>
            
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-app-border bg-app-bg p-3">
                <div className="text-xs text-app-muted mb-2">Daily Email Limit</div>
                {editingId === (account.id || account._id) ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editingLimit}
                      onChange={(e) => setEditingLimit(e.target.value)}
                      min="1"
                      max="100000"
                      className="flex-1 rounded border border-app-border bg-app-bg px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => onUpdateLimit(account.id || account._id)}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingLimit('');
                      }}
                      className="rounded bg-app-muted/30 px-2 py-1 text-xs hover:bg-app-muted/50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{account.sentToday || 0} / {account.dailyLimit || 1000}</p>
                      <p className="text-xs text-green-500 font-medium">{account.remainingToday || 0} remaining</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingId(account.id || account._id);
                        setEditingLimit(account.dailyLimit || 1000);
                      }}
                      className="rounded bg-app-muted/30 px-2 py-1 text-xs hover:bg-app-muted/50"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-app-muted">
                  <input type="checkbox" checked={account.isActive} onChange={() => onToggle(account.id || account._id)} />
                  Active
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onResetCounter(account.id || account._id)}
                    className="rounded-md border border-orange-500/40 px-2 py-1 text-xs text-orange-400 hover:bg-orange-500/10"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => onDelete(account.id || account._id)}
                    className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add SMTP Account" width="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-app-muted">Label</label>
            <input {...register('label', { required: true })} className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-app-muted">Gmail</label>
            <input {...register('email', { required: true })} type="email" className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-app-muted">App Password</label>
            <input {...register('appPassword', { required: true })} type="password" className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-app-muted">Daily Email Limit</label>
            <input {...register('dailyLimit', { required: true })} type="number" min="1" max="100000" className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2" />
          </div>
          <button type="submit" className="w-full rounded-lg bg-app-accent py-2 text-white">Save Account</button>
        </form>
      </Modal>
    </div>
  );
}
