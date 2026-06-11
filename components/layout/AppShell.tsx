'use client';

import { useState } from 'react';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { NavBar } from './NavBar';
import { CaptureModal } from '@/components/capture/CaptureModal';
import type { ReponseListeTaches } from '@/types/api';
import type { Projet } from '@/types/projet';

function Shell({ children }: { children: React.ReactNode }) {
  const [captureOuverte, setCaptureOuverte] = useState(false);
  const { mutate } = useSWRConfig();
  const { data: taches } = useSWR<ReponseListeTaches>('/api/taches');
  const { data: projetsData } = useSWR<{ projets: Projet[] }>('/api/projets');

  return (
    <>
      {children}
      <button className="fab" aria-label="Nouvelle tâche" onClick={() => setCaptureOuverte(true)}>
        +
      </button>
      <NavBar nbAQualifier={taches?.nb_a_qualifier ?? 0} />
      {captureOuverte && (
        <CaptureModal
          projets={projetsData?.projets ?? []}
          onClose={() => setCaptureOuverte(false)}
          onCreee={() => {
            // Invalide toutes les listes de tâches (badge compris)
            mutate(key => typeof key === 'string' && key.startsWith('/api/taches'));
          }}
        />
      )}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: true }}>
      <Shell>{children}</Shell>
    </SWRConfig>
  );
}
