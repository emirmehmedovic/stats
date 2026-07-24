'use client';

import { TicketForm } from '@/components/support-tickets/TicketForm';
import { MainLayout } from '@/components/layout/MainLayout';
import { Headphones } from 'lucide-react';

export default function NewTicketPage() {
  return (
    <MainLayout>
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-4 md:p-6 lg:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(139,92,246,0.12),transparent_25%),radial-gradient(circle_at_85%_0%,rgba(168,85,247,0.12),transparent_25%)]"></div>
          <div className="relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 lg:px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] lg:text-xs uppercase tracking-[0.2em] text-slate-200">
                <Headphones className="w-3 h-3" />
                IT Podrška
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold">Novi tiket</h1>
              <p className="text-xs lg:text-sm text-slate-200">
                Opišite problem koji imate i naš IT tim će vam pomoći
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft border border-dark-100 p-6 lg:p-8">
          <TicketForm />
        </div>
      </div>
    </MainLayout>
  );
}
