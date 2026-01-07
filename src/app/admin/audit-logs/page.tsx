'use client';

import { useEffect, useState } from 'react';
import { formatDateTimeDisplay } from '@/lib/dates';
import { ShieldAlert } from 'lucide-react';

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/audit-logs?limit=100');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Greška pri učitavanju audit logova');
        }
        const data = await response.json();
        setLogs(data.data || []);
      } catch (err: any) {
        setError(err.message || 'Greška pri učitavanju audit logova');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-dark-500">Učitavam audit logove...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-dark-900">Audit log</h1>
          <p className="text-dark-500">Pregled aktivnosti i sigurnosnih događaja</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                  Vrijeme
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                  Korisnik
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                  Akcija
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                  Entitet
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                  IP adresa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-600">
                    {formatDateTimeDisplay(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-dark-900">
                      {log.user?.name || log.user?.email || 'N/A'}
                    </div>
                    <div className="text-xs text-dark-500">{log.user?.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-dark-900">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-600">
                    {log.entityType}
                    {log.entityId ? ` #${log.entityId}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-600">
                    {log.ipAddress || 'N/A'}
                  </td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td className="px-6 py-6 text-sm text-dark-500" colSpan={5}>
                    Nema dostupnih zapisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
