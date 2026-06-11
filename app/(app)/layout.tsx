// Layout des écrans protégés — NavBar 5 onglets + bouton "+" (tranche ①)
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      {children}
      {/* TODO tranche ① : <NavBar /> (5 onglets) + <Fab /> (capture rapide) */}
    </div>
  );
}
