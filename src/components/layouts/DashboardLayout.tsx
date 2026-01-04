'use client';

import Sidebar from './Sidebar';
import Header from './Header';
import AuthCheck from '../AuthCheck';
import { ToastContainer } from '../ui/toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthCheck>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="ml-64">
          <Header />
          <main className="pt-20">
            {children}
          </main>
        </div>
        <ToastContainer />
      </div>
    </AuthCheck>
  );
}

