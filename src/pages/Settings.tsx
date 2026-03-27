import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Bell, 
  CreditCard, 
  DollarSign,
  Save,
  Trash2,
  Camera,
  Mail,
  MapPin
} from 'lucide-react';
import { UserProfile, Firm } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function Settings() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firm, setFirm] = useState<Firm | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    logoUrl: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await api.getMe();
        setUserProfile(profile);
        
        if (profile.firmId) {
          const firmData = await api.getFirm(profile.firmId);
          setFirm(firmData);
          setFormData({
            name: firmData.name || '',
            email: firmData.ownerEmail || '',
            address: '',
            logoUrl: firmData.logoUrl || ''
          });
        }
      } catch (error) {
        console.error('Veri yüklenemedi:', error);
        toast.error('Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (userProfile?.firmId) {
        await api.updateFirm(userProfile.firmId, {
          name: formData.name,
          logoUrl: formData.logoUrl
        });
        toast.success('Firma bilgileri güncellendi');
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast.error('Bilgiler güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-64 bg-neutral-200 rounded-3xl"></div>
        <div className="h-96 bg-neutral-200 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Ayarlar</h1>
        <p className="text-neutral-500 mt-1">Firma profilinizi ve uygulama tercihlerinizi yönetin.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <nav className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-900 text-white font-bold text-sm shadow-lg">
            <Building2 className="w-5 h-5" /> Firma Profili
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 hover:bg-neutral-100 font-bold text-sm transition-colors">
            <ShieldCheck className="w-5 h-5" /> Güvenlik
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 hover:bg-neutral-100 font-bold text-sm transition-colors">
            <Bell className="w-5 h-5" /> Bildirimler
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 hover:bg-neutral-100 font-bold text-sm transition-colors">
            <CreditCard className="w-5 h-5" /> Faturalandırma
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg hover:bg-emerald-700 transition-colors">
            <DollarSign className="w-5 h-5" /> Abonelik
          </button>
        </nav>

        {/* Content */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-8">
            {/* Abonelik Bilgileri */}
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-4">
              <h2 className="text-xl font-bold text-emerald-900 tracking-tight flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Abonelik Bilgileri
              </h2>
              
              {userProfile?.licenseExpiry && (
                <div className="bg-white p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-emerald-700">Lisans Bitiş Tarihi</span>
                    <span className="text-sm font-bold text-emerald-900">
                      {new Date(userProfile.licenseExpiry).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="text-sm text-emerald-600">
                    Kalan gün: {Math.max(0, Math.ceil((new Date(userProfile.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} gün
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-emerald-200">
                  <span className="text-sm font-semibold text-emerald-700">Abonelik Tipi</span>
                  <p className="text-lg font-bold text-emerald-900 mt-1">
                    {userProfile?.licenseStatus === 'active' ? 'Aktif Abonelik' : 
                     userProfile?.licenseStatus === 'trial' ? 'Deneme Süresi' : 'Süresi Dolmuş'}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-emerald-200">
                  <span className="text-sm font-semibold text-emerald-700">Aylık Ücret</span>
                  <p className="text-lg font-bold text-emerald-900 mt-1">
                    ₺{firm?.subscriptionPrice || 299}
                  </p>
                </div>
              </div>

              {userProfile?.demoMode && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-sm font-semibold text-amber-700">Demo Modu</p>
                  <p className="text-sm text-amber-600 mt-1">Bu hesap demo modunda kullanılmaktadır. Bazı özellikler kısıtlı olabilir.</p>
                </div>
              )}

              <button 
                onClick={() => {
                  if (window.confirm('Bu müşteri için ödeme alındı. Ödeme onaylamak istiyor musunuz?')) {
                    console.log('Ödeme onayı talebi gönderildi');
                    toast.success('Ödeme onayı talebi gönderildi');
                  }
                }}
                className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
              >
                Ödeme Onayıla
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-neutral-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-neutral-200 group-hover:border-neutral-900 transition-colors">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 className="w-12 h-12 text-neutral-300" />
                    )}
                  </div>
                  <button 
                    type="button"
                    className="absolute -bottom-2 -right-2 p-3 bg-neutral-900 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Firma Logosu</h2>
                  <p className="text-sm text-neutral-500 mt-1">Bu logo tüm sanal biletlerde ve raporlarda görünecektir.</p>
                  <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                    <button type="button" className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors">Yeni Yükle</button>
                    <button type="button" className="px-4 py-2 bg-neutral-50 text-neutral-500 text-xs font-bold rounded-lg hover:bg-neutral-100 transition-colors">Kaldır</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Firma Adı</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700 focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">İletişim E-postası</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      type="email" 
                      placeholder="iletisim@firma.com" 
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700 focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Adres</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Mahalle, Sokak, No, Şehir" 
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700 focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-neutral-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-neutral-300 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" /> Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 space-y-4">
              <h2 className="text-xl font-bold text-rose-900 tracking-tight">Tehlike Bölgesi</h2>
              <p className="text-sm text-rose-700">Firma hesabınızı sildiğinizde geri dönüşü yoktur. Lütfen emin olun.</p>
              <button className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg active:scale-95 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Firma Hesabını Sil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
