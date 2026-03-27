import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Ticket, 
  User, 
  Phone, 
  DollarSign, 
  Percent, 
  Share2, 
  Download, 
  XCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
  ArrowRight,
  Send,
  MoreVertical,
  Info
} from 'lucide-react';
import { UserProfile, Event, Sale, Ticket as TicketType, Table } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [commission, setCommission] = useState(0);

  useEffect(() => {
    if (quantity >= 10 && selectedTable) {
      const suggestedDiscount = Math.floor(selectedTable.price * quantity * 0.1);
      setDiscount(suggestedDiscount);
      toast.info(`Toplu satış indirimi uygulandı (10%): ₺${suggestedDiscount}`);
    } else if (quantity >= 5 && selectedTable) {
      const suggestedDiscount = Math.floor(selectedTable.price * quantity * 0.05);
      setDiscount(suggestedDiscount);
      toast.info(`Toplu satış indirimi uygulandı (5%): ₺${suggestedDiscount}`);
    } else {
      setDiscount(0);
    }
  }, [quantity, selectedTable]);

  // For Ticket View
  const [viewingTicket, setViewingTicket] = useState<TicketType | null>(null);
  const [selectedSaleTickets, setSelectedSaleTickets] = useState<TicketType[]>([]);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    try {
      await api.updateSale(editingSale.id, editingSale);
      setSales(sales.map(s => s.id === editingSale.id ? editingSale : s));
      setIsEditModalOpen(false);
      toast.success('Satış güncellendi');
    } catch (error) {
      console.error(error);
      toast.error('Güncelleme başarısız');
    }
  };

  const handleViewTickets = async (sale: Sale) => {
    setViewingSale(sale);
    try {
      const tickets = await api.getTickets(sale.id);
      setSelectedSaleTickets(tickets);
      if (tickets.length === 1) {
        setViewingTicket(tickets[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Biletler yüklenemedi');
    }
  };

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
          setEvents(eventsData.filter((e: Event) => e.status === 'published'));
        }
      } catch (error) {
        console.error("Error fetching sales:", error);
        toast.error('Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSale = async (e: React.FormEvent, status: 'confirmed' | 'proposal' = 'confirmed') => {
    e.preventDefault();
    if (!selectedEvent || !selectedTable || !userProfile?.firmId) return;

    const totalAmount = (selectedTable.price * quantity) - discount;
    const saleData = {
      eventId: selectedEvent.id,
      items: [{
        tableId: selectedTable.id,
        tableName: selectedTable.name,
        price: selectedTable.price,
        quantity,
        isPremium: selectedTable.isPremium
      }],
      totalAmount,
      discount,
      commission,
      customerName,
      customerPhone,
      status
    };

    try {
      const result = await api.createSale(saleData);
      
      setSales([{ id: result.id, ...saleData, firmId: userProfile.firmId, soldBy: userProfile.id, soldAt: new Date().toISOString() } as Sale, ...sales]);
      setIsModalOpen(false);
      resetForm();
      toast.success(status === 'confirmed' ? 'Satış başarıyla tamamlandı' : 'Teklif başarıyla kaydedildi');
    } catch (error) {
      console.error(error);
      toast.error(status === 'confirmed' ? 'Satış tamamlanamadı' : 'Teklif kaydedilemedi');
    }
  };

  const resetForm = () => {
    setSelectedEvent(null);
    setSelectedTable(null);
    setQuantity(1);
    setCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setCommission(0);
  };

  const shareOnWhatsApp = (ticket: TicketType) => {
    const message = `*Etkinlik Bileti*%0A%0AMerhaba ${ticket.customerName}, işte etkinlik biletiniz!%0A%0A*Etkinlik:* ${selectedEvent?.title}%0A*Kategori:* ${ticket.tableName}%0A*Kod:* ${ticket.code}%0A*Konum:* ${selectedEvent?.location}%0A*Tarih:* ${format(new Date(selectedEvent?.date || ''), 'd MMMM yyyy HH:mm')}%0A%0AGirişte bu QR kodu gösterin.%0A%0Aİyi eğlenceler!`;
    window.open(`https://wa.me/${ticket.customerPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const exportToCSV = () => {
    const headers = ['Müşteri', 'Telefon', 'Etkinlik', 'Masa', 'Tutar', 'İndirim', 'Borç', 'Alacak', 'Not', 'Tarih'];
    const rows = sales.map(s => [
      s.customerName,
      s.customerPhone,
      events.find(e => e.id === s.eventId)?.title || 'Bilinmiyor',
      s.items[0]?.tableName || '-',
      s.totalAmount,
      s.discount,
      s.debt || 0,
      s.credit || 0,
      s.note || '',
      format(new Date(s.soldAt), 'dd.MM.yyyy HH:mm')
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "satislar.csv");
    link.click();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Bilet Satışları</h1>
          <p className="text-neutral-500 mt-1">Yeni satışları işleyin ve mevcut biletleri yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white border border-neutral-100 px-6 py-3 rounded-xl font-semibold text-neutral-600 hover:text-neutral-900 transition-all shadow-sm"
          >
            <Download className="w-5 h-5" /> Dışa Aktar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Yeni Satış
          </button>
        </div>
      </header>

      {/* Sales List */}
      <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Müşteri veya kod ile ara..." 
              className="w-full pl-12 pr-4 py-2 bg-neutral-50 border-none rounded-lg outline-none text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">
              <Filter className="w-4 h-4" /> Filtrele
            </button>
            <div className="h-4 w-[1px] bg-neutral-200"></div>
            <button className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">
              <Download className="w-4 h-4" /> Dışa Aktar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50/50 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">Etkinlik</th>
                <th className="px-6 py-4">Tutar</th>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Satıcı</th>
                <th className="px-6 py-4">Borç/Alacak</th>
                <th className="px-6 py-4">Not</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 font-bold text-xs">
                        {sale.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{sale.customerName}</p>
                        <p className="text-xs text-neutral-400">{sale.customerPhone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-700">
                        {events.find(e => e.id === sale.eventId)?.title || 'Bilinmeyen Etkinlik'}
                      </p>
                      {sale.status === 'proposal' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">
                          Teklif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-neutral-400">{sale.items[0]?.tableName}</p>
                      {sale.items[0]?.isPremium && (
                        <span className="px-1.5 py-0.5 bg-neutral-900 text-white rounded text-[8px] font-bold uppercase tracking-widest">
                          Premium
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-neutral-900">₺{sale.totalAmount}</p>
                    {sale.discount > 0 && <p className="text-[10px] text-rose-500 font-bold">-₺{sale.discount} İndirim</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-600">{format(new Date(sale.soldAt), 'd MMM yyyy')}</p>
                    <p className="text-xs text-neutral-400">{format(new Date(sale.soldAt), 'HH:mm')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold uppercase tracking-wider">
                      Personel: {sale.soldBy?.substring(0, 5) || 'Sistem'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-neutral-900">
                      {sale.debt ? <span className="text-rose-500">Borç: ₺{sale.debt}</span> : null}
                      {sale.credit ? <span className="text-emerald-500">Alacak: ₺{sale.credit}</span> : null}
                      {!sale.debt && !sale.credit ? '-' : null}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-neutral-600 truncate max-w-[100px]">{sale.note || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingSale(sale);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleViewTickets(sale)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && !loading && (
            <div className="text-center py-20">
              <Ticket className="w-16 h-16 text-neutral-100 mx-auto mb-4" />
              <p className="text-neutral-400 font-medium">Henüz satış kaydedilmedi.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Sale Modal */}
      {isEditModalOpen && editingSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">Satış Düzenle</h2>
            <form onSubmit={handleUpdateSale} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Borç (₺)</label>
                <input type="number" value={editingSale.debt || 0} onChange={e => setEditingSale({...editingSale, debt: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Alacak (₺)</label>
                <input type="number" value={editingSale.credit || 0} onChange={e => setEditingSale({...editingSale, credit: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Not</label>
                <textarea value={editingSale.note || ''} onChange={e => setEditingSale({...editingSale, note: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 text-neutral-500 font-bold">İptal</button>
                <button type="submit" className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {viewingSale && !viewingTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Satış Biletleri</h2>
              <button 
                onClick={() => {
                  setViewingSale(null);
                  setSelectedSaleTickets([]);
                }} 
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-neutral-400" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {selectedSaleTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setViewingTicket(ticket)}
                  className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-2xl transition-all group"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-neutral-900">{ticket.tableName}</p>
                    <p className="text-xs text-neutral-400 font-mono">{ticket.code}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-900 transition-colors" />
                </button>
              ))}
              {selectedSaleTickets.length === 0 && (
                <div className="text-center py-10">
                  <div className="animate-spin w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-neutral-400 font-medium">Biletler yükleniyor...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ticket View Modal */}
      {viewingTicket && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200 text-center">
            <div className="flex justify-between items-center mb-4">
              {selectedSaleTickets.length > 1 && (
                <button 
                  onClick={() => setViewingTicket(null)}
                  className="flex items-center gap-1 text-sm font-bold text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Geri
                </button>
              )}
              <div className="flex-1"></div>
              <button 
                onClick={() => {
                  setViewingTicket(null);
                  setViewingSale(null);
                  setSelectedSaleTickets([]);
                }} 
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-neutral-400" />
              </button>
            </div>
            
            <div className="mb-8">
              <div className="w-48 h-48 bg-white p-4 rounded-2xl border-2 border-neutral-100 mx-auto mb-6 flex items-center justify-center shadow-inner">
                <QRCodeSVG value={viewingTicket.code} size={160} />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">{viewingTicket.customerName}</h2>
              <p className="text-neutral-500 font-medium">Bilet Kodu: {viewingTicket.code}</p>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-left space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Etkinlik</span>
                <span className="text-sm font-bold text-neutral-900">{events.find(e => e.id === viewingTicket.eventId)?.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Kategori</span>
                <span className="text-sm font-bold text-neutral-900">{viewingTicket.tableName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Fiyat</span>
                <span className="text-sm font-bold text-neutral-900">₺{viewingTicket.price}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => shareOnWhatsApp(viewingTicket)}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" /> WhatsApp ile Gönder
              </button>
              <button 
                onClick={() => window.print()}
                className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" /> PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Yeni Bilet Satışı</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSale} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Etkinlik Seç</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    onChange={(e) => setSelectedEvent(events.find(ev => ev.id === e.target.value) || null)}
                  >
                    <option value="">Bir etkinlik seçin...</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Masa/Kategori Seç</label>
                  <select 
                    required
                    disabled={!selectedEvent}
                    className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700 disabled:opacity-50"
                    onChange={(e) => setSelectedTable(selectedEvent?.tables.find(t => t.id === e.target.value) || null)}
                  >
                    <option value="">Bir kategori seçin...</option>
                    {selectedEvent?.tables.map(table => (
                      <option key={table.id} value={table.id}>{table.name} (₺{table.price})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Müşteri Adı</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      required
                      type="text" 
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Tam Ad" 
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Müşteri Telefonu</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      required
                      type="tel" 
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+90 5XX XXX XX XX" 
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Adet</label>
                  <input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">İndirim (₺)</label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      type="number" 
                      value={discount}
                      onChange={e => setDiscount(parseFloat(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-neutral-900 rounded-2xl text-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-neutral-400 font-bold uppercase text-xs tracking-widest">Sipariş Özeti</span>
                  <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest">SaaS Faturalandırma</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">{selectedTable?.name || 'Ürün'} x {quantity}</span>
                    <span className="font-bold">₺{(selectedTable?.price || 0) * quantity}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">İndirim</span>
                      <span className="font-bold text-rose-400">-₺{discount}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-neutral-800 flex justify-between items-end">
                    <span className="text-lg font-bold">Toplam Tutar</span>
                    <span className="text-3xl font-bold tracking-tighter">₺{((selectedTable?.price || 0) * quantity) - discount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-neutral-500 font-bold hover:text-neutral-900 transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleSale(e as any, 'proposal')}
                  className="px-6 py-3 bg-neutral-100 text-neutral-900 rounded-2xl font-bold hover:bg-neutral-200 transition-all active:scale-95"
                >
                  Teklif Olarak Kaydet
                </button>
                <button 
                  type="submit"
                  className="bg-neutral-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                >
                  Satışı Onayla <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
