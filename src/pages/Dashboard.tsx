import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Ticket, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { UserProfile, Event, Sale } from '../types';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const data = [
  { name: 'Pzt', sales: 4000, revenue: 2400 },
  { name: 'Sal', sales: 3000, revenue: 1398 },
  { name: 'Çar', sales: 2000, revenue: 9800 },
  { name: 'Per', sales: 2780, revenue: 3908 },
  { name: 'Cum', sales: 1890, revenue: 4800 },
  { name: 'Cmt', sales: 2390, revenue: 3800 },
  { name: 'Paz', sales: 3490, revenue: 4300 },
];

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTickets: 0,
    activeEvents: 0,
    totalUsers: 0
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Lisans durumu hesapla
  const getLicenseStatus = () => {
    if (!userProfile?.licenseExpiry) return { status: 'active', daysLeft: null, text: 'Süresiz' };
    
    const now = new Date();
    const expiry = new Date(userProfile.licenseExpiry);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { status: 'expired', daysLeft: 0, text: 'Süresi Dolmuş' };
    } else if (daysLeft <= 7) {
      return { status: 'warning', daysLeft, text: `${daysLeft} Gün Kaldı` };
    } else {
      return { status: 'active', daysLeft, text: `${daysLeft} Gün Kaldı` };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await api.getMe();
        setUserProfile(profile);

        if (profile.role === 'superadmin') {
          navigate('/superadmin');
          return;
        }

        const statsData = await api.getStats();
        setStats({
          totalRevenue: statsData.totalRevenue,
          totalTickets: statsData.totalTickets,
          activeEvents: statsData.activeEvents,
          totalUsers: statsData.totalUsers
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-neutral-200 rounded-2xl"></div>)}
      </div>
      <div className="h-96 bg-neutral-200 rounded-2xl"></div>
    </div>;
  }

  const statCards = [
    { title: 'Toplam Gelir', value: `₺${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, trend: stats.totalRevenue > 0 ? '+12.5%' : '0%', isUp: stats.totalRevenue > 0 },
    { title: 'Toplam Satış', value: (stats.totalTickets || 0).toLocaleString(), icon: Ticket, trend: stats.totalTickets > 0 ? '+5.2%' : '0%', isUp: stats.totalTickets > 0 },
    { title: 'Aktif Etkinlikler', value: (stats.activeEvents || 0).toString(), icon: Calendar, trend: stats.activeEvents > 0 ? '-2.1%' : '0%', isUp: stats.activeEvents > 0 },
    { title: 'Müşteriler', value: (stats.totalUsers || 0).toLocaleString(), icon: Users, trend: stats.totalUsers > 0 ? '+18.3%' : '0%', isUp: stats.totalUsers > 0 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Tekrar hoş geldin, {userProfile?.displayName}</h1>
          <p className="text-neutral-500 mt-1">Bugün etkinliklerinizde neler olup bittiğine bir göz atın.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/events" className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800 transition-all shadow-lg active:scale-95">
            <Plus className="w-5 h-5" />
            Yeni Etkinlik
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-neutral-50 rounded-xl group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${stat.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">{stat.title}</p>
            <p className="text-3xl font-bold text-neutral-900 mt-1 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lisans Durumu */}
        <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight mb-6">Lisans Durumu</h2>
          {userProfile && (
            <div className={`p-6 rounded-2xl border-2 ${
              getLicenseStatus().status === 'expired' ? 'bg-rose-50 border-rose-200' :
              getLicenseStatus().status === 'warning' ? 'bg-amber-50 border-amber-200' :
              'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-neutral-700">Abonelik Durumu</span>
                <span className={`text-lg font-bold ${
                  getLicenseStatus().status === 'expired' ? 'text-rose-700' :
                  getLicenseStatus().status === 'warning' ? 'text-amber-700' :
                  'text-emerald-700'
                }`}>
                  {userProfile.demoMode ? 'Demo Modu' : 
                   userProfile.licenseStatus === 'trial' ? 'Deneme Süresi' :
                   userProfile.licenseStatus === 'active' ? 'Aktif Abonelik' : 'Süresi Dolmuş'}
                </span>
              </div>
              <div className="text-sm text-neutral-600 mb-2">
                {getLicenseStatus().text}
              </div>
              {userProfile.demoMode && (
                <div className="text-xs text-amber-600 bg-amber-100 p-3 rounded-lg">
                  Demo modunda olduğunuz için bazı özellikler kısıtlıdır.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Gelir Genel Bakış</h2>
            <select className="bg-neutral-50 border-none text-sm font-semibold rounded-lg px-4 py-2 focus:ring-2 focus:ring-neutral-900">
              <option>Son 7 Gün</option>
              <option>Son 30 Gün</option>
              <option>Son 12 Ay</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#737373', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#737373', fontSize: 12}}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#171717" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Son Satışlar</h2>
            <Link to="/sales" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1">
              Tümünü Gör <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-6">
            {recentSales.length > 0 ? recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-900 font-bold group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                    {sale.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900">{sale.customerName}</p>
                    <p className="text-xs text-neutral-500">{format(new Date(sale.soldAt), 'd MMM, HH:mm')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">₺{sale.totalAmount}</p>
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Ödendi</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                <p className="text-neutral-400 font-medium">Henüz satış yok</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
