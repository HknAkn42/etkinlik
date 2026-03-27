import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Sales from './pages/Sales';
import Staff from './pages/Staff';
import Scanner from './pages/Scanner';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SuperAdmin from './pages/SuperAdmin';
import EventManagement from './pages/EventManagement';
import Logs from './pages/Logs';
import Pricing from './pages/Pricing';

export default function App() {
  React.useEffect(() => {
    console.log('App mounted');
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id/manage" element={<EventManagement />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/superadmin" element={<SuperAdmin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" richColors />
    </Router>
  );
}
