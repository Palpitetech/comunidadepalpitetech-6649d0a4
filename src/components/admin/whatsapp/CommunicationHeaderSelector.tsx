import { Smartphone, FileText, Send, ScrollText, Flame, Users, Megaphone, MessageSquare, Link2, Target, Globe, Mail, Ban, Activity, ChevronDown, Check, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const communicationSections = [
  {
    label: "WhatsApp",
    items: [
      { value: "instancias", label: "Instâncias", icon: Smartphone },
      { value: "proxies", label: "Proxies", icon: Globe },
      { value: "templates", label: "Templates", icon: FileText },
      { value: "fila", label: "Fila", icon: Send },
      { value: "mensagens", label: "Mensagens", icon: Inbox },
      { value: "disparo", label: "Disparo Manual", icon: Megaphone },
      { value: "logs", label: "Logs", icon: ScrollText },
      { value: "retargeting", label: "Retargeting", icon: Target },
      { value: "disparo-grupo", label: "Disparo Grupo", icon: Send },
      { value: "monitor-grupos", label: "Monitor Grupos", icon: Activity },
      { value: "aquecimento", label: "Aquecimento", icon: Flame },
      { value: "grupos", label: "Grupos", icon: Users },
      { value: "smart-links", label: "Smart Links", icon: Link2 },
    ],
  },
  {
    label: "Email Transacional",
    items: [
      { value: "email-templates", label: "Templates Email", icon: FileText },
      { value: "email-fila", label: "Fila Email", icon: Send },
      { value: "email-disparo", label: "Disparo Email", icon: Megaphone },
      { value: "email-logs", label: "Logs Email", icon: ScrollText },
      { value: "email-suppressions", label: "Bloqueados", icon: Ban },
    ],
  },
] as const;

interface CommunicationHeaderSelectorProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function CommunicationHeaderSelector({ activeTab, onTabChange }: CommunicationHeaderSelectorProps) {
  const currentItem = (communicationSections as any)
    .flatMap((s: any) => s.items)
    .find((i: any) => i.value === activeTab);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition-colors outline-none group border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
          <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10 text-primary">
            {currentItem ? <currentItem.icon className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
          </div>
          <span className="text-sm font-semibold whitespace-nowrap">
            {currentItem ? currentItem.label : "Comunicação"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1">
        {communicationSections.map((section: any, idx) => (
          <DropdownMenuGroup key={section.label}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {section.label === "Email Transacional" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
              {section.label}
            </DropdownMenuLabel>
            {section.items.map((item: any) => (
              <DropdownMenuItem
                key={item.value}
                onClick={() => onTabChange(item.value)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer transition-colors",
                  activeTab === item.value ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-sm",
                  activeTab === item.value ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                </div>
                <span className="flex-1 text-[13px]">{item.label}</span>
                {activeTab === item.value && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
