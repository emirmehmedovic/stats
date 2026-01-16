import { MainLayout } from '@/components/layout/MainLayout';
import { ToastContainer } from '@/components/ui/toast';

export default function NaplateLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      {children}
      <ToastContainer />
    </MainLayout>
  );
}
