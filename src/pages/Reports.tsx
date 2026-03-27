import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Ticket, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Filter,
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { UserProfile, Sale, Event } from '../types';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { api } from '../services/api';

const COLORS = ['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4'];

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await api.getMe();
        setUserProfile(profile);

        if (profile.firmId) {
          const [salesData, eventsData] = await Promise.all([
            api.getSales(),
            api.getEvents()
          ]);
          setSales(salesData);
          setEvents(eventsData);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Process data for charts
  const confirmedSales = sales.filter(s => s.status !== 'proposal');
  const proposalSales = sales.filter(s => s.status === 'proposal');

  const revenueByDay = confirmedSales.reduce((acc: any, sale) => {
    const day = format(new Date(sale.soldAt), 'd MMM');
    acc[day] = (acc[day] || 0) + sale.totalAmount;
    return acc;
  }, {});

  const chartData = Object.entries(revenueByDay).map(([name, revenue]) => ({ name, revenue }));

  const revenueByEvent = confirmedSales.reduce((acc: any, sale) => {
    const event = events.find(e => e.id === sale.eventId)?.title || 'Bilinmiyor';
    acc[event] = (acc[event] || 0) + sale.totalAmount;
    return acc;
  }, {});

  const pieData = Object.entries(revenueByEvent).map(([name, value]) => ({ name, value }));

  const totalRevenue = confirmedSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCommission = confirmedSales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
  const totalDiscount = confirmedSales.reduce((sum, sale) => sum + (sale.discount || 0), 0);
  const totalProposalValue = proposalSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-32 bg-neutral-200 rounded-2xl"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-96 bg-neutral-200 rounded-2xl"></div>
        <div className="h-96 bg-neutral-200 rounded-2xl"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Analiz ve Raporlar</h1>
          <p className="text-neutral-500 mt-1">Etkinlik performansınızın ve gelirinizin ayrıntılı dökümü.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-neutral-100 px-6 py-3 rounded-xl font-semibold text-neutral-600 hover:text-neutral-900 transition-all shadow-sm">
            <Filter className="w-5 h-5" />
            Tarih Filtrele
          </button>
          <button className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800 transition-all shadow-lg active:scale-95">
            <Download className="w-5 h-5" />
            PDF Dışa Aktar
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-neutral-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-24 h-24" />
          </div>
          <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs mb-2">Net Gelir</p>
          <h3 className="text-4xl font-bold tracking-tighter">₺{totalRevenue.toLocaleString()}</h3>
          <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <ArrowUpRight className="w-4 h-4" />
            Geçen aydan +24.5%
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
          <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs mb-2">Bekleyen Teklifler</p>
          <h3 className="text-4xl font-bold tracking-tighter text-neutral-900">₺{totalProposalValue.toLocaleString()}</h3>
          <div className="mt-6 flex items-center gap-2 text-amber-600 text-sm font-bold">
            <Clock className="w-4 h-4" />
            {proposalSales.length} bekleyen teklif
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
          <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs mb-2">Toplam Komisyon</p>
          <h3 className="text-4xl font-bold tracking-tighter text-neutral-900">₺{totalCommission.toLocaleString()}</h3>
          <div className="mt-6 flex items-center gap-2 text-neutral-400 text-sm font-medium">
            <Activity className="w-4 h-4" />
            {confirmedSales.length} işleme dayanmaktadır
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
          <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs mb-2">Toplam İndirimler</p>
          <h3 className="text-4xl font-bold tracking-tighter text-neutral-900">₺{totalDiscount.toLocaleString()}</h3>
          <div className="mt-6 flex items-center gap-2 text-rose-500 text-sm font-bold">
            <ArrowDownRight className="w-4 h-4" />
            Geçen aydan -4.2%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Günlük Gelir
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#737373', fontSize: 12}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#737373', fontSize: 12}}
                />
                <Tooltip 
                  cursor={{fill: '#f5f5f5'}}
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="revenue" fill="#171717" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Breakdown */}
        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" /> Etkinliğe Göre Gelir
            </h2>
          </div>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                    <span className="text-sm font-medium text-neutral-600 truncate max-w-[120px]">{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">₺{entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accounting Table */}
      <div className="bg-white border border-neutral-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-50">
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">İşlem Defteri</h2>
          <p className="text-neutral-500 text-sm mt-1">Tüm finansal faaliyetlerin tam geçmişi.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50/50 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-8 py-4">İşlem No</th>
                <th className="px-8 py-4">Müşteri</th>
                <th className="px-8 py-4">Brüt</th>
                <th className="px-8 py-4">İndirim</th>
                <th className="px-8 py-4">Komisyon</th>
                <th className="px-8 py-4">Net Tutar</th>
                <th className="px-8 py-4">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-8 py-4 font-mono text-xs text-neutral-400">#{sale.id.substring(0, 8)}</td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-bold text-neutral-900">{sale.customerName}</p>
                    <p className="text-xs text-neutral-400">{format(new Date(sale.soldAt), 'd MMM yyyy')}</p>
                  </td>
                  <td className="px-8 py-4 text-sm font-medium text-neutral-700">₺{sale.totalAmount + (sale.discount || 0)}</td>
                  <td className="px-8 py-4 text-sm font-bold text-rose-500">-₺{sale.discount || 0}</td>
                  <td className="px-8 py-4 text-sm font-bold text-amber-600">-₺{sale.commission || 0}</td>
                  <td className="px-8 py-4 text-sm font-bold text-neutral-900">₺{sale.totalAmount - (sale.commission || 0)}</td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                      sale.status === 'proposal' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {sale.status === 'proposal' ? 'Teklif' : 'Tamamlandı'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
