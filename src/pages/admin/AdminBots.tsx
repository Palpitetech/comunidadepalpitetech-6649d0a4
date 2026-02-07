import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, MessageSquare, Bot } from "lucide-react";
import { useBots } from "@/hooks/useBots";
import { BotDetailSheet } from "@/components/admin/BotDetailSheet";
import { BotForm } from "@/components/admin/BotForm";
import { BotPostTrigger } from "@/components/admin/BotPostTrigger";
import { BotCategoryFolder } from "@/components/admin/BotCategoryFolder";
import type { BotWithStats } from "@/types/bots";

export default function AdminBots() {
  const { bots, loading, refetch, toggleBotActive } = useBots();
  const [selectedBot, setSelectedBot] = useState<BotWithStats | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newBotDialogOpen, setNewBotDialogOpen] = useState(false);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);

  const handleBotClick = (bot: BotWithStats) => {
    setSelectedBot(bot);
    setSheetOpen(true);
  };

  const handleBotSaved = async (botId: string) => {
    setNewBotDialogOpen(false);
    
    // Refetch and find the newly created bot
    const updatedBots = await refetch();
    const createdBot = updatedBots.find((b) => b.id === botId);
    if (createdBot) {
      setSelectedBot(createdBot);
      setSheetOpen(true);
    }
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

        {/* Pasta: Especialistas para Postagens */}
        <BotCategoryFolder
          title="Especialistas para Postagens"
          bots={bots}
          onBotClick={handleBotClick}
          onToggleActive={toggleBotActive}
          defaultOpen={true}
        />
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