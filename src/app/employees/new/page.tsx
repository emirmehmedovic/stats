'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { MainLayout } from '@/components/layout/MainLayout';
import { getTodayDateString } from '@/lib/dates';
export default function NewEmployeePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    dateOfBirth: '',
    hireDate: getTodayDateString(),
    position: '',
    department: '',
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/employees');
      } else {
        setError(result.error || 'Failed to create employee');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <MainLayout>
    <div className="p-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-dark-600 mb-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 hover:text-dark-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Nazad
          </button>
          <span>›</span>
          <span>Management</span>
          <span>›</span>
          <span>Radnici</span>
          <span>›</span>
          <span className="text-dark-900 font-medium">Novi radnik</span>
        </div>
        <h1 className="text-3xl font-bold text-dark-900">Dodaj novog radnika</h1>
        <p className="text-dark-600 mt-1">Unesite podatke o novom radniku</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-6">
          <h2 className="text-lg font-semibold text-dark-900 mb-6">Osnovne informacije</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="employeeNumber">Broj radnika *</Label>
              <Input
                id="employeeNumber"
                required
                value={formData.employeeNumber}
                onChange={(e) => handleChange('employeeNumber', e.target.value)}
                placeholder="EMP-001"
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

            <div>
              <Label htmlFor="firstName">Ime *</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Petar"
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
                placeholder="Petrović"
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
                placeholder="petar.petrovic@aerodromtzl.ba"
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
                placeholder="+387 61 234 567"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="nationalId">JMBG</Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => handleChange('nationalId', e.target.value)}
                placeholder="1234567890123"
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

        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-6">
          <h2 className="text-lg font-semibold text-dark-900 mb-6">Radno vrijeme</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="workScheduleType">Tip radnog vremena</Label>
              <select
                id="workScheduleType"
                value={formData.workScheduleType}
                onChange={(e) => handleChange('workScheduleType', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="STANDARD">08:00 - 16:00 (Pon-Pet)</option>
                <option value="SHIFT_WORK">Smjenski rad (2-2-2)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="expectedHoursPerDay">Očekivani sati po danu</Label>
              <Input
                id="expectedHoursPerDay"
                type="number"
                min="0"
                step="0.5"
                value={formData.expectedHoursPerDay}
                onChange={(e) => handleChange('expectedHoursPerDay', e.target.value)}
                className="mt-1"
              />
            </div>

            {formData.workScheduleType === 'STANDARD' ? (
              <>
                <div>
                  <Label htmlFor="standardStartTime">Početak rada</Label>
                  <Input
                    id="standardStartTime"
                    type="time"
                    value={formData.standardStartTime}
                    onChange={(e) => handleChange('standardStartTime', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="standardEndTime">Kraj rada</Label>
                  <Input
                    id="standardEndTime"
                    type="time"
                    value={formData.standardEndTime}
                    onChange={(e) => handleChange('standardEndTime', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="shiftStartTime1">Prva smjena - početak</Label>
                  <Input
                    id="shiftStartTime1"
                    type="time"
                    value={formData.shiftStartTime1}
                    onChange={(e) => handleChange('shiftStartTime1', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shiftEndTime1">Prva smjena - kraj</Label>
                  <Input
                    id="shiftEndTime1"
                    type="time"
                    value={formData.shiftEndTime1}
                    onChange={(e) => handleChange('shiftEndTime1', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shiftStartTime2">Druga smjena - početak</Label>
                  <Input
                    id="shiftStartTime2"
                    type="time"
                    value={formData.shiftStartTime2}
                    onChange={(e) => handleChange('shiftStartTime2', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shiftEndTime2">Druga smjena - kraj</Label>
                  <Input
                    id="shiftEndTime2"
                    type="time"
                    value={formData.shiftEndTime2}
                    onChange={(e) => handleChange('shiftEndTime2', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shiftRotationStart">Početak ciklusa (2-2-2)</Label>
                  <Input
                    id="shiftRotationStart"
                    type="date"
                    value={formData.shiftRotationStart}
                    onChange={(e) => handleChange('shiftRotationStart', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-6">
          <h2 className="text-lg font-semibold text-dark-900 mb-6">Informacije o zaposlenju</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Label htmlFor="position">Pozicija *</Label>
              <Input
                id="position"
                required
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="Security Officer"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="department">Odjel</Label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Odaberite odjel</option>
                <option value="Operations">Operations</option>
                <option value="Security">Security</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Administration">Administration</option>
                <option value="Ground Handling">Ground Handling</option>
                <option value="Fire & Rescue">Fire & Rescue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Spremam...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Sačuvaj radnika
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Odustani
          </Button>
        </div>
      </form>
    </div>
    </MainLayout>
  );
}
