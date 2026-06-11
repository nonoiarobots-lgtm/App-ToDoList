export type TypeNotification =
  | 'briefing_matin'
  | 'qualification'
  | 'relance_retards'
  | 'alerte_seuil';

export type CanalNotification = 'push' | 'email';
export type StatutNotification = 'planifiee' | 'envoyee' | 'echouee';

export interface JobNotification {
  id: string;
  user_id: string;
  type: TypeNotification;
  canal: CanalNotification;
  statut: StatutNotification;
  planifiee_at: string;
  envoyee_at: string | null;
  erreur: string | null;
  user_timezone: string | null;
  created_at: string;
}
