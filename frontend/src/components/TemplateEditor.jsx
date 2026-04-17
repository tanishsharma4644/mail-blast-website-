import { useState } from 'react';

const variables = ['{{name}}', '{{company}}'];

export default function TemplateEditor({ value, onChange }) {
  const [preview, setPreview] = useState(false);

  const insertVariable = (variable) => {
    onChange(`${value}${variable}`);
  };

  const renderedPreview = value
    .replace(/{{\s*name\s*}}/gi, 'Alex')
    .replace(/{{\s*company\s*}}/gi, 'Acme Inc');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-app-muted">Variable helper</p>
        <button
          type="button"
          onClick={() => setPreview((prev) => !prev)}
          className="rounded-md border border-app-border px-2 py-1 text-xs text-app-muted"
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      <div className="flex gap-2">
        {variables.map((variable) => (
          <button
            key={variable}
            type="button"
            onClick={() => insertVariable(variable)}
            className="rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs text-app-muted"
          >
            {variable}
          </button>
        ))}
      </div>

      {preview ? (
        <div
          className="min-h-40 rounded-lg border border-app-border bg-app-bg p-3 text-sm"
          dangerouslySetInnerHTML={{ __html: renderedPreview }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={10}
          className="w-full rounded-lg border border-app-border bg-app-bg p-3 text-sm text-app-text"
          placeholder="Write HTML body with variables like {{name}}"
        />
      )}
    </div>
  );
}
