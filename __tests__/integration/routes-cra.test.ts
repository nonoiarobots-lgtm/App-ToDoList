import type { User } from '@supabase/supabase-js';
import * as apiUtils from '@/lib/api-utils';
import { mockQuery } from '../mocks/supabase';
import { POST as activitesPOST } from '@/app/api/activites/route';
import { GET as resumeGET } from '@/app/api/cra/resume/route';
import { GET as semaineGET } from '@/app/api/taches/semaine/route';
import { POST as typesPOST } from '@/app/api/types-activite/route';

const FAUX_USER = { id: 'user-1' } as unknown as User;

function authOk() {
  jest
    .spyOn(apiUtils, 'clientAuthentifie')
    .mockResolvedValue({ supabase: mockQuery({ data: null, error: null }) as never, user: FAUX_USER });
}
function authKo() {
  jest
    .spyOn(apiUtils, 'clientAuthentifie')
    .mockResolvedValue({ supabase: mockQuery({ data: null, error: null }) as never, user: null });
}

function req(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

afterEach(() => jest.restoreAllMocks());

describe('POST /api/activites', () => {
  it('401 sans session', async () => {
    authKo();
    const res = await activitesPOST(req('http://x/api/activites', 'POST', { date_activite: '2026-06-18', duree_min: 60 }));
    expect(res.status).toBe(401);
  });

  it('400 si durée pas multiple de 15', async () => {
    authOk();
    const res = await activitesPOST(req('http://x/api/activites', 'POST', { date_activite: '2026-06-18', duree_min: 10 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  it('400 si date invalide', async () => {
    authOk();
    const res = await activitesPOST(req('http://x/api/activites', 'POST', { date_activite: '18-06-2026', duree_min: 60 }));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/cra/resume', () => {
  it('401 sans session', async () => {
    authKo();
    expect((await resumeGET(req('http://x/api/cra/resume?from=2026-06-15&to=2026-06-21', 'GET'))).status).toBe(401);
  });

  it('400 sans paramètres from/to', async () => {
    authOk();
    expect((await resumeGET(req('http://x/api/cra/resume', 'GET'))).status).toBe(400);
  });
});

describe('GET /api/taches/semaine', () => {
  it('401 sans session', async () => {
    authKo();
    expect((await semaineGET(req('http://x/api/taches/semaine?from=2026-06-15&to=2026-06-21', 'GET'))).status).toBe(401);
  });

  it('400 sans paramètres from/to', async () => {
    authOk();
    expect((await semaineGET(req('http://x/api/taches/semaine', 'GET'))).status).toBe(400);
  });
});

describe('POST /api/types-activite', () => {
  it('401 sans session', async () => {
    authKo();
    expect((await typesPOST(req('http://x/api/types-activite', 'POST', { nom: 'Réunion' }))).status).toBe(401);
  });

  it('400 si nom vide', async () => {
    authOk();
    expect((await typesPOST(req('http://x/api/types-activite', 'POST', { nom: '  ' }))).status).toBe(400);
  });
});
