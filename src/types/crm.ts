export type LeadStatus = "novo" | "contatado" | "atendimento" | "convertido" | "descartado";

export interface LeadStatusConfig {
  key: LeadStatus;
  label: string;
  className: string;
}

export const LEAD_STATUS_OPTIONS: LeadStatusConfig[] = [
  { 
    key: "novo", 
    label: "Novo", 
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" 
  },
  { 
    key: "atendimento", 
    label: "Em Atendimento", 
    className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30" 
  },
  { 
    key: "contatado", 
    label: "Contatado", 
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" 
  },
  { 
    key: "convertido", 
    label: "Convertido", 
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" 
  },
  { 
    key: "descartado", 
    label: "Descartado", 
    className: "bg-muted text-muted-foreground border-border" 
  },
];

export function getLeadStatusConfig(status: string | null | undefined): LeadStatusConfig {
  const s = (status || "novo") as LeadStatus;
  return LEAD_STATUS_OPTIONS.find((opt) => opt.key === s) || LEAD_STATUS_OPTIONS[0];
}
