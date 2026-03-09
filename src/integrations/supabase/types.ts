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
      admin_settings: {
        Row: {
          id: string
          updated_at: string
          updated_by: string | null
          usd_to_brl: number
        }
        Insert: {
          id?: string
          updated_at?: string
          updated_by?: string | null
          usd_to_brl?: number
        }
        Update: {
          id?: string
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
      referral_rewards: {
        Row: {
          created_at: string
          days_granted: number
          id: string
          milestone_count: number
          milestone_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_granted?: number
          id?: string
          milestone_count: number
          milestone_type: string
          user_id: string
        }
        Update: {
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
      check_referral_milestones: {
        Args: { p_referrer_id: string }
        Returns: undefined
      }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
