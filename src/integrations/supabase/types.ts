export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      codigos_verificacao: {
        Row: {
          codigo: string
          created_at: string | null
          destino: string
          expira_em: string
          id: string
          tentativas: number | null
          tipo: string
          usado: boolean | null
          user_id: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          destino: string
          expira_em: string
          id?: string
          tentativas?: number | null
          tipo: string
          usado?: boolean | null
          user_id: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          destino?: string
          expira_em?: string
          id?: string
          tentativas?: number | null
          tipo?: string
          usado?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      notificacoes_pendentes: {
        Row: {
          chave_dedup: string | null
          created_at: string
          erro: string | null
          id: string
          payload: Json
          processado: boolean
          processado_em: string | null
          tipo: string
        }
        Insert: {
          chave_dedup?: string | null
          created_at?: string
          erro?: string | null
          id?: string
          payload: Json
          processado?: boolean
          processado_em?: string | null
          tipo: string
        }
        Update: {
          chave_dedup?: string | null
          created_at?: string
          erro?: string | null
          id?: string
          payload?: Json
          processado?: boolean
          processado_em?: string | null
          tipo?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          avatar_url: string | null
          celular: string | null
          celular_verificado: boolean | null
          created_at: string
          email: string | null
          email_verificado: boolean | null
          id: string
          is_bot: boolean | null
          nome: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          celular?: string | null
          celular_verificado?: boolean | null
          created_at?: string
          email?: string | null
          email_verificado?: boolean | null
          id: string
          is_bot?: boolean | null
          nome?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          celular?: string | null
          celular_verificado?: boolean | null
          created_at?: string
          email?: string | null
          email_verificado?: boolean | null
          id?: string
          is_bot?: boolean | null
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      postagens: {
        Row: {
          concurso_referencia: number | null
          conteudo: string
          created_at: string
          curtidas: number | null
          id: string
          metadata: Json | null
          parent_id: string | null
          respostas_count: number | null
          tipo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          concurso_referencia?: number | null
          conteudo: string
          created_at?: string
          curtidas?: number | null
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          respostas_count?: number | null
          tipo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          concurso_referencia?: number | null
          conteudo?: string
          created_at?: string
          curtidas?: number | null
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          respostas_count?: number | null
          tipo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "postagens_concurso_referencia_fkey"
            columns: ["concurso_referencia"]
            isOneToOne: false
            referencedRelation: "resultados"
            referencedColumns: ["concurso_id"]
          },
          {
            foreignKeyName: "postagens_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "postagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postagens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postagens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados: {
        Row: {
          acumulou: boolean | null
          ciclo_numero: number | null
          concurso_id: number
          created_at: string
          data_sorteio: string
          dezenas: number[]
          dezenas_faltantes_ciclo: number[] | null
          id: string
          locais_ganhadores: Json | null
          local_sorteio: string | null
          premiacao_json: Json | null
          qtd_impares: number | null
          qtd_moldura: number | null
          qtd_pares: number | null
          qtd_primos: number | null
          qtd_repetidas: number | null
          valor_acumulado_especial: number | null
          valor_estimado_proximo: number | null
        }
        Insert: {
          acumulou?: boolean | null
          ciclo_numero?: number | null
          concurso_id: number
          created_at?: string
          data_sorteio: string
          dezenas: number[]
          dezenas_faltantes_ciclo?: number[] | null
          id?: string
          locais_ganhadores?: Json | null
          local_sorteio?: string | null
          premiacao_json?: Json | null
          qtd_impares?: number | null
          qtd_moldura?: number | null
          qtd_pares?: number | null
          qtd_primos?: number | null
          qtd_repetidas?: number | null
          valor_acumulado_especial?: number | null
          valor_estimado_proximo?: number | null
        }
        Update: {
          acumulou?: boolean | null
          ciclo_numero?: number | null
          concurso_id?: number
          created_at?: string
          data_sorteio?: string
          dezenas?: number[]
          dezenas_faltantes_ciclo?: number[] | null
          id?: string
          locais_ganhadores?: Json | null
          local_sorteio?: string | null
          premiacao_json?: Json | null
          qtd_impares?: number | null
          qtd_moldura?: number | null
          qtd_pares?: number | null
          qtd_primos?: number | null
          qtd_repetidas?: number | null
          valor_acumulado_especial?: number | null
          valor_estimado_proximo?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      usuarios_notificaveis_hoje: {
        Row: {
          celular: string | null
          celular_verificado: boolean | null
          created_at: string | null
          email: string | null
          email_verificado: boolean | null
          esta_no_periodo_teste: boolean | null
          id: string | null
          nome: string | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "premium" | "moderator" | "admin"
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
  public: {
    Enums: {
      app_role: ["user", "premium", "moderator", "admin"],
    },
  },
} as const
