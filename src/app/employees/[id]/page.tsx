'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  FileText,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddLicenseModal from '@/components/employees/AddLicenseModal';
import EditLicenseModal from '@/components/employees/EditLicenseModal';
import { LicenseDocuments } from '@/components/employees/LicenseDocuments';
import { DocumentsSection } from '@/components/employees/DocumentsSection';
import { ActivitySection } from '@/components/employees/ActivitySection';
import { showToast } from '@/components/ui/toast';
import { dateOnlyToUtc, formatDateDisplay, getDateStringInTimeZone, getTodayDateString, TIME_ZONE_SARAJEVO } from '@/lib/dates';
import { MainLayout } from '@/components/layout/MainLayout';

type License = {
  id: string;
  licenseType?: string; // DEPRECATED
  licenseTypeId: string | null;
  type?: {
    id: string;
    name: string;
    code: string | null;
    category: string | null;
  } | null;
  licenseNumber: string;
  issuedDate: string;
  expiryDate: string;
  issuer: string | null;
  status: string;
  requiredForPosition: string | null;
  documents: Array<{
    id: string;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
};

type Employee = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  nationalId: string | null;
  dateOfBirth: string | null;
  hireDate: string;
  position: string;
  department: string | null;
  sector: {
    id: string;
    name: string;
    code: string | null;
    color: string | null;
  } | null;
  sectorId: string | null;
  status: string;
  photo: string | null;
  licenses: License[];
  stats: {
    activeLicenses: number;
    expiringLicenses: number;
    totalLicenses: number;
  };
};

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'licenses' | 'documents' | 'activity'>('overview');
  const [isAddLicenseModalOpen, setIsAddLicenseModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);

  useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      const result = await response.json();

      if (result.success) {
        setEmployee(result.data);
      } else {
        setError('Employee not found');
      }
    } catch (err) {
      setError('Failed to load employee');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Aktivan' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle className="w-4 h-4" />, label: 'Neaktivan' },
      ON_LEAVE: { bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock className="w-4 h-4" />, label: 'Na odsustvu' },
    };
    return config[status as keyof typeof config] || config.ACTIVE;
  };

  const getLicenseStatusBadge = (license: License) => {
    if (license.status !== 'ACTIVE') {
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Neaktivna' };
    }

    const daysUntilExpiry = getDaysUntilExpiry(license.expiryDate);

    if (daysUntilExpiry < 0) {
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'Istekla' };
    }
    if (daysUntilExpiry <= 30) {
      return { bg: 'bg-orange-100', text: 'text-orange-700', label: `Ističe za ${daysUntilExpiry} dana` };
    }
    return { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktivna' };
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const todayStr = getTodayDateString();
    const expiryStr = getDateStringInTimeZone(new Date(expiryDate), TIME_ZONE_SARAJEVO);
    const today = dateOnlyToUtc(todayStr).getTime();
    const expiry = dateOnlyToUtc(expiryStr).getTime();
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const getExpiryNotifications = (expiryDate: string) => {
    const daysUntil = getDaysUntilExpiry(expiryDate);
    if (daysUntil < 0) {
      return {
        daysUntil,
        alerts: ['Istekla'],
      };
    }

    const thresholds = [
      { days: 60, label: '2 mjeseca' },
      { days: 30, label: '1 mjesec' },
      { days: 15, label: '15 dana' },
      { days: 1, label: '1 dan' },
    ];

    const alerts = thresholds
      .filter((threshold) => daysUntil <= threshold.days)
      .map((threshold) => threshold.label);

    return { daysUntil, alerts };
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Učitavam podatke...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !employee) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-700">{error || 'Employee not found'}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const statusBadge = getStatusBadge(employee.status);

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Back Button */}
        <div className="px-8 py-4 mb-4">
          <button
            onClick={() => router.push('/employees')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Nazad na listu radnika</span>
          </button>
        </div>

        {/* Profile Section */}
        <div className="px-8">
        <div className="bg-white rounded-2xl shadow-sm relative z-10">
          <div className="px-8 pt-6 pb-4">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div
                  className={`w-32 h-32 rounded-3xl shadow-xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ${
                    employee.photo && !photoError ? 'cursor-zoom-in' : ''
                  }`}
                  onClick={() => {
                    if (employee.photo && !photoError) setIsPhotoOpen(true);
                  }}
                >
                  {employee.photo && !photoError ? (
                    <img
                      src={employee.photo}
                      alt={`${employee.firstName} ${employee.lastName}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        setPhotoError(true);
                      }}
                    />
                  ) : null}
                  {(!employee.photo || photoError) && (
                    <span className="text-white text-4xl font-bold">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Name & Actions */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                      {employee.firstName} {employee.lastName}
                    </h1>
                    <p className="text-lg text-slate-600 mt-1">{employee.position}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                      {employee.department && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{employee.department}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Zaposlen {formatDateDisplay(employee.hireDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusBadge.bg} ${statusBadge.text} font-medium`}>
                      {statusBadge.icon}
                      <span>{statusBadge.label}</span>
                    </div>
                    <Button
                      onClick={() => router.push(`/employees/${employeeId}/edit`)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-900"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Uredi profil
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{employee.stats.activeLicenses}</p>
                    <p className="text-sm text-slate-600">Aktivne licence</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{employee.stats.expiringLicenses}</p>
                    <p className="text-sm text-slate-600">Ističu uskoro</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{employee.stats.totalLicenses}</p>
                    <p className="text-sm text-slate-600">Ukupno licenci</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow-sm mt-6 rounded-t-2xl border-t border-slate-200">
          <div className="px-8">
            <div className="border-b border-slate-200">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'overview'
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Pregled</span>
                </div>
                {activeTab === 'overview' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('licenses')}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'licenses'
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Licence</span>
                  <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                    {employee.licenses.length}
                  </span>
                </div>
                {activeTab === 'licenses' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'documents'
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Dokumenti</span>
                </div>
                {activeTab === 'documents' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'activity'
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Aktivnost</span>
                </div>
                {activeTab === 'activity' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
                )}
              </button>
            </div>
            </div>
          </div>
        </div>
        {employee.photo && !photoError && isPhotoOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </h3>
                <button
                  onClick={() => setIsPhotoOpen(false)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Zatvori
                </button>
              </div>
              <div className="bg-slate-100 p-6 flex items-center justify-center">
                <img
                  src={employee.photo}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="max-h-[70vh] w-auto rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-soft p-8 space-y-8 sticky top-24 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white/70 to-indigo-100/30 opacity-70 group-hover:opacity-90 transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-40"></div>

              <div className="relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  <h3 className="font-bold text-slate-900 text-lg">Osnovne informacije</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/80 rounded-2xl shadow-soft border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 rounded-xl">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</p>
                    </div>
                    <p className="text-slate-900 font-semibold text-sm break-all">{employee.email}</p>
                  </div>
                  {employee.phone && (
                    <div className="p-4 bg-white/80 rounded-2xl shadow-soft border border-slate-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-xl">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Telefon</p>
                      </div>
                      <p className="text-slate-900 font-semibold text-sm">{employee.phone}</p>
                    </div>
                  )}
                  <div className="p-4 bg-white/80 rounded-2xl shadow-soft border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-50 rounded-xl">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Broj radnika</p>
                    </div>
                    <p className="text-slate-900 font-bold text-sm font-mono">{employee.employeeNumber}</p>
                  </div>
                  {employee.nationalId && (
                    <div className="p-4 bg-white/80 rounded-2xl shadow-soft border border-slate-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 rounded-xl">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">JMBG</p>
                      </div>
                      <p className="text-slate-900 font-bold text-sm font-mono">{employee.nationalId}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                  <h3 className="font-bold text-slate-900 text-lg">Detalji zaposlenja</h3>
                </div>
                <div className="space-y-4">
                  {employee.sector && (
                    <div className="p-4 bg-white/80 rounded-2xl shadow-soft border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Sektor</p>
                      <div className="flex items-center gap-2">
                        {employee.sector.color && (
                          <div
                            className="w-4 h-4 rounded-full shadow-soft"
                            style={{ backgroundColor: employee.sector.color }}
                          />
                        )}
                        <p className="text-slate-900 font-bold text-sm">
                          {employee.sector.name}
                          {employee.sector.code && (
                            <span className="text-slate-500 ml-2 font-normal">({employee.sector.code})</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-white/80 rounded-2xl shadow-soft border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Pozicija</p>
                    <p className="text-slate-900 font-bold text-sm">{employee.position}</p>
                  </div>
                  {employee.dateOfBirth && (
                    <div className="p-4 bg-white/80 rounded-2xl shadow-soft border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Datum rođenja</p>
                      <p className="text-slate-900 font-semibold text-sm">{formatDateDisplay(employee.dateOfBirth)}</p>
                    </div>
                  )}
                  <div className="p-4 bg-white/80 rounded-2xl shadow-soft border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Datum zaposlenja</p>
                    <p className="text-slate-900 font-semibold text-sm">{formatDateDisplay(employee.hireDate)}</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 transition-all"></div>

                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">O radniku</h3>
                    <p className="text-slate-600 leading-relaxed">
                      {employee.firstName} {employee.lastName} radi na poziciji {employee.position}
                      {employee.department && ` u odjelu ${employee.department}`}.
                      Zaposlen je {formatDateDisplay(employee.hireDate)}.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-white/70 to-emerald-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-green-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 transition-all"></div>

                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Statistika licenci</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-6 bg-white rounded-2xl border-[6px] border-white shadow-soft hover:shadow-soft-lg transition-all group/card cursor-pointer relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 opacity-80 group-hover/card:opacity-100 transition-all"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full blur-2xl opacity-60"></div>
                        <div className="relative z-10">
                          <div className="p-3 bg-green-100 rounded-2xl w-fit mb-3">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-3xl font-bold text-green-600 mb-1">{employee.stats.activeLicenses}</p>
                          <p className="text-sm font-medium text-green-700">Aktivnih</p>
                        </div>
                      </div>
                      <div className="p-6 bg-white rounded-2xl border-[6px] border-white shadow-soft hover:shadow-soft-lg transition-all group/card cursor-pointer relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100 opacity-80 group-hover/card:opacity-100 transition-all"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 rounded-full blur-2xl opacity-60"></div>
                        <div className="relative z-10">
                          <div className="p-3 bg-orange-100 rounded-2xl w-fit mb-3">
                            <Clock className="w-6 h-6 text-orange-600" />
                          </div>
                          <p className="text-3xl font-bold text-orange-600 mb-1">{employee.stats.expiringLicenses}</p>
                          <p className="text-sm font-medium text-orange-700">Ističu</p>
                        </div>
                      </div>
                      <div className="p-6 bg-white rounded-2xl border-[6px] border-white shadow-soft hover:shadow-soft-lg transition-all group/card cursor-pointer relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-80 group-hover/card:opacity-100 transition-all"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full blur-2xl opacity-60"></div>
                        <div className="relative z-10">
                          <div className="p-3 bg-blue-100 rounded-2xl w-fit mb-3">
                            <Shield className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="text-3xl font-bold text-blue-600 mb-1">{employee.stats.totalLicenses}</p>
                          <p className="text-sm font-medium text-blue-700">Ukupno</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'licenses' && (
              <div className="space-y-4">
                {/* Add License Button */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Licence i certifikati</h3>
                  <Button
                    onClick={() => setIsAddLicenseModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj licencu
                  </Button>
                </div>

                {employee.licenses.length === 0 ? (
                  <div className="bg-white rounded-3xl shadow-soft p-12 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white/70 to-slate-100/50 opacity-70"></div>
                    <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-slate-200 rounded-full blur-3xl opacity-30"></div>

                    <div className="relative z-10">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 shadow-soft">
                        <Shield className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Nema licenci</h3>
                      <p className="text-slate-600 mb-8 max-w-md mx-auto">Ovaj radnik još nema dodijeljenih licenci ili certifikata.</p>
                      <Button
                        onClick={() => setIsAddLicenseModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-soft hover:shadow-soft-lg transition-all"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Dodaj prvu licencu
                      </Button>
                    </div>
                  </div>
                ) : (
                  employee.licenses.map((license) => {
                    const badge = getLicenseStatusBadge(license);
                    return (
                      <div
                        key={license.id}
                        className="bg-white rounded-3xl shadow-soft p-8 hover:shadow-soft-lg transition-all relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                        <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 transition-all"></div>

                        <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="p-3 bg-blue-100 rounded-2xl shadow-soft">
                                <Shield className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                  {license.type?.name || license.licenseType}
                                </h3>
                                <p className="text-sm text-slate-600 font-mono mt-1">{license.licenseNumber}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${badge.bg} ${badge.text} shadow-soft`}>
                              {badge.label}
                            </div>
                            <Button
                              onClick={() => setEditingLicense(license)}
                              variant="outline"
                              size="sm"
                              className="border-slate-300 hover:bg-slate-50 rounded-xl shadow-soft"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-white/80 rounded-2xl border border-slate-200 shadow-soft">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Izdato</span>
                            </div>
                            <p className="text-base font-bold text-slate-900">
                              {formatDateDisplay(license.issuedDate)}
                            </p>
                          </div>
                          <div className="p-4 bg-white/80 rounded-2xl border border-slate-200 shadow-soft">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ističe</span>
                            </div>
                            <p className="text-base font-bold text-slate-900">
                              {formatDateDisplay(license.expiryDate)}
                            </p>
                          </div>
                          {license.issuer && (
                            <div className="col-span-2 p-4 bg-white/80 rounded-2xl border border-slate-200 shadow-soft">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Izdavač</span>
                              <p className="text-base font-semibold text-slate-900">{license.issuer}</p>
                            </div>
                          )}
                          {license.requiredForPosition && (
                            <div className="col-span-2 p-4 bg-white/80 rounded-2xl border border-slate-200 shadow-soft">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Potrebna za poziciju</span>
                              <p className="text-base font-semibold text-slate-900">{license.requiredForPosition}</p>
                            </div>
                          )}
                        </div>

                        {(() => {
                          const { daysUntil, alerts } = getExpiryNotifications(license.expiryDate);
                          return (
                            <div className="rounded-2xl bg-white/80 border border-slate-200 shadow-soft p-5 mb-6">
                              <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-4 h-4 text-slate-600" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Obavještenja o isteku</span>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {alerts.length > 0 ? (
                                  alerts.map((alert) => (
                                    <span
                                      key={alert}
                                      className={`px-3 py-1.5 rounded-full font-semibold text-xs shadow-soft ${
                                        alert === 'Istekla'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      {alert}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-slate-500 font-medium">Nema aktivnih upozorenja</span>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-slate-700">
                                {daysUntil < 0
                                  ? `Istekla prije ${Math.abs(daysUntil)} dana`
                                  : daysUntil === 0
                                    ? 'Ističe danas'
                                    : `Preostalo ${daysUntil} dana`}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Documents Section */}
                        <LicenseDocuments
                          licenseId={license.id}
                          documents={license.documents}
                          onDocumentsChange={fetchEmployee}
                        />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <DocumentsSection employeeId={employeeId} />
            )}

            {activeTab === 'activity' && (
              <ActivitySection employeeId={employeeId} employee={employee} />
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Modals */}
      <AddLicenseModal
        employeeId={employeeId}
        isOpen={isAddLicenseModalOpen}
        onClose={() => setIsAddLicenseModalOpen(false)}
        onSuccess={() => {
          fetchEmployee();
        }}
      />

      {editingLicense && (
        <EditLicenseModal
          license={editingLicense}
          isOpen={!!editingLicense}
          onClose={() => setEditingLicense(null)}
          onSuccess={() => {
            fetchEmployee();
            setEditingLicense(null);
          }}
          onDelete={() => {
            fetchEmployee();
            setEditingLicense(null);
          }}
        />
      )}
      </div>
    </MainLayout>
  );
}
