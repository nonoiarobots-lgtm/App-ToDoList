import {
  calculerStatutRetard,
  estEnRetard,
  estQualifiable,
  filtrerTaches,
  FILTRES_VIDES,
  joursDeRetard,
  nombreFiltresActifs,
  preparerArchivage,
  statutACapture,
} from '@/lib/logique-taches';
import type { Tache } from '@/types/tache';

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

describe('estQualifiable', () => {
  it('est vrai quand projet, échéance et priorité explicite sont renseignés', () => {
    expect(
      estQualifiable({ projet_id: 'p1', date_echeance: '2026-06-25T18:00:00Z', priorite: 'moyenne' })
    ).toBe(true);
  });
  it('est faux sans projet', () => {
    expect(
      estQualifiable({ projet_id: null, date_echeance: '2026-06-25T18:00:00Z', priorite: 'haute' })
    ).toBe(false);
  });
  it('est faux sans échéance', () => {
    expect(estQualifiable({ projet_id: 'p1', date_echeance: null, priorite: 'haute' })).toBe(false);
  });
  it("est faux si la priorité vaut 'aucune'", () => {
    expect(
      estQualifiable({ projet_id: 'p1', date_echeance: '2026-06-25T18:00:00Z', priorite: 'aucune' })
    ).toBe(false);
  });
});

describe('statutACapture', () => {
  it("retourne 'active' pour une tâche entièrement qualifiée", () => {
    expect(
      statutACapture({ projet_id: 'p1', date_echeance: '2026-06-25T18:00:00Z', priorite: 'moyenne' })
    ).toBe('active');
  });
  it("retourne 'a_qualifier' pour une capture incomplète", () => {
    expect(statutACapture({ projet_id: null, date_echeance: null, priorite: 'moyenne' })).toBe(
      'a_qualifier'
    );
  });
});

describe('filtres du backlog', () => {
  const t = (over: Partial<Tache>): Tache =>
    ({
      id: Math.random().toString(),
      titre: 'Tâche',
      notes: null,
      statut: 'active',
      priorite: 'moyenne',
      projet_id: null,
      date_echeance: null,
      user_id: 'u',
      date_debut: null,
      date_cloture: null,
      responsable: 'Moi',
      avancement: 0,
      temps_estime_min: null,
      recurrence_id: null,
      predecesseur_id: null,
      pre_caracterisee_ia: false,
      created_at: '',
      updated_at: '',
      ...over,
    }) as Tache;

  const taches = [
    t({ titre: 'Préparer le COPIL', priorite: 'haute', projet_id: 'p1', statut: 'active' }),
    t({ titre: 'Relancer prestataire', priorite: 'moyenne', projet_id: 'p2', statut: 'en_retard' }),
    t({ titre: 'Ranger le bureau', priorite: 'basse', projet_id: null, statut: 'a_qualifier' }),
  ];

  it('sans critère, retourne tout', () => {
    expect(filtrerTaches(taches, FILTRES_VIDES)).toHaveLength(3);
  });
  it('filtre par recherche (insensible à la casse)', () => {
    expect(filtrerTaches(taches, { ...FILTRES_VIDES, recherche: 'copil' })).toHaveLength(1);
  });
  it('filtre par priorité (multi)', () => {
    expect(
      filtrerTaches(taches, { ...FILTRES_VIDES, priorites: ['haute', 'basse'] })
    ).toHaveLength(2);
  });
  it('filtre par projet, avec la clé sans-projet', () => {
    expect(filtrerTaches(taches, { ...FILTRES_VIDES, projetIds: ['sans-projet'] })).toHaveLength(1);
    expect(filtrerTaches(taches, { ...FILTRES_VIDES, projetIds: ['p1'] })).toHaveLength(1);
  });
  it('filtre par statut', () => {
    expect(filtrerTaches(taches, { ...FILTRES_VIDES, statuts: ['en_retard'] })).toHaveLength(1);
  });
  it('combine plusieurs critères (ET logique)', () => {
    expect(
      filtrerTaches(taches, { ...FILTRES_VIDES, priorites: ['haute'], projetIds: ['p2'] })
    ).toHaveLength(0);
  });
  it('compte les critères actifs', () => {
    expect(nombreFiltresActifs(FILTRES_VIDES)).toBe(0);
    expect(
      nombreFiltresActifs({ recherche: 'x', statuts: ['active'], priorites: ['haute'], projetIds: [] })
    ).toBe(3);
  });
});
