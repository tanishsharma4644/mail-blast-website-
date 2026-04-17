export default function TemplateEditor({ value, onChange }) {
  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={25}
        className="w-full rounded-lg border border-app-border bg-app-bg p-3 text-sm text-app-text font-mono resize-vertical"
        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', minHeight: '500px' }}
        placeholder="Write HTML body"
      />
    </div>
  );
}
