import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Loader2, Bot } from "lucide-react";
import { useBots } from "@/hooks/useBots";
import { BotDetailSheet } from "@/components/admin/BotDetailSheet";
import { BotCategoryFolder } from "@/components/admin/BotCategoryFolder";
import type { BotWithStats } from "@/types/bots";

export default function AdminBots() {
  const { bots, loading, refetch, toggleBotActive } = useBots();

  const postingBots = bots.filter(b => b.can_create_posts);
  const chatOnlyBots = bots.filter(b => !b.can_create_posts && b.chat_enabled);
  const [selectedBot, setSelectedBot] = useState<BotWithStats | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleBotClick = (bot: BotWithStats) => {
    setSelectedBot(bot);
    setSheetOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-senior py-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-senior-2xl font-bold flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            Gestão de Bots
          </h1>
          <p className="text-muted-foreground">
            Gerencie os especialistas virtuais da comunidade
          </p>
        </div>

        <BotCategoryFolder
          title="Especialistas para Postagens"
          bots={postingBots}
          onBotClick={handleBotClick}
          onToggleActive={toggleBotActive}
          defaultOpen={true}
        />

        <BotCategoryFolder
          title="Especialistas para Chat"
          bots={chatOnlyBots}
          onBotClick={handleBotClick}
          onToggleActive={toggleBotActive}
          defaultOpen={true}
        />
      </div>

      {selectedBot && (
        <BotDetailSheet
          bot={selectedBot}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onBotUpdated={refetch}
        />
      )}
    </AdminLayout>
  );
}
