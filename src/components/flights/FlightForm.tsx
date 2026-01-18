'use client';

import { Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFlightSchema, CreateFlightInput } from '@/lib/validators/flight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { FlightStatus } from '@prisma/client';
import { useEffect, useState } from 'react';

interface FlightFormProps {
  defaultValues?: Partial<CreateFlightInput>;
  onSubmit: (data: CreateFlightInput) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

interface Airline {
  id: string;
  name: string;
  icaoCode: string;
}

interface AircraftType {
  id: string;
  model: string;
  seats: number;
}

interface OperationType {
  id: string;
  code: string;
  name: string;
}

export function FlightForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Sačuvaj let',
}: FlightFormProps) {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [aircraftTypes, setAircraftTypes] = useState<AircraftType[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [flightMode, setFlightMode] = useState<'both' | 'arrival-only' | 'departure-only'>('both');
  const [airlineRoutes, setAirlineRoutes] = useState<Array<{ route: string; destination: string; country: string }>>([]);
  const [airlineSearch, setAirlineSearch] = useState('');
  const [aircraftTypeSearch, setAircraftTypeSearch] = useState('');
  const [selectedAirline, setSelectedAirline] = useState<Airline | null>(null);
  const [selectedAircraftType, setSelectedAircraftType] = useState<AircraftType | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateFlightInput>({
    resolver: zodResolver(createFlightSchema) as Resolver<CreateFlightInput>,
    defaultValues: {
      arrivalStatus: 'OPERATED',
      departureStatus: 'OPERATED',
      dataSource: 'MANUAL',
      isLocked: false,
      arrivalFerryIn: false,
      departureFerryOut: false,
      ...defaultValues,
    },
  });

  const arrivalFerryIn = watch('arrivalFerryIn');
  const departureFerryOut = watch('departureFerryOut');
  const airlineId = watch('airlineId');

  useEffect(() => {
    fetchFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (airlineId) {
      fetchAirlineRoutes(airlineId);
    } else {
      setAirlineRoutes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airlineId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAirlines(airlineSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [airlineSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAircraftTypes(aircraftTypeSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [aircraftTypeSearch]);

  const fetchAirlines = async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.set('search', search);
      }
      params.set('limit', '100');

      const res = await fetch(`/api/airlines?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      let airlinesList = data.data || [];

      // Always include the selected airline in the list if it's not there
      if (selectedAirline && !airlinesList.find((a: Airline) => a.id === selectedAirline.id)) {
        airlinesList = [selectedAirline, ...airlinesList];
      }

      setAirlines(airlinesList);
    } catch (error) {
      console.error('Error fetching airlines:', error);
    }
  };

  const fetchAircraftTypes = async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.set('search', search);
      }

      const res = await fetch(`/api/aircraft-types?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      let aircraftTypesList = data.data || [];

      // Always include the selected aircraft type in the list if it's not there
      if (selectedAircraftType && !aircraftTypesList.find((a: AircraftType) => a.id === selectedAircraftType.id)) {
        aircraftTypesList = [selectedAircraftType, ...aircraftTypesList];
      }

      setAircraftTypes(aircraftTypesList);
    } catch (error) {
      console.error('Error fetching aircraft types:', error);
    }
  };

  const fetchFormData = async () => {
    try {
      const [operationTypesRes] = await Promise.all([
        fetch('/api/operation-types?activeOnly=true'),
      ]);

      await fetchAirlines();
      await fetchAircraftTypes();

      if (operationTypesRes.ok) {
        const operationTypesData = await operationTypesRes.json();
        const ops = operationTypesData.data || [];
        setOperationTypes(ops);
        console.log('Loaded operation types:', ops);
        // Set default operation type if not provided
        if (!defaultValues?.operationTypeId && ops.length > 0) {
          const scheduledType = ops.find((ot: OperationType) => ot.code === 'SCHEDULED');
          if (scheduledType) {
            console.log('Setting default operation type:', scheduledType);
            setValue('operationTypeId', scheduledType.id);
          } else if (ops.length > 0) {
            // If SCHEDULED doesn't exist, use first one
            console.log('Setting first operation type as default:', ops[0]);
            setValue('operationTypeId', ops[0].id);
          }
        } else if (defaultValues?.operationTypeId) {
          setValue('operationTypeId', defaultValues.operationTypeId);
        }
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchAirlineRoutes = async (airlineId: string) => {
    try {
      const response = await fetch(`/api/airlines/${airlineId}/routes`);
      const result = await response.json();
      if (result.success) {
        setAirlineRoutes(result.data);
      }
    } catch (err) {
      console.error('Error fetching airline routes:', err);
      setAirlineRoutes([]);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
      </div>
    );
  }

  const onFormSubmit = (data: CreateFlightInput) => {
    console.log('Form submitted with data:', data);
    onSubmit(data);
  };

  const onFormError = (errors: any) => {
    console.error('Form validation errors:', errors);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit, onFormError)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-3xl shadow-soft px-6 py-5">
        <h3 className="text-lg font-semibold text-textMain mb-4">Osnovne informacije</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date */}
          <div>
            <Label htmlFor="date">Datum *</Label>
            <Input
              id="date"
              type="date"
              {...register('date', { valueAsDate: true })}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-xs text-red-600 mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* Airline */}
          <div>
            <Label htmlFor="airlineId">Aviokompanija *</Label>
            <SearchableSelect
              options={airlines.map(airline => ({
                value: airline.id,
                label: airline.name,
                subtitle: airline.icaoCode,
              }))}
              value={watch('airlineId') || ''}
              onChange={(value) => {
                setValue('airlineId', value);
                const airline = airlines.find(a => a.id === value);
                if (airline) {
                  setSelectedAirline(airline);
                }
              }}
              onSearchChange={setAirlineSearch}
              placeholder="Izaberite aviokompaniju"
              searchPlaceholder="Pretraži aviokompanije..."
            />
            {errors.airlineId && (
              <p className="text-xs text-red-600 mt-1">{errors.airlineId.message}</p>
            )}
          </div>

          {/* Aircraft Type */}
          <div>
            <Label htmlFor="aircraftTypeId">Tip aviona *</Label>
            <SearchableSelect
              options={aircraftTypes.map(type => ({
                value: type.id,
                label: type.model,
                subtitle: `${type.seats} sjedišta`,
              }))}
              value={watch('aircraftTypeId') || ''}
              onChange={(value) => {
                setValue('aircraftTypeId', value);
                const aircraftType = aircraftTypes.find(a => a.id === value);
                if (aircraftType) {
                  setSelectedAircraftType(aircraftType);
                }
              }}
              onSearchChange={setAircraftTypeSearch}
              placeholder="Izaberite tip aviona"
              searchPlaceholder="Pretraži tipove aviona..."
            />
            {errors.aircraftTypeId && (
              <p className="text-xs text-red-600 mt-1">{errors.aircraftTypeId.message}</p>
            )}
          </div>

          {/* Route */}
          <div>
            <Label htmlFor="route">Ruta *</Label>
            {airlineRoutes.length > 0 ? (
              <select
                id="route"
                {...register('route')}
                className={`h-10 w-full rounded-xl border ${
                  errors.route ? 'border-red-500' : 'border-borderSoft'
                } bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary`}
              >
                <option value="">Odaberi rutu</option>
                {airlineRoutes.map((route) => (
                  <option key={route.route} value={route.route}>
                    {route.route} - {route.destination}, {route.country}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="route"
                placeholder="npr. TZL-IST"
                {...register('route')}
                className={errors.route ? 'border-red-500' : ''}
              />
            )}
            {errors.route && (
              <p className="text-xs text-red-600 mt-1">{errors.route.message}</p>
            )}
            {airlineId && airlineRoutes.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Nema definisanih ruta za ovu aviokompaniju. Dodajte rute na stranici Aviokompanije.
              </p>
            )}
          </div>

          {/* Registration */}
          <div>
            <Label htmlFor="registration">Registracija *</Label>
            <Input
              id="registration"
              placeholder="npr. TC-RBM"
              {...register('registration')}
              className={errors.registration ? 'border-red-500' : ''}
            />
            {errors.registration && (
              <p className="text-xs text-red-600 mt-1">{errors.registration.message}</p>
            )}
          </div>

          {/* Operation Type */}
          <div>
            <Label htmlFor="operationTypeId">Tip operacije *</Label>
            <select
              id="operationTypeId"
              {...register('operationTypeId')}
              className={`h-10 w-full rounded-xl border ${
                errors.operationTypeId ? 'border-red-500' : 'border-borderSoft'
              } bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary`}
            >
              <option value="">Izaberite tip operacije</option>
              {operationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
            {errors.operationTypeId && (
              <p className="text-xs text-red-600 mt-1">{errors.operationTypeId.message}</p>
            )}
          </div>

          {/* Available Seats */}
          <div>
            <Label htmlFor="availableSeats">Raspoloživa sjedišta</Label>
            <Input
              id="availableSeats"
              type="number"
              {...register('availableSeats', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
            />
          </div>
        </div>
      </div>

      {/* Flight Mode Selection */}
      <div className="bg-white rounded-3xl shadow-soft px-6 py-5">
        <h3 className="text-lg font-semibold text-textMain mb-4">Tip leta</h3>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-dark-600">Izaberite koji dio leta želite dodati:</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="flightMode"
                value="both"
                checked={flightMode === 'both'}
                onChange={(e) => setFlightMode('both')}
                className="w-4 h-4 text-brand-primary border-gray-300 focus:ring-brand-primary"
              />
              <span className="text-sm">Kompletan let (dolazak + odlazak)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="flightMode"
                value="arrival-only"
                checked={flightMode === 'arrival-only'}
                onChange={(e) => {
                  setFlightMode('arrival-only');
                  // Clear departure fields
                  setValue('departureFlightNumber', null);
                  setValue('departureScheduledTime', null);
                  setValue('departureActualTime', null);
                  setValue('departurePassengers', null);
                  setValue('departureInfants', null);
                  setValue('departureBaggage', null);
                  setValue('departureCargo', null);
                  setValue('departureMail', null);
                  setValue('departureFerryOut', false);
                }}
                className="w-4 h-4 text-brand-primary border-gray-300 focus:ring-brand-primary"
              />
              <span className="text-sm">Samo dolazak (prenoćio/divertovan)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="flightMode"
                value="departure-only"
                checked={flightMode === 'departure-only'}
                onChange={(e) => {
                  setFlightMode('departure-only');
                  // Clear arrival fields
                  setValue('arrivalFlightNumber', null);
                  setValue('arrivalScheduledTime', null);
                  setValue('arrivalActualTime', null);
                  setValue('arrivalPassengers', null);
                  setValue('arrivalInfants', null);
                  setValue('arrivalBaggage', null);
                  setValue('arrivalCargo', null);
                  setValue('arrivalMail', null);
                  setValue('arrivalFerryIn', false);
                }}
                className="w-4 h-4 text-brand-primary border-gray-300 focus:ring-brand-primary"
              />
              <span className="text-sm">Samo odlazak (nastavak od prošle noći)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Arrival Information */}
      {(flightMode === 'both' || flightMode === 'arrival-only') && (
        <div className="bg-white rounded-3xl shadow-soft px-6 py-5">
          <h3 className="text-lg font-semibold text-textMain mb-4">Dolazak (Arrival)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Arrival Flight Number */}
          <div>
            <Label htmlFor="arrivalFlightNumber">Broj leta</Label>
            <Input
              id="arrivalFlightNumber"
              placeholder="npr. W62829"
              {...register('arrivalFlightNumber')}
            />
          </div>

          {/* Arrival Scheduled Time */}
          <div>
            <Label htmlFor="arrivalScheduledTime">Planirano vrijeme</Label>
            <Input
              id="arrivalScheduledTime"
              type="datetime-local"
              {...register('arrivalScheduledTime', { valueAsDate: true })}
            />
          </div>

          {/* Arrival Actual Time */}
          <div>
            <Label htmlFor="arrivalActualTime">Stvarno vrijeme</Label>
            <Input
              id="arrivalActualTime"
              type="datetime-local"
              {...register('arrivalActualTime', { valueAsDate: true })}
            />
          </div>

          {/* Arrival Ferry In */}
          <div className="flex items-center gap-2 pt-6">
            <input
              id="arrivalFerryIn"
              type="checkbox"
              {...register('arrivalFerryIn')}
              className="h-4 w-4 rounded border-borderSoft"
            />
            <Label htmlFor="arrivalFerryIn" className="text-sm">
              Ferry IN (prazan let bez putnika)
            </Label>
          </div>

          {/* Arrival Passengers */}
          <div>
            <Label htmlFor="arrivalPassengers">Putnici</Label>
            <Input
              id="arrivalPassengers"
              type="number"
              disabled={arrivalFerryIn}
              {...register('arrivalPassengers', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
            />
          </div>

          {/* Arrival Infants */}
          <div>
            <Label htmlFor="arrivalInfants">Bebe u naručju</Label>
            <Input
              id="arrivalInfants"
              type="number"
              disabled={arrivalFerryIn}
              {...register('arrivalInfants', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
            />
          </div>

          {/* Arrival Baggage */}
          <div>
            <Label htmlFor="arrivalBaggage">Prtljag (kg)</Label>
            <Input
              id="arrivalBaggage"
              type="number"
              {...register('arrivalBaggage', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
            />
          </div>

          {/* Arrival Cargo */}
          <div>
            <Label htmlFor="arrivalCargo">Cargo (kg)</Label>
            <Input
              id="arrivalCargo"
              type="number"
              {...register('arrivalCargo', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
            />
          </div>

          {/* Arrival Mail */}
          <div>
            <Label htmlFor="arrivalMail">Pošta (kg)</Label>
            <Input
              id="arrivalMail"
              type="number"
              {...register('arrivalMail', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
            />
          </div>

          {/* Arrival Status */}
          <div>
            <Label htmlFor="arrivalStatus">Status</Label>
            <select
              id="arrivalStatus"
              {...register('arrivalStatus')}
              className="h-10 w-full rounded-xl border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="OPERATED">Izvršen</option>
              <option value="CANCELLED">Otkazan</option>
              <option value="DIVERTED">Preusmjeren</option>
              <option value="NOT_OPERATED">Nije realizovan</option>
            </select>
          </div>
        </div>
        </div>
      )}

      {/* Departure Information */}
      {(flightMode === 'both' || flightMode === 'departure-only') && (
        <div className="bg-white rounded-3xl shadow-soft px-6 py-5">
          <h3 className="text-lg font-semibold text-textMain mb-4">Odlazak (Departure)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Departure Flight Number */}
          <div>
            <Label htmlFor="departureFlightNumber">Broj leta</Label>
            <Input
              id="departureFlightNumber"
              placeholder="npr. W62830"
              {...register('departureFlightNumber')}
            />
          </div>

          {/* Departure Scheduled Time */}
          <div>
            <Label htmlFor="departureScheduledTime">Planirano vrijeme</Label>
            <Input
              id="departureScheduledTime"
              type="datetime-local"
              {...register('departureScheduledTime', { valueAsDate: true })}
            />
          </div>

          {/* Departure Actual Time */}
          <div>
            <Label htmlFor="departureActualTime">Stvarno vrijeme</Label>
            <Input
              id="departureActualTime"
              type="datetime-local"
              {...register('departureActualTime', { valueAsDate: true })}
            />
          </div>

          {/* Departure Ferry Out */}
          <div className="flex items-center gap-2 pt-6">
            <input
              id="departureFerryOut"
              type="checkbox"
              {...register('departureFerryOut')}
              className="h-4 w-4 rounded border-borderSoft"
            />
            <Label htmlFor="departureFerryOut" className="text-sm">
              Ferry OUT (prazan let bez putnika)
            </Label>
          </div>

          {/* Departure Passengers */}
          <div>
            <Label htmlFor="departurePassengers">Putnici</Label>
            <Input
              id="departurePassengers"
              type="number"
              {...register('departurePassengers', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
              disabled={departureFerryOut}
            />
          </div>

          {/* Departure Infants */}
          <div>
            <Label htmlFor="departureInfants">Bebe u naručju</Label>
            <Input
              id="departureInfants"
              type="number"
              {...register('departureInfants', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
              disabled={departureFerryOut}
            />
          </div>

          {/* Departure Baggage */}
          <div>
            <Label htmlFor="departureBaggage">Prtljag (kg)</Label>
            <Input
              id="departureBaggage"
              type="number"
              {...register('departureBaggage', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
            />
          </div>

          {/* Departure Cargo */}
          <div>
            <Label htmlFor="departureCargo">Cargo (kg)</Label>
            <Input
              id="departureCargo"
              type="number"
              {...register('departureCargo', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
            />
          </div>

          {/* Departure Mail */}
          <div>
            <Label htmlFor="departureMail">Pošta (kg)</Label>
            <Input
              id="departureMail"
              type="number"
              {...register('departureMail', {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(v);
                  return isNaN(num) ? null : num;
                },
              })}
            />
          </div>

          {/* Departure Status */}
          <div>
            <Label htmlFor="departureStatus">Status</Label>
            <select
              id="departureStatus"
              {...register('departureStatus')}
              className="h-10 w-full rounded-xl border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="OPERATED">Izvršen</option>
              <option value="CANCELLED">Otkazan</option>
              <option value="DIVERTED">Preusmjeren</option>
              <option value="NOT_OPERATED">Nije realizovan</option>
            </select>
          </div>
        </div>
        </div>
      )}

      {/* Operational Details */}
      <div className="bg-white rounded-3xl shadow-soft px-6 py-5">
        <h3 className="text-lg font-semibold text-textMain mb-4">Operativni detalji</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="handlingAgent">Handling agent</Label>
            <Input id="handlingAgent" {...register('handlingAgent')} />
          </div>

          <div>
            <Label htmlFor="stand">Stand</Label>
            <Input id="stand" placeholder="npr. 1" {...register('stand')} />
          </div>

          <div>
            <Label htmlFor="gate">Gate</Label>
            <Input id="gate" placeholder="npr. A1" {...register('gate')} />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          Otkaži
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
        >
          {isSubmitting ? 'Čuvam...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
