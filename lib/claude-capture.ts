// Appel Claude API pour le découpage vocal — implémentation en tranche ②
// Clé API côté serveur uniquement (jamais NEXT_PUBLIC_).
import type { Projet } from '@/types/projet';
import type { TacheIA } from '@/types/tache';

export async function capturerTachesIA(_dictee: string, _projets: Projet[]): Promise<TacheIA[]> {
  // TODO tranche ② : @anthropic-ai/sdk + prompt de docs/prompt-engineering.md
  throw new Error('NOT_IMPLEMENTED');
}
