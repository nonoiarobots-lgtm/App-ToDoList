import {
  dateDansFuseau,
  estDue,
  hhmmEnMinutes,
  minutesDuJour,
} from '@/lib/logique-notifications';

describe('minutesDuJour (Europe/Paris)', () => {
  it('gère l’heure d’été (UTC+2) : 06:00 UTC = 08:00 Paris', () => {
    expect(minutesDuJour(new Date('2026-06-18T06:00:00Z'), 'Europe/Paris')).toBe(480);
  });
  it('gère l’heure d’hiver (UTC+1) : 07:00 UTC = 08:00 Paris', () => {
    expect(minutesDuJour(new Date('2026-01-18T07:00:00Z'), 'Europe/Paris')).toBe(480);
  });
  it('18:00 Paris en été = 16:00 UTC', () => {
    expect(minutesDuJour(new Date('2026-06-18T16:00:00Z'), 'Europe/Paris')).toBe(1080);
  });
});

describe('hhmmEnMinutes', () => {
  it('parse HH:MM', () => expect(hhmmEnMinutes('08:00')).toBe(480));
  it('parse HH:MM:SS', () => expect(hhmmEnMinutes('18:30:00')).toBe(1110));
});

describe('dateDansFuseau', () => {
  it('renvoie la date locale au format ISO', () => {
    // 23:30 UTC le 18/06 = 01:30 le 19/06 à Paris (été)
    expect(dateDansFuseau(new Date('2026-06-18T23:30:00Z'), 'Europe/Paris')).toBe('2026-06-19');
  });
});

describe('estDue', () => {
  it('dû pile à l’heure', () => expect(estDue(480, 480)).toBe(true));
  it('dû dans la fenêtre de tolérance', () => expect(estDue(480, 500)).toBe(true));
  it('pas dû avant l’heure', () => expect(estDue(480, 479)).toBe(false));
  it('pas dû après la fenêtre', () => expect(estDue(480, 511)).toBe(false));
});
