'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertCircle, Clock, ArrowRight } from 'lucide-react';

type ExpiringLicense = {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  license: {
    id: string;
    licenseType: string;
    licenseNumber: string;
    expiryDate: string;
  };
  daysUntilExpiry: number;
};

export function ExpiringLicensesWidget() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<ExpiringLicense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExpiringLicenses();
  }, []);

  const fetchExpiringLicenses = async () => {
    try {
      // Prvo provjeri i kreiraj notifikacije ako treba
      try {
        await fetch('/api/notifications/check-expiring', { method: 'POST' });
      } catch (err) {
        // Ignore errors - možda već postoje notifikacije
      }

      // Provjeri notifikacije koje su nepročitane (to znači da licence ističu)
      const response = await fetch('/api/notifications?unreadOnly=true&limit=5');
      const result = await response.json();

      if (result.success) {
        setLicenses(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch expiring licenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'text-red-600 bg-red-50 border-red-200';
    if (days <= 15) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getUrgencyText = (days: number) => {
    if (days === 0) return 'Ističe danas!';
    if (days === 1) return 'Ističe sutra';
    return `Ističe za ${days} dana`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (licenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-50 rounded-xl">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Licence koje ističu</h3>
            <p className="text-sm text-slate-600">Nema licenci koje ističu u sljedećih 30 dana</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 rounded-xl">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Licence koje ističu</h3>
            <p className="text-sm text-slate-600">{licenses.length} licenci ističe uskoro</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/employees')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          Vidi sve
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {licenses.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(`/employees/${item.employee.id}`)}
            className="w-full text-left p-3 border rounded-xl hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {item.employee.firstName} {item.employee.lastName}
                </p>
                <p className="text-xs text-slate-600 mt-1">{item.license.licenseType}</p>
              </div>
              <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${getUrgencyColor(item.daysUntilExpiry)}`}>
                {getUrgencyText(item.daysUntilExpiry)}
              </div>
            </div>
          </button>
        ))}
      </div>

      {licenses.length >= 5 && (
        <button
          onClick={() => router.push('/employees')}
          className="w-full mt-4 text-sm text-center text-blue-600 hover:text-blue-700 font-medium"
        >
          Vidi sve licence koje ističu →
        </button>
      )}
    </div>
  );
}

