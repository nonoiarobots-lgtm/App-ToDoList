// Gestion des fuseaux horaires (cadrage §19.2) — implémentation en tranche ④

export function detecterTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
}

export function calculerHeureUTC(_heureLocale: string, _timezone: string): string {
  // TODO tranche ④ : convertir HH:MM local → HH:MM UTC pour pg_cron (date-fns-tz)
  throw new Error('NOT_IMPLEMENTED');
}
