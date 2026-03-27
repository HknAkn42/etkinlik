import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  MapPin, 
  Calendar as CalendarIcon, 
  Users, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  Clock,
  ChevronRight,
  LayoutGrid,
  List,
  Building2,
  Info
} from 'lucide-react';
import { UserProfile, Event, Table } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '../services/api';

import { useNavigate } from 'react-router-dom';

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    status: 'draft' as const,
    category: '',
    firmName: '',
    firmLogo: '',
    tables: [] as Table[]
  });

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ id: string, status: Event['status'] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await api.getMe();
        setUserProfile(profile);

        if (profile.firmId) {
          const eventsData = await api.getEvents();
          setEvents(eventsData);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error('Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Event['status']) => {
    try {
      const event = events.find(e => e.id === id);
      if (!event) return;

      await api.updateEvent(id, { ...event, status: newStatus });
      setEvents(events.map(e => e.id === id ? { ...e, status: newStatus } : e));
      toast.success('Durum başarıyla güncellendi');
      setIsStatusModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.firmId || userProfile.firmId === 'system') {
      toast.error('Süper Admin olarak doğrudan etkinlik oluşturamazsınız.');
      return;
    }

    try {
      const result = await api.createEvent(formData);
      setEvents([{ id: result.id, ...formData, firmId: userProfile.firmId } as Event, ...events]);
      setIsModalOpen(false);
      setFormData({ title: '', description: '', date: '', location: '', status: 'draft', category: '', firmName: '', firmLogo: '', tables: [] });
      toast.success('Etkinlik başarıyla oluşturuldu');
      // Redirect to management page immediately
      navigate(`/events/${result.id}/manage`);
    } catch (error) {
      console.error(error);
      toast.error('Etkinlik oluşturulamadı');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;
    try {
      await api.deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
      toast.success('Etkinlik silindi');
    } catch (error) {
      toast.error('Etkinlik silinemedi');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Etkinlikler</h1>
          <p className="text-neutral-500 mt-1">Yaklaşan konserlerinizi ve etkinliklerinizi yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-neutral-100 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Etkinlik Oluştur
          </button>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Etkinlik ara..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none shadow-sm transition-all"
          />
        </div>
        <div className="flex gap-4">
          <select className="bg-white border border-neutral-100 px-4 py-3 rounded-xl font-semibold text-neutral-600 outline-none shadow-sm focus:ring-2 focus:ring-neutral-900">
            <option>Tüm Durumlar</option>
            <option>Yayında</option>
            <option>Taslak</option>
            <option>İptal Edildi</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-96 bg-neutral-200 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
          {events.map((event) => (
            <div key={event.id} className={`bg-white border border-neutral-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden ${viewMode === 'grid' ? 'rounded-2xl' : 'rounded-xl p-4 flex items-center justify-between'}`}>
              {viewMode === 'grid' && (
                <div className="h-48 bg-neutral-100 relative overflow-hidden">
                  {event.firmLogo ? (
                    <img 
                      src={event.firmLogo} 
                      alt={event.firmName} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-50">
                      <Building2 className="w-12 h-12 text-neutral-200" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-neutral-900/10 group-hover:bg-neutral-900/0 transition-colors"></div>
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => {
                        setSelectedEvent({ id: event.id, status: event.status });
                        setIsStatusModalOpen(true);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm transition-transform hover:scale-105 ${
                        event.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 
                        event.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {event.status === 'published' ? 'Yayında' : event.status === 'draft' ? 'Taslak' : 'İptal'}
                    </button>
                  </div>
                </div>
              )}

              <div className={viewMode === 'grid' ? 'p-6' : 'flex-1 flex items-center gap-8'}>
                <div className={viewMode === 'grid' ? 'mb-4' : 'flex-1'}>
                  <h3 className="text-xl font-bold text-neutral-900 group-hover:text-neutral-600 transition-colors">{event.title}</h3>
                  <p className="text-neutral-500 text-sm line-clamp-1 mt-1">{event.description}</p>
                </div>

                <div className={`flex flex-wrap gap-4 ${viewMode === 'grid' ? 'mb-6' : 'flex-1'}`}>
                  <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium">
                    <CalendarIcon className="w-4 h-4" />
                    {format(new Date(event.date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium">
                    <Users className="w-4 h-4" />
                    {event.tables.length} Kategori
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                        {i}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate(`/events/${event.id}/manage`)}
                      className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Masaları Yönet"
                    >
                      <LayoutGrid className="w-5 h-5" />
                      <span>Masalar</span>
                    </button>
                    <button className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="p-2 text-neutral-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Yeni Etkinlik Oluştur</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Etkinlik Başlığı</label>
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örn: Yaz Caz Gecesi" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Etkinlik Kategorisi</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                  >
                    <option value="">Kategori Seçin</option>
                    <option value="Konser">Konser</option>
                    <option value="Tiyatro">Tiyatro</option>
                    <option value="Festival">Festival</option>
                    <option value="Konferans">Konferans</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Tarih ve Saat</label>
                  <input 
                    required
                    type="datetime-local" 
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Konum</label>
                  <input 
                    required
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Örn: Büyük Salon, Şehir Oteli" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Açıklama</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Misafirlerinize etkinlik hakkında bilgi verin..." 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Firma / Mekan Adı</label>
                  <input 
                    type="text" 
                    value={formData.firmName}
                    onChange={e => setFormData({ ...formData, firmName: e.target.value })}
                    placeholder="Örn: Jolly Joker, IF Performance" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Firma Logosu (URL)</label>
                  <input 
                    type="text" 
                    value={formData.firmLogo}
                    onChange={e => setFormData({ ...formData, firmLogo: e.target.value })}
                    placeholder="https://example.com/logo.png" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl flex gap-4">
                <Info className="w-6 h-6 text-blue-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-900 text-sm">Masa Oluşturma Hakkında</h4>
                  <p className="text-xs text-blue-700 leading-relaxed mt-1">
                    Etkinliği oluşturduktan sonra, masaları, kategorileri ve fiyatları belirleyebileceğiniz özel yönetim sayfasına yönlendirileceksiniz.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-neutral-500 font-bold hover:text-neutral-900 transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
                >
                  Etkinlik Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {isStatusModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Durumu Değiştir</h2>
            <p className="text-neutral-500 mb-8">Etkinlik durumunu güncellemek istediğinizden emin misiniz?</p>
            
            <div className="grid grid-cols-1 gap-3 mb-8">
              <button 
                onClick={() => handleStatusChange(selectedEvent.id, 'published')}
                className={`w-full py-3 rounded-xl font-bold transition-all ${selectedEvent.status === 'published' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
              >
                Yayına Al
              </button>
              <button 
                onClick={() => handleStatusChange(selectedEvent.id, 'draft')}
                className={`w-full py-3 rounded-xl font-bold transition-all ${selectedEvent.status === 'draft' ? 'bg-amber-600 text-white shadow-lg' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
              >
                Taslağa Çek
              </button>
              <button 
                onClick={() => handleStatusChange(selectedEvent.id, 'cancelled')}
                className={`w-full py-3 rounded-xl font-bold transition-all ${selectedEvent.status === 'cancelled' ? 'bg-rose-600 text-white shadow-lg' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
              >
                İptal Et
              </button>
            </div>

            <button 
              onClick={() => setIsStatusModalOpen(false)}
              className="w-full py-3 text-neutral-500 font-bold hover:text-neutral-900 transition-colors"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
