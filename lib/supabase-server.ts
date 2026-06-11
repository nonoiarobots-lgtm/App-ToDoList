import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Client Supabase côté serveur (Server Components et Route Handlers).
// Utilise @supabase/ssr — successeur officiel de @supabase/auth-helpers-nextjs (déprécié).
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: cookiesToSet => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component — les cookies sont gérés par le middleware
          }
        },
      },
    }
  );
}
