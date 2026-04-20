export interface MessageTemplateVariant {
  id: string;
  template_id: string;
  content: string;
  position: number;
  is_active: boolean;
  times_used: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}
