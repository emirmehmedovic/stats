'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatDateTimeDisplay } from '@/lib/dates';
import { PackagePlus } from 'lucide-react';

interface Sector {
  id: string;
  name: string;
  code?: string | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  sector?: Sector | null;
}

interface EquipmentAssignment {
  id: string;
  equipmentName: string;
  notes?: string | null;
  assignedAt: string;
  returnedAt?: string | null;
  employee?: Employee | null;
  sector?: Sector | null;
}

export default function ItEquipmentPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturning, setIsReturning] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW' | null>(null);
  const [isRoleChecking, setIsRoleChecking] = useState(true);
  const [assignmentTarget, setAssignmentTarget] = useState<'employee' | 'sector'>('employee');
  const [employeeId, setEmployeeId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  const employeeOptions = useMemo(() => {
    return [...employees].sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [employees]);

  const filteredAssignments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const sectorName = assignment.sector?.name || assignment.employee?.sector?.name || '';
      const employeeName = assignment.employee
        ? `${assignment.employee.firstName} ${assignment.employee.lastName}`
        : '';
      const matchesQuery = !query
        || employeeName.toLowerCase().includes(query)
        || sectorName.toLowerCase().includes(query)
        || assignment.equipmentName.toLowerCase().includes(query);
      const sectorIdValue = assignment.sector?.id || assignment.employee?.sector?.id || '';
      const matchesSector = !sectorFilter || sectorIdValue === sectorFilter;
      return matchesQuery && matchesSector;
    });
  }, [assignments, searchTerm, sectorFilter]);

  useEffect(() => {
    const role = localStorage.getItem('userRole') as 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW' | null;
    setUserRole(role);
    setIsRoleChecking(false);
    if (role && role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [employeesRes, sectorsRes, assignmentsRes] = await Promise.all([
          fetch('/api/employees?limit=500&status=ACTIVE'),
          fetch('/api/sectors'),
          fetch('/api/equipment-assignments'),
        ]);

        if (!employeesRes.ok) {
          throw new Error('Ne mogu učitati radnike');
        }
        if (!sectorsRes.ok) {
          throw new Error('Ne mogu učitati sektore');
        }
        if (!assignmentsRes.ok) {
          throw new Error('Ne mogu učitati zaduženja');
        }

        const employeesData = await employeesRes.json();
        const sectorsData = await sectorsRes.json();
        const assignmentsData = await assignmentsRes.json();

        setEmployees(employeesData.data || []);
        setSectors(sectorsData || []);
        setAssignments(assignmentsData.data || []);
      } catch (err) {
        console.error(err);
        setError('Došlo je do greške pri učitavanju podataka.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isRoleChecking) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center text-sm text-slate-500">Provjera pristupa...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (userRole && userRole !== 'ADMIN') {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-sm text-red-700">Nemate pristup ovoj stranici.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!equipmentName.trim()) {
      setError('Unesite naziv opreme.');
      return;
    }
    if (assignmentTarget === 'employee' && !employeeId) {
      setError('Odaberite radnika za zaduženje.');
      return;
    }
    if (assignmentTarget === 'sector' && !sectorId) {
      setError('Odaberite sektor za zaduženje.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/equipment-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: assignmentTarget === 'employee' ? employeeId : null,
          sectorId: assignmentTarget === 'sector' ? sectorId : null,
          equipmentName: equipmentName.trim(),
          notes: notes.trim() ? notes.trim() : null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Greška pri čuvanju zaduženja');
      }

      setAssignments((prev) => [result.data, ...prev]);
      setEmployeeId('');
      setSectorId('');
      setEquipmentName('');
      setNotes('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Greška pri čuvanju zaduženja');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async (assignmentId: string) => {
    setIsReturning(assignmentId);
    setError('');

    try {
      const response = await fetch(`/api/equipment-assignments/${assignmentId}`, {
        method: 'PATCH',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Greška pri razduženju');
      }

      setAssignments((prev) => prev.map((item) => (
        item.id === assignmentId ? result.data : item
      )));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Greška pri razduženju');
    } finally {
      setIsReturning(null);
    }
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-dark-900">IT oprema</h1>
            <p className="text-sm text-dark-500">Lista zaduženja i dodavanje nove opreme po radniku ili sektoru.</p>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-white shadow-soft border-[6px] border-white text-dark-700 text-sm font-semibold">
            {assignments.length} zaduženja
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-6 text-white shadow-soft-xl relative overflow-hidden flex flex-col gap-6">
            <div className="absolute top-0 right-0 w-56 h-56 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-dark-300 text-sm font-medium mb-1">Aktivna zaduženja</p>
                <h3 className="text-4xl font-bold tracking-tight">{assignments.length}</h3>
                <p className="text-xs text-dark-300 mt-2">Ukupno evidentiranih uređaja</p>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <PackagePlus className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[11px] uppercase tracking-wide text-dark-200 font-semibold">Radnici</p>
                  <p className="text-xl font-bold text-primary-200">{employees.length}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[11px] uppercase tracking-wide text-dark-200 font-semibold">Sektori</p>
                  <p className="text-xl font-bold text-blue-200">{sectors.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 bg-white rounded-3xl shadow-soft border-[6px] border-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-dark-900">Novo zaduženje</h2>
                <p className="text-sm text-dark-500">Dodijelite opremu radniku ili sektoru.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-dark-50 text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                Forma
              </span>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-dark-700 mb-2">Zaduženje na</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignmentTarget('employee')}
                    className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${
                      assignmentTarget === 'employee'
                        ? 'bg-dark-900 text-white border-dark-900'
                        : 'bg-white text-dark-700 border-slate-200'
                    }`}
                  >
                    Radnik
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentTarget('sector')}
                    className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${
                      assignmentTarget === 'sector'
                        ? 'bg-dark-900 text-white border-dark-900'
                        : 'bg-white text-dark-700 border-slate-200'
                    }`}
                  >
                    Sektor
                  </button>
                </div>
              </div>

              {assignmentTarget === 'employee' ? (
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">Radnik</label>
                  <select
                    value={employeeId}
                    onChange={(event) => setEmployeeId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Odaberite radnika</option>
                    {employeeOptions.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.lastName} {employee.firstName} · {employee.employeeNumber}
                        {employee.sector?.name ? ` · ${employee.sector.name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">Sektor</label>
                  <select
                    value={sectorId}
                    onChange={(event) => setSectorId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Odaberite sektor</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">Naziv opreme</label>
                <input
                  type="text"
                  value={equipmentName}
                  onChange={(event) => setEquipmentName(event.target.value)}
                  placeholder="Laptop Dell 5420"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-dark-700 mb-2">Napomena (opcionalno)</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Serijski broj, stanje opreme..."
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-dark-900 px-4 py-3 text-sm font-semibold text-white hover:bg-dark-800 disabled:opacity-60"
                >
                  {isSubmitting ? 'Čuvam...' : 'Dodaj zaduženje'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-soft border-[6px] border-white">
          <div className="border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-dark-900">Lista zaduženja</h2>
              <p className="text-sm text-dark-500">Pregled opreme po radnicima i sektorima.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Pretraži po imenu, sektoru ili opremi..."
                className="w-64 rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={sectorFilter}
                onChange={(event) => setSectorFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Svi sektori</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
              <span className="px-3 py-1 rounded-full bg-dark-50 text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                Evidencija
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Zaduženo na</th>
                  <th className="px-6 py-3 text-left font-semibold">Tip</th>
                  <th className="px-6 py-3 text-left font-semibold">Sektor</th>
                  <th className="px-6 py-3 text-left font-semibold">Oprema</th>
                  <th className="px-6 py-3 text-left font-semibold">Zaduženo</th>
                  <th className="px-6 py-3 text-left font-semibold">Razduženo</th>
                  <th className="px-6 py-3 text-left font-semibold">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((assignment) => {
                  const isSectorAssignment = Boolean(assignment.sector);
                  const displaySector = assignment.sector?.name || assignment.employee?.sector?.name || '-';
                  return (
                    <tr key={assignment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-900">
                        {assignment.employee ? (
                          <>
                            {assignment.employee.lastName} {assignment.employee.firstName}
                            <span className="block text-xs text-slate-500">
                              {assignment.employee.employeeNumber}
                            </span>
                          </>
                        ) : (
                          <span className="font-medium text-slate-900">{assignment.sector?.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            isSectorAssignment ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isSectorAssignment ? 'Sektor' : 'Radnik'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-700">{displaySector}</td>
                      <td className="px-6 py-3 text-slate-700">
                        <span className="font-medium text-slate-900">{assignment.equipmentName}</span>
                        {assignment.notes && (
                          <span className="block text-xs text-slate-500">{assignment.notes}</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {formatDateTimeDisplay(assignment.assignedAt)}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {assignment.returnedAt ? formatDateTimeDisplay(assignment.returnedAt) : '-'}
                      </td>
                      <td className="px-6 py-3">
                        {assignment.returnedAt ? (
                          <span className="text-xs text-slate-400">Razduženo</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReturn(assignment.id)}
                            disabled={isReturning === assignment.id}
                            className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-60"
                          >
                            {isReturning === assignment.id ? 'Razdužujem...' : 'Razduži'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!filteredAssignments.length && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                      Nema rezultata za zadate filtere.
                    </td>
                  </tr>
                )}
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                      Učitavanje...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
