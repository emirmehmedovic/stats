import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oglašavanje | Međunarodni aerodrom Tuzla',
  description: 'Reklamni prostor na Međunarodnom aerodromu Tuzla. Predstavite svoju kompaniju putnicima, posjetiocima i poslovnim partnerima.',
};

export default function AdvertisingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple wrapper - no sidebar, no dashboard layout
  // This creates a standalone public page
  return <>{children}</>;
}
