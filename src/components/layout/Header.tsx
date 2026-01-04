'use client';

import { Search, Bell, Calendar, User } from 'lucide-react';
import { formatDateDisplay, getTodayDateString } from '@/lib/dates';

export function Header() {
  const todayLabel = formatDateDisplay(getTodayDateString());

  return (
    <header className="fixed top-0 right-0 left-[280px] h-24 bg-dark-50 border-b border-dark-100 z-30">
      <div className="h-full px-8 flex items-center gap-8">
        {/* Title/Breadcrumb Area */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-dark-900">Dashboard</h2>
          <p className="text-sm text-dark-500 font-medium">Home › Overview</p>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl ml-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Pretražite bilo šta..."
              className="w-full pl-12 pr-4 py-3.5 text-sm bg-white border-none shadow-soft rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-100 text-dark-900 placeholder:text-dark-400 transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Date Display */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-soft text-sm font-medium text-dark-700">
            <span className="text-base font-bold text-dark-900">{todayLabel}</span>
            <Calendar className="w-5 h-5 text-dark-400 ml-2" />
          </div>

          {/* Notification Bell */}
          <button className="relative p-3.5 bg-white rounded-full shadow-soft hover:shadow-primary transition-all group">
            <Bell className="w-5 h-5 text-dark-600 group-hover:text-primary-600" />
            <span className="absolute top-3 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* User Profile */}
          <button className="flex items-center gap-3 pl-2 pr-4 py-2 bg-white rounded-full shadow-soft hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-dark-900 leading-none">Admin User</p>
              <p className="text-[10px] font-medium text-dark-500 uppercase mt-1">Administrator</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
