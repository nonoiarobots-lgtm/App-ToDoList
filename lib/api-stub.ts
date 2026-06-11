import { NextResponse } from 'next/server';
import { erreurAPI } from './logique-erreurs';

// Réponse standard des endpoints non encore implémentés.
// Chaque tranche de développement remplace les stubs par la vraie logique.
export function nonImplemente(tranche: string) {
  return NextResponse.json(erreurAPI('NOT_IMPLEMENTED', `À implémenter en tranche ${tranche}`, 501), {
    status: 501,
  });
}
