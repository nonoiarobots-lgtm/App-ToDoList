import { calculerStatutRetard, estEnRetard, joursDeRetard, preparerArchivage } from '@/lib/logique-taches';

const MAINTENANT = new Date('2026-06-11T12:00:00Z');

describe('calculerStatutRetard', () => {
  it("passe une tâche active à échéance dépassée en 'en_retard'", () => {
    const statut = calculerStatutRetard(
      { statut: 'active', date_echeance: '2026-06-10T18:00:00Z' },
      MAINTENANT
    );
    expect(statut).toBe('en_retard');
  });

  it("passe une tâche 'en_attente_retour' à échéance dépassée en 'en_retard'", () => {
    const statut = calculerStatutRetard(
      { statut: 'en_attente_retour', date_echeance: '2026-06-10T18:00:00Z' },
      MAINTENANT
    );
    expect(statut).toBe('en_retard');
  });

  it("laisse une tâche active à échéance future en 'active'", () => {
    const statut = calculerStatutRetard(
      { statut: 'active', date_echeance: '2026-06-12T18:00:00Z' },
      MAINTENANT
    );
    expect(statut).toBe('active');
  });

  it('ne touche pas une tâche sans échéance', () => {
    expect(calculerStatutRetard({ statut: 'active', date_echeance: null }, MAINTENANT)).toBe('active');
  });

  it("ne met jamais en retard une tâche 'a_qualifier' ou 'archivee'", () => {
    expect(
      calculerStatutRetard({ statut: 'a_qualifier', date_echeance: '2026-06-01T00:00:00Z' }, MAINTENANT)
    ).toBe('a_qualifier');
    expect(
      calculerStatutRetard({ statut: 'archivee', date_echeance: '2026-06-01T00:00:00Z' }, MAINTENANT)
    ).toBe('archivee');
  });
});

describe('estEnRetard', () => {
  it('retourne true pour une échéance dépassée', () => {
    expect(estEnRetard({ statut: 'active', date_echeance: '2026-06-10T18:00:00Z' }, MAINTENANT)).toBe(true);
  });
  it('retourne false pour une échéance future', () => {
    expect(estEnRetard({ statut: 'active', date_echeance: '2026-06-12T18:00:00Z' }, MAINTENANT)).toBe(false);
  });
});

describe('joursDeRetard', () => {
  it('calcule le nombre de jours entiers de retard', () => {
    expect(joursDeRetard('2026-06-08T12:00:00Z', MAINTENANT)).toBe(3);
  });
  it('retourne 0 le jour même', () => {
    expect(joursDeRetard('2026-06-11T08:00:00Z', MAINTENANT)).toBe(0);
  });
  it('ne retourne jamais de valeur négative', () => {
    expect(joursDeRetard('2026-06-20T08:00:00Z', MAINTENANT)).toBe(0);
  });
});

describe('preparerArchivage', () => {
  it("retourne le statut 'archivee' (date_cloture et avancement gérés par trigger SQL)", () => {
    expect(preparerArchivage()).toEqual({ statut: 'archivee' });
  });
});
