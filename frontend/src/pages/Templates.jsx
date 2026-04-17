import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import Modal from '../components/Modal';
import TemplateEditor from '../components/TemplateEditor';
import { templatesApi } from '../api/templates';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function looksLikeHtml(value = '') {
  return /<\/?[a-z][\s\S]*>/i.test(String(value));
}

function renderTemplatePreview(value = '') {
  const raw = String(value ?? '');
  if (!raw.trim()) return 'Template body preview';

  if (looksLikeHtml(raw)) {
    return raw;
  }

  const escaped = escapeHtml(raw)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/([*∗＊]{2})([\s\S]+?)\1/g, '<strong>$2</strong>')
    .replace(/(^|[\s(])[*∗＊]([^\n*∗＊][^\n]*?)\s*[*∗＊](?=$|[\s).,:;!?])/gm, '$1<strong>$2</strong>')
    .replace(/\n/g, '<br/>');

  return escaped.replace(
    /(https?:\/\/[^\s<]+)/gi,
    '<a href="$1" target="_blank" rel="noreferrer" style="color:#60a5fa;">$1</a>',
  );
}

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [htmlBody, setHtmlBody] = useState('');

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { name: '', subject: '' },
  });

  const subject = watch('subject');

  const fetchTemplates = async () => {
    const { data } = await templatesApi.list();
    setTemplates(data.items || []);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', subject: '' });
    setHtmlBody('');
    setOpen(true);
  };

  const openEdit = (template) => {
    setEditing(template);
    setValue('name', template.name);
    setValue('subject', template.subject);
    setHtmlBody(template.htmlBody);
    setOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = { ...values, htmlBody };
      if (editing) {
        await templatesApi.update(editing._id, payload);
        toast.success('Template updated');
      } else {
        await templatesApi.create(payload);
        toast.success('Template created');
      }
      setOpen(false);
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Template action failed');
    }
  };

  const onDelete = async (id) => {
    try {
      await templatesApi.delete(id);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const bodyFormatExample = `<p>Hello {{name}},</p>
<p>Welcome to {{company}}.</p>
<p>Thanks,<br/>Team</p>`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-semibold">Templates</h1>
        <button onClick={openCreate} className="rounded-lg bg-app-accent px-6 py-2 text-sm text-white whitespace-nowrap">Create Template</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <article key={template._id} className="rounded-2xl border border-app-border bg-app-card p-4">
            <h3 className="font-semibold">{template.name}</h3>
            <p className="mt-1 text-xs text-app-muted">{template.subject}</p>
            <p className="mt-3 text-xs text-app-muted">
              Variables: {template.variables?.join(', ') || 'none'}
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => openEdit(template)} className="rounded-md border border-app-border px-3 py-1 text-xs">Edit</button>
              <button onClick={() => onDelete(template._id)} className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-400">Delete</button>
            </div>
          </article>
        ))}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit Template' : 'Create Template'} width="max-w-6xl">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-3 max-h-[80vh] overflow-y-auto">
          <div className="space-y-3 lg:col-span-2 flex flex-col">
            <div>
              <label className="mb-1 block text-sm text-app-muted">Template name</label>
              <input {...register('name', { required: true })} className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-app-muted">Subject</label>
              <input {...register('subject', { required: true })} className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2" />
            </div>

            <div className="flex-grow">
              <TemplateEditor value={htmlBody} onChange={setHtmlBody} />
            </div>

            <button type="submit" className="w-full rounded-lg bg-app-accent py-3 text-white font-semibold hover:bg-app-accent/90 transition">
              {editing ? 'Update Template' : 'Save Template'}
            </button>
          </div>

          <div className="rounded-xl border border-app-border bg-app-bg p-3">
            <div className="rounded-lg border border-app-border bg-app-card p-3 text-xs text-app-muted">
              <p className="font-semibold text-app-text">Body format</p>
              <p className="mt-1">
                Write email body in HTML or plain-text/markdown style format. You can use variables like
                {' '}
                {'{{name}}'}
                {' '}
                and
                {' '}
                {'{{company}}'}.
              </p>
              <pre className="mt-2 overflow-x-auto rounded-md border border-app-border bg-app-bg p-2 text-[11px] text-app-text" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {bodyFormatExample}
              </pre>
            </div>

            <p className="text-xs uppercase tracking-widest text-app-muted mt-3">Live Preview</p>
            <h3 className="mt-2 text-sm font-semibold">{subject || 'Subject preview'}</h3>
            <div
              className="mt-3 min-h-40 rounded-lg border border-app-border p-3 text-sm bg-app-card overflow-auto"
              style={{ wordWrap: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: renderTemplatePreview(htmlBody) }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
