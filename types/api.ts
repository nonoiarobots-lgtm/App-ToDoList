import type { Tache, TacheIA } from './tache';

// Réponses API génériques

export type NiveauAlerte = 'orange' | 'rouge' | null;

export interface ReponseListeTaches {
  data: Tache[];
  total: number;
  nb_a_qualifier: number;
  nb_en_retard: number;
  alerte: NiveauAlerte;
  temps_total_min?: number; // présent pour vue=briefing
}

export interface ReponseCreationTaches {
  taches: Tache[];
  nb_a_qualifier: number;
  alerte: NiveauAlerte;
}

export interface ReponseTache {
  tache: Tache;
  tache_suivante_id?: string | null; // si récurrence déclenchée
  nb_a_qualifier?: number;
  alerte?: NiveauAlerte;
}

export interface ReponseCapture {
  taches: TacheIA[];
  duree_ms: number;
}

export interface ErreurAPI {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

// Codes d'erreur exhaustifs
export type CodeErreur =
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'TACHE_NOT_FOUND'
  | 'PROJET_NOT_FOUND'
  | 'COULEUR_DEJA_UTILISEE'
  | 'ICONE_DEJA_UTILISEE'
  | 'IA_TIMEOUT'
  | 'BDD_INDISPONIBLE'
  | 'EMAIL_DEJA_UTILISE'
  | 'SESSION_EXPIREE'
  | 'NOT_IMPLEMENTED';
