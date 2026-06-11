import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  // Vercel envoie automatiquement "Authorization: Bearer <CRON_SECRET>"
  // quand la variable d'environnement CRON_SECRET est définie
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  // Requête minimale — compte comme activité côté Supabase
  const { error } = await supabase.from('preferences').select('id').limit(1);

  return NextResponse.json({ ok: !error, at: new Date().toISOString() });
}
