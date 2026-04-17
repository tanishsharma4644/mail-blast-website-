import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import Modal from '../components/Modal';
import TemplateEditor from '../components/TemplateEditor';
import { templatesApi } from '../api/templates';

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

  const previewHtml = htmlBody
    .replace(/{{\s*name\s*}}/gi, 'Alex')
    .replace(/{{\s*company\s*}}/gi, 'Acme Inc');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Templates</h1>
        <button onClick={openCreate} className="rounded-lg bg-app-accent px-4 py-2 text-sm text-white">Create Template</button>
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

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit Template' : 'Create Template'} width="max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-app-muted">Template name</label>
              <input {...register('name', { required: true })} className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-app-muted">Subject</label>
              <input {...register('subject', { required: true })} className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2" />
            </div>

            <TemplateEditor value={htmlBody} onChange={setHtmlBody} />

            <button type="submit" className="w-full rounded-lg bg-app-accent py-2 text-white">
              {editing ? 'Update Template' : 'Save Template'}
            </button>
          </div>

          <div className="rounded-xl border border-app-border bg-app-bg p-3">
            <p className="text-xs uppercase tracking-widest text-app-muted">Live Preview</p>
            <h3 className="mt-2 text-sm font-semibold">{subject || 'Subject preview'}</h3>
            <div className="mt-3 min-h-40 rounded-lg border border-app-border p-3 text-sm" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
