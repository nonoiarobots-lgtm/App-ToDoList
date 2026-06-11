import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from './database.types';

type Prefs = Database['public']['Tables']['preferences']['Row'];

// Garantit l'existence de la ligne preferences pour l'utilisateur.
// Créée au premier accès authentifié à partir des métadonnées du signUp —
// robuste que la confirmation d'email soit activée ou non.
export async function ensurePreferences(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<Prefs | null> {
  const { data: existante } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existante) return existante;

  const meta = (user.user_metadata ?? {}) as { prenom?: string; timezone?: string };
  const { data: creee, error } = await supabase
    .from('preferences')
    .insert({
      user_id: user.id,
      prenom: meta.prenom || 'Moi',
      timezone: meta.timezone || 'Europe/Paris',
    })
    .select('*')
    .single();

  if (error) {
    console.error('ensurePreferences:', error.message);
    return null;
  }
  return creee;
}
