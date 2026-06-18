// Mock minimal d'un client Supabase pour les tests d'intégration des routes.
// Chaîne fluide "thenable" : chaque méthode renvoie la chaîne, et l'await
// (à n'importe quel maillon) résout vers le résultat configuré.
type Resolveur = (valeur: unknown) => unknown;

const METHODES = [
  'from', 'select', 'insert', 'update', 'delete',
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is', 'not', 'in',
  'order', 'limit', 'range', 'maybeSingle', 'single',
];

export function mockQuery(resultat: unknown): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  for (const m of METHODES) chain[m] = () => chain;
  chain.then = (resolve: Resolveur) => resolve(resultat);
  return chain;
}
