import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { TYPES_ACTIVITE_DEFAUT } from '@/types/activite';

type TypeActiviteRow = Database['public']['Tables']['types_activite']['Row'];

// Garantit que l'utilisateur dispose de ses types d'activité. Au premier accès,
// on sème la liste par défaut (besoin point 7) ; ensuite elle est paramétrable.
export async function ensureTypesActivite(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<TypeActiviteRow[]> {
  const { data: existants } = await supabase
    .from('types_activite')
    .select('*')
    .order('ordre')
    .order('created_at');

  if (existants && existants.length > 0) return existants;

  const aSemer = TYPES_ACTIVITE_DEFAUT.map((nom, i) => ({
    user_id: user.id,
    nom,
    ordre: i,
  }));
  const { data: crees, error } = await supabase
    .from('types_activite')
    .insert(aSemer)
    .select('*')
    .order('ordre');

  if (error) {
    console.error('ensureTypesActivite:', error.message);
    return existants ?? [];
  }
  return crees ?? [];
}
