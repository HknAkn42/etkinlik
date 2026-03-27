import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Shield, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  Mail,
  User,
  Lock,
  ChevronRight,
  MoreVertical,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, Permissions, UserRole } from '../types';
import { toast } from 'sonner';
import { api } from '../services/api';

export default function Staff() {
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'staff' as UserRole,
    permissions: {
      canSell: true,
      canScan: true,
      canViewRevenue: false,
      canManageEvents: false,
      canManageStaff: false
    } as Permissions
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await api.getMe();
        setUserProfile(profile);

        if (profile && profile.firmId) {
          const staffData = await api.getStaff();
          setStaff(staffData);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast.error('Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePermissionChange = (perm: keyof Permissions) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [perm]: !formData.permissions[perm]
      }
    });
  };

  const handleRoleChange = (role: UserRole) => {
    const isFirmAdmin = role === 'firmadmin';
    setFormData({
      ...formData,
      role,
      permissions: {
        canSell: true,
        canScan: true,
        canViewRevenue: isFirmAdmin,
        canManageEvents: isFirmAdmin,
        canManageStaff: false
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.firmId) return;

    try {
      const result = await api.createStaff(formData);
      setStaff([...staff, { ...result, id: result.id, firmId: userProfile.firmId, permissions: formData.permissions } as UserProfile]);
      setIsModalOpen(false);
      resetForm();
      toast.success('Personel başarıyla eklendi');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Personel eklenemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      displayName: '',
      role: 'staff',
      permissions: {
        canSell: true,
        canScan: true,
        canViewRevenue: false,
        canManageEvents: false,
        canManageStaff: false
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu personeli kaldırmak istediğinizden emin misiniz?')) return;
    try {
      await api.deleteStaff(id);
      setStaff(staff.filter(s => s.id !== id));
      toast.success('Personel kaldırıldı');
    } catch (error) {
      toast.error('Personel kaldırılamadı');
    }
  };

  const getPermissionLabel = (key: string) => {
    const labels: Record<string, string> = {
      canSell: 'Satış Yapabilir',
      canScan: 'Bilet Okuyabilir',
      canViewRevenue: 'Gelir Görebilir',
      canManageEvents: 'Etkinlik Yönetebilir',
      canManageStaff: 'Personel Yönetebilir'
    };
    return labels[key] || key.replace('can', '').replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Personel Yönetimi</h1>
          <p className="text-neutral-500 mt-1">Ekibinizi ve erişim izinlerini yönetin.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Personel Ekle
        </button>
      </header>

      {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member.id} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-lg">
                  {member.displayName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">{member.displayName}</h3>
                  <p className="text-xs text-neutral-400 font-medium">{member.email}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                member.role === 'firmadmin' ? 'bg-indigo-100 text-indigo-700' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {member.role === 'firmadmin' ? 'Firma Yöneticisi' : 'Personel'}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">İzinler</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(member.permissions).map(([key, value]) => (
                  <div key={key} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    value ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-neutral-50 text-neutral-400 border border-neutral-100'
                  }`}>
                    {value ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                    {getPermissionLabel(key)}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-50 flex items-center justify-between">
              <button className="text-sm font-bold text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1">
                <Edit3 className="w-4 h-4" /> Düzenle
              </button>
              <button 
                onClick={() => handleDelete(member.id)}
                className="text-sm font-bold text-neutral-400 hover:text-rose-600 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Kaldır
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Yeni Personel Ekle</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tam Ad</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      required
                      type="text" 
                      value={formData.displayName}
                      onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Örn: Ahmet Yılmaz" 
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">E-posta Adresi</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ahmet@ornek.com" 
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      required
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••" 
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Rol</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['staff', 'firmadmin'] as UserRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleChange(role)}
                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                          formData.role === role 
                            ? 'bg-neutral-900 text-white shadow-lg' 
                            : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                        }`}
                      >
                        {role === 'firmadmin' ? 'Firma Yöneticisi' : 'Personel'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">İzinler</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.keys(formData.permissions).map((perm) => (
                      <button
                        key={perm}
                        type="button"
                        onClick={() => handlePermissionChange(perm as keyof Permissions)}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          formData.permissions[perm as keyof Permissions] 
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg' 
                            : 'bg-neutral-50 text-neutral-500 border-neutral-100 hover:border-neutral-300'
                        }`}
                      >
                        <span className="text-sm font-bold capitalize">{getPermissionLabel(perm)}</span>
                        {formData.permissions[perm as keyof Permissions] ? <CheckCircle2 className="w-5 h-5" /> : <Shield className="w-5 h-5 opacity-30" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-neutral-100">
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
                  Personel Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
