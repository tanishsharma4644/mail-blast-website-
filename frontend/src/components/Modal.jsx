export default function Modal({ isOpen, onClose, title, children, width = 'max-w-2xl' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`w-full ${width} rounded-2xl border border-app-border bg-app-card p-5 shadow-card`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-app-text">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md border border-app-border px-3 py-1 text-sm text-app-muted hover:text-app-text"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
