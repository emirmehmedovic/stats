'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock } from 'lucide-react';

type ProfileUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (!response.ok || !data?.authenticated) {
          throw new Error(data?.error || 'Niste autentifikovani');
        }
        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Greška pri učitavanju profila');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Sva polja za lozinku su obavezna');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Nova lozinka i potvrda se ne poklapaju');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Greška pri promjeni lozinke');
      }
      setSuccess('Lozinka je uspješno promijenjena');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri promjeni lozinke');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <div className="bg-white rounded-3xl shadow-soft p-8 border border-dark-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-900">Profil</h1>
              <p className="text-sm text-dark-500">Vaše korisničke informacije</p>
            </div>
          </div>

          {isLoading && <p className="text-sm text-dark-500">Učitavanje...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Ime</Label>
                <Input value={user.name || ''} readOnly className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user.email} readOnly className="mt-1" />
              </div>
              <div>
                <Label>Uloga</Label>
                <Input value={user.role} readOnly className="mt-1" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-soft p-8 border border-dark-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-dark-900 text-white flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-900">Promjena lozinke</h2>
              <p className="text-sm text-dark-500">Unesite trenutnu i novu lozinku</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Trenutna lozinka</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nova lozinka</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Potvrda lozinke</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {success && <p className="mt-4 text-sm text-green-600">{success}</p>}
          {error && !isLoading && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6">
            <Button onClick={handleChangePassword} disabled={isSaving}>
              {isSaving ? 'Spremam...' : 'Promijeni lozinku'}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
