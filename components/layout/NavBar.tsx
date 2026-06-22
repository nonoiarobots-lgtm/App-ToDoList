'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

const ONGLETS = [
  { href: '/aujourd-hui', icone: 'light_mode', label: "Aujourd'hui" },
  { href: '/backlog', icone: 'inbox', label: 'Backlog' },
  { href: '/qualifier', icone: 'auto_awesome', label: 'À qualifier' },
  { href: '/cra', icone: 'bar_chart', label: 'CRA' },
  { href: '/semaine', icone: 'calendar_month', label: 'Semaine' },
];

export function NavBar({ nbAQualifier }: { nbAQualifier: number }) {
  const pathname = usePathname();

  return (
    <nav className="nav-bar">
      {ONGLETS.map(o => (
        <Link key={o.href} href={o.href} className={`nav-item ${pathname === o.href ? 'active' : ''}`}>
          <span className="nav-icon">
            <Icon name={o.icone} />
          </span>
          <span className="nav-label">{o.label}</span>
          {o.href === '/qualifier' && nbAQualifier > 0 && (
            <span className="nav-badge">{nbAQualifier}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
