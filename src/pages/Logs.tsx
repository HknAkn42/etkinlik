import React, { useState, useEffect } from 'react';
import { Search, Filter, Activity } from 'lucide-react';
import { Log } from '../types';
import { api } from '../services/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [entityType, action]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getLogs({ entityType: entityType || undefined, action: action || undefined });
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">İşlem Kayıtları</h1>
        <div className="flex gap-2">
          <select 
            value={entityType} 
            onChange={e => setEntityType(e.target.value)}
            className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700"
          >
            <option value="">Tüm Varlıklar</option>
            <option value="sale">Satış</option>
            <option value="ticket">Bilet</option>
            <option value="user">Kullanıcı</option>
            <option value="event">Etkinlik</option>
            <option value="system">Sistem</option>
          </select>
          <input 
            type="text" 
            placeholder="İşlem ara..." 
            value={action}
            onChange={e => setAction(e.target.value)}
            className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 text-neutral-500 uppercase text-xs font-bold">
            <tr>
              <th className="px-6 py-4">Tarih</th>
              <th className="px-6 py-4">Kullanıcı</th>
              <th className="px-6 py-4">İşlem</th>
              <th className="px-6 py-4">Varlık</th>
              <th className="px-6 py-4">Detaylar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Yükleniyor...</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 font-mono text-neutral-500">{format(new Date(log.timestamp), 'dd MMM yyyy HH:mm', { locale: tr })}</td>
                <td className="px-6 py-4 font-bold text-neutral-900">{log.userName}</td>
                <td className="px-6 py-4">{log.action}</td>
                <td className="px-6 py-4 capitalize">{log.entityType}</td>
                <td className="px-6 py-4 text-neutral-600">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
