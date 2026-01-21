import type { StatusAssinatura } from "@/types/plans";

export const STATUS_CONFIG: Record<
  StatusAssinatura,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ativa: { label: "Ativa", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
  inadimplente: { label: "Inadimplente", variant: "secondary" },
  inativa: { label: "Sem assinatura", variant: "outline" },
};
