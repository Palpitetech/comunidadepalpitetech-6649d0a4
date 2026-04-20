import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Bot, User } from "lucide-react";
import type { BotWithStats } from "@/types/bots";

interface BotCategoryFolderProps {
  title: string;
  icon?: React.ReactNode;
  bots: BotWithStats[];
  onBotClick: (bot: BotWithStats) => void;
  onToggleActive: (botId: string, active: boolean) => void;
  defaultOpen?: boolean;
}

export function BotCategoryFolder({
  title,
  icon,
  bots,
  onBotClick,
  onToggleActive,
  defaultOpen = true,
}: BotCategoryFolderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getInitials = (nome: string | null) => {
    if (!nome) return "B";
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b">
            {isOpen ? (
              <FolderOpen className="h-5 w-5 text-primary" />
            ) : (
              <Folder className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="flex items-center gap-2 flex-1">
              {icon}
              <h2 className="font-semibold">{title}</h2>
              <Badge variant="secondary" className="ml-1">
                {bots.length}
              </Badge>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-0">
            {bots.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum bot nesta categoria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Bot</TableHead>
                    <TableHead className="hidden sm:table-cell">Recursos</TableHead>
                    <TableHead className="w-[80px] text-center">Ativo</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bots.map((bot) => (
                    <TableRow
                      key={bot.id}
                      className={`cursor-pointer hover:bg-muted/50 ${!bot.ativo ? "opacity-60" : ""}`}
                      onClick={() => onBotClick(bot)}
                    >
                      {/* Bot Info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={bot.perfis?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(bot.perfis?.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium truncate">
                                {bot.perfis?.nome || "Bot"}
                              </span>
                              {bot.perfis?.is_bot ? (
                                <Bot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              ) : (
                                <User className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                              {bot.is_result_author && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  🎯 Resultados
                                </Badge>
                              )}
                              {bot.is_strategy_author && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                                  📚 Estratégia
                                </Badge>
                              )}
                              {bot.is_sales_author && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-accent/50 text-accent-foreground">
                                  💰 Vendas
                                </Badge>
                              )}
                              {bot.is_system_sales_author && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground">
                                  🕕 Vendas 18h
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Features */}
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {bot.can_create_posts && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Posts
                            </Badge>
                          )}
                          {bot.auto_reply_enabled && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Auto-reply
                            </Badge>
                          )}
                          {bot.chat_enabled && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Chat
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Toggle */}
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={bot.ativo}
                          onCheckedChange={(checked) => onToggleActive(bot.id, checked)}
                        />
                      </TableCell>

                      {/* Arrow */}
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
