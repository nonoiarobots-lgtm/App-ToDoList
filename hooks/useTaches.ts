'use client';

// Pattern SWR de référence pour tous les hooks de données (plan-demarrage Action 7)
import useSWR from 'swr';
import type { ReponseListeTaches } from '@/types/api';

export function useTaches(params?: { statut?: string; vue?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const { data, error, isLoading, mutate } = useSWR<ReponseListeTaches>(`/api/taches?${query}`);

  return {
    taches: data?.data ?? [],
    nbAQualifier: data?.nb_a_qualifier ?? 0,
    alerte: data?.alerte ?? null,
    isLoading,
    error,
    mutate, // pour les invalidations après mutation
  };
}
