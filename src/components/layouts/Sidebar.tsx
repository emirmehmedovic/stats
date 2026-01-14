'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  Plane,
  Building2,
  Calendar,
  Users,
  ChevronDown,
  ChevronRight,
  Settings,
  Settings2,
  Shield,
  PieChart,
  Activity,
  Route,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';

type MenuItem = {
  id: string;
  label: string;
  icon: any;
  href?: string;
  children?: MenuItem[];
};

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'daily-operations',
    label: 'Dnevne operacije',
    icon: Calendar,
    href: '/daily-operations',
  },
  {
    id: 'flights',
    label: 'Letovi',
    icon: Plane,
    children: [
      {
        id: 'flights-list',
        label: 'Lista letova',
        icon: Plane,
        href: '/flights',
      },
      {
        id: 'flights-import',
        label: 'Import letova',
        icon: Plane,
        href: '/flights/import',
      },
    ],
  },
  {
    id: 'airlines',
    label: 'Aviokompanije',
    icon: Building2,
    href: '/airlines',
  },
  {
    id: 'aircraft-types',
    label: 'Tipovi aviona',
    icon: Plane,
    href: '/aircraft-types',
  },
  {
    id: 'operation-types',
    label: 'Tipovi operacije',
    icon: Settings2,
    href: '/operation-types',
  },
  {
    id: 'delay-codes',
    label: 'Delay kodovi',
    icon: AlertCircle,
    href: '/delay-codes',
  },
  {
    id: 'comparison',
    label: 'Komparacija',
    icon: TrendingUp,
    children: [
      {
        id: 'comparison-main',
        label: 'Komparacija',
        icon: TrendingUp,
        href: '/comparison',
      },
      {
        id: 'weekly-trend',
        label: 'Sedmični trend',
        icon: Calendar,
        href: '/comparison/weekly-trend',
      },
      {
        id: 'monthly-trend',
        label: 'Mjesečni trend',
        icon: Calendar,
        href: '/comparison/monthly-trend',
      },
      {
        id: 'yearly-trend',
        label: 'Godišnji trend',
        icon: Calendar,
        href: '/comparison/yearly-trend',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    children: [
      {
        id: 'load-factor',
        label: 'Load Factor',
        icon: PieChart,
        href: '/analytics/load-factor',
      },
      {
        id: 'punctuality',
        label: 'Punctuality',
        icon: Activity,
        href: '/analytics/punctuality',
      },
      {
        id: 'routes',
        label: 'Routes',
        icon: Route,
        href: '/analytics/routes',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Izvještaji',
    icon: FileText,
    children: [
      {
        id: 'daily',
        label: 'Dnevni',
        icon: FileText,
        href: '/reports/daily',
      },
      {
        id: 'monthly',
        label: 'Mjesečni',
        icon: FileText,
        href: '/reports/monthly',
      },
      {
        id: 'yearly',
        label: 'Godišnji',
        icon: FileText,
        href: '/reports/yearly',
      },
      {
        id: 'custom',
        label: 'Custom',
        icon: FileText,
        href: '/reports/custom',
      },
    ],
  },
];

const managementItems: MenuItem[] = [
  {
    id: 'employees',
    label: 'Radnici',
    icon: Users,
    href: '/employees',
  },
];

const adminItems: MenuItem[] = [
  {
    id: 'admin',
    label: 'Admin Panel',
    icon: Settings2,
    href: '/admin/users',
  },
  {
    id: 'audit-logs',
    label: 'Audit log',
    icon: Shield,
    href: '/admin/audit-logs',
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['analytics', 'reports']);
  const [userRole, setUserRole] = useState<string | null>(() => {
    // Initialize from localStorage immediately
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole');
    }
    return null;
  });

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
        console.error('Error fetching user role:', error);
        // Fallback to localStorage
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
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [userRole]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const viewerRestrictedHrefs = [
    '/flights',
    '/airlines',
    '/aircraft-types',
    '/operation-types',
    '/delay-codes',
  ];

  const filterViewerMenuItems = (items: MenuItem[]) => {
    return items
      .map((item) => {
        if (item.children && item.children.length > 0) {
          const filteredChildren = item.children.filter(
            (child) => !viewerRestrictedHrefs.some(route => child.href?.startsWith(route))
          );
          if (filteredChildren.length === 0) {
            return null;
          }
          return { ...item, children: filteredChildren };
        }
        const href = item.href;
        if (href && viewerRestrictedHrefs.some(route => href.startsWith(route))) {
          return null;
        }
        return item;
      })
      .filter((item): item is MenuItem => item !== null);
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.href);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpand(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              active || item.children?.some(child => isActive(child.href))
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
            style={{ paddingLeft: `${depth * 16 + 16}px` }}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children?.map(child => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href || '#'}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
          active
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-700 hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${depth * 16 + 16}px` }}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Aerodrom TZL</h1>
            <p className="text-xs text-slate-500">Statistics System</p>
          </div>
        </Link>
      </div>

      {/* Help Section */}
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="text-xs font-semibold text-slate-400 mb-1">Trebate pomoć?</div>
        <div className="text-sm text-slate-600">Pitajte nas bilo šta!</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* HOME Section */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2 px-2">HOME</div>
          <div className="space-y-1">
            {(userRole === 'VIEWER' ? filterViewerMenuItems(menuItems) : menuItems)
              .map(item => renderMenuItem(item))}
          </div>
        </div>

        {/* MANAGEMENT Section */}
        {userRole !== 'OPERATIONS' && (
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2 px-2">MANAGEMENT</div>
            <div className="space-y-1">
              {managementItems.map(item => renderMenuItem(item))}
            </div>
          </div>
        )}

        {/* ADMIN Section - Only for ADMIN role */}
        {userRole === 'ADMIN' && (
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2 px-2">ADMIN</div>
            <div className="space-y-1">
              {adminItems.map(item => renderMenuItem(item))}
            </div>
          </div>
        )}
      </nav>

      {/* Settings Footer */}
      <div className="p-4 border-t border-slate-200">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
        >
          <Settings className="w-5 h-5" />
          <span>Postavke</span>
        </Link>
      </div>
    </aside>
  );
}
