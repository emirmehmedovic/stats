'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Building2, 
  MapPin, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { MainLayout } from '@/components/layout/MainLayout';
import { dateOnlyToUtc, dateStringFromParts, getDateStringDaysAgo, getTodayDateString } from '@/lib/dates';
type ComparisonType = 
  | 'week-over-week'
  | 'day-over-day'
  | 'month-over-month'
  | 'year-over-year'
  | 'quarter-over-quarter'
  | 'season-over-season'
  | 'airlines'
  | 'destinations'
  | 'delays';

type ComparisonData = {
  period1: {
    label: string;
    flights: number;
    passengers: number;
    loadFactor: number;
    delays: number;
    avgDelayMinutes: number;
  };
  period2: {
    label: string;
    flights: number;
    passengers: number;
    loadFactor: number;
    delays: number;
    avgDelayMinutes: number;
  };
  change: {
    flights: number;
    passengers: number;
    loadFactor: number;
    delays: number;
    avgDelayMinutes: number;
  };
  chartData?: Array<{
    date: string;
    period1: number;
    period2: number;
    label: string;
  }>;
  breakdown?: Array<{
    name: string;
    period1: number;
    period2: number;
    change: number;
  }>;
};

const COLORS = ['#3392C5', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Comparison Tab Component
function ComparisonTab({ 
  type, 
  label, 
  icon: Icon 
}: { 
  type: ComparisonType; 
  label: string; 
  icon: any;
}) {
  const [period1From, setPeriod1From] = useState('');
  const [period1To, setPeriod1To] = useState('');
  const [period2From, setPeriod2From] = useState('');
  const [period2To, setPeriod2To] = useState('');
  const [data, setData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Set default date ranges based on comparison type
    const todayStr = getTodayDateString();
    const todayDate = dateOnlyToUtc(todayStr);
    const setDefaultDates = () => {
      switch (type) {
        case 'week-over-week': {
          // Last week
          setPeriod1From(getDateStringDaysAgo(14));
          setPeriod1To(getDateStringDaysAgo(7));
          setPeriod2From(getDateStringDaysAgo(7));
          setPeriod2To(todayStr);
          break;
        }
        case 'day-over-day': {
          const yesterday = getDateStringDaysAgo(1);
          setPeriod1From(yesterday);
          setPeriod1To(yesterday);
          setPeriod2From(todayStr);
          setPeriod2To(todayStr);
          break;
        }
        case 'month-over-month': {
          // Last month
          const lastMonth = new Date(todayDate);
          lastMonth.setUTCMonth(todayDate.getUTCMonth() - 1);
          const lastMonthStart = dateStringFromParts(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth() + 1, 1);
          const lastMonthEnd = dateStringFromParts(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth() + 2, 0);
          // This month
          const thisMonthStart = dateStringFromParts(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 1, 1);
          const thisMonthEnd = dateStringFromParts(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 2, 0);
          setPeriod1From(lastMonthStart);
          setPeriod1To(lastMonthEnd);
          setPeriod2From(thisMonthStart);
          setPeriod2To(thisMonthEnd);
          break;
        }
        case 'year-over-year': {
          // Last year
          const lastYear = todayDate.getUTCFullYear() - 1;
          const lastYearStart = dateStringFromParts(lastYear, 1, 1);
          const lastYearEnd = dateStringFromParts(lastYear, 12, 31);
          // This year
          const thisYearStart = dateStringFromParts(todayDate.getUTCFullYear(), 1, 1);
          const thisYearEnd = dateStringFromParts(todayDate.getUTCFullYear(), 12, 31);
          setPeriod1From(lastYearStart);
          setPeriod1To(lastYearEnd);
          setPeriod2From(thisYearStart);
          setPeriod2To(thisYearEnd);
          break;
        }
        case 'quarter-over-quarter': {
          // Last quarter
          const lastQuarter = new Date(todayDate);
          lastQuarter.setUTCMonth(todayDate.getUTCMonth() - 3);
          const lastQuarterNum = Math.floor(lastQuarter.getUTCMonth() / 3);
          const lastQuarterStart = dateStringFromParts(lastQuarter.getUTCFullYear(), lastQuarterNum * 3 + 1, 1);
          const lastQuarterEnd = dateStringFromParts(lastQuarter.getUTCFullYear(), (lastQuarterNum + 1) * 3 + 1, 0);
          // This quarter
          const thisQuarterNum = Math.floor(todayDate.getUTCMonth() / 3);
          const thisQuarterStart = dateStringFromParts(todayDate.getUTCFullYear(), thisQuarterNum * 3 + 1, 1);
          const thisQuarterEnd = dateStringFromParts(todayDate.getUTCFullYear(), (thisQuarterNum + 1) * 3 + 1, 0);
          setPeriod1From(lastQuarterStart);
          setPeriod1To(lastQuarterEnd);
          setPeriod2From(thisQuarterStart);
          setPeriod2To(thisQuarterEnd);
          break;
        }
        case 'season-over-season': {
          // Last season (June-Sept last year)
          const lastYear = todayDate.getUTCFullYear() - 1;
          const lastSeasonStart = dateStringFromParts(lastYear, 6, 1);
          const lastSeasonEnd = dateStringFromParts(lastYear, 9, 30);
          // This season (June-Sept this year)
          const thisYear = todayDate.getUTCFullYear();
          const thisSeasonStart = dateStringFromParts(thisYear, 6, 1);
          const thisSeasonEnd = dateStringFromParts(thisYear, 9, 30);
          setPeriod1From(lastSeasonStart);
          setPeriod1To(lastSeasonEnd);
          setPeriod2From(thisSeasonStart);
          setPeriod2To(thisSeasonEnd);
          break;
        }
        case 'airlines':
        case 'destinations':
        case 'delays': {
          // Last month
          const lastMonth = new Date(todayDate);
          lastMonth.setUTCMonth(todayDate.getUTCMonth() - 1);
          const lastMonthStart = dateStringFromParts(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth() + 1, 1);
          const lastMonthEnd = dateStringFromParts(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth() + 2, 0);
          // This month
          const thisMonthStart = dateStringFromParts(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 1, 1);
          const thisMonthEnd = dateStringFromParts(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 2, 0);
          setPeriod1From(lastMonthStart);
          setPeriod1To(lastMonthEnd);
          setPeriod2From(thisMonthStart);
          setPeriod2To(thisMonthEnd);
          break;
        }
        default:
          break;
      }
    };
    setDefaultDates();
  }, [type]);

  const fetchComparison = async () => {
    if (!period1From || !period1To || !period2From || !period2To) {
      setError('Molimo odaberite sve datume za oba perioda');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        type,
        date1From: period1From,
        date1To: period1To,
        date2From: period2From,
        date2To: period2To,
      });

      const response = await fetch(`/api/comparison?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Greška pri učitavanju komparacije');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  const formatChange = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${absValue.toFixed(1)}%`;
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
        <div className="space-y-4">
          {/* Period 1 */}
          <div>
            <Label className="text-sm font-semibold text-dark-900 mb-2 block">Period 1</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`period1From-${type}`}>Od</Label>
                <Input
                  id={`period1From-${type}`}
                  type="date"
                  value={period1From}
                  onChange={(e) => setPeriod1From(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`period1To-${type}`}>Do</Label>
                <Input
                  id={`period1To-${type}`}
                  type="date"
                  value={period1To}
                  onChange={(e) => setPeriod1To(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Period 2 */}
          <div>
            <Label className="text-sm font-semibold text-dark-900 mb-2 block">Period 2 (za komparaciju)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`period2From-${type}`}>Od</Label>
                <Input
                  id={`period2From-${type}`}
                  type="date"
                  value={period2From}
                  onChange={(e) => setPeriod2From(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`period2To-${type}`}>Do</Label>
                <Input
                  id={`period2To-${type}`}
                  type="date"
                  value={period2To}
                  onChange={(e) => setPeriod2To(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={fetchComparison}
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-600/90 text-white"
            >
              {isLoading ? 'Učitavam...' : 'Analiziraj'}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Učitavam komparaciju..." />
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorDisplay error={error} onRetry={fetchComparison} />
      )}

      {/* Results */}
      {data && !isLoading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
              <p className="text-xs text-dark-500 mb-1">Letovi</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-dark-900">{data.period1.flights}</p>
                <span className="text-sm text-dark-500">vs</span>
                <p className="text-2xl font-semibold text-dark-900">{data.period2.flights}</p>
              </div>
              <div className={`flex items-center gap-1 mt-2 ${getChangeColor(data.change.flights)}`}>
                {getChangeIcon(data.change.flights)}
                <span className="text-sm font-medium">{formatChange(data.change.flights)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
              <p className="text-xs text-dark-500 mb-1">Putnici</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-dark-900">{data.period1.passengers.toLocaleString()}</p>
                <span className="text-sm text-dark-500">vs</span>
                <p className="text-2xl font-semibold text-dark-900">{data.period2.passengers.toLocaleString()}</p>
              </div>
              <div className={`flex items-center gap-1 mt-2 ${getChangeColor(data.change.passengers)}`}>
                {getChangeIcon(data.change.passengers)}
                <span className="text-sm font-medium">{formatChange(data.change.passengers)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
              <p className="text-xs text-dark-500 mb-1">Load Factor</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-dark-900">{data.period1.loadFactor.toFixed(1)}%</p>
                <span className="text-sm text-dark-500">vs</span>
                <p className="text-2xl font-semibold text-dark-900">{data.period2.loadFactor.toFixed(1)}%</p>
              </div>
              <div className={`flex items-center gap-1 mt-2 ${getChangeColor(data.change.loadFactor)}`}>
                {getChangeIcon(data.change.loadFactor)}
                <span className="text-sm font-medium">{formatChange(data.change.loadFactor)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
              <p className="text-xs text-dark-500 mb-1">Kašnjenja</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-dark-900">{data.period1.delays}</p>
                <span className="text-sm text-dark-500">vs</span>
                <p className="text-2xl font-semibold text-dark-900">{data.period2.delays}</p>
              </div>
              <div className={`flex items-center gap-1 mt-2 ${getChangeColor(data.change.delays)}`}>
                {getChangeIcon(data.change.delays)}
                <span className="text-sm font-medium">{formatChange(data.change.delays)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
              <p className="text-xs text-dark-500 mb-1">Prosječno kašnjenje</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-dark-900">{data.period1.avgDelayMinutes.toFixed(0)} min</p>
                <span className="text-sm text-dark-500">vs</span>
                <p className="text-2xl font-semibold text-dark-900">{data.period2.avgDelayMinutes.toFixed(0)} min</p>
              </div>
              <div className={`flex items-center gap-1 mt-2 ${getChangeColor(data.change.avgDelayMinutes)}`}>
                {getChangeIcon(data.change.avgDelayMinutes)}
                <span className="text-sm font-medium">{formatChange(data.change.avgDelayMinutes)}</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          {data.chartData && data.chartData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Vizuelizacija</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#9A9A9A' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E2E4',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="period1"
                    stroke="#3392C5"
                    strokeWidth={2}
                    name={data.period1.label}
                  />
                  <Line
                    type="monotone"
                    dataKey="period2"
                    stroke="#16A34A"
                    strokeWidth={2}
                    name={data.period2.label}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Breakdown */}
          {data.breakdown && data.breakdown.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Detaljna analiza</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-dark-900">
                        {type === 'airlines' ? 'Kompanija' : type === 'destinations' ? 'Destinacija' : 'Kategorija'}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-dark-900">{data.period1.label}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-dark-900">{data.period2.label}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-dark-900">Promjena</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.breakdown.map((item, index) => (
                      <tr key={index} className="border-b border-dark-100 last:border-0">
                        <td className="py-3 px-4 text-sm text-dark-900">{item.name}</td>
                        <td className="py-3 px-4 text-sm text-dark-900 text-right">{item.period1.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-dark-900 text-right">{item.period2.toLocaleString()}</td>
                        <td className={`py-3 px-4 text-sm font-medium text-right ${getChangeColor(item.change)}`}>
                          <div className="flex items-center justify-end gap-1">
                            {getChangeIcon(item.change)}
                            {formatChange(item.change)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <h1 className="text-2xl font-semibold text-dark-900 mb-2">Komparacija</h1>
          <p className="text-sm text-dark-500">Napredna analiza i komparacija podataka</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <Tabs defaultValue="week-over-week" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
              <TabsTrigger value="week-over-week" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Week over Week</span>
                <span className="sm:hidden">WoW</span>
              </TabsTrigger>
              <TabsTrigger value="day-over-day" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Day over Day</span>
                <span className="sm:hidden">DoD</span>
              </TabsTrigger>
              <TabsTrigger value="month-over-month" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Month over Month</span>
                <span className="sm:hidden">MoM</span>
              </TabsTrigger>
              <TabsTrigger value="year-over-year" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Year over Year</span>
                <span className="sm:hidden">YoY</span>
              </TabsTrigger>
              <TabsTrigger value="quarter-over-quarter" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Quarter over Quarter</span>
                <span className="sm:hidden">QoQ</span>
              </TabsTrigger>
              <TabsTrigger value="season-over-season" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Season over Season</span>
                <span className="sm:hidden">SoS</span>
              </TabsTrigger>
              <TabsTrigger value="airlines" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Kompanije</span>
              </TabsTrigger>
              <TabsTrigger value="destinations" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Destinacije</span>
              </TabsTrigger>
              <TabsTrigger value="delays" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Kašnjenja</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="week-over-week">
              <ComparisonTab type="week-over-week" label="Week over Week" icon={Calendar} />
            </TabsContent>

            <TabsContent value="day-over-day">
              <ComparisonTab type="day-over-day" label="Day over Day" icon={Calendar} />
            </TabsContent>

            <TabsContent value="month-over-month">
              <ComparisonTab type="month-over-month" label="Month over Month" icon={Calendar} />
            </TabsContent>

            <TabsContent value="year-over-year">
              <ComparisonTab type="year-over-year" label="Year over Year" icon={Calendar} />
            </TabsContent>

            <TabsContent value="quarter-over-quarter">
              <ComparisonTab type="quarter-over-quarter" label="Quarter over Quarter" icon={Calendar} />
            </TabsContent>

            <TabsContent value="season-over-season">
              <ComparisonTab type="season-over-season" label="Season over Season" icon={Calendar} />
            </TabsContent>

            <TabsContent value="airlines">
              <ComparisonTab type="airlines" label="Komparacija kompanija" icon={Building2} />
            </TabsContent>

            <TabsContent value="destinations">
              <ComparisonTab type="destinations" label="Komparacija destinacija" icon={MapPin} />
            </TabsContent>

            <TabsContent value="delays">
              <ComparisonTab type="delays" label="Komparacija kašnjenja" icon={Clock} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
