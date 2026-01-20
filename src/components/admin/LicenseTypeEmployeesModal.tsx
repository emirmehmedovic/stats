'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, UserPlus, Download, X, Calendar, Search, Filter } from 'lucide-react';

interface LicenseType {
  id: string;
  name: string;
  code: string | null;
  validityPeriodMonths: number | null;
}

interface LicenseTypeEmployeesModalProps {
  licenseType: LicenseType;
  onClose: () => void;
}

interface EmployeeLicense {
  id: string;
  licenseNumber: string;
  issuedDate: string;
  expiryDate: string;
  status: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position: string;
    sector?: {
      id: string;
      name: string;
    } | null;
    service?: {
      id: string;
      name: string;
    } | null;
  };
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  position: string;
  sector?: {
    id: string;
    name: string;
  } | null;
  service?: {
    id: string;
    name: string;
  } | null;
  jobPosition?: {
    id: string;
    name: string;
  } | null;
}

interface SectorOption {
  id: string;
  name: string;
  isActive?: boolean | null;
}

interface ServiceOption {
  id: string;
  name: string;
  sector?: {
    id: string;
    name: string;
  } | null;
}

interface PositionOption {
  id: string;
  name: string;
  sector?: {
    id: string;
    name: string;
  } | null;
  service?: {
    id: string;
    name: string;
  } | null;
}

export default function LicenseTypeEmployeesModal({ licenseType, onClose }: LicenseTypeEmployeesModalProps) {
  const [licenses, setLicenses] = useState<EmployeeLicense[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [sectors, setSectors] = useState<SectorOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licensePdf, setLicensePdf] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [addFilterSector, setAddFilterSector] = useState('all');
  const [addFilterService, setAddFilterService] = useState('all');
  const [addFilterPosition, setAddFilterPosition] = useState('all');

  useEffect(() => {
    fetchLicenses();
  }, [licenseType.id]);

  useEffect(() => {
    fetchSectors();
    fetchServices();
    fetchPositions();
  }, []);

  useEffect(() => {
    if (addFilterSector !== 'all') {
      if (addFilterService !== 'all') {
        const matchesSector = services.some(
          service => service.id === addFilterService && service.sector?.id === addFilterSector
        );
        if (!matchesSector) {
          setAddFilterService('all');
        }
      }
      if (addFilterPosition !== 'all') {
        const matchesSector = positions.some(
          position => position.id === addFilterPosition && position.sector?.id === addFilterSector
        );
        if (!matchesSector) {
          setAddFilterPosition('all');
        }
      }
    }
  }, [addFilterSector, addFilterService, addFilterPosition, services, positions]);

  useEffect(() => {
    if (addFilterService !== 'all' && addFilterPosition !== 'all') {
      const matchesService = positions.some(
        position => position.id === addFilterPosition && position.service?.id === addFilterService
      );
      if (!matchesService) {
        setAddFilterPosition('all');
      }
    }
  }, [addFilterService, addFilterPosition, positions]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEmployees();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [addSearchTerm, addFilterSector, addFilterService, addFilterPosition]);

  const fetchLicenses = async () => {
    try {
      const res = await fetch(`/api/license-types/${licenseType.id}/employees`);
      if (res.ok) {
        const data = await res.json();
        setLicenses(data);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams();
      if (addSearchTerm.trim()) params.append('search', addSearchTerm.trim());
      if (addFilterSector !== 'all') params.append('sectorId', addFilterSector);
      if (addFilterService !== 'all') params.append('serviceId', addFilterService);
      if (addFilterPosition !== 'all') params.append('jobPositionId', addFilterPosition);
      params.append('limit', '1000');

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const nextEmployees = (data.data || []).slice().sort((a: EmployeeOption, b: EmployeeOption) => {
          const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
          const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setEmployees(nextEmployees);
        setTotalEmployees(data.pagination?.total || nextEmployees.length);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSectors = async () => {
    try {
      const res = await fetch('/api/sectors');
      if (res.ok) {
        const data = await res.json();
        const active = (data || []).filter((s: SectorOption) => s.isActive !== false);
        setSectors(active);
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await fetch('/api/positions');
      if (res.ok) {
        const data = await res.json();
        setPositions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const calculateExpiryDate = (issuedDateStr: string): string => {
    if (!issuedDateStr || !licenseType.validityPeriodMonths) return '';

    const issued = new Date(issuedDateStr);
    issued.setMonth(issued.getMonth() + licenseType.validityPeriodMonths);
    return issued.toISOString().split('T')[0];
  };

  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !issuedDate) return;
    if (licensePdf && licensePdf.type !== 'application/pdf') {
      alert('Dozvoljen je samo PDF dokument.');
      return;
    }

    setSaving(true);
    try {
      const expiryDate = calculateExpiryDate(issuedDate);

      const res = await fetch(`/api/employees/${selectedEmployee}/licenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseTypeId: licenseType.id,
          licenseNumber: licenseNumber || `${licenseType.code}-${Date.now()}`,
          issuedDate,
          expiryDate,
          status: 'ACTIVE',
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const createdLicenseId = result?.data?.id as string | undefined;

        if (licensePdf && createdLicenseId) {
          const formData = new FormData();
          formData.append('file', licensePdf);
          const uploadRes = await fetch(`/api/licenses/${createdLicenseId}/documents`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const uploadError = await uploadRes.json();
            alert(uploadError.error || 'Licenca je dodana, ali PDF nije uploadovan');
          }
        }

        setShowAddForm(false);
        setSelectedEmployee('');
        setIssuedDate('');
        setLicenseNumber('');
        setLicensePdf(null);
        fetchLicenses();
      } else {
        const error = await res.json();
        alert(error.error || 'Greška pri dodavanju licence');
      }
    } catch (error) {
      console.error('Error adding license:', error);
      alert('Greška pri dodavanju licence');
    } finally {
      setSaving(false);
    }
  };

  const exportToPDF = () => {
    // Otvori PDF export u novom tabu
    window.open(`/api/license-types/${licenseType.id}/export-pdf`, '_blank');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string, expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (status === 'EXPIRED' || daysUntilExpiry < 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Istekla</span>;
    }
    if (daysUntilExpiry <= 30) {
      return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Ističe uskoro</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Aktivna</span>;
  };

  // Get unique sectors, services, and positions
  const licensedSectors = Array.from(
    new Set(licenses.map(l => l.employee.sector?.name).filter((s): s is string => Boolean(s)))
  );
  const licensedServices = Array.from(
    new Set(licenses.map(l => l.employee.service?.name).filter((s): s is string => Boolean(s)))
  );
  const licensedPositions = Array.from(
    new Set(licenses.map(l => l.employee.position).filter((p): p is string => Boolean(p)))
  );

  const availableServices = addFilterSector === 'all'
    ? services
    : services.filter(service => service.sector?.id === addFilterSector);

  const availablePositions = positions.filter(position => {
    if (addFilterSector !== 'all' && position.sector?.id !== addFilterSector) return false;
    if (addFilterService !== 'all' && position.service?.id !== addFilterService) return false;
    return true;
  });

  // Filter licenses
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch =
      license.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = filterSector === 'all' || license.employee.sector?.name === filterSector;
    const matchesService = filterService === 'all' || license.employee.service?.name === filterService;
    const matchesPosition = filterPosition === 'all' || license.employee.position === filterPosition;

    return matchesSearch && matchesSector && matchesService && matchesPosition;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{licenseType.name}</h2>
            <p className="text-sm text-slate-600 mt-1">
              {licenseType.code && <span className="font-mono">{licenseType.code}</span>}
              {licenseType.validityPeriodMonths && (
                <span className="ml-2">• Važenje: {licenseType.validityPeriodMonths} mjeseci</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-6 border-b border-slate-200 flex gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Dodaj radnika
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportuj PDF
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pretraži po imenu, broju radnika, licenci..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Sector Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
              >
                <option value="all">Svi sektori</option>
                {licensedSectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            {/* Service Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
              >
                <option value="all">Sve službe</option>
                {licensedServices.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            {/* Position Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
              >
                <option value="all">Sve pozicije</option>
                {licensedPositions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchTerm || filterSector !== 'all' || filterService !== 'all' || filterPosition !== 'all') && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-slate-600 font-medium">Aktivni filteri:</span>
              {searchTerm && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  Pretraga: "{searchTerm}"
                </span>
              )}
              {filterSector !== 'all' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                  Sektor: {filterSector}
                </span>
              )}
              {filterService !== 'all' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  Služba: {filterService}
                </span>
              )}
              {filterPosition !== 'all' && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
                  Pozicija: {filterPosition}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSector('all');
                  setFilterService('all');
                  setFilterPosition('all');
                }}
                className="ml-2 text-slate-600 hover:text-slate-900 underline"
              >
                Poništi sve
              </button>
            </div>
          )}
        </div>

        {/* Add License Form */}
        {showAddForm && (
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Dodaj radnika sa ovom licencom</h3>
            <form onSubmit={handleAddLicense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pretraži radnike..."
                    value={addSearchTerm}
                    onChange={(e) => setAddSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={addFilterSector}
                    onChange={(e) => setAddFilterSector(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                  >
                    <option value="all">Svi sektori</option>
                    {sectors.map(sector => (
                      <option key={sector.id} value={sector.id}>{sector.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={addFilterService}
                    onChange={(e) => setAddFilterService(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                  >
                    <option value="all">Sve službe</option>
                    {availableServices.map(service => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={addFilterPosition}
                    onChange={(e) => setAddFilterPosition(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                  >
                    <option value="all">Sve pozicije</option>
                    {availablePositions.map(position => (
                      <option key={position.id} value={position.id}>{position.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(addSearchTerm || addFilterSector !== 'all' || addFilterService !== 'all' || addFilterPosition !== 'all') && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium">
                    Prikazano: {employees.length} / {totalEmployees}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAddSearchTerm('');
                      setAddFilterSector('all');
                      setAddFilterService('all');
                      setAddFilterPosition('all');
                    }}
                    className="text-slate-600 hover:text-slate-900 underline"
                  >
                    Poništi filtere
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Radnik <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Odaberi radnika --</option>
                    {employees.length === 0 && (
                      <option value="" disabled>Nema radnika za odabrane filtere</option>
                    )}
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Datum sticanja <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Broj licence
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Automatski ako ostavite prazno"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    PDF licence
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setLicensePdf(file);
                    }}
                    className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Dozvoljen je samo PDF (max 10MB).</p>
                </div>
              </div>

              {issuedDate && licenseType.validityPeriodMonths && (
                <div className="p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700">
                      Datum isteka će biti: <span className="font-semibold text-slate-900">
                        {formatDate(calculateExpiryDate(issuedDate))}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Dodavanje...' : 'Dodaj licencu'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setLicensePdf(null);
                  }}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Employees Table */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-600">Učitavanje...</div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Nema radnika sa ovom licencom</p>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Nema radnika koji odgovaraju filterima</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSector('all');
                  setFilterService('all');
                  setFilterPosition('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Poništi filtere
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Radnik</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Sektor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Služba</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Pozicija</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Broj licence</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Datum sticanja</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Datum isteka</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLicenses.map((license) => (
                    <tr key={license.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/employees/${license.employee.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {license.employee.firstName} {license.employee.lastName}
                        </Link>
                        <p className="text-xs text-slate-500 font-mono">{license.employee.employeeNumber}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {license.employee.sector?.name || <span className="text-slate-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {license.employee.service?.name || <span className="text-slate-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">{license.employee.position}</td>
                      <td className="py-3 px-4 text-sm text-slate-700 font-mono">{license.licenseNumber}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{formatDate(license.issuedDate)}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{formatDate(license.expiryDate)}</td>
                      <td className="py-3 px-4">{getStatusBadge(license.status, license.expiryDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                Prikazano: {filteredLicenses.length} / {licenses.length}
              </span>
              {filteredLicenses.length !== licenses.length && (
                <span className="text-xs text-slate-500">
                  ({licenses.length - filteredLicenses.length} filtrirano)
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
