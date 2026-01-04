'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { dateOnlyToUtc, formatDateDisplay, getDateStringInTimeZone, getTodayDateString, TIME_ZONE_SARAJEVO } from '@/lib/dates';

type Sector = {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
  isActive: boolean;
};

type Employee = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  department: string | null;
  sector: Sector | null;
  sectorId: string | null;
  status: string;
  hireDate: string;
  photo: string | null;
  licenses: Array<{
    id: string;
    licenseType: string;
    licenseNumber: string;
    expiryDate: string;
    status: string;
  }>;
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'employees' | 'alerts'>('employees');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState('');
  const [expiryWindow, setExpiryWindow] = useState('60');
  const [expirySectorFilter, setExpirySectorFilter] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState('ACTIVE');
  const [expirySearch, setExpirySearch] = useState('');
  const [expiryGroupBy, setExpiryGroupBy] = useState<'license' | 'employee'>('license');

  const getDaysUntilExpiry = (expiryDate: string) => {
    const todayStr = getTodayDateString();
    const expiryStr = getDateStringInTimeZone(new Date(expiryDate), TIME_ZONE_SARAJEVO);
    const today = dateOnlyToUtc(todayStr).getTime();
    const expiry = dateOnlyToUtc(expiryStr).getTime();
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (daysUntil: number) => {
    if (daysUntil < 0) return { label: 'Istekla', className: 'bg-red-100 text-red-700' };
    if (daysUntil <= 1) return { label: '1 dan', className: 'bg-red-100 text-red-700' };
    if (daysUntil <= 7) return { label: '7 dana', className: 'bg-orange-100 text-orange-700' };
    if (daysUntil <= 15) return { label: '15 dana', className: 'bg-orange-100 text-orange-700' };
    if (daysUntil <= 30) return { label: '1 mjesec', className: 'bg-amber-100 text-amber-700' };
    if (daysUntil <= 60) return { label: '2 mjeseca', className: 'bg-yellow-100 text-yellow-700' };
    if (daysUntil <= 90) return { label: '3 mjeseca', className: 'bg-lime-100 text-lime-700' };
    return { label: 'Kasnije', className: 'bg-slate-100 text-slate-600' };
  };

  const licenseTypes = useMemo(() => {
    return Array.from(
      new Set(
        employees.flatMap((employee) => employee.licenses.map((license) => license.licenseType))
      )
    ).sort();
  }, [employees]);

  const expiringLicenses = useMemo(() => {
    return employees
      .flatMap((employee) =>
        employee.licenses.map((license) => ({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeStatus: employee.status,
          position: employee.position,
          sector: employee.sector?.name || '-',
          sectorId: employee.sector?.id || '',
          licenseType: license.licenseType,
          licenseNumber: license.licenseNumber,
          licenseStatus: license.status,
          expiryDate: license.expiryDate,
          daysUntil: getDaysUntilExpiry(license.expiryDate),
        }))
      )
      .filter((item) => {
        if (licenseTypeFilter && item.licenseType !== licenseTypeFilter) return false;
        if (expirySectorFilter && item.sectorId !== expirySectorFilter) return false;
        if (licenseStatusFilter && licenseStatusFilter !== 'ALL' && item.licenseStatus !== licenseStatusFilter) {
          return false;
        }
        if (expirySearch) {
          const term = expirySearch.toLowerCase();
          const match =
            item.employeeName.toLowerCase().includes(term) ||
            item.licenseType.toLowerCase().includes(term) ||
            item.licenseNumber.toLowerCase().includes(term);
          if (!match) return false;
        }
        if (expiryWindow === 'expired') {
          return item.daysUntil < 0;
        }
        if (expiryWindow !== 'all') {
          const windowDays = Number(expiryWindow);
          if (item.daysUntil < 0 || item.daysUntil > windowDays) return false;
        }
        return true;
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [
    employees,
    licenseTypeFilter,
    expirySectorFilter,
    expiryWindow,
    licenseStatusFilter,
    expirySearch,
  ]);

  const expiryBuckets = useMemo(() => {
    const buckets = {
      expired: 0,
      d1: 0,
      d7: 0,
      d15: 0,
      d30: 0,
      d60: 0,
      d90: 0,
    };
    expiringLicenses.forEach((item) => {
      if (item.daysUntil < 0) buckets.expired += 1;
      else if (item.daysUntil <= 1) buckets.d1 += 1;
      else if (item.daysUntil <= 7) buckets.d7 += 1;
      else if (item.daysUntil <= 15) buckets.d15 += 1;
      else if (item.daysUntil <= 30) buckets.d30 += 1;
      else if (item.daysUntil <= 60) buckets.d60 += 1;
      else if (item.daysUntil <= 90) buckets.d90 += 1;
    });
    return buckets;
  }, [expiringLicenses]);

  const sectorSummary = useMemo(() => {
    const summary = new Map<string, { name: string; count: number }>();
    expiringLicenses.forEach((item) => {
      const key = item.sectorId || 'none';
      const current = summary.get(key) || { name: item.sector, count: 0 };
      current.count += 1;
      summary.set(key, current);
    });
    return Array.from(summary.values()).sort((a, b) => b.count - a.count);
  }, [expiringLicenses]);

  const employeeGroups = useMemo(() => {
    if (expiryGroupBy !== 'employee') return [];
    const grouped = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        sector: string;
        position: string;
        items: typeof expiringLicenses;
      }
    >();
    expiringLicenses.forEach((item) => {
      const entry = grouped.get(item.employeeId) || {
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        sector: item.sector,
        position: item.position,
        items: [],
      };
      entry.items.push(item);
      grouped.set(item.employeeId, entry);
    });
    return Array.from(grouped.values()).sort((a, b) => a.items.length - b.items.length);
  }, [expiringLicenses, expiryGroupBy]);

  useEffect(() => {
    fetchSectors();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter, sectorFilter, activeTab]);

  const fetchSectors = async () => {
    try {
      const res = await fetch('/api/sectors');
      if (res.ok) {
        const data = await res.json();
        setSectors(data.filter((s: Sector) => s.isActive !== false));
      }
    } catch (err) {
      console.error('Error fetching sectors:', err);
    }
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'employees') {
        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);
        if (sectorFilter) params.append('sectorId', sectorFilter);
      }

      params.append('limit', '1000');
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              activeTab === 'employees'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Radnici
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              activeTab === 'alerts'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Obavještenja o isteku
          </button>
        </div>
      </div>

      {activeTab === 'employees' && (
        <>
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
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Svi sektori</option>
                  {sectors.map(sector => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name} {sector.code ? `(${sector.code})` : ''}
                    </option>
                  ))}
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
        </>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-dark-900">Napredna obavještenja o isteku licenci</h2>
              <p className="text-sm text-dark-600 mt-1">
                Filtrirajte licencе po roku isteka, tipu, sektoru i statusu.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                { label: 'Istekle', value: expiryBuckets.expired, className: 'bg-red-50 text-red-700' },
                { label: '1 dan', value: expiryBuckets.d1, className: 'bg-red-50 text-red-700' },
                { label: '7 dana', value: expiryBuckets.d7, className: 'bg-orange-50 text-orange-700' },
                { label: '15 dana', value: expiryBuckets.d15, className: 'bg-amber-50 text-amber-700' },
                { label: '1 mjesec', value: expiryBuckets.d30, className: 'bg-yellow-50 text-yellow-700' },
                { label: '2 mjeseca', value: expiryBuckets.d60, className: 'bg-lime-50 text-lime-700' },
                { label: '3 mjeseca', value: expiryBuckets.d90, className: 'bg-emerald-50 text-emerald-700' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-3 ${item.className}`}>
                  <p className="text-xs uppercase tracking-wide font-semibold">{item.label}</p>
                  <p className="text-lg font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Input
              value={expirySearch}
              onChange={(e) => setExpirySearch(e.target.value)}
              placeholder="Pretraga radnika ili licence..."
              className="bg-white"
            />
            <select
              value={licenseTypeFilter}
              onChange={(e) => setLicenseTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">Sve licence</option>
              {licenseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={expirySectorFilter}
              onChange={(e) => setExpirySectorFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">Svi sektori</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
            <select
              value={licenseStatusFilter}
              onChange={(e) => setLicenseStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="ALL">Sve licence</option>
              <option value="ACTIVE">Aktivne</option>
              <option value="INACTIVE">Neaktivne</option>
            </select>
            <select
              value={expiryWindow}
              onChange={(e) => setExpiryWindow(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="90">U naredna 3 mjeseca</option>
              <option value="60">U naredna 2 mjeseca</option>
              <option value="30">U naredni mjesec</option>
              <option value="15">U narednih 15 dana</option>
              <option value="7">U narednih 7 dana</option>
              <option value="1">U naredna 1 dan</option>
              <option value="expired">Istekle licence</option>
              <option value="all">Sve licence</option>
            </select>
            <select
              value={expiryGroupBy}
              onChange={(e) => setExpiryGroupBy(e.target.value as 'license' | 'employee')}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="license">Grupisano po licenci</option>
              <option value="employee">Grupisano po radniku</option>
            </select>
          </div>

          {sectorSummary.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                Pregled po sektoru
              </p>
              <div className="flex flex-wrap gap-2">
                {sectorSummary.map((sector) => (
                  <span
                    key={sector.name}
                    className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    {sector.name}: {sector.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-sm text-slate-500">Učitavam obavještenja...</div>
          ) : expiringLicenses.length === 0 ? (
            <div className="text-sm text-slate-500">Nema licenci za odabrane filtere.</div>
          ) : expiryGroupBy === 'license' ? (
            <div className="overflow-x-auto">
              <table className="min-w-[880px] w-full text-sm">
                <thead className="text-left text-slate-500 bg-slate-50">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Radnik</th>
                    <th className="py-2 px-3 font-semibold">Pozicija</th>
                    <th className="py-2 px-3 font-semibold">Licenca</th>
                    <th className="py-2 px-3 font-semibold">Sektor</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                    <th className="py-2 px-3 font-semibold">Ističe</th>
                    <th className="py-2 px-3 font-semibold">Preostalo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiringLicenses.map((item) => {
                    const badge = getExpiryBadge(item.daysUntil);
                    return (
                      <tr
                        key={`${item.employeeId}-${item.licenseNumber}`}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => router.push(`/employees/${item.employeeId}`)}
                      >
                        <td className="py-2 px-3 font-semibold text-slate-900">{item.employeeName}</td>
                        <td className="py-2 px-3 text-slate-700">{item.position}</td>
                        <td className="py-2 px-3 text-slate-700">
                          <div className="font-medium">{item.licenseType}</div>
                          <div className="text-xs text-slate-500 font-mono">{item.licenseNumber}</div>
                        </td>
                        <td className="py-2 px-3 text-slate-700">{item.sector}</td>
                        <td className="py-2 px-3 text-slate-700">{item.licenseStatus}</td>
                        <td className="py-2 px-3 text-slate-700">{formatDateDisplay(item.expiryDate)}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                            {item.daysUntil < 0
                              ? `Istekla prije ${Math.abs(item.daysUntil)} dana`
                              : `${item.daysUntil} dana`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              {employeeGroups.map((group) => (
                <div
                  key={group.employeeId}
                  className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div>
                      <button
                        onClick={() => router.push(`/employees/${group.employeeId}`)}
                        className="text-base font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {group.employeeName}
                      </button>
                      <p className="text-sm text-slate-600">{group.position}</p>
                    </div>
                    <div className="text-sm text-slate-600">{group.sector}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const badge = getExpiryBadge(item.daysUntil);
                      return (
                        <div
                          key={`${group.employeeId}-${item.licenseNumber}`}
                          className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.licenseType}</p>
                            <p className="text-xs text-slate-500 font-mono">{item.licenseNumber}</p>
                            <p className="text-xs text-slate-500">{formatDateDisplay(item.expiryDate)}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                            {item.daysUntil < 0
                              ? `Istekla prije ${Math.abs(item.daysUntil)} dana`
                              : `${item.daysUntil} dana`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'employees' && (isLoading ? (
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
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 relative">
                    <span className="relative z-0">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </span>
                    {employee.photo && (
                      <img
                        src={employee.photo}
                        alt={`${employee.firstName} ${employee.lastName}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
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
                  {employee.sector && (
                    <div className="flex items-center gap-2 text-sm text-dark-600">
                      <Briefcase className="w-4 h-4" />
                      <div className="flex items-center gap-1.5">
                        {employee.sector.color && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: employee.sector.color }}
                          />
                        )}
                        <span>{employee.sector.name}</span>
                      </div>
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
      ))}
    </div>
    </MainLayout>
  );
}
