import {
  agregerParJour,
  bornesMois,
  bornesSemaine,
  ciblePeriode,
  decompteMin,
  estDureeValide,
  etatCraJour,
  formatHeures,
  heuresEnMinutes,
  joursOuvres,
  listerJours,
  minutesEnHeures,
  pourcent,
  totalMinutes,
} from '@/lib/logique-cra';

describe('conversions quart d’heure', () => {
  it('convertit les heures décimales en minutes', () => {
    expect(heuresEnMinutes(1.25)).toBe(75);
    expect(heuresEnMinutes(2)).toBe(120);
    expect(heuresEnMinutes(7.5)).toBe(450);
  });
  it('convertit les minutes en heures', () => {
    expect(minutesEnHeures(75)).toBe(1.25);
    expect(minutesEnHeures(450)).toBe(7.5);
  });
});

describe('estDureeValide', () => {
  it('accepte les multiples du quart d’heure', () => {
    expect(estDureeValide(0.25)).toBe(true);
    expect(estDureeValide(1.25)).toBe(true);
    expect(estDureeValide(2)).toBe(true);
  });
  it('refuse les durées hors quart d’heure', () => {
    expect(estDureeValide(1.1)).toBe(false);
    expect(estDureeValide(0.3)).toBe(false);
  });
  it('refuse zéro et le négatif', () => {
    expect(estDureeValide(0)).toBe(false);
    expect(estDureeValide(-1)).toBe(false);
  });
});

describe('décompte journalier', () => {
  it('calcule le total des minutes', () => {
    expect(totalMinutes([{ duree_min: 120 }, { duree_min: 120 }, { duree_min: 120 }])).toBe(360);
  });
  it('décompte 7,5 h − 3×2 h = 1,5 h (exemple du besoin)', () => {
    const total = totalMinutes([{ duree_min: 120 }, { duree_min: 120 }, { duree_min: 120 }]);
    expect(decompteMin(total, 450)).toBe(90);
  });
  it('peut être négatif en cas de dépassement', () => {
    expect(decompteMin(540, 450)).toBe(-90);
  });
});

describe('formatHeures', () => {
  it('formate à la française', () => {
    expect(formatHeures(90)).toBe('1,5 h');
    expect(formatHeures(75)).toBe('1,25 h');
    expect(formatHeures(450)).toBe('7,5 h');
    expect(formatHeures(120)).toBe('2 h');
    expect(formatHeures(0)).toBe('0 h');
    expect(formatHeures(-90)).toBe('-1,5 h');
  });
});

describe('agrégation par jour', () => {
  it('somme les durées d’un même jour', () => {
    const parJour = agregerParJour([
      { date_activite: '2026-06-16', duree_min: 120 },
      { date_activite: '2026-06-16', duree_min: 60 },
      { date_activite: '2026-06-17', duree_min: 90 },
    ]);
    expect(parJour['2026-06-16']).toBe(180);
    expect(parJour['2026-06-17']).toBe(90);
  });
});

describe('etatCraJour', () => {
  it('vide si rien', () => expect(etatCraJour(0, 450)).toBe('vide'));
  it('partiel si en dessous de la cible', () => expect(etatCraJour(300, 450)).toBe('partiel'));
  it('complet si cible atteinte', () => {
    expect(etatCraJour(450, 450)).toBe('complet');
    expect(etatCraJour(480, 450)).toBe('complet');
  });
});

describe('pourcent', () => {
  it('arrondit à l’entier', () => expect(pourcent(125, 325)).toBe(38));
  it('renvoie 0 si total nul', () => expect(pourcent(10, 0)).toBe(0));
});

describe('bornes de période', () => {
  it('semaine lundi→dimanche (le 18/06/2026 est un jeudi)', () => {
    expect(bornesSemaine('2026-06-18')).toEqual({ from: '2026-06-15', to: '2026-06-21' });
  });
  it('semaine depuis un dimanche reste dans la même semaine', () => {
    expect(bornesSemaine('2026-06-21')).toEqual({ from: '2026-06-15', to: '2026-06-21' });
  });
  it('mois 1er→dernier jour', () => {
    expect(bornesMois('2026-06-18')).toEqual({ from: '2026-06-01', to: '2026-06-30' });
  });
});

describe('jours ouvrés et cible période', () => {
  it('compte 5 jours ouvrés sur une semaine complète', () => {
    expect(joursOuvres('2026-06-15', '2026-06-21')).toBe(5);
  });
  it('cible hebdo = 5 × 7h30 = 37,5 h', () => {
    expect(ciblePeriode('2026-06-15', '2026-06-21', 450)).toBe(2250);
  });
  it('liste les 7 jours de la période', () => {
    expect(listerJours('2026-06-15', '2026-06-21')).toHaveLength(7);
  });
});
