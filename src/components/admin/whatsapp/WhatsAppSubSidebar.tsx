import { Smartphone, FileText, Send, ScrollText, Flame, Users, Megaphone, MessageSquare, Link2, Target, Inbox, Globe, Mail, Ban, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    label: "Conexão",
    items: [
      { value: "instancias", label: "Instâncias", icon: Smartphone },
      { value: "proxies", label: "Proxies", icon: Globe },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { value: "templates", label: "Templates", icon: FileText },
      { value: "smart-links", label: "Smart Links", icon: Link2 },
      { value: "mensagens", label: "Histórico", icon: Inbox },
    ],
  },
  {
    label: "Envio & Grupos",
    items: [
      { value: "fila", label: "Fila de Envio", icon: Send },
      { value: "disparo", label: "Disparo Manual", icon: Megaphone },
      { value: "grupos", label: "Gestão Grupos", icon: Users },
      { value: "disparo-grupo", label: "Disparo Grupo", icon: Send },
      { value: "monitor-grupos", label: "Monitor Grupos", icon: Activity },
    ],
  },
  {
    label: "Automações",
    items: [
      { value: "retargeting", label: "Automações CRM", icon: Target },
      { value: "aquecimento", label: "Aquecimento", icon: Flame },
      { value: "logs", label: "Logs Gerais", icon: ScrollText },
    ],
  },
  {
    label: "Email",
    items: [
      { value: "email-templates", label: "Templates", icon: FileText },
      { value: "email-fila", label: "Fila", icon: Send },
      { value: "email-suppressions", label: "Bloqueios", icon: Ban },
      { value: "email-logs", label: "Logs", icon: ScrollText },
    ],
  },
] as const;

const allItems = sections.flatMap((s) => s.items.map((i) => ({ ...i })));

interface WhatsAppSubSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function WhatsAppSubSidebar({ activeTab, onTabChange }: WhatsAppSubSidebarProps) {
  return (
    <nav className="w-[200px] shrink-0 border-r border-border bg-card/40 hidden md:flex md:flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Comunicação</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => (
          <div key={section.label} className="mb-3">
            <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
              {section.label === "Email" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
              {section.label}
            </div>
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => (
                <li key={item.value}>
                  <button
                    onClick={() => onTabChange(item.value)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                      activeTab === item.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

export { allItems as whatsappTabs };
