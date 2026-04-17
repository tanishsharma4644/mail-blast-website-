import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Templates from './pages/Templates';
import SMTP from './pages/SMTP';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Logs from './pages/Logs';

function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-app-bg text-app-text">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar pathname={location.pathname} />
        <main className="h-[calc(100vh-72px)] overflow-auto p-4 md:p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/smtp" element={<SMTP />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<AppLayout />} />
      </Route>
    </Routes>
  );
}
