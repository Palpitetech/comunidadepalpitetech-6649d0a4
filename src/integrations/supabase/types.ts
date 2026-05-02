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
      app_config: {
        Row: {
          current_version: number
          force_reload_at: string
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          current_version?: number
          force_reload_at?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          current_version?: number
          force_reload_at?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      assinaturas_operacionais: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          identificacao: string
          periodo_dias_custom: number | null
          periodo_validade: string
          provedor: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          identificacao: string
          periodo_dias_custom?: number | null
          periodo_validade: string
          provedor: string
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          identificacao?: string
          periodo_dias_custom?: number | null
          periodo_validade?: string
          provedor?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      attribution_merge_logs: {
        Row: {
          attribution_after: Json
          attribution_before: Json
          created_at: string
          fields_added: string[]
          fields_skipped: string[]
          id: string
          marked_purchase: boolean
          new_attr_input: Json
          source: string
          user_existed: boolean
          user_id: string | null
        }
        Insert: {
          attribution_after?: Json
          attribution_before?: Json
          created_at?: string
          fields_added?: string[]
          fields_skipped?: string[]
          id?: string
          marked_purchase?: boolean
          new_attr_input?: Json
          source?: string
          user_existed?: boolean
          user_id?: string | null
        }
        Update: {
          attribution_after?: Json
          attribution_before?: Json
          created_at?: string
          fields_added?: string[]
          fields_skipped?: string[]
          id?: string
          marked_purchase?: boolean
          new_attr_input?: Json
          source?: string
          user_existed?: boolean
          user_id?: string | null
        }
        Relationships: []
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
          pago_em: string | null
          palpites: Json | null
          palpites_premiados: Json | null
          pdf_url: string | null
          resultado_verificado: boolean | null
          sigla: string
          status: string | null
          task_comprovantes: boolean | null
          task_impresso: boolean | null
          task_pago: boolean | null
          task_registrado: boolean | null
          task_resgate: boolean | null
          total_cotas: number
          total_palpites: number
          updated_at: string | null
          valor_cota: number
          valor_premiacao: number | null
          valor_registro: number | null
          verificado_em: string | null
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
          pago_em?: string | null
          palpites?: Json | null
          palpites_premiados?: Json | null
          pdf_url?: string | null
          resultado_verificado?: boolean | null
          sigla: string
          status?: string | null
          task_comprovantes?: boolean | null
          task_impresso?: boolean | null
          task_pago?: boolean | null
          task_registrado?: boolean | null
          task_resgate?: boolean | null
          total_cotas: number
          total_palpites: number
          updated_at?: string | null
          valor_cota: number
          valor_premiacao?: number | null
          valor_registro?: number | null
          verificado_em?: string | null
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
          pago_em?: string | null
          palpites?: Json | null
          palpites_premiados?: Json | null
          pdf_url?: string | null
          resultado_verificado?: boolean | null
          sigla?: string
          status?: string | null
          task_comprovantes?: boolean | null
          task_impresso?: boolean | null
          task_pago?: boolean | null
          task_registrado?: boolean | null
          task_resgate?: boolean | null
          total_cotas?: number
          total_palpites?: number
          updated_at?: string | null
          valor_cota?: number
          valor_premiacao?: number | null
          valor_registro?: number | null
          verificado_em?: string | null
        }
        Relationships: []
      }
      cadastros_pendentes: {
        Row: {
          attribution: Json
          celular: string | null
          celular_codigo: string | null
          celular_codigo_enviado_em: string | null
          celular_codigo_expira_em: string | null
          celular_tentativas: number
          celular_verificado: boolean
          created_at: string
          email: string
          email_codigo: string | null
          email_codigo_enviado_em: string | null
          email_codigo_expira_em: string | null
          email_tentativas: number
          email_verificado: boolean
          expires_at: string
          finalizado: boolean
          finalizado_em: string | null
          id: string
          ip: string | null
          referral_code: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attribution?: Json
          celular?: string | null
          celular_codigo?: string | null
          celular_codigo_enviado_em?: string | null
          celular_codigo_expira_em?: string | null
          celular_tentativas?: number
          celular_verificado?: boolean
          created_at?: string
          email: string
          email_codigo?: string | null
          email_codigo_enviado_em?: string | null
          email_codigo_expira_em?: string | null
          email_tentativas?: number
          email_verificado?: boolean
          expires_at?: string
          finalizado?: boolean
          finalizado_em?: string | null
          id?: string
          ip?: string | null
          referral_code?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attribution?: Json
          celular?: string | null
          celular_codigo?: string | null
          celular_codigo_enviado_em?: string | null
          celular_codigo_expira_em?: string | null
          celular_tentativas?: number
          celular_verificado?: boolean
          created_at?: string
          email?: string
          email_codigo?: string | null
          email_codigo_enviado_em?: string | null
          email_codigo_expira_em?: string | null
          email_tentativas?: number
          email_verificado?: boolean
          expires_at?: string
          finalizado?: boolean
          finalizado_em?: string | null
          id?: string
          ip?: string | null
          referral_code?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      carteira_movimentacoes: {
        Row: {
          bolao_id: string | null
          created_at: string | null
          created_by: string | null
          descricao: string
          id: string
          referencia: string | null
          tipo: string
          valor: number
        }
        Insert: {
          bolao_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao: string
          id?: string
          referencia?: string | null
          tipo: string
          valor: number
        }
        Update: {
          bolao_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string
          id?: string
          referencia?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "carteira_movimentacoes_bolao_id_fkey"
            columns: ["bolao_id"]
            isOneToOne: false
            referencedRelation: "boloes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_movimentacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_movimentacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_movimentacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
        ]
      }
      chip_celulares: {
        Row: {
          aparelho_conectado: string | null
          ativo: boolean
          created_at: string
          custo_chip: number
          data_compra: string
          id: string
          numero: string
          numero_id: number
          observacao: string | null
          operadora: string
          plano_tipo: string
          ultima_recarga_at: string | null
          ultima_recarga_valor: number | null
          updated_at: string
          valor_plano: number
        }
        Insert: {
          aparelho_conectado?: string | null
          ativo?: boolean
          created_at?: string
          custo_chip?: number
          data_compra?: string
          id?: string
          numero: string
          numero_id?: number
          observacao?: string | null
          operadora: string
          plano_tipo: string
          ultima_recarga_at?: string | null
          ultima_recarga_valor?: number | null
          updated_at?: string
          valor_plano?: number
        }
        Update: {
          aparelho_conectado?: string | null
          ativo?: boolean
          created_at?: string
          custo_chip?: number
          data_compra?: string
          id?: string
          numero?: string
          numero_id?: number
          observacao?: string | null
          operadora?: string
          plano_tipo?: string
          ultima_recarga_at?: string | null
          ultima_recarga_valor?: number | null
          updated_at?: string
          valor_plano?: number
        }
        Relationships: []
      }
      chip_recargas: {
        Row: {
          chip_id: string
          created_at: string
          created_by: string | null
          data_recarga: string
          id: string
          metodo: string | null
          observacao: string | null
          valor: number
        }
        Insert: {
          chip_id: string
          created_at?: string
          created_by?: string | null
          data_recarga?: string
          id?: string
          metodo?: string | null
          observacao?: string | null
          valor: number
        }
        Update: {
          chip_id?: string
          created_at?: string
          created_by?: string | null
          data_recarga?: string
          id?: string
          metodo?: string | null
          observacao?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "chip_recargas_chip_id_fkey"
            columns: ["chip_id"]
            isOneToOne: false
            referencedRelation: "chip_celulares"
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
      custos_operacionais_manuais: {
        Row: {
          categoria: string
          created_at: string
          created_by: string | null
          data_custo: string
          descricao: string
          id: string
          observacao: string | null
          recorrente: boolean
          updated_at: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          created_by?: string | null
          data_custo?: string
          descricao: string
          id?: string
          observacao?: string | null
          recorrente?: boolean
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          created_by?: string | null
          data_custo?: string
          descricao?: string
          id?: string
          observacao?: string | null
          recorrente?: boolean
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          created_at: string
          error_message: string | null
          html_render: string | null
          id: string
          priority: number
          recipient_email: string
          recipient_name: string | null
          resend_message_id: string | null
          retry_count: number
          scheduled_at: string
          sent_at: string | null
          status: string
          subject_render: string | null
          template_id: string | null
          variables: Json
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          html_render?: string | null
          id?: string
          priority?: number
          recipient_email: string
          recipient_name?: string | null
          resend_message_id?: string | null
          retry_count?: number
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject_render?: string | null
          template_id?: string | null
          variables?: Json
        }
        Update: {
          created_at?: string
          error_message?: string | null
          html_render?: string | null
          id?: string
          priority?: number
          recipient_email?: string
          recipient_name?: string | null
          resend_message_id?: string | null
          retry_count?: number
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject_render?: string | null
          template_id?: string | null
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          queue_id: string | null
          recipient_email: string
          resend_message_id: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          queue_id?: string | null
          recipient_email: string
          resend_message_id?: string | null
          status: string
          template_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          queue_id?: string | null
          recipient_email?: string
          resend_message_id?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_send_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_send_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_suppressions: {
        Row: {
          created_at: string
          email: string
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          reason?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string
          delay_minutes: number
          event_trigger: string
          exclude_tags: string[]
          from_name: string
          html: string
          id: string
          include_tags: string[]
          is_active: boolean
          name: string
          plan_ids: string[]
          reply_to: string | null
          subject: string
          tags_match_mode: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          delay_minutes?: number
          event_trigger: string
          exclude_tags?: string[]
          from_name?: string
          html: string
          id?: string
          include_tags?: string[]
          is_active?: boolean
          name: string
          plan_ids?: string[]
          reply_to?: string | null
          subject: string
          tags_match_mode?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          delay_minutes?: number
          event_trigger?: string
          exclude_tags?: string[]
          from_name?: string
          html?: string
          id?: string
          include_tags?: string[]
          is_active?: boolean
          name?: string
          plan_ids?: string[]
          reply_to?: string | null
          subject?: string
          tags_match_mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          lead_email: string | null
          lead_phone: string | null
          metadata: Json | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          lead_email?: string | null
          lead_phone?: string | null
          metadata?: Json | null
          source?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          lead_email?: string | null
          lead_phone?: string | null
          metadata?: Json | null
          source?: string
          user_id?: string | null
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
      faixas_premiacao: {
        Row: {
          concurso: string
          created_at: string | null
          faixa: string
          ganhadores: number | null
          id: string
          loteria: string
          pontos_necessarios: number
          valor_premio: number | null
        }
        Insert: {
          concurso: string
          created_at?: string | null
          faixa: string
          ganhadores?: number | null
          id?: string
          loteria: string
          pontos_necessarios: number
          valor_premio?: number | null
        }
        Update: {
          concurso?: string
          created_at?: string | null
          faixa?: string
          ganhadores?: number | null
          id?: string
          loteria?: string
          pontos_necessarios?: number
          valor_premio?: number | null
        }
        Relationships: []
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
      gerador_estudo_daily_usage: {
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
          group_jids: string[]
          id: string
          include_palpites: boolean
          is_active: boolean | null
          member_tag: string | null
          name: string
          palpite_settings: Json
          slots: Json | null
          updated_at: string | null
          vip_group_link: string | null
        }
        Insert: {
          created_at?: string | null
          group_jids?: string[]
          id?: string
          include_palpites?: boolean
          is_active?: boolean | null
          member_tag?: string | null
          name: string
          palpite_settings?: Json
          slots?: Json | null
          updated_at?: string | null
          vip_group_link?: string | null
        }
        Update: {
          created_at?: string | null
          group_jids?: string[]
          id?: string
          include_palpites?: boolean
          is_active?: boolean | null
          member_tag?: string | null
          name?: string
          palpite_settings?: Json
          slots?: Json | null
          updated_at?: string | null
          vip_group_link?: string | null
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
          last_error_at: string | null
          message_content: string
          message_source: string | null
          retry_count: number
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
          last_error_at?: string | null
          message_content: string
          message_source?: string | null
          retry_count?: number
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
          last_error_at?: string | null
          message_content?: string
          message_source?: string | null
          retry_count?: number
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
      group_blast_prepare_runs: {
        Row: {
          config_id: string | null
          error_message: string | null
          id: string
          ran_at: string
          skipped_dedup: number
          slots_failed_resolution: number
          slots_resolved: number
          slots_scheduled: number
        }
        Insert: {
          config_id?: string | null
          error_message?: string | null
          id?: string
          ran_at?: string
          skipped_dedup?: number
          slots_failed_resolution?: number
          slots_resolved?: number
          slots_scheduled?: number
        }
        Update: {
          config_id?: string | null
          error_message?: string | null
          id?: string
          ran_at?: string
          skipped_dedup?: number
          slots_failed_resolution?: number
          slots_resolved?: number
          slots_scheduled?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_blast_prepare_runs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "group_blast_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      help_content: {
        Row: {
          author_experience: string | null
          author_name: string | null
          content: string
          created_at: string
          direct_answer: string | null
          faq_items: Json | null
          id: string
          intent: string | null
          main_question: string | null
          meta_description: string | null
          meta_title: string | null
          review_method: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_experience?: string | null
          author_name?: string | null
          content: string
          created_at?: string
          direct_answer?: string | null
          faq_items?: Json | null
          id?: string
          intent?: string | null
          main_question?: string | null
          meta_description?: string | null
          meta_title?: string | null
          review_method?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_experience?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          direct_answer?: string | null
          faq_items?: Json | null
          id?: string
          intent?: string | null
          main_question?: string | null
          meta_description?: string | null
          meta_title?: string | null
          review_method?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      lead_retargeting_runs: {
        Row: {
          blocked_by_db_constraint: number
          enqueued: number
          errors: Json
          errors_dedupe_db: number
          errors_insert_db: number
          errors_sales_db: number
          id: string
          processed_templates: number
          ran_at: string
          skipped: number
          skipped_converted: number
          skipped_dedupe: number
          skipped_no_phone: number
          skipped_paid_profile: number
          skipped_recent_purchase: number
        }
        Insert: {
          blocked_by_db_constraint?: number
          enqueued?: number
          errors?: Json
          errors_dedupe_db?: number
          errors_insert_db?: number
          errors_sales_db?: number
          id?: string
          processed_templates?: number
          ran_at?: string
          skipped?: number
          skipped_converted?: number
          skipped_dedupe?: number
          skipped_no_phone?: number
          skipped_paid_profile?: number
          skipped_recent_purchase?: number
        }
        Update: {
          blocked_by_db_constraint?: number
          enqueued?: number
          errors?: Json
          errors_dedupe_db?: number
          errors_insert_db?: number
          errors_sales_db?: number
          id?: string
          processed_templates?: number
          ran_at?: string
          skipped?: number
          skipped_converted?: number
          skipped_dedupe?: number
          skipped_no_phone?: number
          skipped_paid_profile?: number
          skipped_recent_purchase?: number
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
      leads_inbox: {
        Row: {
          celular: string | null
          created_at: string
          email: string | null
          fbclid: string | null
          gclid: string | null
          id: string
          ip: string | null
          nome: string | null
          pagina_origem: string | null
          perfil_id: string | null
          raw_payload: Json | null
          referrer: string | null
          slug: string | null
          status: string
          tags: string[] | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          webhook_id: string | null
          webhook_name: string | null
        }
        Insert: {
          celular?: string | null
          created_at?: string
          email?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          ip?: string | null
          nome?: string | null
          pagina_origem?: string | null
          perfil_id?: string | null
          raw_payload?: Json | null
          referrer?: string | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_id?: string | null
          webhook_name?: string | null
        }
        Update: {
          celular?: string | null
          created_at?: string
          email?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          ip?: string | null
          nome?: string | null
          pagina_origem?: string | null
          perfil_id?: string | null
          raw_payload?: Json | null
          referrer?: string | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_id?: string | null
          webhook_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_inbox_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_inbox_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_inbox_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_inbox_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "lead_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      message_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          instance_id: string | null
          priority: number
          recipient_name: string | null
          recipient_phone: string
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          variables: Json | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          priority?: number
          recipient_name?: string | null
          recipient_phone: string
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          variables?: Json | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          priority?: number
          recipient_name?: string | null
          recipient_phone?: string
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          variables?: Json | null
          variant_id?: string | null
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
          {
            foreignKeyName: "message_queue_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "message_template_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      message_template_variants: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          last_used_at: string | null
          position: number
          template_id: string
          times_used: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          position: number
          template_id: string
          times_used?: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          position?: number
          template_id?: string
          times_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_template_variants_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          delay_enabled: boolean
          delay_minutes: number
          event_trigger: string
          exclude_recent_window_hours: number
          exclude_tags: string[]
          exclude_tags_recent: string[]
          id: string
          include_tags: string[]
          is_active: boolean
          last_variant_position: number
          name: string
          plan_ids: string[]
          tags_match_mode: string
          type: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          delay_enabled?: boolean
          delay_minutes?: number
          event_trigger: string
          exclude_recent_window_hours?: number
          exclude_tags?: string[]
          exclude_tags_recent?: string[]
          id?: string
          include_tags?: string[]
          is_active?: boolean
          last_variant_position?: number
          name: string
          plan_ids?: string[]
          tags_match_mode?: string
          type?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          delay_enabled?: boolean
          delay_minutes?: number
          event_trigger?: string
          exclude_recent_window_hours?: number
          exclude_tags?: string[]
          exclude_tags_recent?: string[]
          id?: string
          include_tags?: string[]
          is_active?: boolean
          last_variant_position?: number
          name?: string
          plan_ids?: string[]
          tags_match_mode?: string
          type?: string | null
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
      perfil_tag_history: {
        Row: {
          added_at: string
          id: string
          perfil_id: string
          tag: string
        }
        Insert: {
          added_at?: string
          id?: string
          perfil_id: string
          tag: string
        }
        Update: {
          added_at?: string
          id?: string
          perfil_id?: string
          tag?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          admin_notes: string | null
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          attribution: Json
          avatar_url: string | null
          celular: string | null
          celular_verificado: boolean | null
          cpf: string | null
          created_at: string
          custom_features: Json | null
          email: string | null
          email_verificado: boolean | null
          first_purchase_at: string | null
          id: string
          is_blocked: boolean
          is_bot: boolean | null
          nome: string | null
          plan_id: string | null
          referral_code: string | null
          status_assinatura: string | null
          tags: string[]
          trial_used: boolean | null
          updated_at: string
          utm_source: string | null
          validade_assinatura: string | null
          whatsapp: string | null
        }
        Insert: {
          admin_notes?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          attribution?: Json
          avatar_url?: string | null
          celular?: string | null
          celular_verificado?: boolean | null
          cpf?: string | null
          created_at?: string
          custom_features?: Json | null
          email?: string | null
          email_verificado?: boolean | null
          first_purchase_at?: string | null
          id: string
          is_blocked?: boolean
          is_bot?: boolean | null
          nome?: string | null
          plan_id?: string | null
          referral_code?: string | null
          status_assinatura?: string | null
          tags?: string[]
          trial_used?: boolean | null
          updated_at?: string
          utm_source?: string | null
          validade_assinatura?: string | null
          whatsapp?: string | null
        }
        Update: {
          admin_notes?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          attribution?: Json
          avatar_url?: string | null
          celular?: string | null
          celular_verificado?: boolean | null
          cpf?: string | null
          created_at?: string
          custom_features?: Json | null
          email?: string | null
          email_verificado?: boolean | null
          first_purchase_at?: string | null
          id?: string
          is_blocked?: boolean
          is_bot?: boolean | null
          nome?: string | null
          plan_id?: string | null
          referral_code?: string | null
          status_assinatura?: string | null
          tags?: string[]
          trial_used?: boolean | null
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
      post_schedules: {
        Row: {
          ativo: boolean
          created_at: string
          dias: number[]
          horario: string
          id: string
          loteria: string
          observacao: string | null
          tipo_post: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dias?: number[]
          horario: string
          id?: string
          loteria?: string
          observacao?: string | null
          tipo_post: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dias?: number[]
          horario?: string
          id?: string
          loteria?: string
          observacao?: string | null
          tipo_post?: string
          updated_at?: string
        }
        Relationships: []
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
          fatos_snapshot: Json | null
          id: string
          loteria_tag: string | null
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          parent_id: string | null
          publicar_em: string | null
          respostas_count: number | null
          slug: string | null
          status: string
          tema_estudo: string | null
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
          fatos_snapshot?: Json | null
          id?: string
          loteria_tag?: string | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          parent_id?: string | null
          publicar_em?: string | null
          respostas_count?: number | null
          slug?: string | null
          status?: string
          tema_estudo?: string | null
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
          fatos_snapshot?: Json | null
          id?: string
          loteria_tag?: string | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          parent_id?: string | null
          publicar_em?: string | null
          respostas_count?: number | null
          slug?: string | null
          status?: string
          tema_estudo?: string | null
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
          qtd_fibonacci: number | null
          qtd_impares: number | null
          qtd_moldura: number | null
          qtd_pares: number | null
          qtd_primos: number | null
          qtd_repetidas: number | null
          sequencias: number | null
          soma: number | null
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
          qtd_fibonacci?: number | null
          qtd_impares?: number | null
          qtd_moldura?: number | null
          qtd_pares?: number | null
          qtd_primos?: number | null
          qtd_repetidas?: number | null
          sequencias?: number | null
          soma?: number | null
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
          qtd_fibonacci?: number | null
          qtd_impares?: number | null
          qtd_moldura?: number | null
          qtd_pares?: number | null
          qtd_primos?: number | null
          qtd_repetidas?: number | null
          sequencias?: number | null
          soma?: number | null
          valor_acumulado_especial?: number | null
          valor_estimado_proximo?: number | null
        }
        Relationships: []
      }
      resultados_diadesorte: {
        Row: {
          acumulou: boolean | null
          concurso: number
          created_at: string | null
          data_proximo_concurso: string | null
          data_sorteio: string
          dezenas: string[]
          id: string
          mes_sorte: string | null
          premiacao_json: Json | null
          valor_acumulado: number | null
          valor_estimado_proximo: number | null
          valor_premio_principal: number | null
        }
        Insert: {
          acumulou?: boolean | null
          concurso: number
          created_at?: string | null
          data_proximo_concurso?: string | null
          data_sorteio: string
          dezenas: string[]
          id?: string
          mes_sorte?: string | null
          premiacao_json?: Json | null
          valor_acumulado?: number | null
          valor_estimado_proximo?: number | null
          valor_premio_principal?: number | null
        }
        Update: {
          acumulou?: boolean | null
          concurso?: number
          created_at?: string | null
          data_proximo_concurso?: string | null
          data_sorteio?: string
          dezenas?: string[]
          id?: string
          mes_sorte?: string | null
          premiacao_json?: Json | null
          valor_acumulado?: number | null
          valor_estimado_proximo?: number | null
          valor_premio_principal?: number | null
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
      resultados_loterias: {
        Row: {
          acumulou: boolean | null
          ciclo_numero: number | null
          concurso: number
          created_at: string | null
          data_proximo_concurso: string | null
          data_sorteio: string
          dezenas: number[]
          dezenas_faltantes_ciclo: number[] | null
          dezenas_sorteio2: number[] | null
          id: string
          locais_ganhadores: Json | null
          local_sorteio: string | null
          loteria: string
          mes_sorte: string | null
          premiacao_json: Json | null
          qtd_fibonacci: number | null
          qtd_fibonacci_s2: number | null
          qtd_impares: number | null
          qtd_impares_s2: number | null
          qtd_moldura: number | null
          qtd_moldura_s2: number | null
          qtd_pares: number | null
          qtd_pares_s2: number | null
          qtd_primos: number | null
          qtd_primos_s2: number | null
          qtd_repetidas: number | null
          qtd_repetidas_s2: number | null
          sequencias: number | null
          sequencias_s2: number | null
          soma: number | null
          soma_s2: number | null
          valor_acumulado: number | null
          valor_acumulado_especial: number | null
          valor_estimado_proximo: number | null
          valor_premio_principal: number | null
        }
        Insert: {
          acumulou?: boolean | null
          ciclo_numero?: number | null
          concurso: number
          created_at?: string | null
          data_proximo_concurso?: string | null
          data_sorteio: string
          dezenas: number[]
          dezenas_faltantes_ciclo?: number[] | null
          dezenas_sorteio2?: number[] | null
          id?: string
          locais_ganhadores?: Json | null
          local_sorteio?: string | null
          loteria: string
          mes_sorte?: string | null
          premiacao_json?: Json | null
          qtd_fibonacci?: number | null
          qtd_fibonacci_s2?: number | null
          qtd_impares?: number | null
          qtd_impares_s2?: number | null
          qtd_moldura?: number | null
          qtd_moldura_s2?: number | null
          qtd_pares?: number | null
          qtd_pares_s2?: number | null
          qtd_primos?: number | null
          qtd_primos_s2?: number | null
          qtd_repetidas?: number | null
          qtd_repetidas_s2?: number | null
          sequencias?: number | null
          sequencias_s2?: number | null
          soma?: number | null
          soma_s2?: number | null
          valor_acumulado?: number | null
          valor_acumulado_especial?: number | null
          valor_estimado_proximo?: number | null
          valor_premio_principal?: number | null
        }
        Update: {
          acumulou?: boolean | null
          ciclo_numero?: number | null
          concurso?: number
          created_at?: string | null
          data_proximo_concurso?: string | null
          data_sorteio?: string
          dezenas?: number[]
          dezenas_faltantes_ciclo?: number[] | null
          dezenas_sorteio2?: number[] | null
          id?: string
          locais_ganhadores?: Json | null
          local_sorteio?: string | null
          loteria?: string
          mes_sorte?: string | null
          premiacao_json?: Json | null
          qtd_fibonacci?: number | null
          qtd_fibonacci_s2?: number | null
          qtd_impares?: number | null
          qtd_impares_s2?: number | null
          qtd_moldura?: number | null
          qtd_moldura_s2?: number | null
          qtd_pares?: number | null
          qtd_pares_s2?: number | null
          qtd_primos?: number | null
          qtd_primos_s2?: number | null
          qtd_repetidas?: number | null
          qtd_repetidas_s2?: number | null
          sequencias?: number | null
          sequencias_s2?: number | null
          soma?: number | null
          soma_s2?: number | null
          valor_acumulado?: number | null
          valor_acumulado_especial?: number | null
          valor_estimado_proximo?: number | null
          valor_premio_principal?: number | null
        }
        Relationships: []
      }
      resultados_lotomania: {
        Row: {
          acumulou: boolean | null
          concurso: number
          created_at: string | null
          data_proximo_concurso: string | null
          data_sorteio: string
          dezenas: string[]
          id: string
          premiacao_json: Json | null
          valor_acumulado: number | null
          valor_estimado_proximo: number | null
          valor_premio_principal: number | null
        }
        Insert: {
          acumulou?: boolean | null
          concurso: number
          created_at?: string | null
          data_proximo_concurso?: string | null
          data_sorteio: string
          dezenas: string[]
          id?: string
          premiacao_json?: Json | null
          valor_acumulado?: number | null
          valor_estimado_proximo?: number | null
          valor_premio_principal?: number | null
        }
        Update: {
          acumulou?: boolean | null
          concurso?: number
          created_at?: string | null
          data_proximo_concurso?: string | null
          data_sorteio?: string
          dezenas?: string[]
          id?: string
          premiacao_json?: Json | null
          valor_acumulado?: number | null
          valor_estimado_proximo?: number | null
          valor_premio_principal?: number | null
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
      resultados_quina: {
        Row: {
          acumulou: boolean | null
          concurso: number
          created_at: string | null
          data_proximo_concurso: string | null
          data_sorteio: string
          dezenas: string[]
          id: string
          premiacao_json: Json | null
          valor_acumulado: number | null
          valor_estimado_proximo: number | null
          valor_premio_principal: number | null
        }
        Insert: {
          acumulou?: boolean | null
          concurso: number
          created_at?: string | null
          data_proximo_concurso?: string | null
          data_sorteio: string
          dezenas: string[]
          id?: string
          premiacao_json?: Json | null
          valor_acumulado?: number | null
          valor_estimado_proximo?: number | null
          valor_premio_principal?: number | null
        }
        Update: {
          acumulou?: boolean | null
          concurso?: number
          created_at?: string | null
          data_proximo_concurso?: string | null
          data_sorteio?: string
          dezenas?: string[]
          id?: string
          premiacao_json?: Json | null
          valor_acumulado?: number | null
          valor_estimado_proximo?: number | null
          valor_premio_principal?: number | null
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
      whatsapp_chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          last_message_at: string | null
          last_message_preview: string | null
          phone_number: string
          profile_name: string | null
          unread_count: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          phone_number: string
          profile_name?: string | null
          unread_count?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          phone_number?: string
          profile_name?: string | null
          unread_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_chat_conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          direction: string
          evolution_message_id: string | null
          expires_at: string
          id: string
          instance_id: string | null
          phone_number: string
          received_at: string
          status: string
        }
        Insert: {
          content: string
          conversation_id: string
          direction: string
          evolution_message_id?: string | null
          expires_at?: string
          id?: string
          instance_id?: string | null
          phone_number: string
          received_at?: string
          status?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          direction?: string
          evolution_message_id?: string | null
          expires_at?: string
          id?: string
          instance_id?: string | null
          phone_number?: string
          received_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_chat_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instance_groups: {
        Row: {
          created_at: string
          group_jid: string
          id: string
          instance_id: string
        }
        Insert: {
          created_at?: string
          group_jid: string
          id?: string
          instance_id: string
        }
        Update: {
          created_at?: string
          group_jid?: string
          id?: string
          instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instance_groups_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          cooldown_queue: Json
          cooldown_queue_index: number
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
          webhook_configured: boolean
        }
        Insert: {
          cooldown_queue?: Json
          cooldown_queue_index?: number
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
          webhook_configured?: boolean
        }
        Update: {
          cooldown_queue?: Json
          cooldown_queue_index?: number
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
          webhook_configured?: boolean
        }
        Relationships: []
      }
      whatsapp_proxies: {
        Row: {
          assigned_at: string | null
          created_at: string
          external_ip: string | null
          host: string
          id: string
          instance_id: string | null
          label: string
          last_error: string | null
          last_health_check_at: string | null
          password: string | null
          port: number
          protocol: string
          status: string
          updated_at: string
          username: string | null
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string
          external_ip?: string | null
          host: string
          id?: string
          instance_id?: string | null
          label: string
          last_error?: string | null
          last_health_check_at?: string | null
          password?: string | null
          port: number
          protocol?: string
          status?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          assigned_at?: string | null
          created_at?: string
          external_ip?: string | null
          host?: string
          id?: string
          instance_id?: string | null
          label?: string
          last_error?: string | null
          last_health_check_at?: string | null
          password?: string | null
          port?: number
          protocol?: string
          status?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_proxies_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_smart_links: {
        Row: {
          clicks: number
          created_at: string
          created_by: string | null
          group_invite_code: string
          group_name: string | null
          id: string
          is_active: boolean
          original_url: string
          plan_id: string | null
          redirect_type: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          group_invite_code: string
          group_name?: string | null
          id?: string
          is_active?: boolean
          original_url: string
          plan_id?: string | null
          redirect_type?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          group_invite_code?: string
          group_name?: string | null
          id?: string
          is_active?: boolean
          original_url?: string
          plan_id?: string | null
          redirect_type?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_smart_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_smart_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfis_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_smart_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_notificaveis_hoje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_smart_links_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      kirvano_webhook_logs_masked: {
        Row: {
          authorized_method: string | null
          checkout_id: string | null
          email_masked: string | null
          error: string | null
          event: string | null
          id: string | null
          payment_method: string | null
          phone_masked: string | null
          process_result: string | null
          processed: boolean | null
          purchase_type: string | null
          raw_payload_safe: Json | null
          received_at: string | null
          sale_id: string | null
          status: string | null
        }
        Insert: {
          authorized_method?: string | null
          checkout_id?: string | null
          email_masked?: never
          error?: string | null
          event?: string | null
          id?: string | null
          payment_method?: string | null
          phone_masked?: never
          process_result?: string | null
          processed?: boolean | null
          purchase_type?: string | null
          raw_payload_safe?: never
          received_at?: string | null
          sale_id?: string | null
          status?: string | null
        }
        Update: {
          authorized_method?: string | null
          checkout_id?: string | null
          email_masked?: never
          error?: string | null
          event?: string | null
          id?: string | null
          payment_method?: string | null
          phone_masked?: never
          process_result?: string | null
          processed?: boolean | null
          purchase_type?: string | null
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
      vw_custos_operacionais: {
        Row: {
          categoria: string | null
          data_custo: string | null
          descricao: string | null
          mes_ref: string | null
          origem: string | null
          origem_id: string | null
          periodo: string | null
          valor: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _email_queue_dedupe_window: { Args: { ts: string }; Returns: unknown }
      _message_queue_dedupe_window: {
        Args: { p_created_at: string }
        Returns: unknown
      }
      audit_webhook_access: { Args: never; Returns: undefined }
      check_referral_milestones: {
        Args: { p_referrer_id: string }
        Returns: undefined
      }
      claim_proxy_for_instance: {
        Args: { p_instance_id: string }
        Returns: Json
      }
      claim_referral_reward: { Args: { p_reward_id: string }; Returns: Json }
      count_array_overlap: {
        Args: { a: number[]; b: number[] }
        Returns: number
      }
      count_sequences: { Args: { arr: number[] }; Returns: number }
      find_user_by_contact: {
        Args: { p_celular?: string; p_email?: string }
        Returns: Json
      }
      generate_bolao_codigo: {
        Args: { p_mes_ano: string; p_sigla: string }
        Returns: string
      }
      generate_referral_code: { Args: never; Returns: string }
      generate_slug: { Args: { title: string }; Returns: string }
      get_group_blast_schedule: {
        Args: never
        Returns: {
          active: boolean
          jobid: number
          jobname: string
          last_ran_at: string
          next_run_at: string
          schedule: string
        }[]
      }
      get_lead_retargeting_schedule: {
        Args: never
        Returns: {
          active: boolean
          jobid: number
          jobname: string
          last_ran_at: string
          next_run_at: string
          schedule: string
        }[]
      }
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
      increment_smart_link_clicks: {
        Args: { p_slug: string }
        Returns: undefined
      }
      increment_unread_count: {
        Args: { p_phone_number: string }
        Returns: undefined
      }
      incrementar_uso_gerador: {
        Args: { p_max: number; p_user_id: string }
        Returns: number
      }
      incrementar_uso_gerador_estudo: {
        Args: { p_max: number; p_user_id: string }
        Returns: number
      }
      is_pix_already_paid: {
        Args: { p_after: string; p_phone: string }
        Returns: boolean
      }
      merge_user_attribution:
        | {
            Args: {
              p_mark_purchase?: boolean
              p_new_attr: Json
              p_purchase_at?: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_mark_purchase?: boolean
              p_new_attr: Json
              p_purchase_at?: string
              p_source?: string
              p_user_id: string
            }
            Returns: undefined
          }
      pick_template_variant: {
        Args: { p_template_id: string }
        Returns: string
      }
      queue_email_templates_for_event: {
        Args: {
          p_email: string
          p_event_trigger: string
          p_name: string
          p_priority?: number
          p_user_id: string
          p_variables?: Json
        }
        Returns: number
      }
      queue_templates_for_event: {
        Args: {
          p_event_trigger: string
          p_name: string
          p_phone: string
          p_priority?: number
          p_user_id: string
          p_variables?: Json
        }
        Returns: number
      }
      register_instance_usage: {
        Args: { p_instance_id: string }
        Returns: undefined
      }
      register_warming_usage: {
        Args: { p_instance_id: string }
        Returns: undefined
      }
      release_proxy_for_instance: {
        Args: { p_instance_id: string }
        Returns: Json
      }
      select_best_instance: {
        Args: never
        Returns: {
          evolution_instance_id: string
          instance_id: string
          phone_number: string
        }[]
      }
      select_best_instances:
        | {
            Args: { p_limit?: number }
            Returns: {
              evolution_instance_id: string
              instance_id: string
              phone_number: string
            }[]
          }
        | {
            Args: { p_group_jid?: string; p_limit?: number }
            Returns: {
              evolution_instance_id: string
              instance_id: string
              phone_number: string
            }[]
          }
      should_send_template:
        | {
            Args: { p_template_id: string; p_user_id: string }
            Returns: boolean
          }
        | {
            Args: {
              p_template_id: string
              p_user_id: string
              p_variables?: Json
            }
            Returns: boolean
          }
      verificar_existencia_usuario: {
        Args: { p_celular?: string; p_email?: string }
        Returns: Json
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
