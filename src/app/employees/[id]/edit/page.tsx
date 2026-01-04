'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/ui/toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Image from 'next/image';

type Sector = {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
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
  sectorId: string | null;
  photo: string | null;
  status: string;
};

export default function EmployeeEditPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    dateOfBirth: '',
    hireDate: '',
    position: '',
    sectorId: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchEmployee();
    fetchSectors();
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      const result = await response.json();

      if (result.success) {
        const emp = result.data;
        setEmployee(emp);
        setFormData({
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          phone: emp.phone || '',
          nationalId: emp.nationalId || '',
          dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '',
          hireDate: emp.hireDate.split('T')[0],
          position: emp.position,
          sectorId: emp.sectorId || '',
          status: emp.status,
        });
        if (emp.photo) {
          setPhotoPreview(emp.photo);
        }
      } else {
        setError('Failed to load employee');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSectors = async () => {
    try {
      const res = await fetch('/api/sectors');
      if (res.ok) {
        const data = await res.json();
        setSectors(data.filter((s: Sector & { isActive: boolean }) => s.isActive));
      }
    } catch (err) {
      console.error('Error fetching sectors:', err);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Slika ne može biti veća od 5MB', 'error');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showToast('Molimo izaberite sliku', 'error');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      // First, upload photo if there's a new one
      let photoUrl = employee?.photo;
      if (photoFile) {
        const formDataPhoto = new FormData();
        formDataPhoto.append('file', photoFile);
        formDataPhoto.append('employeeId', employeeId);

        const photoResponse = await fetch('/api/upload/employee-photo', {
          method: 'POST',
          body: formDataPhoto,
        });

        if (photoResponse.ok) {
          const photoResult = await photoResponse.json();
          photoUrl = photoResult.url;
        } else {
          throw new Error('Failed to upload photo');
        }
      }

      // Then update employee data
      const updateData = {
        ...formData,
        phone: formData.phone || null,
        nationalId: formData.nationalId || null,
        dateOfBirth: formData.dateOfBirth || null,
        sectorId: formData.sectorId || null,
        photo: photoUrl,
      };

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Podaci o radniku su uspješno ažurirani!', 'success');
        router.push(`/employees/${employeeId}`);
      } else {
        setError(result.error || 'Failed to update employee');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
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

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/employees/${employeeId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Nazad na profil</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Uredi radnika</h1>
          <p className="text-slate-600 mt-1">
            {employee.firstName} {employee.lastName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="space-y-6">
            {/* Photo Upload Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Profilna slika</h3>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {photoPreview ? (
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden">
                      <Image
                        src={photoPreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold">
                      {formData.firstName[0]}
                      {formData.lastName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={handlePhotoClick}
                    variant="outline"
                    className="mb-2"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {photoPreview ? 'Promijeni sliku' : 'Dodaj sliku'}
                  </Button>
                  <p className="text-xs text-slate-500">
                    PNG, JPG ili GIF. Maksimalno 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Osnovne informacije</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Ime *</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Prezime *</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="nationalId">JMBG</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => handleChange('nationalId', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Datum rođenja</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Detalji zaposlenja</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Pozicija *</Label>
                  <Input
                    id="position"
                    required
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="sectorId">Sektor</Label>
                  <select
                    id="sectorId"
                    value={formData.sectorId}
                    onChange={(e) => handleChange('sectorId', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Bez sektora</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name} {sector.code ? `(${sector.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="hireDate">Datum zaposlenja *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    required
                    value={formData.hireDate}
                    onChange={(e) => handleChange('hireDate', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Aktivan</option>
                    <option value="INACTIVE">Neaktivan</option>
                    <option value="ON_LEAVE">Na odsustvu</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Spremam...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Sačuvaj promjene
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/employees/${employeeId}`)}
                disabled={isSaving}
              >
                Otkaži
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
