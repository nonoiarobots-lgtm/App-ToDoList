import { mockQuery } from '../mocks/supabase';

// Le client admin est créé via @supabase/supabase-js — on le mocke pour éviter le réseau.
// Aucune préférence → la boucle ne tourne pas → réponse "rien envoyé".
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => mockQuery({ data: [], error: null }),
    auth: { admin: { getUserById: jest.fn() } },
  }),
}));

import { GET as cronGET } from '@/app/api/cron/notifications/route';

const URL = 'http://x/api/cron/notifications';

beforeAll(() => {
  process.env.CRON_SECRET = 'secret-de-test';
});

describe('GET /api/cron/notifications', () => {
  it('401 sans en-tête Authorization', async () => {
    const res = await cronGET(new Request(URL));
    expect(res.status).toBe(401);
  });

  it('401 avec un mauvais secret', async () => {
    const res = await cronGET(new Request(URL, { headers: { Authorization: 'Bearer mauvais' } }));
    expect(res.status).toBe(401);
  });

  it('200 et rien envoyé quand aucune préférence', async () => {
    const res = await cronGET(new Request(URL, { headers: { Authorization: 'Bearer secret-de-test' } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.envoyes).toEqual([]);
  });
});
