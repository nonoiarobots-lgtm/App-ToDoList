'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ONGLETS = [
  { href: '/aujourd-hui', icone: '☀️', label: "Aujourd'hui" },
  { href: '/backlog', icone: '📋', label: 'Backlog' },
  { href: '/qualifier', icone: '⚡', label: 'À qualifier' },
  { href: '/cra', icone: '📊', label: 'CRA' },
  { href: '/semaine', icone: '📅', label: 'Semaine' },
];

export function NavBar({ nbAQualifier }: { nbAQualifier: number }) {
  const pathname = usePathname();

  return (
    <nav className="nav-bar">
      {ONGLETS.map(o => (
        <Link key={o.href} href={o.href} className={`nav-item ${pathname === o.href ? 'active' : ''}`}>
          <span className="nav-icon">{o.icone}</span>
          <span className="nav-label">{o.label}</span>
          {o.href === '/qualifier' && nbAQualifier > 0 && (
            <span className="nav-badge">{nbAQualifier}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
