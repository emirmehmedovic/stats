'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Shield, FileText, Edit, UserPlus } from 'lucide-react';

type ActivityItem = {
  id: string;
  type: 'license_added' | 'license_updated' | 'license_expired' | 'document_added' | 'profile_updated' | 'created';
  description: string;
  timestamp: string;
  details?: string;
};

interface ActivitySectionProps {
  employeeId: string;
  employee: any;
}

export function ActivitySection({ employeeId, employee }: ActivitySectionProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Generate activity items from employee data
    const items: ActivityItem[] = [];

    // Employee created
    items.push({
      id: 'created',
      type: 'created',
      description: 'Radnik je dodan u sistem',
      timestamp: employee.createdAt,
      details: `Kreirao: ${employee.firstName} ${employee.lastName}`,
    });

    // Licenses added
    employee.licenses?.forEach((license: any) => {
      items.push({
        id: `license-${license.id}`,
        type: 'license_added',
        description: `Licenca dodana: ${license.licenseType}`,
        timestamp: license.createdAt,
        details: `Broj: ${license.licenseNumber}, Ističe: ${new Date(license.expiryDate).toLocaleDateString('bs-BA')}`,
      });
    });

    // Documents added
    employee.documents?.forEach((doc: any) => {
      items.push({
        id: `doc-${doc.id}`,
        type: 'document_added',
        description: `Dokument upload-ovan: ${doc.title}`,
        timestamp: doc.uploadedAt,
        details: doc.category ? `Kategorija: ${doc.category}` : undefined,
      });
    });

    // Sort by timestamp (newest first)
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setActivities(items);
  }, [employee, employeeId]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'license_added':
      case 'license_updated':
        return <Shield className="w-5 h-5 text-blue-600" />;
      case 'license_expired':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'document_added':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'profile_updated':
        return <Edit className="w-5 h-5 text-orange-600" />;
      case 'created':
        return <UserPlus className="w-5 h-5 text-purple-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'license_added':
      case 'license_updated':
        return 'bg-blue-50';
      case 'license_expired':
        return 'bg-red-50';
      case 'document_added':
        return 'bg-green-50';
      case 'profile_updated':
        return 'bg-orange-50';
      case 'created':
        return 'bg-purple-50';
      default:
        return 'bg-slate-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes < 1 ? 'Upravo sada' : `Prije ${diffMinutes} min`;
      }
      return `Prije ${diffHours}h`;
    }

    if (diffDays === 1) return 'Jučer';
    if (diffDays < 7) return `Prije ${diffDays} dana`;

    return date.toLocaleDateString('bs-BA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        Aktivnost ({activities.length})
      </h3>

      {activities.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft p-12 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white/70 to-slate-100/50 opacity-70"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-slate-200 rounded-full blur-3xl opacity-30"></div>

          <div className="relative z-10">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 shadow-soft">
              <Clock className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nema aktivnosti</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Aktivnosti će se prikazivati ovdje kada se dese promjene.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-3xl shadow-soft p-6 hover:shadow-soft-lg transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 via-white/70 to-slate-100/30 opacity-70 group-hover:opacity-90 transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-32 h-32 bg-slate-200 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-all"></div>

              <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shadow-soft ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-base">{activity.description}</p>
                  {activity.details && (
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{activity.details}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs text-slate-500 font-medium">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
