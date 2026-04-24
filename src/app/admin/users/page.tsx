'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Shield, User as UserIcon, UserCheck, Eye, Briefcase, Database, Shuffle, DollarSign } from 'lucide-react';
import { formatDateDisplay } from '@/lib/dates';
import { RouteMigrationModal } from '@/components/admin/RouteMigrationModal';
import { FlightTypeMigrationModal } from '@/components/admin/FlightTypeMigrationModal';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW' | 'NAPLATE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);
  const [bulkVerifyMessage, setBulkVerifyMessage] = useState<string | null>(null);
  const [showBulkVerifyModal, setShowBulkVerifyModal] = useState(false);
  const [showRouteMigrationModal, setShowRouteMigrationModal] = useState(false);
  const [showFlightTypeMigrationModal, setShowFlightTypeMigrationModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'VIEWER' as 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW' | 'NAPLATE',
    isActive: true,
    billingPin: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Nemate dozvolu za pristup ovoj stranici');
        } else {
          setError('Greška pri učitavanju korisnika');
        }
        return;
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError('Greška pri učitavanju korisnika');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        name: user.name || '',
        role: user.role,
        isActive: user.isActive,
        billingPin: '',
      });
    } else {
      setEditingUser(null);
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'VIEWER',
        isActive: true,
        billingPin: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
      setShowModal(false);
    setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'VIEWER',
      isActive: true,
      billingPin: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const payload: any = {
        email: formData.email,
        name: formData.name || null,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (formData.password) {
        payload.password = formData.password;
      }
      if (formData.billingPin) {
        payload.billingPin = formData.billingPin;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri čuvanju korisnika');
      }

      handleCloseModal();
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Greška pri čuvanju korisnika');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovog korisnika?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri brisanju korisnika');
      }

      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Greška pri brisanju korisnika');
    }
  };

  const handleBulkVerify = async () => {
    if (!confirm('Verifikovati sve letove prije današnjeg datuma koji nisu verifikovani?')) {
      return;
    }

    try {
      setIsBulkVerifying(true);
      setShowBulkVerifyModal(true);
      setError(null);
      setBulkVerifyMessage(null);

      const response = await fetch('/api/daily-operations/verification/bulk', {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Greška pri verifikaciji operacija');
      }

      const { totalFlights, verifiedFlights } = data.data || {};
      setBulkVerifyMessage(
        `Verifikovano ${verifiedFlights || 0} letova. Ukupno dostupno: ${totalFlights || 0}.`
      );
    } catch (err: any) {
      setError(err.message || 'Greška pri verifikaciji operacija');
    } finally {
      setIsBulkVerifying(false);
      setShowBulkVerifyModal(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'MANAGER':
        return <UserCheck className="w-5 h-5 text-blue-600" />;
      case 'OPERATIONS':
        return <Briefcase className="w-5 h-5 text-emerald-600" />;
      case 'STW':
        return <Database className="w-5 h-5 text-violet-600" />;
      case 'NAPLATE':
        return <DollarSign className="w-5 h-5 text-amber-600" />;
      default:
        return <Eye className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-red-100 text-red-700',
      MANAGER: 'bg-blue-100 text-blue-700',
      OPERATIONS: 'bg-emerald-100 text-emerald-700',
      STW: 'bg-violet-100 text-violet-700',
      NAPLATE: 'bg-amber-100 text-amber-700',
      VIEWER: 'bg-gray-100 text-gray-700',
    };
    return styles[role as keyof typeof styles] || styles.VIEWER;
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-center py-12 lg:py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-sm lg:text-base text-dark-500">Učitavam korisnike...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !users.length) {
    return (
      <div className="p-4 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl lg:rounded-2xl p-4 lg:p-5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
      <div className="p-4 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-dark-900 mb-2">Upravljanje korisnicima</h1>
              <p className="text-sm lg:text-base text-dark-500">Kreirajte i upravljajte korisničkim nalozima</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-3">
              <button
                onClick={() => setShowFlightTypeMigrationModal(true)}
                className="flex items-center justify-center gap-2 px-3 lg:px-5 py-2.5 lg:py-3 border border-emerald-300 text-emerald-800 bg-emerald-50 font-semibold rounded-xl lg:rounded-2xl hover:bg-emerald-100 transition-all shadow-soft text-sm lg:text-base"
              >
                <Shuffle className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden md:inline">Migriraj tipove leta</span>
                <span className="md:hidden">Tipovi</span>
              </button>
              <button
                onClick={() => setShowRouteMigrationModal(true)}
                className="flex items-center justify-center gap-2 px-3 lg:px-5 py-2.5 lg:py-3 border border-purple-300 text-purple-800 bg-purple-50 font-semibold rounded-xl lg:rounded-2xl hover:bg-purple-100 transition-all shadow-soft text-sm lg:text-base"
              >
                <Database className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden md:inline">Migriraj rute</span>
                <span className="md:hidden">Rute</span>
              </button>
              <button
                onClick={handleBulkVerify}
                disabled={isBulkVerifying}
                className="flex items-center justify-center gap-2 px-3 lg:px-5 py-2.5 lg:py-3 border border-amber-300 text-amber-800 bg-amber-50 font-semibold rounded-xl lg:rounded-2xl hover:bg-amber-100 transition-all shadow-soft text-sm lg:text-base"
              >
                <span className="hidden md:inline">{isBulkVerifying ? 'Verifikujem...' : 'Verifikuj starije letove'}</span>
                <span className="md:hidden">Verifikuj</span>
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 bg-gradient-to-br from-dark-900 to-dark-800 text-white font-semibold rounded-xl lg:rounded-2xl hover:from-dark-800 hover:to-dark-700 transition-all shadow-soft-xl text-sm lg:text-base"
              >
                <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">Novi korisnik</span>
                <span className="sm:hidden">Novi</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 lg:mb-6 bg-red-50 border border-red-200 rounded-xl lg:rounded-2xl p-3 lg:p-4">
            <p className="text-xs lg:text-sm text-red-700">{error}</p>
          </div>
        )}
        {bulkVerifyMessage && (
          <div className="mb-4 lg:mb-6 bg-emerald-50 border border-emerald-200 rounded-xl lg:rounded-2xl p-3 lg:p-4">
            <p className="text-xs lg:text-sm text-emerald-700">{bulkVerifyMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-dark-50">
                <tr>
                  <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                    Korisnik
                  </th>
                  <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                    Uloga
                  </th>
                  <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider hidden lg:table-cell">
                    Kreiran
                  </th>
                  <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs font-semibold text-dark-700 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-dark-50 transition-colors">
                    <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <UserIcon className="w-4 h-4 lg:w-5 lg:h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="text-xs lg:text-sm font-semibold text-dark-900">
                            {user.name || 'N/A'}
                          </div>
                          <div className="text-xs text-dark-600 md:hidden">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-xs lg:text-sm text-dark-600">{user.email}</div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 lg:gap-2">
                        <span className="hidden sm:inline">{getRoleIcon(user.role)}</span>
                        <span className={`px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs font-semibold ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                      <span className={`px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs font-semibold ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className="hidden sm:inline">{user.isActive ? 'Aktivan' : 'Neaktivan'}</span>
                        <span className="sm:hidden">{user.isActive ? 'A' : 'N'}</span>
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-dark-500 hidden lg:table-cell">
                      {formatDateDisplay(user.createdAt)}
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1 lg:gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-lg lg:rounded-xl transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 lg:p-2 text-red-600 hover:bg-red-50 rounded-lg lg:rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft-xl max-w-md w-full p-4 lg:p-8 relative max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl lg:text-2xl font-bold text-dark-900 mb-4 lg:mb-6">
                {editingUser ? 'Uredi korisnika' : 'Novi korisnik'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    Ime
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    {editingUser ? 'Nova lozinka (ostavite prazno da ne promijenite)' : 'Lozinka *'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required={!editingUser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    PIN za naplate {formData.role === 'NAPLATE' ? '*' : '(opciono)'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.billingPin}
                    onChange={(e) => setFormData({ ...formData, billingPin: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600"
                    maxLength={6}
                    required={!editingUser && formData.role === 'NAPLATE'}
                  />
                  <p className="text-xs text-dark-400 mt-2">
                    PIN mora imati 4-6 cifara. Prazno ostavite ako ne mijenjate postojeći PIN.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    Uloga *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-3 border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="STW">STW</option>
                    <option value="OPERATIONS">Operacije</option>
                    <option value="MANAGER">Manager</option>
                    <option value="NAPLATE">Naplate</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm text-dark-700">
                    Aktivan
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 border border-dark-200 rounded-2xl text-dark-700 font-semibold hover:bg-dark-50 transition-colors"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-br from-dark-900 to-dark-800 text-white font-semibold rounded-2xl hover:from-dark-800 hover:to-dark-700 transition-all"
                  >
                    {editingUser ? 'Sačuvaj' : 'Kreiraj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showBulkVerifyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-soft-xl max-w-sm w-full p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                <div>
                  <h3 className="text-lg font-semibold text-dark-900">Verifikacija u toku</h3>
                  <p className="text-sm text-dark-500">Pripremam verifikaciju starijih letova...</p>
                </div>
              </div>
              <p className="text-xs text-dark-400">
                Ovo može potrajati nekoliko sekundi u zavisnosti od broja dana.
              </p>
            </div>
          </div>
        )}

        <RouteMigrationModal
          isOpen={showRouteMigrationModal}
          onClose={() => setShowRouteMigrationModal(false)}
        />
        <FlightTypeMigrationModal
          isOpen={showFlightTypeMigrationModal}
          onClose={() => setShowFlightTypeMigrationModal(false)}
        />
      </div>
  );
}
