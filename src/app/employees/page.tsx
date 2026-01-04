'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Briefcase,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/MainLayout';

type Employee = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  department: string | null;
  status: string;
  hireDate: string;
  photo: string | null;
  licenses: Array<{
    id: string;
    licenseType: string;
    expiryDate: string;
    status: string;
  }>;
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter, departmentFilter]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (departmentFilter) params.append('department', departmentFilter);

      const response = await fetch(`/api/employees?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setEmployees(result.data);
      } else {
        setError('Failed to load employees');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-700',
      INACTIVE: 'bg-gray-100 text-gray-700',
      ON_LEAVE: 'bg-orange-100 text-orange-700',
    };
    return styles[status as keyof typeof styles] || styles.ACTIVE;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'ACTIVE') return <CheckCircle className="w-4 h-4" />;
    if (status === 'ON_LEAVE') return <Clock className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getLicenseStatus = (licenses: Employee['licenses']) => {
    const active = licenses.filter(l => l.status === 'ACTIVE').length;
    const expiring = licenses.filter(l => {
      if (l.status !== 'ACTIVE') return false;
      const daysUntilExpiry = Math.floor(
        (new Date(l.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;
    
    return { active, expiring, total: licenses.length };
  };

  return (
    <MainLayout>
    <div className="p-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-dark-600 mb-2">
          <span>Management</span>
          <span>›</span>
          <span className="text-dark-900 font-medium">Radnici</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-900">Radnici</h1>
            <p className="text-dark-600 mt-1">Upravljanje radnicima i njihovim licencama</p>
          </div>
          <Button
            onClick={() => router.push('/employees/new')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj radnika
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Pretraži po imenu, email-u ili broju..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Svi statusi</option>
              <option value="ACTIVE">Aktivan</option>
              <option value="INACTIVE">Neaktivan</option>
              <option value="ON_LEAVE">Na odsustvu</option>
            </select>
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Svi odjeli</option>
              <option value="Operations">Operations</option>
              <option value="Security">Security</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Administration">Administration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-dark-600">Ukupno radnika</p>
              <p className="text-2xl font-bold text-dark-900">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-dark-600">Aktivnih</p>
              <p className="text-2xl font-bold text-dark-900">
                {employees.filter(e => e.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-dark-600">Na odsustvu</p>
              <p className="text-2xl font-bold text-dark-900">
                {employees.filter(e => e.status === 'ON_LEAVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-dark-600">Ukupno licenci</p>
              <p className="text-2xl font-bold text-dark-900">
                {employees.reduce((sum, e) => sum + e.licenses.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-dark-600">Učitavam radnike...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-12 text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-dark-600">Nema radnika za prikaz</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => {
            const licenseStats = getLicenseStatus(employee.licenses);
            
            return (
              <div
                key={employee.id}
                onClick={() => router.push(`/employees/${employee.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-dark-100 p-6 hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Profile Section */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {employee.firstName[0]}{employee.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-dark-900 group-hover:text-blue-600 transition-colors truncate">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-dark-600 truncate">{employee.position}</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium mt-2 ${getStatusBadge(employee.status)}`}>
                      {getStatusIcon(employee.status)}
                      <span>{employee.status === 'ACTIVE' ? 'Aktivan' : employee.status === 'ON_LEAVE' ? 'Na odsustvu' : 'Neaktivan'}</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-dark-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-dark-600">
                      <Phone className="w-4 h-4" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.department && (
                    <div className="flex items-center gap-2 text-sm text-dark-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{employee.department}</span>
                    </div>
                  )}
                </div>

                {/* License Stats */}
                <div className="pt-4 border-t border-dark-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-600">Licence:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dark-900">{licenseStats.active}/{licenseStats.total}</span>
                      {licenseStats.expiring > 0 && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          {licenseStats.expiring} ističe
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </MainLayout>
  );
}

