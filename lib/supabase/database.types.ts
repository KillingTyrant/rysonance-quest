export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      personaggi: {
        Row: {
          created_at: string
          id: string
          name: string
          razza_key: string
          tribu_key: string | null
          updated_at: string
          user_id: string
          via_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          razza_key: string
          tribu_key?: string | null
          updated_at?: string
          user_id: string
          via_key: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          razza_key?: string
          tribu_key?: string | null
          updated_at?: string
          user_id?: string
          via_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "personaggi_razza_key_fkey"
            columns: ["razza_key"]
            isOneToOne: false
            referencedRelation: "razze"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "personaggi_tribu_key_fkey"
            columns: ["tribu_key"]
            isOneToOne: false
            referencedRelation: "tribu"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "personaggi_tribu_key_razza_key_fkey"
            columns: ["tribu_key", "razza_key"]
            isOneToOne: false
            referencedRelation: "tribu"
            referencedColumns: ["key", "razza_key"]
          },
          {
            foreignKeyName: "personaggi_via_key_fkey"
            columns: ["via_key"]
            isOneToOne: false
            referencedRelation: "vie"
            referencedColumns: ["key"]
          },
        ]
      }
      personaggio_quest: {
        Row: {
          numero_dado: number | null
          personaggio_id: string
          quest_key: string
        }
        Insert: {
          numero_dado?: number | null
          personaggio_id: string
          quest_key: string
        }
        Update: {
          numero_dado?: number | null
          personaggio_id?: string
          quest_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "personaggio_quest_personaggio_id_fkey"
            columns: ["personaggio_id"]
            isOneToOne: false
            referencedRelation: "personaggi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personaggio_quest_quest_key_fkey"
            columns: ["quest_key"]
            isOneToOne: false
            referencedRelation: "quest"
            referencedColumns: ["key"]
          },
        ]
      }
      personaggio_talenti: {
        Row: {
          personaggio_id: string
          talent_key: string
        }
        Insert: {
          personaggio_id: string
          talent_key: string
        }
        Update: {
          personaggio_id?: string
          talent_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "personaggio_talenti_personaggio_id_fkey"
            columns: ["personaggio_id"]
            isOneToOne: false
            referencedRelation: "personaggi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personaggio_talenti_talent_key_fkey"
            columns: ["talent_key"]
            isOneToOne: false
            referencedRelation: "talenti"
            referencedColumns: ["key"]
          },
        ]
      }
      quest: {
        Row: {
          description: string
          key: string
          name: string
        }
        Insert: {
          description?: string
          key: string
          name: string
        }
        Update: {
          description?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      razze: {
        Row: {
          description: string
          key: string
          name: string
          sort_order: number
        }
        Insert: {
          description?: string
          key: string
          name: string
          sort_order?: number
        }
        Update: {
          description?: string
          key?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      talenti: {
        Row: {
          description: string
          key: string
          name: string
          sort_order: number
        }
        Insert: {
          description?: string
          key: string
          name: string
          sort_order?: number
        }
        Update: {
          description?: string
          key?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      tribu: {
        Row: {
          base_hp: number
          base_mana: number
          base_speed: number
          description: string
          key: string
          name: string
          razza_key: string
          sort_order: number
        }
        Insert: {
          base_hp: number
          base_mana: number
          base_speed: number
          description?: string
          key: string
          name: string
          razza_key: string
          sort_order?: number
        }
        Update: {
          base_hp?: number
          base_mana?: number
          base_speed?: number
          description?: string
          key?: string
          name?: string
          razza_key?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "tribu_razza_key_fkey"
            columns: ["razza_key"]
            isOneToOne: false
            referencedRelation: "razze"
            referencedColumns: ["key"]
          },
        ]
      }
      vie: {
        Row: {
          description: string
          key: string
          name: string
          sort_order: number
        }
        Insert: {
          description?: string
          key: string
          name: string
          sort_order?: number
        }
        Update: {
          description?: string
          key?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      wishlist_events: {
        Row: {
          created_at: string
          detail: Json | null
          id: number
          subscriber_id: string
          type: string
        }
        Insert: {
          created_at?: string
          detail?: Json | null
          id?: never
          subscriber_id: string
          type: string
        }
        Update: {
          created_at?: string
          detail?: Json | null
          id?: never
          subscriber_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_events_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "wishlist_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_subscribers: {
        Row: {
          consent_at: string
          consent_ip: unknown
          consent_user_agent: string | null
          created_at: string
          email: string
          id: string
          locale: string | null
          referrer: string | null
          source: string
          status: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          welcome_error: string | null
          welcome_sent_at: string | null
          welcome_status: string
        }
        Insert: {
          consent_at?: string
          consent_ip?: unknown
          consent_user_agent?: string | null
          created_at?: string
          email: string
          id?: string
          locale?: string | null
          referrer?: string | null
          source?: string
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          welcome_error?: string | null
          welcome_sent_at?: string | null
          welcome_status?: string
        }
        Update: {
          consent_at?: string
          consent_ip?: unknown
          consent_user_agent?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string | null
          referrer?: string | null
          source?: string
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          welcome_error?: string | null
          welcome_sent_at?: string | null
          welcome_status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crea_personaggio: {
        Args: {
          p_name: string
          p_quest_key?: string
          p_razza_key: string
          p_talenti: string[]
          p_tribu_key?: string
          p_via_key: string
        }
        Returns: string
      }
      lancia_dado: {
        Args: { p_personaggio_id: string; p_quest_key: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

