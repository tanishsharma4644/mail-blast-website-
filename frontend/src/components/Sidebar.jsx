import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Mail, Send, History, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/smtp', label: 'SMTP', icon: Mail },
  { to: '/campaigns', label: 'Campaigns', icon: Send },
  { to: '/logs', label: 'Logs', icon: History },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside className={`hidden border-r border-app-border bg-app-sidebar p-3 md:block ${collapsed ? 'w-[80px]' : 'w-[260px]'}`}>
      <div className="mb-8 flex items-center justify-between">
        {!collapsed && <h2 className="text-sm font-semibold tracking-wider text-app-muted">Campaign Manager</h2>}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-md border border-app-border p-2 text-app-muted hover:text-app-text"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? 'bg-app-accent/25 text-app-text'
                  : 'text-app-muted hover:bg-white/5 hover:text-app-text'
              }`}
            >
              <Icon size={16} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
