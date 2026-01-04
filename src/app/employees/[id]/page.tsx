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
import DashboardLayout from '@/components/layouts/DashboardLayout';

type License = {
  id: string;
  licenseType: string;
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
      <DashboardLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Učitavam podatke...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-700">{error || 'Employee not found'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusBadge = getStatusBadge(employee.status);

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Back Button */}
        <div className="bg-white border-b border-slate-200 -mt-20">
          <div className="px-8 py-4">
            <button
              onClick={() => router.push('/employees')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Nazad na listu radnika</span>
            </button>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 h-64 relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Profile Section */}
        <div className="px-8">
        <div className="bg-white rounded-b-2xl shadow-sm -mt-20 relative z-10">
          <div className="px-8 pt-6 pb-4">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="-mt-24 flex-shrink-0">
                <div
                  className={`w-40 h-40 rounded-3xl ring-8 ring-white shadow-xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ${
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
                    <span className="text-white text-5xl font-bold">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Name & Actions */}
              <div className="flex-1 pt-4">
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
        <div className="bg-white shadow-sm -mt-px">
          <div className="max-w-7xl mx-auto px-6">
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
        <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Osnovne informacije</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Email</p>
                      <p className="text-slate-900">{employee.email}</p>
                    </div>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-slate-500">Telefon</p>
                        <p className="text-slate-900">{employee.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Broj radnika</p>
                      <p className="text-slate-900 font-mono">{employee.employeeNumber}</p>
                    </div>
                  </div>
                  {employee.nationalId && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-slate-500">JMBG</p>
                        <p className="text-slate-900 font-mono">{employee.nationalId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Detalji zaposlenja</h3>
                <div className="space-y-4">
                  {employee.sector && (
                    <div>
                      <p className="text-sm text-slate-500">Sektor</p>
                      <div className="flex items-center gap-2">
                        {employee.sector.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: employee.sector.color }}
                          />
                        )}
                        <p className="text-slate-900 font-medium">
                          {employee.sector.name}
                          {employee.sector.code && (
                            <span className="text-slate-500 ml-2">({employee.sector.code})</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">Pozicija</p>
                    <p className="text-slate-900 font-medium">{employee.position}</p>
                  </div>
                  {employee.dateOfBirth && (
                    <div>
                      <p className="text-sm text-slate-500">Datum rođenja</p>
                      <p className="text-slate-900">{formatDateDisplay(employee.dateOfBirth)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">Datum zaposlenja</p>
                    <p className="text-slate-900">{formatDateDisplay(employee.hireDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">O radniku</h3>
                  <p className="text-slate-600">
                    {employee.firstName} {employee.lastName} radi na poziciji {employee.position}
                    {employee.department && ` u odjelu ${employee.department}`}.
                    Zaposlen je {formatDateDisplay(employee.hireDate)}.
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Statistika licenci</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-3xl font-bold text-green-600">{employee.stats.activeLicenses}</p>
                      <p className="text-sm text-green-700 mt-1">Aktivnih</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <p className="text-3xl font-bold text-orange-600">{employee.stats.expiringLicenses}</p>
                      <p className="text-sm text-orange-700 mt-1">Ističu</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-3xl font-bold text-blue-600">{employee.stats.totalLicenses}</p>
                      <p className="text-sm text-blue-700 mt-1">Ukupno</p>
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
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Shield className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nema licenci</h3>
                    <p className="text-slate-600 mb-6">Ovaj radnik još nema dodijeljenih licenci ili certifikata.</p>
                    <Button
                      onClick={() => setIsAddLicenseModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj prvu licencu
                    </Button>
                  </div>
                ) : (
                  employee.licenses.map((license) => {
                    const badge = getLicenseStatusBadge(license);
                    return (
                      <div
                        key={license.id}
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <Shield className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">{license.licenseType}</h3>
                                <p className="text-sm text-slate-600 font-mono">{license.licenseNumber}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </div>
                            <Button
                              onClick={() => setEditingLicense(license)}
                              variant="outline"
                              size="sm"
                              className="border-slate-300 hover:bg-slate-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <div>
                              <span className="text-slate-500">Izdato:</span>
                              <span className="ml-2 text-slate-900 font-medium">
                                {formatDateDisplay(license.issuedDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                            <div>
                              <span className="text-slate-500">Ističe:</span>
                              <span className="ml-2 text-slate-900 font-medium">
                                {formatDateDisplay(license.expiryDate)}
                              </span>
                            </div>
                          </div>
                          {license.issuer && (
                            <div className="col-span-2">
                              <span className="text-slate-500">Izdavač:</span>
                              <span className="ml-2 text-slate-900">{license.issuer}</span>
                            </div>
                          )}
                          {license.requiredForPosition && (
                            <div className="col-span-2">
                              <span className="text-slate-500">Potrebna za poziciju:</span>
                              <span className="ml-2 text-slate-900">{license.requiredForPosition}</span>
                            </div>
                          )}
                        </div>

                        {(() => {
                          const { daysUntil, alerts } = getExpiryNotifications(license.expiryDate);
                          return (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 mb-4">
                              <div className="font-semibold text-slate-600 mb-2">Obavještenja o isteku</div>
                              <div className="flex flex-wrap gap-2">
                                {alerts.length > 0 ? (
                                  alerts.map((alert) => (
                                    <span
                                      key={alert}
                                      className={`px-2.5 py-1 rounded-full font-semibold ${
                                        alert === 'Istekla'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      {alert}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-500">Nema aktivnih upozorenja</span>
                                )}
                              </div>
                              <div className="mt-2 text-slate-600">
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
    </DashboardLayout>
  );
}
