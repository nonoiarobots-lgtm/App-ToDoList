'use client';

import type { ErreurAPI } from '@/types/api';

export class FetchError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// Fetcher SWR commun : parse le JSON, lève FetchError sur code HTTP non-2xx
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (json as ErreurAPI)?.error;
    throw new FetchError(err?.code ?? 'BDD_INDISPONIBLE', err?.message ?? 'Erreur réseau', res.status);
  }
  return json as T;
}

// Helper mutations (POST/PATCH/DELETE)
export async function appeler<T>(url: string, methode: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: methode,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (json as ErreurAPI)?.error;
    throw new FetchError(err?.code ?? 'BDD_INDISPONIBLE', err?.message ?? 'Erreur réseau', res.status);
  }
  return json as T;
}
