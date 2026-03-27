import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Ticket, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  QrCode, 
  TrendingUp,
  Building2,
  ShieldCheck,
  Activity,
  ShieldAlert,
  DollarSign
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // Don't set loading to true if we already have a profile and are just navigating
      if (!userProfile) setLoading(true);
      
      try {
        const profile = await api.getMe();
        setUserProfile(profile);
        
        if (profile && location.pathname === '/login') {
          navigate(profile.role === 'superadmin' ? '/superadmin' : '/');
        } else if (!profile && location.pathname !== '/login') {
          navigate('/login');
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUserProfile(null);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]); // Removed navigate from dependencies to avoid unnecessary triggers

  const handleLogout = async () => {
    try {
      await api.createLog({
        action: 'Çıkış yapıldı',
        entityType: 'system',
        entityId: userProfile?.id || '',
        details: `Kullanıcı ${userProfile?.email} sistemden çıkış yaptı.`
      });
    } catch (error) {
      console.error('Error logging logout:', error);
    }
    api.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (!userProfile && location.pathname !== '/login') {
    return null;
  }

  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Süper Admin', path: '/superadmin', icon: ShieldCheck, show: userProfile?.role === 'superadmin' },
    { name: 'Fiyatlandırma', path: '/pricing', icon: DollarSign, show: userProfile?.role === 'superadmin' },
    { name: 'Panel', path: '/', icon: LayoutDashboard, show: userProfile?.role !== 'superadmin' },
    { name: 'Etkinlikler', path: '/events', icon: Calendar, show: userProfile?.role !== 'superadmin' && userProfile?.permissions?.canManageEvents },
    { name: 'Satışlar', path: '/sales', icon: Ticket, show: userProfile?.role !== 'superadmin' && userProfile?.permissions?.canSell },
    { name: 'Personel', path: '/staff', icon: Users, show: userProfile?.role !== 'superadmin' && userProfile?.permissions?.canManageStaff },
    { name: 'Tarayıcı', path: '/scanner', icon: QrCode, show: userProfile?.role !== 'superadmin' && userProfile?.permissions?.canScan },
    { name: 'Raporlar', path: '/reports', icon: TrendingUp, show: userProfile?.role !== 'superadmin' && userProfile?.permissions?.canViewRevenue },
    { name: 'Kayıtlar', path: '/logs', icon: Activity, show: userProfile?.role === 'firmadmin' || userProfile?.role === 'superadmin' },
    { name: 'Ayarlar', path: '/settings', icon: Settings, show: userProfile?.role === 'firmadmin' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-neutral-900" />
          <span className="font-bold text-lg tracking-tight">EtkinlikYöneticisi</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 md:relative md:z-0
        bg-neutral-900 text-neutral-400 w-64 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 flex flex-col
      `}>
        <div className="p-6 flex items-center gap-3 text-white">
          <Building2 className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tighter">EtkinlikYöneticisi</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.filter(item => item.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${location.pathname === item.path 
                  ? 'bg-neutral-800 text-white' 
                  : 'hover:bg-neutral-800 hover:text-neutral-200'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white font-bold text-xs">
              {userProfile?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userProfile?.displayName}</p>
              <p className="text-xs text-neutral-500 truncate capitalize">
                {userProfile?.role === 'superadmin' ? 'Süper Admin' : 
                 userProfile?.role === 'firmadmin' ? 'Firma Yöneticisi' : 'Personel'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {userProfile?.demoMode && (
          <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2">
            <Activity className="w-4 h-4" />
            Sistem şu anda Demo Modunda çalışmaktadır. Bazı özellikler kısıtlı olabilir.
          </div>
        )}
        {userProfile?.licenseStatus === 'expired' && (
          <div className="bg-rose-600 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Lisans süreniz dolmuştur. Lütfen yenileyin.
          </div>
        )}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
