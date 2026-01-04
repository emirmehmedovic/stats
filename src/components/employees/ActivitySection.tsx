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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nema aktivnosti</h3>
          <p className="text-slate-600">
            Aktivnosti će se prikazivati ovdje kada se dese promjene.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{activity.description}</p>
                  {activity.details && (
                    <p className="text-sm text-slate-600 mt-1">{activity.details}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
