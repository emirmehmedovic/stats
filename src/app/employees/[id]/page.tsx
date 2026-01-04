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
import { showToast } from '@/components/ui/toast';
import { formatDateDisplay } from '@/lib/dates';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'licenses'>('overview');
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

    const daysUntilExpiry = Math.floor(
      (new Date(license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'Istekla' };
    }
    if (daysUntilExpiry <= 30) {
      return { bg: 'bg-orange-100', text: 'text-orange-700', label: `Ističe za ${daysUntilExpiry} dana` };
    }
    return { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktivna' };
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Učitavam podatke...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-700">{error || 'Employee not found'}</p>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(employee.status);

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb & Actions */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
          <button
            onClick={() => router.push('/employees')}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Nazad na listu
          </button>
          <span>›</span>
          <span>Management</span>
          <span>›</span>
          <span>Radnici</span>
          <span>›</span>
          <span className="text-slate-900 font-medium">{employee.firstName} {employee.lastName}</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Profil radnika</h1>
          <Button
            onClick={() => router.push(`/employees/${employeeId}/edit`)}
            variant="outline"
          >
            <Edit className="w-4 h-4 mr-2" />
            Uredi
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="text-lg text-slate-600">{employee.position}</p>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusBadge.bg} ${statusBadge.text} font-medium`}>
                {statusBadge.icon}
                <span>{statusBadge.label}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-5 h-5" />
                <span>{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-5 h-5" />
                  <span>{employee.phone}</span>
                </div>
              )}
              {employee.department && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Briefcase className="w-5 h-5" />
                  <span>{employee.department}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar className="w-5 h-5" />
                <span>Zaposlen: {formatDateDisplay(employee.hireDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Aktivne licence</p>
              <p className="text-2xl font-bold text-slate-900">{employee.stats.activeLicenses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Ističu uskoro</p>
              <p className="text-2xl font-bold text-slate-900">{employee.stats.expiringLicenses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Ukupno licenci</p>
              <p className="text-2xl font-bold text-slate-900">{employee.stats.totalLicenses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Pregled
            </button>
            <button
              onClick={() => setActiveTab('licenses')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'licenses'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Licence ({employee.licenses.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-slate-700">Broj radnika</label>
                  <p className="mt-1 text-slate-900">{employee.employeeNumber}</p>
                </div>
                {employee.nationalId && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">JMBG</label>
                    <p className="mt-1 text-slate-900">{employee.nationalId}</p>
                  </div>
                )}
                {employee.dateOfBirth && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Datum rođenja</label>
                    <p className="mt-1 text-slate-900">
                      {formatDateDisplay(employee.dateOfBirth)}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-700">Datum zaposlenja</label>
                  <p className="mt-1 text-slate-900">
                    {formatDateDisplay(employee.hireDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'licenses' && (
            <div className="space-y-4">
              {/* Add License Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setIsAddLicenseModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj licencu
                </Button>
              </div>

              {employee.licenses.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Nema licenci za ovog radnika</p>
                  <Button
                    onClick={() => setIsAddLicenseModalOpen(true)}
                    variant="outline"
                    className="mt-4"
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
                      className="p-6 border border-slate-200 rounded-xl hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">{license.licenseType}</h3>
                          <p className="text-sm text-slate-600">{license.licenseNumber}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </div>
                          <Button
                            onClick={() => setEditingLicense(license)}
                            variant="outline"
                            size="sm"
                            className="border-slate-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Izdato:</span>
                          <span className="ml-2 text-slate-900">
                            {formatDateDisplay(license.issuedDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600">Ističe:</span>
                          <span className="ml-2 text-slate-900">
                            {formatDateDisplay(license.expiryDate)}
                          </span>
                        </div>
                        {license.issuer && (
                          <div className="col-span-2">
                            <span className="text-slate-600">Izdavač:</span>
                            <span className="ml-2 text-slate-900">{license.issuer}</span>
                          </div>
                        )}
                        {license.requiredForPosition && (
                          <div className="col-span-2">
                            <span className="text-slate-600">Potrebna za poziciju:</span>
                            <span className="ml-2 text-slate-900">{license.requiredForPosition}</span>
                          </div>
                        )}
                      </div>

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
        </div>
      </div>

      {/* Add License Modal */}
      <AddLicenseModal
        employeeId={employeeId}
        isOpen={isAddLicenseModalOpen}
        onClose={() => setIsAddLicenseModalOpen(false)}
        onSuccess={() => {
          fetchEmployee(); // Refresh employee data
        }}
      />

      {/* Edit License Modal */}
      {editingLicense && (
        <EditLicenseModal
          license={editingLicense}
          isOpen={!!editingLicense}
          onClose={() => setEditingLicense(null)}
          onSuccess={() => {
            fetchEmployee(); // Refresh employee data
            setEditingLicense(null);
          }}
          onDelete={() => {
            fetchEmployee(); // Refresh employee data
            setEditingLicense(null);
          }}
        />
      )}
    </div>
  );
}
