import { calculerNiveauAlerte } from '@/lib/logique-seuils';

describe('calculerNiveauAlerte', () => {
  it('retourne null sous le seuil orange', () => {
    expect(calculerNiveauAlerte(14, 15, 20)).toBeNull();
    expect(calculerNiveauAlerte(0, 15, 20)).toBeNull();
  });

  it("retourne 'orange' au seuil orange", () => {
    expect(calculerNiveauAlerte(15, 15, 20)).toBe('orange');
    expect(calculerNiveauAlerte(19, 15, 20)).toBe('orange');
  });

  it("retourne 'rouge' au seuil rouge", () => {
    expect(calculerNiveauAlerte(20, 15, 20)).toBe('rouge');
    expect(calculerNiveauAlerte(50, 15, 20)).toBe('rouge');
  });

  it('respecte des seuils personnalisés', () => {
    expect(calculerNiveauAlerte(5, 5, 8)).toBe('orange');
    expect(calculerNiveauAlerte(8, 5, 8)).toBe('rouge');
  });
});
