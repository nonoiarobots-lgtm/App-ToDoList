// Détection du fuseau horaire du navigateur (utilisé à l'inscription, cadrage §19.2).
// La conversion d'heures pour les rappels est gérée dans lib/logique-notifications.

export function detecterTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
}
