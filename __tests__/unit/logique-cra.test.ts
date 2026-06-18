import {
  decompteMin,
  estDureeValide,
  formatHeures,
  heuresEnMinutes,
  minutesEnHeures,
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
