import type { Projet } from './projet';

export type StatutTache = 'a_qualifier' | 'active' | 'en_retard' | 'en_attente_retour' | 'archivee';

export type PrioriteTache = 'haute' | 'moyenne' | 'basse' | 'aucune';

export type FrequenceRecurrence = 'quotidienne' | 'hebdomadaire' | 'mensuelle';

export interface Recurrence {
  id: string;
  tache_mere_id: string;
  frequence: FrequenceRecurrence;
  jour_semaine?: number; // 0=lundi, 6=dimanche
  jour_mois?: number; // 1-31
  actif: boolean;
  created_at: string;
}

export interface Tache {
  id: string;
  user_id: string;
  projet_id: string | null; // nullable — voir décision 19.1
  titre: string;
  notes: string | null;
  statut: StatutTache;
  priorite: PrioriteTache;
  date_debut: string | null; // ISO 8601 date
  date_echeance: string | null; // ISO 8601 datetime
  date_cloture: string | null; // renseignée automatiquement
  responsable: string; // "Moi" par défaut
  avancement: number; // 0-100
  temps_estime_min: number | null;
  recurrence_id: string | null;
  predecesseur_id: string | null;
  pre_caracterisee_ia: boolean;
  created_at: string;
  updated_at: string;
  // Relations jointes
  projet?: Projet | null;
  recurrence?: Recurrence | null;
  predecesseur?: Pick<Tache, 'id' | 'titre'> | null;
}

export interface TacheCreation {
  titre: string;
  projet_id?: string | null;
  priorite?: PrioriteTache;
  date_debut?: string | null;
  date_echeance?: string | null;
  responsable?: string;
  avancement?: number;
  temps_estime_min?: number | null;
  recurrence?: Pick<Recurrence, 'frequence' | 'jour_semaine' | 'jour_mois'> | null;
  predecesseur_id?: string | null;
  notes?: string | null;
  pre_caracterisee_ia?: boolean;
}

export interface TacheMaj {
  titre?: string;
  projet_id?: string | null;
  priorite?: PrioriteTache;
  statut?: StatutTache;
  date_debut?: string | null;
  date_echeance?: string | null;
  responsable?: string;
  avancement?: number;
  temps_estime_min?: number | null;
  notes?: string | null;
}

// Type retourné par Claude API après découpage vocal
export interface TacheIA {
  titre: string;
  projet_id: string | null;
  priorite: PrioriteTache;
  date_echeance: string | null;
  temps_estime_min: number | null;
  recurrence: Pick<Recurrence, 'frequence' | 'jour_semaine' | 'jour_mois'> | null;
  confiance: number; // 0-1 sur l'attribution du projet
  projet_incertain: boolean; // true si confiance < 0.6
}

// Type pour le briefing matin — tâches groupées par projet
export interface GroupeProjet {
  projet_id: string; // 'sans-projet' si projet_id null
  projet_nom: string;
  couleur: string | null;
  icone: string | null;
  nb_taches: number;
  nb_retard: number;
  temps_total_min: number;
  taches: Tache[];
}
