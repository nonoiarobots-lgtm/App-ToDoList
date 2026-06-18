import type { Projet } from './projet';

export interface TypeActivite {
  id: string;
  user_id: string;
  nom: string;
  ordre: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Activite {
  id: string;
  user_id: string;
  date_activite: string; // ISO date (YYYY-MM-DD)
  type_activite_id: string | null;
  projet_id: string | null;
  duree_min: number; // multiple de 15
  commentaire: string | null;
  created_at: string;
  updated_at: string;
  // Relations jointes
  type_activite?: Pick<TypeActivite, 'id' | 'nom'> | null;
  projet?: Projet | null;
}

export interface ActiviteCreation {
  date_activite: string;
  type_activite_id?: string | null;
  projet_id?: string | null;
  duree_min: number;
  commentaire?: string | null;
}

// Liste par défaut, semée au premier accès (cf. besoin point 7 — paramétrable ensuite)
export const TYPES_ACTIVITE_DEFAUT = [
  'Réunion',
  'Expression de besoin',
  'Cahier des charges',
  'Recette',
  'Cadrage',
  'COPIL',
  'Formation',
] as const;
