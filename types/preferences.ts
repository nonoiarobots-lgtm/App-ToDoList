export interface Preferences {
  id: string;
  user_id: string;
  prenom: string;
  heure_briefing: string; // format HH:MM
  heure_qualification: string;
  heure_retards: string;
  seuil_orange: number; // défaut 15
  seuil_rouge: number; // défaut 20
  cible_jour_min: number; // cible journalière CRA en minutes, défaut 450 (7h30)
  timezone: string; // ex: 'Europe/Paris'
  push_subscription: PushSubscriptionJSON | null;
  created_at: string;
  updated_at: string;
}

export interface PreferencesMaj {
  prenom?: string;
  heure_briefing?: string;
  heure_qualification?: string;
  heure_retards?: string;
  seuil_orange?: number;
  seuil_rouge?: number;
  cible_jour_min?: number;
  timezone?: string;
  push_subscription?: PushSubscriptionJSON | null;
}
