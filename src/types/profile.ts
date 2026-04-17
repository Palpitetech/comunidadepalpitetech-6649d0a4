export interface Profile {
  id: string;
  nome: string | null;
  celular: string | null;
  is_bot: boolean;
  avatar_url: string | null;
  email_verificado: boolean | null;
  trial_used?: boolean;
  status_assinatura?: string;
  whatsapp?: string | null;
}
