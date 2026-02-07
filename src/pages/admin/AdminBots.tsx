import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, MessageSquare, FileText, Bot, User, ChevronRight } from "lucide-react";
import { useBots } from "@/hooks/useBots";
import { BotDetailSheet } from "@/components/admin/BotDetailSheet";
import { BotForm } from "@/components/admin/BotForm";
import { BotPostTrigger } from "@/components/admin/BotPostTrigger";
import type { BotWithStats } from "@/types/bots";

export default function AdminBots() {
  const { bots, loading, refetch, toggleBotActive } = useBots();
  const [selectedBot, setSelectedBot] = useState<BotWithStats | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newBotDialogOpen, setNewBotDialogOpen] = useState(false);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);

  const getInitials = (nome: string | null) => {
    if (!nome) return "B";
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleBotClick = (bot: BotWithStats) => {
    setSelectedBot(bot);
    setSheetOpen(true);
  };

  const handleBotSaved = () => {
    setNewBotDialogOpen(false);
    refetch();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-senior py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-senior-2xl font-bold flex items-center gap-2">
              <Bot className="h-7 w-7 text-primary" />
              Gestão de Bots
            </h1>
            <p className="text-muted-foreground">
              Gerencie os especialistas virtuais da comunidade
            </p>
          </div>
          <div className="flex gap-2">
            {/* Disparo Manual */}
            <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Disparar Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Disparar Post Manual</DialogTitle>
                </DialogHeader>
                <BotPostTrigger 
                  bots={bots} 
                  onSuccess={() => setTriggerDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>

            {/* Novo Bot */}
            <Dialog open={newBotDialogOpen} onOpenChange={setNewBotDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Bot
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Bot</DialogTitle>
                </DialogHeader>
                <BotForm onSaved={handleBotSaved} onCancel={() => setNewBotDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Lista de Bots */}
        <Card>
          <CardContent className="p-0">
            {bots.length === 0 ? (
              <div className="py-12 text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum bot cadastrado. Clique em "Novo Bot" para começar.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Bot</TableHead>
                    <TableHead className="hidden md:table-cell">Estatísticas</TableHead>
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
                      onClick={() => handleBotClick(bot)}
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
                                {bot.badge_emoji} {bot.perfis?.nome || "Bot"}
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
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600">
                                  📚 Estratégia
                                </Badge>
                              )}
                              {bot.is_free_tips_author && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600">
                                  🎁 Palpites
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Stats */}
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {bot.total_posts}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {bot.total_comments}
                          </span>
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
                          onCheckedChange={(checked) => toggleBotActive(bot.id, checked)}
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
        </Card>
      </div>

      {/* Detail Sheet */}
      {selectedBot && (
        <BotDetailSheet
          bot={selectedBot}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onBotUpdated={refetch}
        />
      )}
    </MainLayout>
  );
}