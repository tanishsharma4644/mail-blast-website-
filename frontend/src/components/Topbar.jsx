import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Topbar({ pathname }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const breadcrumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    if (!parts.length) return ['dashboard'];
    return parts;
  }, [pathname]);

  const onLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="flex h-[72px] items-center justify-between border-b border-app-border bg-app-sidebar px-4 md:px-6">
      <div className="flex items-center gap-2 text-sm text-app-muted">
        {breadcrumbs.map((crumb, index) => (
          <div key={`${crumb}-${index}`} className="flex items-center gap-2 capitalize">
            {index > 0 && <ChevronRight size={14} />}
            <span className={index === breadcrumbs.length - 1 ? 'text-app-text' : ''}>{crumb}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right md:block">
          <p className="text-sm font-semibold text-app-text">{user?.name || 'User'}</p>
          <p className="text-xs text-app-muted">{user?.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-app-border bg-app-card px-3 py-2 text-xs text-app-muted hover:text-app-text"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </header>
  );
}
