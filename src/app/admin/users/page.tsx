'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Shield, User as UserIcon, UserCheck, Eye, Briefcase, Database, Shuffle } from 'lucide-react';
import { formatDateDisplay } from '@/lib/dates';
import { RouteMigrationModal } from '@/components/admin/RouteMigrationModal';
import { FlightTypeMigrationModal } from '@/components/admin/FlightTypeMigrationModal';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW';
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
    role: 'VIEWER' as 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW',
    isActive: true,
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
      });
    } else {
      setEditingUser(null);
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'VIEWER',
        isActive: true,
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
      VIEWER: 'bg-gray-100 text-gray-700',
    };
    return styles[role as keyof typeof styles] || styles.VIEWER;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-dark-500">Učitavam korisnike...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !users.length) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark-900 mb-2">Upravljanje korisnicima</h1>
              <p className="text-dark-500">Kreirajte i upravljajte korisničkim nalozima</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFlightTypeMigrationModal(true)}
                className="flex items-center gap-2 px-5 py-3 border border-emerald-300 text-emerald-800 bg-emerald-50 font-semibold rounded-2xl hover:bg-emerald-100 transition-all shadow-soft"
              >
                <Shuffle className="w-5 h-5" />
                Migriraj tipove leta
              </button>
              <button
                onClick={() => setShowRouteMigrationModal(true)}
                className="flex items-center gap-2 px-5 py-3 border border-purple-300 text-purple-800 bg-purple-50 font-semibold rounded-2xl hover:bg-purple-100 transition-all shadow-soft"
              >
                <Database className="w-5 h-5" />
                Migriraj rute
              </button>
              <button
                onClick={handleBulkVerify}
                disabled={isBulkVerifying}
                className="flex items-center gap-2 px-5 py-3 border border-amber-300 text-amber-800 bg-amber-50 font-semibold rounded-2xl hover:bg-amber-100 transition-all shadow-soft"
              >
                {isBulkVerifying ? 'Verifikujem...' : 'Verifikuj starije letove'}
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-dark-900 to-dark-800 text-white font-semibold rounded-2xl hover:from-dark-800 hover:to-dark-700 transition-all shadow-soft-xl"
              >
                <Plus className="w-5 h-5" />
                Novi korisnik
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {bulkVerifyMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-sm text-emerald-700">{bulkVerifyMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-soft-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                    Korisnik
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                    Uloga
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-700 uppercase tracking-wider">
                    Kreiran
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-dark-700 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-dark-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-dark-900">
                            {user.name || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-dark-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Aktivan' : 'Neaktivan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                      {formatDateDisplay(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
            <div className="bg-white rounded-3xl shadow-soft-xl max-w-md w-full p-8 relative">
              <h2 className="text-2xl font-bold text-dark-900 mb-6">
                {editingUser ? 'Uredi korisnika' : 'Novi korisnik'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
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
