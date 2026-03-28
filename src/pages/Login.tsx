import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await api.login(email, password);
      if (user.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/');
      }
      toast.success('Giriş başarılı');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-neutral-100">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">EtkinlikYöneticisi Pro</h1>
          <p className="text-neutral-500 mt-2">Kapsamlı etkinlik yönetim platformu</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">E-posta</label>
            <input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@mail.com"
              className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-xl outline-none focus:border-neutral-900 transition-all font-semibold text-neutral-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Şifre</label>
            <input 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-xl outline-none focus:border-neutral-900 transition-all font-semibold text-neutral-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white font-bold py-4 px-6 rounded-xl hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-neutral-300 border-t-white rounded-full animate-spin mx-auto"></div>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold mb-4">Güvenli SaaS Platformu</p>
          
          <div className="space-y-3 text-left">
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <p className="text-xs font-bold text-neutral-600 mb-1">SuperAdmin Hesabı:</p>
              <p className="text-xs text-neutral-500">E-posta: superadmin@etkinlik.com</p>
              <p className="text-xs text-neutral-500">Şifre: superadmin123</p>
            </div>
            
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <p className="text-xs font-bold text-emerald-600 mb-1">Demo Firma Hesabı:</p>
              <p className="text-xs text-emerald-500">E-posta: admin@demo.com</p>
              <p className="text-xs text-emerald-500">Şifre: demo123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
