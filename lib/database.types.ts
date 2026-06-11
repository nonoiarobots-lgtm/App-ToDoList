// GÉNÉRÉ depuis le schéma Supabase (projet gtyinljbotgcxinjfgjc) — ne pas éditer manuellement.
// Regénérer après chaque migration : npm run db:types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      jobs_notifications: {
        Row: {
          canal: Database['public']['Enums']['canal_notification'];
          created_at: string;
          envoyee_at: string | null;
          erreur: string | null;
          id: string;
          planifiee_at: string;
          statut: Database['public']['Enums']['statut_notification'];
          type: Database['public']['Enums']['type_notification'];
          user_id: string;
          user_timezone: string | null;
        };
        Insert: {
          canal: Database['public']['Enums']['canal_notification'];
          created_at?: string;
          envoyee_at?: string | null;
          erreur?: string | null;
          id?: string;
          planifiee_at: string;
          statut?: Database['public']['Enums']['statut_notification'];
          type: Database['public']['Enums']['type_notification'];
          user_id: string;
          user_timezone?: string | null;
        };
        Update: {
          canal?: Database['public']['Enums']['canal_notification'];
          created_at?: string;
          envoyee_at?: string | null;
          erreur?: string | null;
          id?: string;
          planifiee_at?: string;
          statut?: Database['public']['Enums']['statut_notification'];
          type?: Database['public']['Enums']['type_notification'];
          user_id?: string;
          user_timezone?: string | null;
        };
        Relationships: [];
      };
      preferences: {
        Row: {
          created_at: string;
          heure_briefing: string;
          heure_qualification: string;
          heure_retards: string;
          id: string;
          prenom: string;
          push_subscription: Json | null;
          seuil_orange: number;
          seuil_rouge: number;
          timezone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          heure_briefing?: string;
          heure_qualification?: string;
          heure_retards?: string;
          id?: string;
          prenom: string;
          push_subscription?: Json | null;
          seuil_orange?: number;
          seuil_rouge?: number;
          timezone?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          heure_briefing?: string;
          heure_qualification?: string;
          heure_retards?: string;
          id?: string;
          prenom?: string;
          push_subscription?: Json | null;
          seuil_orange?: number;
          seuil_rouge?: number;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      projets: {
        Row: {
          actif: boolean;
          couleur: string | null;
          created_at: string;
          icone: string | null;
          id: string;
          nom: string;
          ordre: number;
          type_identifiant: Database['public']['Enums']['projet_identifiant'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          actif?: boolean;
          couleur?: string | null;
          created_at?: string;
          icone?: string | null;
          id?: string;
          nom: string;
          ordre?: number;
          type_identifiant?: Database['public']['Enums']['projet_identifiant'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          actif?: boolean;
          couleur?: string | null;
          created_at?: string;
          icone?: string | null;
          id?: string;
          nom?: string;
          ordre?: number;
          type_identifiant?: Database['public']['Enums']['projet_identifiant'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      recurrences: {
        Row: {
          actif: boolean;
          created_at: string;
          frequence: Database['public']['Enums']['frequence_recurrence'];
          id: string;
          jour_mois: number | null;
          jour_semaine: number | null;
          tache_mere_id: string;
          user_id: string;
        };
        Insert: {
          actif?: boolean;
          created_at?: string;
          frequence: Database['public']['Enums']['frequence_recurrence'];
          id?: string;
          jour_mois?: number | null;
          jour_semaine?: number | null;
          tache_mere_id: string;
          user_id: string;
        };
        Update: {
          actif?: boolean;
          created_at?: string;
          frequence?: Database['public']['Enums']['frequence_recurrence'];
          id?: string;
          jour_mois?: number | null;
          jour_semaine?: number | null;
          tache_mere_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recurrences_tache_mere_id_fkey';
            columns: ['tache_mere_id'];
            isOneToOne: false;
            referencedRelation: 'taches';
            referencedColumns: ['id'];
          },
        ];
      };
      taches: {
        Row: {
          avancement: number;
          created_at: string;
          date_cloture: string | null;
          date_debut: string | null;
          date_echeance: string | null;
          id: string;
          notes: string | null;
          pre_caracterisee_ia: boolean;
          predecesseur_id: string | null;
          priorite: Database['public']['Enums']['priorite_tache'];
          projet_id: string | null;
          recurrence_id: string | null;
          responsable: string;
          statut: Database['public']['Enums']['statut_tache'];
          temps_estime_min: number | null;
          titre: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avancement?: number;
          created_at?: string;
          date_cloture?: string | null;
          date_debut?: string | null;
          date_echeance?: string | null;
          id?: string;
          notes?: string | null;
          pre_caracterisee_ia?: boolean;
          predecesseur_id?: string | null;
          priorite?: Database['public']['Enums']['priorite_tache'];
          projet_id?: string | null;
          recurrence_id?: string | null;
          responsable?: string;
          statut?: Database['public']['Enums']['statut_tache'];
          temps_estime_min?: number | null;
          titre: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avancement?: number;
          created_at?: string;
          date_cloture?: string | null;
          date_debut?: string | null;
          date_echeance?: string | null;
          id?: string;
          notes?: string | null;
          pre_caracterisee_ia?: boolean;
          predecesseur_id?: string | null;
          priorite?: Database['public']['Enums']['priorite_tache'];
          projet_id?: string | null;
          recurrence_id?: string | null;
          responsable?: string;
          statut?: Database['public']['Enums']['statut_tache'];
          temps_estime_min?: number | null;
          titre?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'taches_predecesseur_id_fkey';
            columns: ['predecesseur_id'];
            isOneToOne: false;
            referencedRelation: 'taches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_projet_id_fkey';
            columns: ['projet_id'];
            isOneToOne: false;
            referencedRelation: 'projets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_recurrence_fk';
            columns: ['recurrence_id'];
            isOneToOne: false;
            referencedRelation: 'recurrences';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      process_notifications: { Args: never; Returns: undefined };
      update_statuts_retard: { Args: never; Returns: undefined };
    };
    Enums: {
      canal_notification: 'push' | 'email';
      frequence_recurrence: 'quotidienne' | 'hebdomadaire' | 'mensuelle';
      priorite_tache: 'haute' | 'moyenne' | 'basse' | 'aucune';
      projet_identifiant: 'couleur' | 'icone';
      statut_notification: 'planifiee' | 'envoyee' | 'echouee';
      statut_tache: 'a_qualifier' | 'active' | 'en_retard' | 'en_attente_retour' | 'archivee';
      type_notification: 'briefing_matin' | 'qualification' | 'relance_retards' | 'alerte_seuil';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      canal_notification: ['push', 'email'],
      frequence_recurrence: ['quotidienne', 'hebdomadaire', 'mensuelle'],
      priorite_tache: ['haute', 'moyenne', 'basse', 'aucune'],
      projet_identifiant: ['couleur', 'icone'],
      statut_notification: ['planifiee', 'envoyee', 'echouee'],
      statut_tache: ['a_qualifier', 'active', 'en_retard', 'en_attente_retour', 'archivee'],
      type_notification: ['briefing_matin', 'qualification', 'relance_retards', 'alerte_seuil'],
    },
  },
} as const;
