import { AppShell } from '@/components/layout/AppShell';

// Layout des écrans protégés — NavBar 5 onglets + bouton "+" de capture rapide
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
