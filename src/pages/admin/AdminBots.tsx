import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2, MessageSquare, FileText, Bot, User } from "lucide-react";
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

        {/* Grid de Bots */}
        <div className="grid gap-4 md:grid-cols-2">
          {bots.map((bot) => (
            <Card 
              key={bot.id} 
              className={`cursor-pointer hover:shadow-lg transition-shadow ${!bot.ativo ? "opacity-60" : ""}`}
              onClick={() => handleBotClick(bot)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={bot.perfis?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(bot.perfis?.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-senior-lg flex items-center gap-2">
                        {bot.badge_emoji} {bot.perfis?.nome || "Bot"}
                        {bot.perfis?.is_bot ? (
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                        {bot.is_roundtable_author && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                            Mesa Redonda
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{bot.cargo}</CardDescription>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={bot.ativo}
                      onCheckedChange={(checked) => toggleBotActive(bot.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline">{bot.especialidade}</Badge>
                  <Badge variant="outline">{bot.estilo_escrita}</Badge>
                  {bot.can_create_posts && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                      Cria Posts
                    </Badge>
                  )}
                  {bot.auto_reply_enabled && (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                      Auto-responde
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {bot.total_posts} posts
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {bot.total_comments} comentários
                  </span>
                </div>
                {bot.ultimo_post_em && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Último post: {new Date(bot.ultimo_post_em).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {bots.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum bot cadastrado. Clique em "Novo Bot" para começar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
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
