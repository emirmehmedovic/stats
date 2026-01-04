import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  Route,
  ArrowRight,
  Activity,
  PieChart
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

export default function AnalyticsPage() {
  const analyticsModules = [
    {
      title: 'Load Factor Analysis',
      description: 'Analyze aircraft capacity utilization and seat occupancy rates across flights and airlines',
      href: '/analytics/load-factor',
      icon: PieChart,
      color: 'from-blue-500 to-blue-600',
      stats: 'Capacity & Occupancy',
    },
    {
      title: 'Punctuality Report',
      description: 'Monitor on-time performance, delays, and operational efficiency metrics',
      href: '/analytics/punctuality',
      icon: Activity,
      color: 'from-green-500 to-green-600',
      stats: 'On-Time Performance',
    },
    {
      title: 'Route Analysis',
      description: 'Evaluate route profitability, frequency, and passenger traffic patterns',
      href: '/analytics/routes',
      icon: Route,
      color: 'from-purple-500 to-purple-600',
      stats: 'Routes & Destinations',
    },
  ];

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-dark-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-dark-900">Analytics Dashboard</h1>
              <p className="text-dark-600 mt-1">Advanced analytics and performance insights</p>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-2 text-sm text-dark-500">
            <TrendingUp className="w-4 h-4" />
            <span>Real-time data analysis • Performance metrics • Trend visualization</span>
          </div>
        </div>

          {/* Analytics Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyticsModules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group bg-white rounded-2xl shadow-lg p-6 border border-dark-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                <div className="flex flex-col h-full">
                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-4 bg-gradient-to-br ${module.color} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-dark-900 group-hover:text-blue-600 transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-xs text-dark-500 mt-1">{module.stats}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-dark-600 text-sm leading-relaxed mb-6 flex-1">
                    {module.description}
                  </p>

                  {/* Action Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-dark-100">
                    <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                      View Analytics
                    </span>
                    <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
            })}
          </div>

          {/* Quick Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-blue-900">Load Factor</h3>
            </div>
            <p className="text-sm text-blue-700 leading-relaxed">
              Track seat occupancy rates, identify underperforming flights, and optimize capacity allocation
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-green-900">Punctuality</h3>
            </div>
            <p className="text-sm text-green-700 leading-relaxed">
              Monitor delays, calculate on-time performance, and analyze operational efficiency patterns
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Route className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-purple-900">Routes</h3>
            </div>
            <p className="text-sm text-purple-700 leading-relaxed">
              Evaluate route profitability, passenger volumes, and identify growth opportunities
            </p>
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border border-dark-100 text-dark-600 hover:text-blue-600 font-medium"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Dashboard
            </Link>
          </div>
        </div>
    </MainLayout>
  );
}

