import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Save, 
  LayoutGrid, 
  Users, 
  DollarSign,
  Info,
  Building2,
  Calendar,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Event as AppEvent, Table } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EventManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const downloadQR = () => {
    const svg = document.getElementById('event-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${event?.title || 'event'}-qr.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Batch creation state
  const [batchData, setBatchData] = useState({
    category: 'Genel',
    price: 0,
    capacity: 4,
    count: 10,
    isPremium: false
  });

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const data = await api.getEvent(id);
        setEvent(data);
      } catch (error) {
        console.error(error);
        toast.error('Etkinlik bilgileri yüklenemedi');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  const handleAddBatch = () => {
    if (!event) return;

    // Find current max table number
    let maxNum = 0;
    event.tables.forEach(t => {
      const match = t.name.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNum) maxNum = num;
      }
    });

    const newTables: Table[] = [];
    for (let i = 1; i <= batchData.count; i++) {
      const tableNum = maxNum + i;
      newTables.push({
        id: Math.random().toString(36).substring(2, 11),
        name: `Masa ${tableNum}`,
        price: batchData.price,
        capacity: batchData.capacity,
        category: batchData.category,
        isPremium: batchData.isPremium
      });
    }

    setEvent({
      ...event,
      tables: [...event.tables, ...newTables]
    });
    toast.success(`${batchData.count} adet masa eklendi.`);
  };

  const handleRemoveTable = (tableId: string) => {
    if (!event) return;
    setEvent({
      ...event,
      tables: event.tables.filter(t => t.id !== tableId)
    });
  };

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    try {
      await api.updateEvent(event.id, event);
      toast.success('Masalar başarıyla kaydedildi');
    } catch (error) {
      toast.error('Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/events')}
            className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-neutral-100"
          >
            <ChevronLeft className="w-6 h-6 text-neutral-600" />
          </button>
          <div className="flex items-center gap-4">
            {event.firmLogo ? (
              <img 
                src={event.firmLogo} 
                alt={event.firmName} 
                className="w-12 h-12 rounded-xl object-cover border border-neutral-100 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center border border-neutral-100">
                <Building2 className="w-6 h-6 text-neutral-300" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{event.title}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                  event.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 
                  event.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {event.status === 'published' ? 'Yayında' : event.status === 'draft' ? 'Taslak' : 'İptal'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-neutral-500 text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(event.date), 'd MMMM yyyy HH:mm')}
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {event.firmName || 'Belirtilmemiş'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadQR}
            className="flex items-center gap-2 bg-neutral-100 px-6 py-3 rounded-xl font-bold text-neutral-600 hover:bg-neutral-200 transition-all"
          >
            <QrCode className="w-5 h-5" /> QR İndir
          </button>
          <div className="hidden">
            <QRCodeSVG id="event-qr" value={`${window.location.origin}/events/${event.id}`} size={256} />
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Creation Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-neutral-50 rounded-lg">
                <LayoutGrid className="w-5 h-5 text-neutral-900" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">Masa Oluşturma</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Kategori Adı</label>
                <input 
                  type="text" 
                  value={batchData.category}
                  onChange={e => setBatchData({ ...batchData, category: e.target.value })}
                  placeholder="Örn: VIP, Standart, Sahne Önü" 
                  className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Masa Fiyatı</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input 
                      type="number" 
                      value={batchData.price}
                      onChange={e => setBatchData({ ...batchData, price: parseFloat(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Kapasite</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input 
                      type="number" 
                      value={batchData.capacity}
                      onChange={e => setBatchData({ ...batchData, capacity: parseInt(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Oluşturulacak Masa Sayısı</label>
                <input 
                  type="number" 
                  value={batchData.count}
                  onChange={e => setBatchData({ ...batchData, count: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="isPremium"
                  checked={batchData.isPremium}
                  onChange={e => setBatchData({ ...batchData, isPremium: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <label htmlFor="isPremium" className="text-sm font-bold text-neutral-700 uppercase tracking-wide">Premium / VIP Masa</label>
              </div>

              <button 
                onClick={handleAddBatch}
                className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Masaları Ekle
              </button>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed font-medium">
                Masalar otomatik olarak sıralı numaralandırılır. Örneğin mevcut en yüksek masa numarası 10 ise, yeni eklenen masalar 11'den başlar.
              </p>
            </div>
          </div>
        </div>

        {/* Tables List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-neutral-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-8 border-b border-neutral-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Mevcut Masalar ({event.tables.length})</h2>
            </div>
            
            {event.tables.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LayoutGrid className="w-8 h-8 text-neutral-300" />
                </div>
                <p className="text-neutral-500 font-medium">Henüz masa oluşturulmadı.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-50/50 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                      <th className="px-8 py-4">Masa No</th>
                      <th className="px-8 py-4">Kategori</th>
                      <th className="px-8 py-4 text-center">Kapasite</th>
                      <th className="px-8 py-4">Fiyat</th>
                      <th className="px-8 py-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {event.tables.map((table) => (
                      <tr key={table.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-8 py-4">
                          <p className="text-sm font-bold text-neutral-900">{table.name}</p>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                            table.isPremium ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {table.category}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <p className="text-sm text-neutral-600 font-medium">{table.capacity} Kişilik</p>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-sm font-bold text-neutral-900">₺{table.price.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button 
                            onClick={() => handleRemoveTable(table.id)}
                            className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
