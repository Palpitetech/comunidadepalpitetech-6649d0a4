import { Smartphone, FileText, Send, ScrollText, Flame, Users, Megaphone, MessageSquare, Link2, Target, Globe, Mail, Ban, Activity, ChevronDown, Check } from "lucide-react";
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
      { value: "mensagens", label: "Mensagens", icon: InboxIcon },
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

// Lucide doesn't have a direct "Inbox" in some versions, but we'll use Inbox icon
function InboxIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

interface CommunicationHeaderSelectorProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function CommunicationHeaderSelector({ activeTab, onTabChange }: CommunicationHeaderSelectorProps) {
  const currentItem = communicationSections
    .flatMap((s) => s.items)
    .find((i) => i.value === activeTab);

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
        {communicationSections.map((section, idx) => (
          <DropdownMenuGroup key={section.label}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {section.label === "Email Transacional" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
              {section.label}
            </DropdownMenuLabel>
            {section.items.map((item) => (
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
