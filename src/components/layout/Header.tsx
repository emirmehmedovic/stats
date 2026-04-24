'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Bell, Calendar, User, Menu } from 'lucide-react';
import { formatDateDisplay, getTodayDateString } from '@/lib/dates';

interface HeaderProps {
  toggleMobileMenu: () => void;
}

export function Header({ toggleMobileMenu }: HeaderProps) {
  const todayLabel = formatDateDisplay(getTodayDateString());
  const [userName, setUserName] = useState('Korisnik');
  const [userRole, setUserRole] = useState('Korisnik');

  useEffect(() => {
    const localName = localStorage.getItem('userName');
    const localRole = localStorage.getItem('userRole');
    if (localName) setUserName(localName);
    if (localRole) setUserRole(localRole);

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data?.authenticated && data?.user) {
          const name = data.user.name || data.user.email?.split('@')[0] || 'Korisnik';
          setUserName(name);
          setUserRole(data.user.role || 'Korisnik');
          localStorage.setItem('userName', name);
          localStorage.setItem('userRole', data.user.role || 'Korisnik');
        }
      } catch (error) {
        // Use localStorage fallback
      }
    };

    fetchUser();
  }, []);

  return (
    <header className="fixed top-0 right-0 lg:left-[280px] left-0 h-16 lg:h-24 bg-dark-50 border-b border-dark-100 z-30">
      <div className="h-full px-4 lg:px-8 flex items-center gap-2 lg:gap-8">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-dark-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6 text-dark-900" />
        </button>

        {/* Title/Breadcrumb Area */}
        <div className="flex flex-col hidden md:block">
          <h2 className="text-xl lg:text-2xl font-bold text-dark-900">Dashboard</h2>
          <p className="text-xs lg:text-sm text-dark-500 font-medium hidden lg:block">Home › Overview</p>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-xl ml-auto">
          <div className="relative group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Pretražite bilo šta..."
              className="w-full pl-12 pr-4 py-2.5 lg:py-3.5 text-sm bg-white border-none shadow-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-100 text-dark-900 placeholder:text-dark-400 transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-4 ml-auto md:ml-0">
          {/* Date Display - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-soft text-sm font-medium text-dark-700">
            <span className="text-base font-bold text-dark-900">{todayLabel}</span>
            <Calendar className="w-5 h-5 text-dark-400 ml-2" />
          </div>

          {/* Notification Bell */}
          <button className="relative p-2 lg:p-3.5 bg-white rounded-full shadow-soft hover:shadow-primary transition-all group">
            <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-dark-600 group-hover:text-primary-600" />
            <span className="absolute top-2 right-2 lg:top-3 lg:right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* User Profile */}
          <Link
            href="/profile"
            className="flex items-center gap-2 lg:gap-3 pl-1 lg:pl-2 pr-2 lg:pr-4 py-1 lg:py-2 bg-white rounded-full shadow-soft hover:shadow-md transition-all"
          >
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs lg:text-sm font-bold text-dark-900 leading-none">{userName}</p>
              <p className="text-[9px] lg:text-[10px] font-medium text-dark-500 uppercase mt-1">{userRole}</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
