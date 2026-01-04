import { MainLayout } from '@/components/layout/MainLayout';
import AuthCheck from '@/components/AuthCheck';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck>
      <MainLayout>{children}</MainLayout>
    </AuthCheck>
  );
}

