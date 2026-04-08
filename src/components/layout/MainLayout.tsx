'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/ui/toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-50">
      <Sidebar />
      <Header />
      <main className="ml-[280px] pt-24">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}
