export type TypeIdentifiant = 'couleur' | 'icone';

export interface Projet {
  id: string;
  user_id: string;
  nom: string;
  ordre: number;
  type_identifiant: TypeIdentifiant;
  couleur: string | null; // ex: '#4a9eff'
  icone: string | null; // ex: '🏠'
  actif: boolean;
  created_at: string;
  updated_at: string;
  // Calculé côté API
  nb_taches_actives?: number;
}

export interface ProjetCreation {
  nom: string;
  type_identifiant: TypeIdentifiant;
  couleur?: string | null;
  icone?: string | null;
}

export interface PaletteDisponible {
  couleurs: string[];
  icones: string[];
}
