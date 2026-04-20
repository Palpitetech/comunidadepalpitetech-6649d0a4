import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, User } from "lucide-react";
import { BotProfileTab } from "./BotProfileTab";
import { BotPromptTab } from "./BotPromptTab";
import { BotAutomationTab } from "./BotAutomationTab";
import type { BotWithStats } from "@/types/bots";

interface BotDetailSheetProps {
  bot: BotWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBotUpdated: () => void;
}

export function BotDetailSheet({ bot, open, onOpenChange, onBotUpdated }: BotDetailSheetProps) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={bot.perfis?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(bot.perfis?.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-xl flex items-center gap-2">
                {bot.perfis?.nome || "Bot"}
                {bot.perfis?.is_bot ? (
                  <Bot className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </SheetTitle>
              <div className="flex flex-wrap gap-2 mt-1">
                {bot.ativo ? (
                  <Badge className="bg-green-500/10 text-green-600">Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
                {bot.is_result_author && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    🎯 Resultados
                  </Badge>
                )}
                {bot.is_strategy_author && (
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    📚 Estratégias
                  </Badge>
                )}
                {bot.is_sales_author && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                    💰 Vendas
                  </Badge>
                )}
                {bot.is_system_sales_author && (
                  <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                    🕕 Vendas 18h
                  </Badge>
                )}
                {!bot.perfis?.is_bot && (
                  <Badge variant="outline">Conta Humana</Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {!bot.perfis?.is_bot && (
          <Alert className="mt-4 border-primary/20 bg-primary/5">
            <User className="h-4 w-4" />
            <AlertDescription>
              Esta persona está vinculada a uma conta de usuário real. Posts podem ser 
              gerados automaticamente, mas a conta mantém acesso normal ao sistema.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="perfil" className="mt-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="prompt">Prompt IA</TabsTrigger>
            <TabsTrigger value="automacao">Automação</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="mt-4">
            <BotProfileTab bot={bot} onUpdated={onBotUpdated} />
          </TabsContent>

          <TabsContent value="prompt" className="mt-4">
            <BotPromptTab bot={bot} onUpdated={onBotUpdated} />
          </TabsContent>

          <TabsContent value="automacao" className="mt-4">
            <BotAutomationTab bot={bot} onUpdated={onBotUpdated} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
