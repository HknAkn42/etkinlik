import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Edit3, 
  XCircle,
  Users,
  Activity,
  DollarSign,
  Trash2
} from 'lucide-react';
import { UserProfile, Firm } from '../types';
import { toast } from 'sonner';
import { api } from '../services/api';

export default function SuperAdmin() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFirm, setEditingFirm] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    ownerEmail: '',
    password: '',
    status: 'active' as const,
    licenseExpiry: '',
    licenseStatus: 'trial' as const,
    demoMode: false,
    subscriptionPrice: 299,
    subscriptionType: 'monthly' as const,
    discount: 0,
    permissions: {
      canSell: true,
      canScan: true,
      canViewRevenue: true,
      canManageEvents: true,
      canManageStaff: true
    }
  });

  const getPermissionLabel = (key: string) => {
  const labels: { [key: string]: string } = {
    'canSell': 'Satış Yapabilir',
    'canScan': 'Bilet Okuyabilir',
    'canViewRevenue': 'Gelir Görebilir',
    'canManageEvents': 'Etkinlik Yönetebilir',
    'canManageStaff': 'Personel Yönetebilir'
  };
  return labels[key] || key.replace('can', '').replace(/([A-Z])/g, ' $1').trim();
};

  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    status: 'active' as const,
    licenseExpiry: '',
    licenseStatus: 'trial' as const,
    demoMode: false,
    subscriptionPrice: 299,
    subscriptionType: 'monthly' as const,
    totalPaid: 0,
    permissions: {
      canSell: true,
      canScan: true,
      canViewRevenue: true,
      canManageEvents: true,
      canManageStaff: true
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await api.getMe();
        setUserProfile(profile);

        if (profile.role === 'superadmin') {
          const firmsData = await api.getFirms();
          setFirms(firmsData);
        }
      } catch (error) {
        console.error("Error fetching superadmin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password || formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      const newFirm = await api.createFirm({
        name: formData.name,
        ownerEmail: formData.ownerEmail,
        password: formData.password,
        licenseExpiry: formData.licenseExpiry,
        licenseStatus: formData.licenseStatus,
        demoMode: formData.demoMode,
        subscriptionPrice: formData.subscriptionPrice,
        subscriptionType: formData.subscriptionType,
        discount: formData.discount,
        permissions: formData.permissions
      });
      setFirms([newFirm, ...firms]);
      setIsModalOpen(false);
      setFormData({ 
        name: '', 
        ownerEmail: '', 
        password: '', 
        status: 'active',
        licenseExpiry: '',
        licenseStatus: 'trial',
        demoMode: false,
        subscriptionPrice: 299,
        subscriptionType: 'monthly',
        discount: 0,
        permissions: {
          canSell: true,
          canScan: true,
          canViewRevenue: true,
          canManageEvents: true,
          canManageStaff: true
        }
      });
      toast.success('Firma ve yönetici hesabı başarıyla oluşturuldu.');
    } catch (error: any) {
      console.error(error);
      toast.error('Hata: ' + error.message);
    }
  };

  const handleEditClick = async (firm: Firm) => {
    try {
      const fullFirm = await api.getFirm(firm.id);
      setEditingFirm(fullFirm);
      setEditFormData({
        id: fullFirm.id,
        name: fullFirm.name,
        status: fullFirm.status,
        licenseExpiry: fullFirm.licenseExpiry || '',
        licenseStatus: fullFirm.licenseStatus || 'trial',
        demoMode: !!fullFirm.demoMode,
        subscriptionPrice: fullFirm.subscriptionPrice || 299,
        subscriptionType: fullFirm.subscriptionType || 'monthly',
        totalPaid: fullFirm.totalPaid || 0,
        permissions: fullFirm.permissions || {
          canSell: true,
          canScan: true,
          canViewRevenue: true,
          canManageEvents: true,
          canManageStaff: true
        }
      });
      setIsEditModalOpen(true);
    } catch (error) {
      toast.error('Firma bilgileri yüklenemedi');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateFirm(editFormData.id, editFormData);
      setFirms(firms.map(f => f.id === editFormData.id ? { ...f, ...editFormData } : f));
      setIsEditModalOpen(false);
      toast.success('Firma başarıyla güncellendi');
    } catch (error: any) {
      toast.error('Güncelleme hatası: ' + error.message);
    }
  };

  const toggleStatus = async (firm: Firm) => {
    try {
      const newStatus = firm.status === 'active' ? 'suspended' : 'active';
      await api.updateFirm(firm.id, { ...firm, status: newStatus });
      setFirms(firms.map(f => f.id === firm.id ? { ...f, status: newStatus } : f));
      toast.success(`Firma ${newStatus === 'active' ? 'aktifleştirildi' : 'askıya alındı'}`);
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
  };

  const handleDeleteClick = async (firm: Firm) => {
    if (window.confirm(`"${firm.name}" firmasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      try {
        await api.deleteFirm(firm.id);
        setFirms(firms.filter(f => f.id !== firm.id));
        toast.success('Firma başarıyla silindi');
      } catch (error: any) {
        toast.error('Silme hatası: ' + error.message);
      }
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-32 bg-neutral-200 rounded-2xl"></div>
      <div className="h-96 bg-neutral-200 rounded-2xl"></div>
    </div>;
  }

  if (userProfile?.role !== 'superadmin') {
    return <div className="text-center py-20">
      <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-neutral-900">Erişim Engellendi</h2>
      <p className="text-neutral-500">Bu sayfayı görüntüleme izniniz yok.</p>
    </div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Süper Admin Paneli</h1>
          <p className="text-neutral-500 mt-1">Tüm firmaları ve platform genelindeki ayarları yönetin.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Yeni Firma Ekle
        </button>
      </header>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neutral-50 rounded-lg">
              <Building2 className="w-5 h-5 text-neutral-900" />
            </div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Toplam Firma</p>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{firms.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neutral-50 rounded-lg">
              <Users className="w-5 h-5 text-neutral-900" />
            </div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Toplam Kullanıcı</p>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{firms.reduce((acc, firm) => acc + 1, 0) * 2}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neutral-50 rounded-lg">
              <Activity className="w-5 h-5 text-neutral-900" />
            </div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Aktif Etkinlikler</p>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{firms.filter(f => f.licenseStatus === 'active').length * 3}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neutral-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-neutral-900" />
            </div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Aylık Gelir</p>
          </div>
          <p className="text-3xl font-bold text-neutral-900">₺{firms.reduce((total, firm) => {
    if (firm.licenseStatus === 'active') {
      const price = firm.subscriptionPrice || 299;
      return total + price;
    }
    return total;
  }, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Firms List */}
      <div className="bg-white border border-neutral-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Firmaları Yönet</h2>
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Firma ara..." 
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border-none rounded-lg outline-none text-sm font-medium"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50/50 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-8 py-4">Firma Adı</th>
                <th className="px-8 py-4">Sahip</th>
                <th className="px-8 py-4">Lisans / Demo</th>
                <th className="px-8 py-4">Abonelik</th>
                <th className="px-8 py-4">Durum</th>
                <th className="px-8 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {firms.map((firm) => (
                <tr key={firm.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 font-bold">
                        {firm.name.charAt(0)}
                      </div>
                      <p className="text-sm font-bold text-neutral-900">{firm.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-neutral-600 font-medium">
                      {!firm.ownerUid || firm.ownerUid === 'pending' ? 'Beklemede' : `Sahip ID: ${firm.ownerUid.substring(0, 8)}`}
                    </p>
                    <p className="text-xs text-neutral-400">{firm.ownerEmail}</p>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          firm.licenseStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                          firm.licenseStatus === 'trial' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {firm.licenseStatus === 'active' ? 'Aktif' : firm.licenseStatus === 'trial' ? 'Deneme' : 'Süresi Dolmuş'}
                        </span>
                        {firm.demoMode && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-bold uppercase">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">
                        SKT: {firm.licenseExpiry ? new Date(firm.licenseExpiry).toLocaleDateString('tr-TR') : 'Süresiz'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-neutral-900">₺{firm.subscriptionPrice || 299}</p>
                      <p className="text-xs text-neutral-500">{firm.subscriptionType === 'monthly' ? 'Aylık' : 'Yıllık'}</p>
                      <p className="text-xs text-emerald-600">Toplam: ₺{firm.totalPaid || 0}</p>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                      firm.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {firm.status === 'active' ? 'Aktif' : 'Askıya Alındı'}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleStatus(firm)}
                        className={`p-2 rounded-lg transition-colors ${firm.status === 'active' ? 'text-rose-400 hover:bg-rose-50' : 'text-emerald-400 hover:bg-emerald-50'}`}
                        title={firm.status === 'active' ? 'Askıya Al' : 'Aktifleştir'}
                      >
                        {firm.status === 'active' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => handleEditClick(firm)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(firm)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Firmayı Sil"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Firm Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Firmayı Düzenle</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Temel Bilgiler</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Firma Adı</label>
                    <input 
                      required
                      type="text" 
                      value={editFormData.name}
                      onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Durum</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                      value={editFormData.status}
                      onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    >
                      <option value="active">Aktif</option>
                      <option value="suspended">Askıya Alındı</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Lisans ve Mod</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Lisans Durumu</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                      value={editFormData.licenseStatus}
                      onChange={e => setEditFormData({ ...editFormData, licenseStatus: e.target.value as any })}
                    >
                      <option value="trial">Deneme (Trial)</option>
                      <option value="active">Aktif</option>
                      <option value="expired">Süresi Dolmuş</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Lisans Bitiş Tarihi</label>
                    <input 
                      type="date" 
                      value={editFormData.licenseExpiry}
                      onChange={e => setEditFormData({ ...editFormData, licenseExpiry: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="checkbox" 
                      id="editDemoMode"
                      checked={editFormData.demoMode}
                      onChange={e => setEditFormData({ ...editFormData, demoMode: e.target.checked })}
                      className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <label htmlFor="editDemoMode" className="text-sm font-bold text-neutral-700">Demo Modu Aktif</label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Özellik İzinleri</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(editFormData.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`edit-perm-${key}`}
                        checked={value as boolean}
                        onChange={e => setEditFormData({ 
                          ...editFormData, 
                          permissions: { ...editFormData.permissions, [key]: e.target.checked } 
                        })}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <label htmlFor={`edit-perm-${key}`} className="text-xs font-medium text-neutral-600">
                        {getPermissionLabel(key)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-100">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-3 text-neutral-500 font-bold hover:text-neutral-900 transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="bg-neutral-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl active:scale-95"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Firm Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Yeni Firma Ekle</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Temel Bilgiler</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Firma Adı</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Örn: Acme Etkinlikleri" 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Sahip E-postası</label>
                    <input 
                      required
                      type="email" 
                      value={formData.ownerEmail}
                      onChange={e => setFormData({ ...formData, ownerEmail: e.target.value })}
                      placeholder="sahip@firma.com" 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Geçici Şifre</label>
                    <input 
                      required
                      type="text" 
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Kullanıcıya verilecek şifre" 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Fiyatlandırma</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Abonelik Tipi</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                      value={formData.subscriptionType}
                      onChange={e => setFormData({ ...formData, subscriptionType: e.target.value as any })}
                    >
                      <option value="daily">Günlük - ₺19</option>
                      <option value="monthly">Aylık - ₺299</option>
                      <option value="yearly">Yıllık - ₺2990</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Fiyat (₺)</label>
                    <input 
                      type="number" 
                      value={formData.subscriptionPrice}
                      onChange={e => setFormData({ ...formData, subscriptionPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">İskonto (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100"
                      value={formData.discount}
                      onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                  {formData.discount > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-semibold text-amber-800">
                        İndirimli Fiyat: ₺{(formData.subscriptionPrice * (1 - formData.discount / 100)).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Lisans ve Mod</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Lisans Durumu</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                      value={formData.licenseStatus}
                      onChange={e => setFormData({ ...formData, licenseStatus: e.target.value as any })}
                    >
                      <option value="trial">Deneme (Trial)</option>
                      <option value="active">Aktif</option>
                      <option value="expired">Süresi Dolmuş</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Lisans Bitiş Tarihi</label>
                    <input 
                      type="date" 
                      value={formData.licenseExpiry}
                      onChange={e => setFormData({ ...formData, licenseExpiry: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="checkbox" 
                      id="demoMode"
                      checked={formData.demoMode}
                      onChange={e => setFormData({ ...formData, demoMode: e.target.checked })}
                      className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <label htmlFor="demoMode" className="text-sm font-bold text-neutral-700">Demo Modu Aktif</label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Özellik İzinleri</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`perm-${key}`}
                        checked={value}
                        onChange={e => setFormData({ 
                          ...formData, 
                          permissions: { ...formData.permissions, [key]: e.target.checked } 
                        })}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <label htmlFor={`perm-${key}`} className="text-xs font-medium text-neutral-600">
                        {getPermissionLabel(key)}
                      </label>
                    </div>
                  ))}
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
                  className="bg-neutral-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl active:scale-95"
                >
                  Firma Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
