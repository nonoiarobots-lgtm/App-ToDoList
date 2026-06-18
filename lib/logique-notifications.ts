// Logique de déclenchement des rappels email (besoin point 6).
// Tout est calculé dans le fuseau de l'utilisateur pour gérer l'heure d'été.

// Minutes écoulées depuis minuit dans un fuseau donné (0–1439).
export function minutesDuJour(maintenant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(maintenant);
  const h = Number(parts.find(p => p.type === 'hour')?.value ?? '0') % 24;
  const m = Number(parts.find(p => p.type === 'minute')?.value ?? '0');
  return h * 60 + m;
}

// "HH:MM" ou "HH:MM:SS" → minutes depuis minuit
export function hhmmEnMinutes(heure: string): number {
  const [h, m] = heure.split(':');
  return Number(h) * 60 + Number(m);
}

// Date locale (YYYY-MM-DD) dans un fuseau donné
export function dateDansFuseau(maintenant: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(maintenant);
}

// Un rappel est "dû" si l'heure locale a dépassé l'heure prévue mais reste
// dans la fenêtre de tolérance (par défaut 30 min) — tolère un tick de cron manqué
// sans envoyer le rappel des heures trop tard. L'idempotence (1 envoi/jour) est
// gérée à part via la table jobs_notifications.
export function estDue(prefMin: number, nowMin: number, fenetreMin = 30): boolean {
  return nowMin >= prefMin && nowMin < prefMin + fenetreMin;
}
