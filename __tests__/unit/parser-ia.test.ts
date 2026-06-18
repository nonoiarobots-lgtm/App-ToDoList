import { parserReponseIA, validerReponseIA } from '@/lib/parser-ia';

describe('parserReponseIA', () => {
  it('parse un JSON propre', () => {
    const taches = parserReponseIA('{"taches":[{"titre":"Appeler Sophie","confiance":0.2}]}');
    expect(taches).toHaveLength(1);
    expect(taches[0].titre).toBe('Appeler Sophie');
  });

  it('tolère les balises markdown autour du JSON', () => {
    const taches = parserReponseIA('```json\n{"taches":[{"titre":"Ranger","confiance":0}]}\n```');
    expect(taches).toHaveLength(1);
    expect(taches[0].titre).toBe('Ranger');
  });

  it('renvoie [] sur du JSON invalide', () => {
    expect(parserReponseIA('pas du json')).toEqual([]);
    expect(parserReponseIA('')).toEqual([]);
  });
});

describe('validerReponseIA', () => {
  it('ignore les entrées sans titre', () => {
    expect(validerReponseIA([{ titre: '   ', confiance: 0.9 }, { confiance: 0.9 }])).toHaveLength(0);
  });

  it('met projet_id à null si confiance < 0.6 (même si un id est fourni)', () => {
    const [t] = validerReponseIA([{ titre: 'X', projet_id: 'p1', confiance: 0.4 }]);
    expect(t.projet_id).toBeNull();
    expect(t.projet_incertain).toBe(true);
  });

  it('conserve projet_id si confiance ≥ 0.6', () => {
    const [t] = validerReponseIA([{ titre: 'X', projet_id: 'p1', confiance: 0.9 }]);
    expect(t.projet_id).toBe('p1');
    expect(t.projet_incertain).toBe(false);
  });

  it('remplace une priorité invalide par "moyenne"', () => {
    const [t] = validerReponseIA([{ titre: 'X', priorite: 'extreme', confiance: 0.9 }]);
    expect(t.priorite).toBe('moyenne');
  });

  it('valide une récurrence connue et rejette une fréquence inconnue', () => {
    const [ok] = validerReponseIA([
      { titre: 'A', confiance: 0.9, recurrence: { frequence: 'hebdomadaire', jour_semaine: 4 } },
    ]);
    expect(ok.recurrence?.frequence).toBe('hebdomadaire');
    const [ko] = validerReponseIA([{ titre: 'B', confiance: 0.9, recurrence: { frequence: 'annuelle' } }]);
    expect(ko.recurrence).toBeNull();
  });

  it('renvoie [] si l’entrée n’est pas un tableau', () => {
    expect(validerReponseIA(null)).toEqual([]);
    expect(validerReponseIA({})).toEqual([]);
  });
});
