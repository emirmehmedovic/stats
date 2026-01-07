'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Plane,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Building2,
  Users,
  Calendar,
  AlertTriangle,
  Package,
  Settings2,
  LogOut,
  Shield,
  Briefcase,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'HOME',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Pregled', href: '/summary', icon: BarChart3 },
      { label: 'Dnevne operacije', href: '/daily-operations', icon: Calendar },
      {
        label: 'Letovi',
        href: '/flights',
        icon: Plane,
        subItems: [
          { label: 'Svi letovi', href: '/flights', icon: Plane },
          { label: 'Import rasporeda', href: '/flights/import', icon: Package },
          { label: 'Aviokompanije', href: '/airlines', icon: Building2 },
          { label: 'Tipovi aviona', href: '/aircraft-types', icon: Plane },
          { label: 'Tipovi operacija', href: '/operation-types', icon: Package },
          { label: 'Kodovi kašnjenja', href: '/delay-codes', icon: AlertTriangle },
        ],
      },
    ],
  },
  {
    title: 'ANALITIKA',
    items: [
      {
        label: 'Analitika',
        href: '/analytics',
        icon: BarChart3,
        subItems: [
          { label: 'Load Factor', href: '/analytics/load-factor', icon: TrendingUp },
          { label: 'Tačnost', href: '/analytics/punctuality', icon: TrendingUp },
          { label: 'Rute', href: '/analytics/routes', icon: TrendingUp },
        ],
      },
    ],
  },
  {
    title: 'IZVJEŠTAJI',
    items: [
      { label: 'Generisanje izvještaja', href: '/generate-report', icon: Sparkles },
      {
        label: 'Izvještaji',
        href: '/reports',
        icon: FileText,
        subItems: [
          { label: 'Dnevni', href: '/reports/daily', icon: Calendar },
          { label: 'Mjesečni', href: '/reports/monthly', icon: Calendar },
          { label: 'Godišnji', href: '/reports/yearly', icon: Calendar },
          { label: 'Prilagođeni', href: '/reports/custom', icon: Calendar },
        ],
      },
    ],
  },
  {
    title: 'POREĐENJE',
    items: [
      {
        label: 'Poređenje',
        href: '/comparison',
        icon: TrendingUp,
        subItems: [
          { label: 'Pregled', href: '/comparison', icon: TrendingUp },
          { label: 'Sedmični trend', href: '/comparison/weekly-trend', icon: TrendingUp },
          { label: 'Mjesečni trend', href: '/comparison/monthly-trend', icon: TrendingUp },
          { label: 'Godišnji trend', href: '/comparison/yearly-trend', icon: TrendingUp },
        ],
      },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      {
        label: 'Radnici',
        href: '/employees',
        icon: Users,
        subItems: [
          { label: 'Svi radnici', href: '/employees', icon: Users },
          { label: 'Tipovi licenci', href: '/admin/license-types', icon: Shield },
          { label: 'Sektori', href: '/admin/sectors', icon: Briefcase },
        ],
      },
    ],
  },
];

const adminSection: NavSection = {
  title: 'ADMIN',
  items: [
    { label: 'Admin Panel', href: '/admin/users', icon: Settings2 },
    { label: 'Audit log', href: '/admin/audit-logs', icon: Shield },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    '/flights': true,
    '/reports': true,
    '/analytics': true,
    '/comparison': true,
  });
  const [todayPassengers, setTodayPassengers] = useState<number | null>(null);
  const [loadingPassengers, setLoadingPassengers] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      // First check localStorage immediately for faster initial render
      const localRole = localStorage.getItem('userRole');
      if (localRole && localRole !== userRole) {
        setUserRole(localRole);
      }

      // Also fetch from API to ensure we have the latest role
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.user) {
          const role = data.user.role;
          if (role !== userRole) {
            setUserRole(role);
            localStorage.setItem('userRole', role);
          }
        }
      } catch (error) {
        // Silently fail, use localStorage as fallback
        const localRole = localStorage.getItem('userRole');
        if (localRole && localRole !== userRole) {
          setUserRole(localRole);
        }
      }
    };

    // Check role on mount
    checkRole();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      const newRole = localStorage.getItem('userRole');
      if (newRole !== userRole) {
        setUserRole(newRole);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case localStorage was updated in same tab
    const interval = setInterval(() => {
      const currentRole = localStorage.getItem('userRole');
      if (currentRole !== userRole) {
        setUserRole(currentRole);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [userRole]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleSection = (href: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  useEffect(() => {
    const fetchTodayPassengers = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('Greška pri učitavanju');
        }
        const result = await response.json();
        setTodayPassengers(result.data?.today?.passengers ?? null);
      } catch (error) {
        console.error('Failed to load today passengers', error);
        setTodayPassengers(null);
      } finally {
        setLoadingPassengers(false);
      }
    };

    fetchTodayPassengers();
  }, []);

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedSections[item.href];

    if (hasSubItems) {
      return (
        <div key={item.href}>
          <button
            onClick={() => toggleSection(item.href)}
            className={`
              w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all duration-200 group
              ${active
                ? 'bg-dark-900 text-white shadow-soft-lg'
                : 'text-dark-500 hover:bg-dark-50 hover:text-dark-900'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-dark-400 group-hover:text-dark-900'}`} />
              <span className="font-medium">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className={`w-4 h-4 ${active ? 'text-white' : 'text-dark-400'}`} />
            ) : (
              <ChevronRight className={`w-4 h-4 ${active ? 'text-white' : 'text-dark-400'}`} />
            )}
          </button>

          {isExpanded && (
            <div className="mt-1 ml-4 space-y-1 relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-200">
              {item.subItems?.map((subItem, index) => {
                const SubIcon = subItem.icon;
                const subActive = isActive(subItem.href);

                return (
                  <div key={subItem.href} className="relative">
                    {/* Curved connector line */}
                    <div className="absolute left-0 top-0 w-8 h-full -ml-6">
                      <div className="absolute left-0 top-1/2 w-full h-6 border-l-2 border-b-2 border-dark-200 rounded-bl-2xl -translate-y-1/2"></div>
                    </div>

                    <Link
                      href={subItem.href}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm transition-all duration-200 group relative z-10
                        ${subActive
                          ? 'bg-dark-900 text-white shadow-soft-lg'
                          : 'text-dark-500 hover:bg-dark-50 hover:text-dark-900'
                        }
                      `}
                    >
                      <SubIcon className={`w-4 h-4 ${subActive ? 'text-white' : 'text-dark-400 group-hover:text-dark-900'}`} />
                      <span className="font-medium">{subItem.label}</span>
                      {subActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 group
          ${active
            ? 'bg-dark-900 text-white shadow-soft-lg'
            : 'text-dark-500 hover:bg-dark-50 hover:text-dark-900'
          }
        `}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-dark-400 group-hover:text-dark-900'}`} />
        <span className="font-medium">{item.label}</span>
        {active && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
        )}
      </Link>
    );
  };

  const visibleSections = navSections.filter((section) => {
    if (section.title === 'MANAGEMENT' && userRole === 'OPERATIONS') {
      return false;
    }
    return true;
  });

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-dark-100 flex flex-col shadow-soft z-50 overflow-hidden">
      {/* Logo Section */}
      <div className="px-6 pt-8 pb-6 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group mb-6">
          <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center shadow-primary group-hover:shadow-primary-lg transition-all">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-dark-900 font-bold text-xl tracking-tight">Aerodrom Tuzla</h1>
            <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider">Dashboard</p>
          </div>
        </Link>

        {/* Help Section */}
        <div className="bg-dark-50 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-dark-900">Trebate pomoć?</p>
              <p className="text-xs text-dark-500 mt-1">Nazovite Emira (061/904-759)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto">
        <div className="space-y-6 pb-4">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <p className="px-4 mb-2 text-[10px] font-bold text-dark-400 uppercase tracking-widest">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => renderNavItem(item))}
              </div>
            </div>
          ))}
          
          {/* ADMIN Section - Only for ADMIN role */}
          {isMounted && userRole === 'ADMIN' && (
            <div>
              <p className="px-4 mb-2 text-[10px] font-bold text-dark-400 uppercase tracking-widest">
                {adminSection.title}
              </p>
              <div className="space-y-1">
                {adminSection.items.map((item) => renderNavItem(item))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Promo Section */}
      <div className="p-4 flex-shrink-0">
        <div className="bg-dark-50 rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-100 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity"></div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm mb-3">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-bold text-dark-900 text-sm mb-1">Dnevna statistika</h3>
            <p className="text-xs text-dark-500 mb-3">Pregled današnjeg prometa putnika</p>
            <button className="w-full py-2 bg-dark-900 text-white text-xs font-medium rounded-xl hover:bg-primary-600 transition-colors shadow-soft">
              {loadingPassengers
                ? 'Učitavanje...'
                : todayPassengers !== null
                  ? `Putnika danas: ${todayPassengers}`
                  : 'Nije dostupno'}
            </button>
          </div>
        </div>

        {/* Settings & Logout */}
        <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-dark-100">
          <Link
            href="/settings"
            className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-50 rounded-xl transition-all"
            title="Podešavanja"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <button
            onClick={async () => {
              setIsLoggingOut(true);
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
                localStorage.clear();
                router.push('/');
              } catch (error) {
                console.error('Logout error:', error);
                // Still redirect even if API call fails
                localStorage.clear();
                router.push('/');
              } finally {
                setIsLoggingOut(false);
              }
            }}
            disabled={isLoggingOut}
            className="p-2 text-dark-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Odjavi se"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
