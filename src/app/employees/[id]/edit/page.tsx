'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, Camera, Clock, Calendar } from 'lucide-react';
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
  workScheduleType: 'STANDARD' | 'SHIFT_WORK';
  standardStartTime: string | null;
  standardEndTime: string | null;
  expectedHoursPerDay: number | null;
  shiftStartTime1: string | null;
  shiftEndTime1: string | null;
  shiftStartTime2: string | null;
  shiftEndTime2: string | null;
  shiftRotationStart: string | null;
};

export default function EmployeeEditPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const employeeId = params.id as string;
  const isWorkTimeOnly = searchParams.get('section') === 'work-time';
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
    workScheduleType: 'STANDARD',
    standardStartTime: '08:00',
    standardEndTime: '16:00',
    expectedHoursPerDay: '8',
    shiftStartTime1: '06:00',
    shiftEndTime1: '14:00',
    shiftStartTime2: '14:00',
    shiftEndTime2: '22:00',
    shiftRotationStart: '',
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
            workScheduleType: emp.workScheduleType || 'STANDARD',
            standardStartTime: emp.standardStartTime || '08:00',
            standardEndTime: emp.standardEndTime || '16:00',
            expectedHoursPerDay: emp.expectedHoursPerDay?.toString() || '8',
            shiftStartTime1: emp.shiftStartTime1 || '06:00',
            shiftEndTime1: emp.shiftEndTime1 || '14:00',
            shiftStartTime2: emp.shiftStartTime2 || '14:00',
            shiftEndTime2: emp.shiftEndTime2 || '22:00',
            shiftRotationStart: emp.shiftRotationStart ? emp.shiftRotationStart.split('T')[0] : '',
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
            <span className="font-medium">{isWorkTimeOnly ? 'Nazad na evidenciju' : 'Nazad na profil'}</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{isWorkTimeOnly ? 'Podesi smjene' : 'Uredi radnika'}</h1>
          <p className="text-slate-600 mt-1">
            {employee.firstName} {employee.lastName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="space-y-6">
            {!isWorkTimeOnly && (
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
            )}

            {!isWorkTimeOnly && (
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
            )}

            {!isWorkTimeOnly && (
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
            )}

            <div className="bg-white rounded-3xl shadow-soft border-[6px] border-white p-8 relative overflow-hidden group" id="work-time-settings">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all pointer-events-none rounded-3xl"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 transition-all pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-2xl shadow-soft">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-dark-900">Radno vrijeme i smjene</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="workScheduleType" className="text-sm font-bold text-dark-700">Tip radnog vremena</Label>
                    <select
                      id="workScheduleType"
                      value={formData.workScheduleType}
                      onChange={(e) => handleChange('workScheduleType', e.target.value)}
                      className="mt-2 w-full px-4 py-3 border-2 border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-soft hover:shadow-soft-lg transition-all font-medium"
                    >
                      <option value="STANDARD">08:00 - 16:00 (Pon-Pet)</option>
                      <option value="SHIFT_WORK">Smjenski rad (2-2-2)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="expectedHoursPerDay" className="text-sm font-bold text-dark-700">Očekivani sati po danu</Label>
                    <Input
                      id="expectedHoursPerDay"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.expectedHoursPerDay}
                      onChange={(e) => handleChange('expectedHoursPerDay', e.target.value)}
                      className="mt-2 border-2 border-dark-200 rounded-xl shadow-soft hover:shadow-soft-lg transition-all font-medium"
                    />
                  </div>

                {formData.workScheduleType === 'STANDARD' ? (
                  <div className="col-span-full">
                    <div className="bg-white/80 rounded-2xl p-6 shadow-soft border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <Clock className="w-4 h-4 text-green-600" />
                        </div>
                        <h4 className="font-bold text-dark-900">Standardno radno vrijeme</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="standardStartTime" className="text-sm font-bold text-dark-700">Početak rada</Label>
                          <Input
                            id="standardStartTime"
                            type="time"
                            value={formData.standardStartTime}
                            onChange={(e) => handleChange('standardStartTime', e.target.value)}
                            className="mt-2 border-2 border-dark-200 rounded-xl shadow-soft hover:shadow-soft-lg transition-all font-medium"
                          />
                        </div>
                        <div>
                          <Label htmlFor="standardEndTime" className="text-sm font-bold text-dark-700">Kraj rada</Label>
                          <Input
                            id="standardEndTime"
                            type="time"
                            value={formData.standardEndTime}
                            onChange={(e) => handleChange('standardEndTime', e.target.value)}
                            className="mt-2 border-2 border-dark-200 rounded-xl shadow-soft hover:shadow-soft-lg transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-full space-y-4">
                    <div className="bg-white/80 rounded-2xl p-6 shadow-soft border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-dark-900">Prva smjena</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shiftStartTime1" className="text-sm font-bold text-dark-700">Početak</Label>
                          <Input
                            id="shiftStartTime1"
                            type="time"
                            value={formData.shiftStartTime1}
                            onChange={(e) => handleChange('shiftStartTime1', e.target.value)}
                            className="mt-2 border-2 border-dark-200 rounded-xl shadow-soft hover:shadow-soft-lg transition-all font-medium"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shiftEndTime1" className="text-sm font-bold text-dark-700">Kraj</Label>
                          <Input
                            id="shiftEndTime1"
                            type="time"
                            value={formData.shiftEndTime1}
                            onChange={(e) => handleChange('shiftEndTime1', e.target.value)}
                            className="mt-2 border-2 border-dark-200 rounded-xl shadow-soft hover:shadow-soft-lg transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 rounded-2xl p-6 shadow-soft border-2 border-violet-200">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-violet-100 rounded-xl">
                          <Clock className="w-4 h-4 text-violet-600" />
                        </div>
                        <h4 className="font-bold text-dark-900">Druga smjena</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shiftStartTime2" className="text-sm font-bold text-dark-700">Početak</Label>
                          <Input
                            id="shiftStartTime2"
                            type="time"
                            value={formData.shiftStartTime2}
                            onChange={(e) => handleChange('shiftStartTime2', e.target.value)}
                            className="mt-2 border-2 border-dark-200 rounded-xl shadow-soft hover:shadow-soft-lg transition-all font-medium"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shiftEndTime2" className="text-sm font-bold text-dark-700">Kraj</Label>
                          <Input
                            id="shiftEndTime2"
                            type="time"
                            value={formData.shiftEndTime2}
                            onChange={(e) => handleChange('shiftEndTime2', e.target.value)}
                            className="mt-2 border-2 border-dark-200 rounded-xl shadow-soft hover:shadow-soft-lg transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 rounded-2xl p-6 shadow-soft border-2 border-orange-200">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-orange-100 rounded-xl">
                          <Calendar className="w-4 h-4 text-orange-600" />
                        </div>
                        <h4 className="font-bold text-dark-900">Rotacija</h4>
                      </div>
                      <div>
                        <Label htmlFor="shiftRotationStart" className="text-sm font-bold text-dark-700">Početak ciklusa (2-2-2)</Label>
                        <Input
                          id="shiftRotationStart"
                          type="date"
                          value={formData.shiftRotationStart}
                          onChange={(e) => handleChange('shiftRotationStart', e.target.value)}
                          className="mt-2 border-2 border-dark-200 rounded-xl shadow-soft hover:shadow-soft-lg transition-all font-medium"
                        />
                        <p className="text-xs text-dark-500 mt-2">
                          Ciklus: 2 dana prva smjena → 2 dana slobodno → 2 dana druga smjena
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
