import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';

interface PricingPlan {
  id: string;
  name: string;
  type: 'daily' | 'monthly' | 'yearly';
  basePrice: number;
  features: string[];
  isActive: boolean;
}

export default function Pricing() {
  const [plans, setPlans] = useState<PricingPlan[]>([
    {
      id: 'daily-basic',
      name: 'Günlük Basic',
      type: 'daily',
      basePrice: 19,
      features: [
        'Tek günlük erişim',
        'Sınırsız etkinlik',
        'Temel raporlama',
        'E-posta desteği'
      ],
      isActive: true
    },
    {
      id: 'monthly-pro',
      name: 'Aylık Professional',
      type: 'monthly',
      basePrice: 299,
      features: [
        'Aylık erişim',
        'Sınırsız etkinlik',
        'Gelişmiş raporlama',
        'Öncelikli destek',
        'API erişimi',
        'Personel yönetimi'
      ],
      isActive: true
    },
    {
      id: 'yearly-enterprise',
      name: 'Yıllık Enterprise',
      type: 'yearly',
      basePrice: 2990,
      features: [
        'Yıllık erişim (2 ay bedava)',
        'Sınırsız her şey',
        'Özel raporlama',
        '7/24 destek',
        'Full API erişimi',
        'Beyaz etiket',
        'Özel eğitim'
      ],
      isActive: true
    }
  ]);
  
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      // Burada API'den fiyatları çekebiliriz
      // const data = await api.getPricingPlans();
      // setPlans(data);
    } catch (error) {
      console.error('Fiyatlar yüklenemedi:', error);
    }
  };

  const handleEditPlan = (plan: PricingPlan) => {
    setEditingPlan({ ...plan });
    setIsModalOpen(true);
  };

  const handleUpdatePlan = () => {
    if (!editingPlan) return;
    
    try {
      setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
      setIsModalOpen(false);
      setEditingPlan(null);
      toast.success('Fiyat planı güncellendi');
    } catch (error) {
      toast.error('Güncelleme hatası');
    }
  };

  const togglePlanStatus = (planId: string) => {
    setPlans(plans.map(p => 
      p.id === planId ? { ...p, isActive: !p.isActive } : p
    ));
    toast.success('Plan durumu güncellendi');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Fiyatlandırma</h1>
          <p className="text-neutral-500 mt-1">Abonelik paketlerini ve fiyatlarını yönetin.</p>
        </div>
      </header>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative bg-white border-2 rounded-3xl p-8 shadow-lg transition-all ${
            plan.isActive ? 'border-emerald-500' : 'border-neutral-200 opacity-60'
          }`}>
            {!plan.isActive && (
              <div className="absolute top-4 right-4 px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                Pasif
              </div>
            )}
            
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-neutral-900">₺{plan.basePrice}</span>
                <span className="text-neutral-500">
                  {plan.type === 'daily' ? '/gün' : plan.type === 'monthly' ? '/ay' : '/yıl'}
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-neutral-600">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <button 
                onClick={() => handleEditPlan(plan)}
                className="w-full bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800 transition-all"
              >
                Düzenle
              </button>
              <button 
                onClick={() => togglePlanStatus(plan.id)}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                  plan.isActive 
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {plan.isActive ? 'Pasif Yap' : 'Aktif Yap'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Fiyat Planını Düzenle</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdatePlan(); }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Plan Adı</label>
                <input 
                  type="text" 
                  value={editingPlan.name}
                  onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Fiyat (₺)</label>
                <input 
                  type="number" 
                  value={editingPlan.basePrice}
                  onChange={e => setEditingPlan({ ...editingPlan, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Özellikler</label>
                <textarea 
                  value={editingPlan.features.join('\n')}
                  onChange={e => setEditingPlan({ 
                    ...editingPlan, 
                    features: e.target.value.split('\n').filter(f => f.trim()) 
                  })}
                  rows={6}
                  className="w-full px-4 py-3 bg-neutral-50 border-none rounded-xl outline-none font-semibold text-neutral-700"
                  placeholder="Her özellik bir satırda olmalı..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="plan-active"
                  checked={editingPlan.isActive}
                  onChange={e => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <label htmlFor="plan-active" className="text-sm font-bold text-neutral-700">Plan Aktif</label>
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
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
