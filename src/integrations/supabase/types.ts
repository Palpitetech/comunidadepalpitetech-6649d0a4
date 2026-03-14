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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          table_name: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          table_name: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          table_name?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          kirvano_webhook_token: string
          lead_webhook_token: string
          notifications_webhook_secret: string | null
          updated_at: string
          updated_by: string | null
          usd_to_brl: number
        }
        Insert: {
          id?: string
          kirvano_webhook_token?: string
          lead_webhook_token?: string
          notifications_webhook_secret?: string | null
          updated_at?: string
          updated_by?: string | null
          usd_to_brl?: number
        }
        Update: {
          id?: string
          kirvano_webhook_token?: string
          lead_webhook_token?: string
          notifications_webhook_secret?: string | null
          updated_at?: string
          updated_by?: string | null
          usd_to_brl?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cta_settings: {
        Row: {
          buttons: Json
          created_at: string
          default_text: string
          enabled: boolean
          id: string
          max_buttons: number
          updated_at: string
        }
        Insert: {
          buttons?: Json
          created_at?: string
          default_text?: string
          enabled?: boolean
          id?: string
          max_buttons?: number
          updated_at?: string
        }
        Update: {
          buttons?: Json
          created_at?: string
          default_text?: string
          enabled?: boolean
          id?: string
          max_buttons?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          action_type: string
          bot_name: string | null
          bot_persona_id: string | null
          completion_tokens: number
          cost_usd: number
          created_at: string
          edge_function: string
          id: string
          metadata: Json | null
          model: string | null
          prompt_tokens: number
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          action_type: string
          bot_name?: string | null
          bot_persona_id?: string | null
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          edge_function: string
          id?: string
          metadata?: Json | null
          model?: string | null
          prompt_tokens?: number
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          action_type?: string
          bot_name?: string | null
          bot_persona_id?: string | null
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          edge_function?: string
          id?: string
          metadata?: Json | null
          model?: string | null
          prompt_tokens?: number
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_bot_persona_id_fkey"
            columns: ["bot_persona_id"]
            isOneToOne: false
            referencedRelation: "guide_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_bot_persona_id_fkey"
            columns: ["bot_persona_id"]
            isOneToOne: false
            referencedRelation: "guide_personas_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_cotas: {
        Row: {
          bolao_id: string | null
          created_at: string | null
          id: string
          numero_cota: number
          observacao: string | null
          reservado_por: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          bolao_id?: string | null
          created_at?: string | null
          id?: string
          numero_cota: number
          observacao?: string | null
          reservado_por?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          bolao_id?: string | null
          created_at?: string | null
          id?: string
          numero_cota?: number
          observacao?: string | null
          reservado_por?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_cotas_bolao_id_fkey"
            columns: ["bolao_id"]
            isOneToOne: false
            referencedRelation: "boloes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_cotas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_cotas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_cotas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_resgates: {
        Row: {
          bolao_id: string | null
          created_at: string | null
          id: string
          status: string | null
          user_id: string | null
          valor: number | null
        }
        Insert: {
          bolao_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
          valor?: number | null
        }
        Update: {
          bolao_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_resgates_bolao_id_fkey"
            columns: ["bolao_id"]
            isOneToOne: false
            referencedRelation: "boloes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_resgates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_resgates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_resgates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      boloes: {
        Row: {
          codigo: string
          concurso_numero: string
          cotas_reservadas: number | null
          cotas_vendidas: number | null
          created_at: string | null
          data_concurso: string
          descricao_estrategia: string | null
          dezenas_por_palpite: number
          id: string
          loteria: string
          mes_ano: string
          numero_bolao: number
          palpites: Json | null
          sigla: string
          status: string | null
          task_comprovantes: boolean | null
          task_impresso: boolean | null
          task_registrado: boolean | null
          task_resgate: boolean | null
          total_cotas: number
          total_palpites: number
          updated_at: string | null
          valor_cota: number
          valor_premiacao: number | null
        }
        Insert: {
          codigo: string
          concurso_numero: string
          cotas_reservadas?: number | null
          cotas_vendidas?: number | null
          created_at?: string | null
          data_concurso: string
          descricao_estrategia?: string | null
          dezenas_por_palpite: number
          id?: string
          loteria: string
          mes_ano: string
          numero_bolao: number
          palpites?: Json | null
          sigla: string
          status?: string | null
          task_comprovantes?: boolean | null
          task_impresso?: boolean | null
          task_registrado?: boolean | null
          task_resgate?: boolean | null
          total_cotas: number
          total_palpites: number
          updated_at?: string | null
          valor_cota: number
          valor_premiacao?: number | null
        }
        Update: {
          codigo?: string
          concurso_numero?: string
          cotas_reservadas?: number | null
          cotas_vendidas?: number | null
          created_at?: string | null
          data_concurso?: string
          descricao_estrategia?: string | null
          dezenas_por_palpite?: number
          id?: string
          loteria?: string
          mes_ano?: string
          numero_bolao?: number
          palpites?: Json | null
          sigla?: string
          status?: string | null
          task_comprovantes?: boolean | null
          task_impresso?: boolean | null
          task_registrado?: boolean | null
          task_resgate?: boolean | null
          total_cotas?: number
          total_palpites?: number
          updated_at?: string | null
          valor_cota?: number
          valor_premiacao?: number | null
        }
        Relationships: []
      }
      bot_post_interactions: {
        Row: {
          bot_perfil_id: string
          comment_id: string | null
          created_at: string
          error: string | null
          id: string
          post_id: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bot_perfil_id: string
          comment_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          post_id: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bot_perfil_id?: string
          comment_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          post_id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_post_interactions_bot_fk"
            columns: ["bot_perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_post_interactions_bot_fk"
            columns: ["bot_perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_post_interactions_bot_fk"
            columns: ["bot_perfil_id"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_post_interactions_comment_fk"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_post_interactions_post_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "postagens"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_publishing_logs: {
        Row: {
          bot_name: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          guide_persona_id: string
          id: string
          reason: string | null
        }
        Insert: {
          bot_name?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          guide_persona_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          bot_name?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          guide_persona_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_publishing_logs_guide_persona_id_fkey"
            columns: ["guide_persona_id"]
            isOneToOne: false
            referencedRelation: "guide_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_publishing_logs_guide_persona_id_fkey"
            columns: ["guide_persona_id"]
            isOneToOne: false
            referencedRelation: "guide_personas_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_daily_usage: {
        Row: {
          count: number
          created_at: string
          day: string
          id: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          day: string
          id?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          day?: string
          id?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          actions: Json | null
          bot_persona_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          bot_persona_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          bot_persona_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_bot_persona_id_fkey"
            columns: ["bot_persona_id"]
            isOneToOne: false
            referencedRelation: "guide_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_bot_persona_id_fkey"
            columns: ["bot_persona_id"]
            isOneToOne: false
            referencedRelation: "guide_personas_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      community_group_logs: {
        Row: {
          id: string
          instance_evolution_id: string | null
          instance_id: string | null
          message_generated: string | null
          message_sent: string | null
          post_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          id?: string
          instance_evolution_id?: string | null
          instance_id?: string | null
          message_generated?: string | null
          message_sent?: string | null
          post_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          id?: string
          instance_evolution_id?: string | null
          instance_id?: string | null
          message_generated?: string | null
          message_sent?: string | null
          post_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "postagens"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "convites_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamento_auto_usage: {
        Row: {
          count: number
          created_at: string
          day: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          day?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          day?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gerador_daily_usage: {
        Row: {
          count: number
          created_at: string
          day: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          day?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          day?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_blast_configs: {
        Row: {
          created_at: string | null
          group_jid: string
          id: string
          is_active: boolean | null
          name: string
          slots: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_jid: string
          id?: string
          is_active?: boolean | null
          name: string
          slots?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_jid?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slots?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      group_blast_logs: {
        Row: {
          config_id: string | null
          created_at: string | null
          error_message: string | null
          evolution_instance_id: string | null
          group_jid: string
          id: string
          instance_id: string | null
          message_content: string
          scheduled_for: string
          sent_at: string | null
          slot_id: string | null
          status: string | null
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          error_message?: string | null
          evolution_instance_id?: string | null
          group_jid: string
          id?: string
          instance_id?: string | null
          message_content: string
          scheduled_for: string
          sent_at?: string | null
          slot_id?: string | null
          status?: string | null
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          error_message?: string | null
          evolution_instance_id?: string | null
          group_jid?: string
          id?: string
          instance_id?: string | null
          message_content?: string
          scheduled_for?: string
          sent_at?: string | null
          slot_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_blast_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "group_blast_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_blast_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_personas: {
        Row: {
          ai_model: string | null
          ativo: boolean | null
          auto_reply_enabled: boolean | null
          badge_emoji: string | null
          can_comment_on_posts: boolean
          can_create_posts: boolean | null
          can_reply_own_post_comments: boolean
          can_respond_to_bot_posts: boolean
          cargo: string
          chat_enabled: boolean
          chat_priority: number
          chat_tags: string[]
          created_at: string | null
          cta_override_buttons: Json
          cta_override_enabled: boolean
          cta_override_text: string | null
          especialidade: string
          estilo_escrita: string | null
          frequencia_posts: number | null
          id: string
          is_result_author: boolean | null
          is_sales_author: boolean
          is_strategy_author: boolean
          is_system_sales_author: boolean
          max_chars_comment: number | null
          max_chars_post: number | null
          max_comments_per_post: number
          perfil_id: string
          post_schedule: Json | null
          prompt_estrutura_post: string | null
          prompt_modelos_mensagem: string | null
          prompt_objetivo: string | null
          safety_banned_topics: string[]
          safety_banned_words: string[]
          safety_block_pii: boolean
          safety_enabled: boolean
          safety_style: string
          system_prompt: string
          total_comments: number | null
          total_posts: number | null
          ultimo_post_em: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          ativo?: boolean | null
          auto_reply_enabled?: boolean | null
          badge_emoji?: string | null
          can_comment_on_posts?: boolean
          can_create_posts?: boolean | null
          can_reply_own_post_comments?: boolean
          can_respond_to_bot_posts?: boolean
          cargo: string
          chat_enabled?: boolean
          chat_priority?: number
          chat_tags?: string[]
          created_at?: string | null
          cta_override_buttons?: Json
          cta_override_enabled?: boolean
          cta_override_text?: string | null
          especialidade: string
          estilo_escrita?: string | null
          frequencia_posts?: number | null
          id?: string
          is_result_author?: boolean | null
          is_sales_author?: boolean
          is_strategy_author?: boolean
          is_system_sales_author?: boolean
          max_chars_comment?: number | null
          max_chars_post?: number | null
          max_comments_per_post?: number
          perfil_id: string
          post_schedule?: Json | null
          prompt_estrutura_post?: string | null
          prompt_modelos_mensagem?: string | null
          prompt_objetivo?: string | null
          safety_banned_topics?: string[]
          safety_banned_words?: string[]
          safety_block_pii?: boolean
          safety_enabled?: boolean
          safety_style?: string
          system_prompt: string
          total_comments?: number | null
          total_posts?: number | null
          ultimo_post_em?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          ativo?: boolean | null
          auto_reply_enabled?: boolean | null
          badge_emoji?: string | null
          can_comment_on_posts?: boolean
          can_create_posts?: boolean | null
          can_reply_own_post_comments?: boolean
          can_respond_to_bot_posts?: boolean
          cargo?: string
          chat_enabled?: boolean
          chat_priority?: number
          chat_tags?: string[]
          created_at?: string | null
          cta_override_buttons?: Json
          cta_override_enabled?: boolean
          cta_override_text?: string | null
          especialidade?: string
          estilo_escrita?: string | null
          frequencia_posts?: number | null
          id?: string
          is_result_author?: boolean | null
          is_sales_author?: boolean
          is_strategy_author?: boolean
          is_system_sales_author?: boolean
          max_chars_comment?: number | null
          max_chars_post?: number | null
          max_comments_per_post?: number
          perfil_id?: string
          post_schedule?: Json | null
          prompt_estrutura_post?: string | null
          prompt_modelos_mensagem?: string | null
          prompt_objetivo?: string | null
          safety_banned_topics?: string[]
          safety_banned_words?: string[]
          safety_block_pii?: boolean
          safety_enabled?: boolean
          safety_style?: string
          system_prompt?: string
          total_comments?: number | null
          total_posts?: number | null
          ultimo_post_em?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_personas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_personas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_personas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      kirvano_offer_plan_map: {
        Row: {
          created_at: string
          days_valid: number
          id: string
          is_active: boolean
          offer_id: string
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_valid?: number
          id?: string
          is_active?: boolean
          offer_id: string
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_valid?: number
          id?: string
          is_active?: boolean
          offer_id?: string
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kirvano_offer_plan_map_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      kirvano_webhook_logs: {
        Row: {
          authorized_method: string | null
          checkout_id: string | null
          email: string | null
          error: string | null
          event: string | null
          id: string
          payment_method: string | null
          phone: string | null
          process_result: string | null
          processed: boolean
          purchase_type: string | null
          raw_payload: Json
          received_at: string
          sale_id: string | null
          status: string | null
        }
        Insert: {
          authorized_method?: string | null
          checkout_id?: string | null
          email?: string | null
          error?: string | null
          event?: string | null
          id?: string
          payment_method?: string | null
          phone?: string | null
          process_result?: string | null
          processed?: boolean
          purchase_type?: string | null
          raw_payload: Json
          received_at?: string
          sale_id?: string | null
          status?: string | null
        }
        Update: {
          authorized_method?: string | null
          checkout_id?: string | null
          email?: string | null
          error?: string | null
          event?: string | null
          id?: string
          payment_method?: string | null
          phone?: string | null
          process_result?: string | null
          processed?: boolean
          purchase_type?: string | null
          raw_payload?: Json
          received_at?: string
          sale_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      lead_webhooks: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_lead_at: string | null
          leads_count: number | null
          name: string
          source_tag: string
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_lead_at?: string | null
          leads_count?: number | null
          name: string
          source_tag: string
          token?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_lead_at?: string | null
          leads_count?: number | null
          name?: string
          source_tag?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      message_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          instance_id: string | null
          recipient_name: string | null
          recipient_phone: string
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          recipient_name?: string | null
          recipient_phone: string
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          content: string
          created_at: string | null
          delay_enabled: boolean
          delay_minutes: number
          event_trigger: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          delay_enabled?: boolean
          delay_minutes?: number
          event_trigger: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          content?: string
          created_at?: string | null
          delay_enabled?: boolean
          delay_minutes?: number
          event_trigger?: string
          id?: string
          is_active?: boolean
          name?: string
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
      palpites_pastas: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          is_root: boolean | null
          loteria: string | null
          nome: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          is_root?: boolean | null
          loteria?: string | null
          nome: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          is_root?: boolean | null
          loteria?: string | null
          nome?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "palpites_pastas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "palpites_pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      palpites_salvos: {
        Row: {
          acertos: number | null
          concurso_alvo: number | null
          conferido: boolean
          created_at: string
          dezenas: number[]
          estrategia: string | null
          estrategia_data: Json | null
          id: string
          loteria: string | null
          nome: string | null
          pasta_id: string | null
          periodo_analise: number | null
          qtd_dezenas: number
          user_id: string
        }
        Insert: {
          acertos?: number | null
          concurso_alvo?: number | null
          conferido?: boolean
          created_at?: string
          dezenas: number[]
          estrategia?: string | null
          estrategia_data?: Json | null
          id?: string
          loteria?: string | null
          nome?: string | null
          pasta_id?: string | null
          periodo_analise?: number | null
          qtd_dezenas?: number
          user_id: string
        }
        Update: {
          acertos?: number | null
          concurso_alvo?: number | null
          conferido?: boolean
          created_at?: string
          dezenas?: number[]
          estrategia?: string | null
          estrategia_data?: Json | null
          id?: string
          loteria?: string | null
          nome?: string | null
          pasta_id?: string | null
          periodo_analise?: number | null
          qtd_dezenas?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "palpites_salvos_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "palpites_pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          admin_notes: string | null
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          avatar_url: string | null
          celular: string | null
          celular_verificado: boolean | null
          cpf: string | null
          created_at: string
          custom_features: Json | null
          email: string | null
          email_verificado: boolean | null
          id: string
          is_blocked: boolean
          is_bot: boolean | null
          nome: string | null
          plan_id: string | null
          referral_code: string | null
          status_assinatura: string | null
          tags: string[]
          updated_at: string
          utm_source: string | null
          validade_assinatura: string | null
          whatsapp: string | null
        }
        Insert: {
          admin_notes?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          avatar_url?: string | null
          celular?: string | null
          celular_verificado?: boolean | null
          cpf?: string | null
          created_at?: string
          custom_features?: Json | null
          email?: string | null
          email_verificado?: boolean | null
          id: string
          is_blocked?: boolean
          is_bot?: boolean | null
          nome?: string | null
          plan_id?: string | null
          referral_code?: string | null
          status_assinatura?: string | null
          tags?: string[]
          updated_at?: string
          utm_source?: string | null
          validade_assinatura?: string | null
          whatsapp?: string | null
        }
        Update: {
          admin_notes?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          avatar_url?: string | null
          celular?: string | null
          celular_verificado?: boolean | null
          cpf?: string | null
          created_at?: string
          custom_features?: Json | null
          email?: string | null
          email_verificado?: boolean | null
          id?: string
          is_blocked?: boolean
          is_bot?: boolean | null
          nome?: string | null
          plan_id?: string | null
          referral_code?: string | null
          status_assinatura?: string | null
          tags?: string[]
          updated_at?: string
          utm_source?: string | null
          validade_assinatura?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfis_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          chat_estatisticas_max_msgs_per_day: number
          checkout_link: string | null
          created_at: string
          description: string | null
          display_order: number
          features: Json
          gerador_max_per_day: number
          id: string
          is_active: boolean
          name: string
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          chat_estatisticas_max_msgs_per_day?: number
          checkout_link?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json
          gerador_max_per_day?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          slug: string
          updated_at?: string
        }
        Update: {
          chat_estatisticas_max_msgs_per_day?: number
          checkout_link?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json
          gerador_max_per_day?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          actions: Json | null
          conteudo: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions?: Json | null
          conteudo: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json | null
          conteudo?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "postagens"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "postagens"
            referencedColumns: ["id"]
          },
        ]
      }
      postagens: {
        Row: {
          actions: Json | null
          bot_interactions_done: number
          bot_interactions_enabled: boolean
          bot_interactions_last_at: string | null
          bot_interactions_target: number | null
          concurso_referencia: number | null
          conteudo: string
          created_at: string
          curtidas: number | null
          external_link_text: string | null
          external_link_url: string | null
          id: string
          loteria_tag: string | null
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          parent_id: string | null
          respostas_count: number | null
          slug: string | null
          tipo: string | null
          titulo: string | null
          tool_snapshot: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          bot_interactions_done?: number
          bot_interactions_enabled?: boolean
          bot_interactions_last_at?: string | null
          bot_interactions_target?: number | null
          concurso_referencia?: number | null
          conteudo: string
          created_at?: string
          curtidas?: number | null
          external_link_text?: string | null
          external_link_url?: string | null
          id?: string
          loteria_tag?: string | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          parent_id?: string | null
          respostas_count?: number | null
          slug?: string | null
          tipo?: string | null
          titulo?: string | null
          tool_snapshot?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          bot_interactions_done?: number
          bot_interactions_enabled?: boolean
          bot_interactions_last_at?: string | null
          bot_interactions_target?: number | null
          concurso_referencia?: number | null
          conteudo?: string
          created_at?: string
          curtidas?: number | null
          external_link_text?: string | null
          external_link_url?: string | null
          id?: string
          loteria_tag?: string | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          parent_id?: string | null
          respostas_count?: number | null
          slug?: string | null
          tipo?: string | null
          titulo?: string | null
          tool_snapshot?: boolean | null
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
            referencedRelation: "perfis_publicos"
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
      proximos_concursos: {
        Row: {
          acumulado: boolean | null
          created_at: string | null
          data_sorteio: string | null
          id: string
          loteria: string
          numero_concurso: string
          premio_estimado: number | null
          updated_at: string | null
        }
        Insert: {
          acumulado?: boolean | null
          created_at?: string | null
          data_sorteio?: string | null
          id?: string
          loteria: string
          numero_concurso: string
          premio_estimado?: number | null
          updated_at?: string | null
        }
        Update: {
          acumulado?: boolean | null
          created_at?: string | null
          data_sorteio?: string | null
          id?: string
          loteria?: string
          numero_concurso?: string
          premio_estimado?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          claimed_at: string | null
          created_at: string
          days_granted: number
          id: string
          milestone_count: number
          milestone_type: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          days_granted?: number
          id?: string
          milestone_count: number
          milestone_type: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          days_granted?: number
          id?: string
          milestone_count?: number
          milestone_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_user_id_fkey"
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
      resultados_duplasena: {
        Row: {
          acumulou: boolean | null
          concurso_id: number
          created_at: string | null
          data_sorteio: string
          dezenas_sorteio1: number[]
          dezenas_sorteio2: number[]
          id: string
          locais_ganhadores: Json | null
          local_sorteio: string | null
          premiacao_json: Json | null
          qtd_impares_s1: number | null
          qtd_impares_s2: number | null
          qtd_moldura_s1: number | null
          qtd_moldura_s2: number | null
          qtd_pares_s1: number | null
          qtd_pares_s2: number | null
          qtd_primos_s1: number | null
          qtd_primos_s2: number | null
          qtd_repetidas_s1: number | null
          qtd_repetidas_s2: number | null
          valor_acumulado: number | null
          valor_estimado_proximo: number | null
        }
        Insert: {
          acumulou?: boolean | null
          concurso_id: number
          created_at?: string | null
          data_sorteio: string
          dezenas_sorteio1: number[]
          dezenas_sorteio2: number[]
          id?: string
          locais_ganhadores?: Json | null
          local_sorteio?: string | null
          premiacao_json?: Json | null
          qtd_impares_s1?: number | null
          qtd_impares_s2?: number | null
          qtd_moldura_s1?: number | null
          qtd_moldura_s2?: number | null
          qtd_pares_s1?: number | null
          qtd_pares_s2?: number | null
          qtd_primos_s1?: number | null
          qtd_primos_s2?: number | null
          qtd_repetidas_s1?: number | null
          qtd_repetidas_s2?: number | null
          valor_acumulado?: number | null
          valor_estimado_proximo?: number | null
        }
        Update: {
          acumulou?: boolean | null
          concurso_id?: number
          created_at?: string | null
          data_sorteio?: string
          dezenas_sorteio1?: number[]
          dezenas_sorteio2?: number[]
          id?: string
          locais_ganhadores?: Json | null
          local_sorteio?: string | null
          premiacao_json?: Json | null
          qtd_impares_s1?: number | null
          qtd_impares_s2?: number | null
          qtd_moldura_s1?: number | null
          qtd_moldura_s2?: number | null
          qtd_pares_s1?: number | null
          qtd_pares_s2?: number | null
          qtd_primos_s1?: number | null
          qtd_primos_s2?: number | null
          qtd_repetidas_s1?: number | null
          qtd_repetidas_s2?: number | null
          valor_acumulado?: number | null
          valor_estimado_proximo?: number | null
        }
        Relationships: []
      }
      resultados_megasena: {
        Row: {
          acumulou: boolean | null
          concurso_id: number
          created_at: string
          data_sorteio: string
          dezenas: number[]
          id: string
          locais_ganhadores: Json | null
          local_sorteio: string | null
          premiacao_json: Json | null
          qtd_impares: number | null
          qtd_moldura: number | null
          qtd_pares: number | null
          qtd_primos: number | null
          qtd_repetidas: number | null
          valor_acumulado: number | null
          valor_estimado_proximo: number | null
        }
        Insert: {
          acumulou?: boolean | null
          concurso_id: number
          created_at?: string
          data_sorteio: string
          dezenas: number[]
          id?: string
          locais_ganhadores?: Json | null
          local_sorteio?: string | null
          premiacao_json?: Json | null
          qtd_impares?: number | null
          qtd_moldura?: number | null
          qtd_pares?: number | null
          qtd_primos?: number | null
          qtd_repetidas?: number | null
          valor_acumulado?: number | null
          valor_estimado_proximo?: number | null
        }
        Update: {
          acumulou?: boolean | null
          concurso_id?: number
          created_at?: string
          data_sorteio?: string
          dezenas?: number[]
          id?: string
          locais_ganhadores?: Json | null
          local_sorteio?: string | null
          premiacao_json?: Json | null
          qtd_impares?: number | null
          qtd_moldura?: number | null
          qtd_pares?: number | null
          qtd_primos?: number | null
          qtd_repetidas?: number | null
          valor_acumulado?: number | null
          valor_estimado_proximo?: number | null
        }
        Relationships: []
      }
      saldo_transacoes: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          referencia_id: string | null
          status: string | null
          tipo: string
          user_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          referencia_id?: string | null
          status?: string | null
          tipo: string
          user_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          referencia_id?: string | null
          status?: string | null
          tipo?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "saldo_transacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saldo_transacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saldo_transacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      send_logs: {
        Row: {
          id: string
          instance_id: string | null
          message_content: string | null
          queue_id: string | null
          recipient_phone: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          id?: string
          instance_id?: string | null
          message_content?: string | null
          queue_id?: string | null
          recipient_phone: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          instance_id?: string | null
          message_content?: string | null
          queue_id?: string | null
          recipient_phone?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "send_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "send_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "message_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          source: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
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
      warming_logs: {
        Row: {
          from_instance_id: string
          id: string
          message_content: string | null
          sent_at: string | null
          to_instance_id: string
          window_name: string | null
        }
        Insert: {
          from_instance_id: string
          id?: string
          message_content?: string | null
          sent_at?: string | null
          to_instance_id: string
          window_name?: string | null
        }
        Update: {
          from_instance_id?: string
          id?: string
          message_content?: string | null
          sent_at?: string | null
          to_instance_id?: string
          window_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warming_logs_from_instance_id_fkey"
            columns: ["from_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warming_logs_to_instance_id_fkey"
            columns: ["to_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      warming_rotation: {
        Row: {
          id: string
          last_pair: string | null
          last_used_at: string | null
          window_name: string
        }
        Insert: {
          id?: string
          last_pair?: string | null
          last_used_at?: string | null
          window_name: string
        }
        Update: {
          id?: string
          last_pair?: string | null
          last_used_at?: string | null
          window_name?: string
        }
        Relationships: []
      }
      warming_schedule: {
        Row: {
          day_type: string
          hour_end: number
          hour_start: number
          id: string
          is_active: boolean | null
          max_messages: number | null
          min_messages: number | null
          theme: string
          window_name: string
        }
        Insert: {
          day_type: string
          hour_end: number
          hour_start: number
          id?: string
          is_active?: boolean | null
          max_messages?: number | null
          min_messages?: number | null
          theme: string
          window_name: string
        }
        Update: {
          day_type?: string
          hour_end?: number
          hour_start?: number
          id?: string
          is_active?: boolean | null
          max_messages?: number | null
          min_messages?: number | null
          theme?: string
          window_name?: string
        }
        Relationships: []
      }
      warming_scheduled_messages: {
        Row: {
          created_at: string
          error_message: string | null
          from_evolution_id: string
          from_instance_id: string
          id: string
          message_content: string
          pair_session_id: string
          scheduled_for: string
          sent_at: string | null
          status: string
          to_instance_id: string
          to_phone_number: string
          window_name: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          from_evolution_id: string
          from_instance_id: string
          id?: string
          message_content: string
          pair_session_id: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          to_instance_id: string
          to_phone_number: string
          window_name?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          from_evolution_id?: string
          from_instance_id?: string
          id?: string
          message_content?: string
          pair_session_id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          to_instance_id?: string
          to_phone_number?: string
          window_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warming_scheduled_messages_from_instance_id_fkey"
            columns: ["from_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warming_scheduled_messages_to_instance_id_fkey"
            columns: ["to_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string | null
          daily_limit: number | null
          evolution_instance_id: string
          friendly_name: string
          id: string
          last_message_at: string | null
          messages_sent_today: number | null
          name: string
          phone_number: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          daily_limit?: number | null
          evolution_instance_id: string
          friendly_name: string
          id?: string
          last_message_at?: string | null
          messages_sent_today?: number | null
          name: string
          phone_number: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          daily_limit?: number | null
          evolution_instance_id?: string
          friendly_name?: string
          id?: string
          last_message_at?: string | null
          messages_sent_today?: number | null
          name?: string
          phone_number?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      guide_personas_publico: {
        Row: {
          ativo: boolean | null
          badge_emoji: string | null
          cargo: string | null
          chat_enabled: boolean | null
          chat_priority: number | null
          chat_tags: string[] | null
          cta_override_buttons: Json | null
          cta_override_enabled: boolean | null
          cta_override_text: string | null
          especialidade: string | null
          id: string | null
          perfil_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          badge_emoji?: string | null
          cargo?: string | null
          chat_enabled?: boolean | null
          chat_priority?: number | null
          chat_tags?: string[] | null
          cta_override_buttons?: Json | null
          cta_override_enabled?: boolean | null
          cta_override_text?: string | null
          especialidade?: string | null
          id?: string | null
          perfil_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          badge_emoji?: string | null
          cargo?: string | null
          chat_enabled?: boolean | null
          chat_priority?: number | null
          chat_tags?: string[] | null
          cta_override_buttons?: Json | null
          cta_override_enabled?: boolean | null
          cta_override_text?: string | null
          especialidade?: string | null
          id?: string | null
          perfil_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_personas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_personas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_personas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      kirvano_webhook_logs_masked: {
        Row: {
          authorized_method: string | null
          checkout_id: string | null
          email: string | null
          email_masked: string | null
          error: string | null
          event: string | null
          id: string | null
          payment_method: string | null
          phone: string | null
          phone_masked: string | null
          process_result: string | null
          processed: boolean | null
          purchase_type: string | null
          raw_payload: Json | null
          raw_payload_safe: Json | null
          received_at: string | null
          sale_id: string | null
          status: string | null
        }
        Insert: {
          authorized_method?: string | null
          checkout_id?: string | null
          email?: string | null
          email_masked?: never
          error?: string | null
          event?: string | null
          id?: string | null
          payment_method?: string | null
          phone?: string | null
          phone_masked?: never
          process_result?: string | null
          processed?: boolean | null
          purchase_type?: string | null
          raw_payload?: Json | null
          raw_payload_safe?: never
          received_at?: string | null
          sale_id?: string | null
          status?: string | null
        }
        Update: {
          authorized_method?: string | null
          checkout_id?: string | null
          email?: string | null
          email_masked?: never
          error?: string | null
          event?: string | null
          id?: string | null
          payment_method?: string | null
          phone?: string | null
          phone_masked?: never
          process_result?: string | null
          processed?: boolean | null
          purchase_type?: string | null
          raw_payload?: Json | null
          raw_payload_safe?: never
          received_at?: string | null
          sale_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      perfis_publicos: {
        Row: {
          avatar_url: string | null
          id: string | null
          is_bot: boolean | null
          nome: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          is_bot?: boolean | null
          nome?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          is_bot?: boolean | null
          nome?: string | null
        }
        Relationships: []
      }
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
      audit_webhook_access: { Args: never; Returns: undefined }
      check_referral_milestones: {
        Args: { p_referrer_id: string }
        Returns: undefined
      }
      claim_referral_reward: { Args: { p_reward_id: string }; Returns: Json }
      generate_bolao_codigo: {
        Args: { p_mes_ano: string; p_sigla: string }
        Returns: string
      }
      generate_referral_code: { Args: never; Returns: string }
      generate_slug: { Args: { title: string }; Returns: string }
      get_referrer_name: { Args: { p_code: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      identificar_conta: { Args: { p_identificador: string }; Returns: Json }
      increment_lead_webhook_count: {
        Args: { webhook_id: string }
        Returns: undefined
      }
      process_pending_bot_replies: { Args: never; Returns: undefined }
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
