'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Plus, Trash2 } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface FlightRule {
  id: string;
  carrier: string;
  flightNumber: string;
  leg: string;
  aircraftType: string;
  seats: number;
  dateFrom: string;
  dateTo: string;
  onDays: string;
  departureTime: string; // STD - departure time from origin
  arrivalTime: string;   // STA - arrival time at destination
}

interface Airline {
  id: string;
  name: string;
  icaoCode: string;
  iataCode: string | null;
}

export function ScheduleChangesExport() {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [searchTerm, setSearchTerm] = useState<Record<string, string>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState<Record<string, boolean>>({});
  const [rules, setRules] = useState<FlightRule[]>([
    {
      id: '1',
      carrier: '',
      flightNumber: '',
      leg: '',
      aircraftType: 'B738',
      seats: 189,
      dateFrom: '',
      dateTo: '',
      onDays: '1234567',
      departureTime: '',
      arrivalTime: '',
    },
  ]);
  const [season, setSeason] = useState('S26');

  useEffect(() => {
    fetchAirlines();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.airline-dropdown')) {
        setIsDropdownOpen({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAirlines = async () => {
    try {
      let allAirlines: Airline[] = [];
      let page = 1;
      let hasMore = true;

      // Fetch all airlines with pagination (max 100 per page)
      while (hasMore) {
        const response = await fetch(`/api/airlines?page=${page}&limit=100`);
        if (response.ok) {
          const data = await response.json();
          allAirlines = [...allAirlines, ...(data.data || [])];

          // Check if there are more pages
          hasMore = data.pagination && data.pagination.page < data.pagination.totalPages;
          page++;
        } else {
          hasMore = false;
        }
      }

      setAirlines(allAirlines);
    } catch (error) {
      console.error('Failed to fetch airlines:', error);
    }
  };

  const addRule = () => {
    setRules([
      ...rules,
      {
        id: Date.now().toString(),
        carrier: '',
        flightNumber: '',
        leg: '',
        aircraftType: 'B738',
        seats: 189,
        dateFrom: '',
        dateTo: '',
        onDays: '1234567',
        departureTime: '',
        arrivalTime: '',
      },
    ]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const updateRule = (id: string, field: keyof FlightRule, value: any) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const toggleDay = (ruleId: string, dayIndex: number) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const days = rule.onDays.split('');
    days[dayIndex] = days[dayIndex] === String(dayIndex + 1) ? '_' : String(dayIndex + 1);
    updateRule(ruleId, 'onDays', days.join(''));
  };

  const getFilteredAirlines = (ruleId: string) => {
    const search = searchTerm[ruleId]?.toLowerCase() || '';
    if (!search) return airlines;

    return airlines.filter(
      (airline) =>
        airline.name.toLowerCase().includes(search) ||
        airline.icaoCode.toLowerCase().includes(search) ||
        airline.iataCode?.toLowerCase().includes(search)
    );
  };

  const selectAirline = (ruleId: string, airlineCode: string) => {
    updateRule(ruleId, 'carrier', airlineCode);
    setIsDropdownOpen({ ...isDropdownOpen, [ruleId]: false });
    setSearchTerm({ ...searchTerm, [ruleId]: '' });
  };

  const getSelectedAirlineName = (carrier: string) => {
    if (!carrier) return 'Izaberi aviokompaniju...';
    const airline = airlines.find(
      (a) => a.iataCode === carrier || a.icaoCode === carrier
    );
    return airline
      ? `${airline.iataCode || airline.icaoCode} - ${airline.name}`
      : carrier;
  };

  const formatDateForExport = (dateStr: string): string => {
    // Convert DD.MM.YYYY to M/D/YYYY
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parts[2];
      return `${month}/${day}/${year}`;
    }
    return dateStr;
  };

  const formatTimeForExport = (timeStr: string): string => {
    // Convert HH:MM (24h) to H:MM AM/PM
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // Convert 0 to 12
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  };

  const exportToTxt = () => {
    if (rules.length === 0) {
      showToast('Dodajte barem jedno pravilo', 'error');
      return;
    }

    // Validate rules
    for (const rule of rules) {
      if (!rule.carrier || !rule.flightNumber || !rule.leg || !rule.dateFrom || !rule.dateTo || !rule.departureTime || !rule.arrivalTime) {
        showToast('Popunite sva polja za svako pravilo', 'error');
        return;
      }
    }

    // Generate TXT content with proper 13-column format
    let content = `Schedule Changes TZL\nall times in UTC\n`;

    // Add header row (13 columns as parser expects)
    const header = [
      'Carrier',
      'Flight',
      'Leg',
      'Type of change',
      'From',
      'To',
      'STD',
      'STA',
      'Ac Type',
      'Seat Conf',
      'On days',
      'Season',
      'Nr. of affected flights',
    ].join('\t'); // Use tabs instead of pipes for original format
    content += header + '\n';

    // Add data rows
    rules.forEach((rule) => {
      const line = [
        rule.carrier,                           // Carrier
        rule.flightNumber,                      // Flight
        rule.leg,                               // Leg
        'None',                                 // Type of change
        formatDateForExport(rule.dateFrom),     // From (date in M/D/YYYY)
        formatDateForExport(rule.dateTo),       // To (date in M/D/YYYY)
        formatTimeForExport(rule.departureTime), // STD (departure from origin)
        formatTimeForExport(rule.arrivalTime),   // STA (arrival at destination)
        rule.aircraftType,                      // Ac Type
        rule.seats.toString(),                  // Seat Conf
        rule.onDays,                            // On days
        season,                                 // Season
        '0',                                    // Nr. of affected flights
      ].join('\t'); // Use tabs

      content += line + '\n';
    });

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule-changes-${season}-${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('TXT fajl eksportovan', 'success');
  };

  const dayNames = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

  return (
    <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-borderSoft bg-gradient-to-r from-green-50 to-emerald-50">
        <h3 className="text-lg font-semibold text-textMain mb-2 flex items-center gap-2">
          <Download className="w-5 h-5 text-green-600" />
          Export Schedule Changes
        </h3>
        <p className="text-sm text-textMuted">
          Kreirajte TXT fajl u Schedule Changes formatu koji možete kasnije importovati
        </p>
      </div>

      {/* Season */}
      <div className="px-5 py-4 border-b border-borderSoft bg-shellBg">
        <label className="block text-sm font-semibold text-textMain mb-2">
          Sezona
        </label>
        <input
          type="text"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          placeholder="npr. S26, W26"
          className="w-full max-w-xs px-4 py-2 rounded-xl border border-borderSoft bg-white text-textMain focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Rules */}
      <div className="px-5 py-4 space-y-4">
        {rules.map((rule, index) => (
          <div
            key={rule.id}
            className="p-4 border border-borderSoft rounded-2xl bg-shellBg space-y-3"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-textMain">
                Pravilo #{index + 1}
              </span>
              {rules.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRule(rule.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Row 1: Carrier, Flight Number, Leg */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative airline-dropdown">
                <label className="block text-xs font-semibold text-textMuted mb-1">
                  Aviokompanija
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setIsDropdownOpen({
                        ...isDropdownOpen,
                        [rule.id]: !isDropdownOpen[rule.id],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-borderSoft bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between"
                  >
                    <span className={rule.carrier ? 'text-textMain' : 'text-textMuted'}>
                      {getSelectedAirlineName(rule.carrier)}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isDropdownOpen[rule.id] ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isDropdownOpen[rule.id] && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-borderSoft rounded-xl shadow-lg max-h-64 overflow-hidden">
                      {/* Search input */}
                      <div className="p-2 border-b border-borderSoft">
                        <input
                          type="text"
                          placeholder="Pretraži..."
                          value={searchTerm[rule.id] || ''}
                          onChange={(e) =>
                            setSearchTerm({ ...searchTerm, [rule.id]: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-borderSoft text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          autoFocus
                        />
                      </div>

                      {/* Airlines list */}
                      <div className="max-h-48 overflow-y-auto">
                        {getFilteredAirlines(rule.id).length > 0 ? (
                          getFilteredAirlines(rule.id).map((airline) => (
                            <button
                              key={airline.id}
                              type="button"
                              onClick={() =>
                                selectAirline(rule.id, airline.iataCode || airline.icaoCode)
                              }
                              className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors"
                            >
                              <div className="font-semibold text-textMain">
                                {airline.iataCode || airline.icaoCode}
                              </div>
                              <div className="text-xs text-textMuted">{airline.name}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-sm text-textMuted text-center">
                            Nema rezultata
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">
                  Broj leta
                </label>
                <input
                  type="text"
                  value={rule.flightNumber}
                  onChange={(e) => updateRule(rule.id, 'flightNumber', e.target.value)}
                  placeholder="npr. 4276"
                  className="w-full px-3 py-2 rounded-xl border border-borderSoft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">
                  Ruta (Leg)
                </label>
                <input
                  type="text"
                  value={rule.leg}
                  onChange={(e) => updateRule(rule.id, 'leg', e.target.value)}
                  placeholder="npr. BERTZL"
                  className="w-full px-3 py-2 rounded-xl border border-borderSoft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Row 2: Aircraft, Seats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">
                  Tip aviona
                </label>
                <input
                  type="text"
                  value={rule.aircraftType}
                  onChange={(e) => updateRule(rule.id, 'aircraftType', e.target.value)}
                  placeholder="npr. B738"
                  className="w-full px-3 py-2 rounded-xl border border-borderSoft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">
                  Broj sjedišta
                </label>
                <input
                  type="number"
                  value={rule.seats}
                  onChange={(e) => updateRule(rule.id, 'seats', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-borderSoft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Row 2.5: Departure and Arrival Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">
                  STD - Polazak (HH:MM UTC)
                </label>
                <input
                  type="time"
                  value={rule.departureTime}
                  onChange={(e) => updateRule(rule.id, 'departureTime', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-borderSoft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">
                  STA - Dolazak (HH:MM UTC)
                </label>
                <input
                  type="time"
                  value={rule.arrivalTime}
                  onChange={(e) => updateRule(rule.id, 'arrivalTime', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-borderSoft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Row 3: Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">
                  Datum od (DD.MM.YYYY)
                </label>
                <input
                  type="text"
                  value={rule.dateFrom}
                  onChange={(e) => updateRule(rule.id, 'dateFrom', e.target.value)}
                  placeholder="01.06.2026"
                  className="w-full px-3 py-2 rounded-xl border border-borderSoft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">
                  Datum do (DD.MM.YYYY)
                </label>
                <input
                  type="text"
                  value={rule.dateTo}
                  onChange={(e) => updateRule(rule.id, 'dateTo', e.target.value)}
                  placeholder="30.06.2026"
                  className="w-full px-3 py-2 rounded-xl border border-borderSoft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Row 4: On Days */}
            <div>
              <label className="block text-xs font-semibold text-textMuted mb-2">
                Dani u sedmici
              </label>
              <div className="flex gap-2">
                {dayNames.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(rule.id, i)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      rule.onDays[i] !== '_'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-xs text-textMuted mt-1">
                Pattern: {rule.onDays}
              </p>
            </div>
          </div>
        ))}

        {/* Add Rule Button */}
        <Button
          variant="outline"
          onClick={addRule}
          className="w-full border-dashed border-2 hover:bg-green-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj pravilo
        </Button>
      </div>

      {/* Export Button */}
      <div className="px-5 py-4 border-t border-borderSoft bg-shellBg">
        <Button
          onClick={exportToTxt}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Eksportuj TXT fajl
        </Button>
      </div>
    </div>
  );
}
