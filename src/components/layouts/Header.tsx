'use client';

import { Search, Calendar, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationsDropdown } from '../notifications/NotificationsDropdown';
import { formatDateDisplay, getTodayDateString } from '@/lib/dates';

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('Administrator');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentDateLabel, setCurrentDateLabel] = useState<string>('');

  useEffect(() => {
    setCurrentDateLabel(formatDateDisplay(getTodayDateString()));
  }, []);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-20">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Pretraži bilo šta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-6">
        {/* Notifications */}
        <NotificationsDropdown />

        {/* Date Display */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
          {currentDateLabel && (
            <div className="text-right text-sm font-semibold text-slate-900">{currentDateLabel}</div>
          )}
        </div>

        {/* Calendar Button */}
        <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
          <Calendar className="w-5 h-5 text-slate-600" />
        </button>

        {/* User Profile with Dropdown */}
        <div className="relative pl-4 border-l border-slate-200">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 capitalize">{userName}</div>
              <div className="text-xs text-slate-500">Administrator</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/settings');
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Postavke</span>
              </button>
              <div className="border-t border-slate-200 my-2"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Odjavi se</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </header>
  );
}
