import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const steps = ['Name', 'Leads', 'Templates', 'SMTP', 'Review'];

export default function CampaignBuilder({ leads, templates, smtpAccounts, onSubmit }) {
  const [step, setStep] = useState(0);
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      name: '',
      leadIds: [],
      templateIds: [],
      smtpIds: [],
      delayMs: 2000,
    },
  });

  const values = watch();
  const hasSmtpAccounts = smtpAccounts.length > 0;
  const hasSelectedSmtp = values.smtpIds.length > 0;

  const toggleItem = (field, id) => {
    const current = new Set(values[field]);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    setValue(field, [...current]);
  };

  const onLaunch = handleSubmit((formValues) => {
    if (!formValues.smtpIds.length) {
      toast.error('Please select at least one SMTP account');
      return;
    }

    onSubmit(formValues);
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-lg border border-app-border bg-app-bg p-3 text-sm text-app-muted">
        Select multiple templates and multiple SMTP accounts. The mail sender will shuffle them automatically during campaign delivery.
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <div
            key={label}
            className={`rounded-full px-3 py-1 text-xs ${
              index === step ? 'bg-app-accent text-white' : 'border border-app-border text-app-muted'
            }`}
          >
            {index + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <label className="mb-1 block text-sm text-app-muted">Campaign Name</label>
          <input
            {...register('name', { required: true })}
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2"
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue('leadIds', leads.map(lead => lead._id))}
              className="rounded-lg bg-app-accent px-3 py-2 text-xs font-medium text-white hover:bg-app-accent/90"
            >
              Select All ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setValue('leadIds', [])}
              className="rounded-lg border border-app-border px-3 py-2 text-xs hover:bg-app-border/20"
            >
              Clear All
            </button>
          </div>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {leads.map((lead) => (
              <label key={lead._id} className="flex items-center gap-2 rounded-lg border border-app-border p-2">
                <input type="checkbox" checked={values.leadIds.includes(lead._id)} onChange={() => toggleItem('leadIds', lead._id)} />
                <span>{lead.name} ({lead.email})</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-app-muted">Selected leads: {values.leadIds.length}</p>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-2">
          {templates.map((template) => (
            <label key={template._id} className="flex items-center gap-2 rounded-lg border border-app-border p-2">
              <input type="checkbox" checked={values.templateIds.includes(template._id)} onChange={() => toggleItem('templateIds', template._id)} />
              <span>{template.name}</span>
            </label>
          ))}
          <p className="text-xs text-app-muted">Selected templates: {values.templateIds.length}</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          {!hasSmtpAccounts && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              No SMTP accounts found. Add at least one SMTP account on the SMTP page before launching a campaign.
            </div>
          )}
          <div className="grid gap-2">
            {smtpAccounts.map((smtp) => (
              <label key={smtp.id || smtp._id} className="flex items-center gap-2 rounded-lg border border-app-border p-2">
                <input
                  type="checkbox"
                  checked={values.smtpIds.includes(smtp.id || smtp._id)}
                  onChange={() => toggleItem('smtpIds', smtp.id || smtp._id)}
                />
                <span>{smtp.label} ({smtp.email})</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-app-muted">Selected SMTP accounts: {values.smtpIds.length}</p>
          <div>
            <label className="mb-1 block text-sm text-app-muted">Delay (ms)</label>
            <input
              type="number"
              {...register('delayMs', { min: 200 })}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2"
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-lg border border-app-border bg-app-bg p-3 text-sm text-app-muted">
          <p>Name: {values.name || '-'}</p>
          <p>Leads: {values.leadIds.length}</p>
          <p>Templates: {values.templateIds.length}</p>
          <p>SMTP Accounts: {values.smtpIds.length}</p>
          <p>Delay: {values.delayMs} ms</p>
          {!hasSelectedSmtp && (
            <p className="mt-2 text-sm text-red-400">
              Select at least one SMTP account to launch the campaign.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((prev) => Math.max(0, prev - 1))}
          className="rounded-lg border border-app-border px-3 py-2 text-sm disabled:opacity-40"
        >
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))}
            className="rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={onLaunch}
            disabled={!hasSelectedSmtp}
            className="rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Launch Campaign
          </button>
        )}
      </div>
    </form>
  );
}
