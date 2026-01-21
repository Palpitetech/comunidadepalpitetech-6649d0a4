import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIAS_SEMANA, type BotSchedule } from "@/types/bots";

interface BotScheduleData {
  id: string;
  nome: string;
  badge_emoji: string;
  schedule: BotSchedule;
  ativo: boolean;
}

interface ScheduleSlot {
  botId: string;
  nome: string;
  emoji: string;
  horario: string;
}

// Hours to show on calendar (06:00 to 23:00)
const HOURS = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  return `${hour.toString().padStart(2, "0")}:00`;
});

export function WeeklyBotCalendar() {
  const [bots, setBots] = useState<BotScheduleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllBotSchedules() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("guide_personas")
          .select("id, badge_emoji, post_schedule, ativo, perfis(nome)")
          .eq("can_create_posts", true);

        if (error) throw error;

        const mapped: BotScheduleData[] = (data || []).map((bot) => {
          const rawSchedule = bot.post_schedule as { horarios?: string[]; dias?: number[] } | null;
          return {
            id: bot.id,
            nome: (bot.perfis as { nome: string } | null)?.nome || "Bot",
            badge_emoji: bot.badge_emoji || "🤖",
            schedule: {
              horarios: rawSchedule?.horarios || [],
              dias: rawSchedule?.dias || [],
            },
            ativo: bot.ativo,
          };
        });

        setBots(mapped);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllBotSchedules();
  }, []);

  // Build schedule map: day -> hour -> bots
  const buildScheduleMap = () => {
    const map: Record<number, Record<string, ScheduleSlot[]>> = {};

    // Initialize all days
    DIAS_SEMANA.forEach((dia) => {
      map[dia.value] = {};
      HOURS.forEach((hour) => {
        map[dia.value][hour] = [];
      });
    });

    // Fill with bot schedules
    bots.forEach((bot) => {
      if (!bot.ativo || !bot.schedule?.dias || !bot.schedule?.horarios) return;

      bot.schedule.dias.forEach((dia) => {
        bot.schedule.horarios.forEach((horario) => {
          // Round to nearest hour for display
          const hour = horario.split(":")[0] + ":00";
          if (map[dia] && map[dia][hour]) {
            map[dia][hour].push({
              botId: bot.id,
              nome: bot.nome,
              emoji: bot.badge_emoji,
              horario: horario,
            });
          }
        });
      });
    });

    return map;
  };

  const scheduleMap = buildScheduleMap();

  // Get color for bot (consistent based on name)
  const getBotColor = (nome: string) => {
    const colors = [
      "bg-blue-500/20 text-blue-700 border-blue-500/30",
      "bg-green-500/20 text-green-700 border-green-500/30",
      "bg-purple-500/20 text-purple-700 border-purple-500/30",
      "bg-amber-500/20 text-amber-700 border-amber-500/30",
      "bg-rose-500/20 text-rose-700 border-rose-500/30",
      "bg-cyan-500/20 text-cyan-700 border-cyan-500/30",
    ];
    const index = nome.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum bot com postagem automática</p>
      </div>
    );
  }

  // Filter hours that have at least one post
  const activeHours = HOURS.filter((hour) =>
    DIAS_SEMANA.some((dia) => scheduleMap[dia.value][hour]?.length > 0)
  );

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {bots
          .filter((b) => b.ativo)
          .map((bot) => (
            <div
              key={bot.id}
              className={cn(
                "px-2 py-1 rounded-md border text-xs font-medium flex items-center gap-1",
                getBotColor(bot.nome)
              )}
            >
              <span>{bot.badge_emoji}</span>
              <span>{bot.nome}</span>
            </div>
          ))}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header - Days */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="text-xs font-medium text-muted-foreground p-2">
              Horário
            </div>
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia.value}
                className="text-xs font-medium text-center p-2 bg-muted/50 rounded-md"
              >
                {dia.label}
              </div>
            ))}
          </div>

          {/* Body - Hours x Days */}
          <div className="space-y-1">
            {activeHours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 gap-1">
                {/* Hour label */}
                <div className="text-xs text-muted-foreground p-2 flex items-center">
                  {hour}
                </div>

                {/* Day cells */}
                {DIAS_SEMANA.map((dia) => {
                  const slots = scheduleMap[dia.value][hour] || [];
                  return (
                    <div
                      key={dia.value}
                      className={cn(
                        "min-h-[40px] rounded-md p-1 flex flex-wrap gap-1 items-start",
                        slots.length > 0 ? "bg-muted/30" : "bg-muted/10"
                      )}
                    >
                      {slots.map((slot, idx) => (
                        <div
                          key={`${slot.botId}-${idx}`}
                          className={cn(
                            "px-1.5 py-0.5 rounded border text-[10px] font-medium flex items-center gap-0.5",
                            getBotColor(slot.nome)
                          )}
                          title={`${slot.nome} às ${slot.horario}`}
                        >
                          <span>{slot.emoji}</span>
                          <span className="hidden sm:inline truncate max-w-[50px]">
                            {slot.horario}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {activeHours.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum horário de postagem configurado
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="text-xs text-muted-foreground text-center">
        {bots.filter((b) => b.ativo).length} bots ativos •{" "}
        {bots.reduce(
          (acc, bot) =>
            acc +
            (bot.ativo
              ? (bot.schedule?.dias?.length || 0) *
                (bot.schedule?.horarios?.length || 0)
              : 0),
          0
        )}{" "}
        posts/semana
      </div>
    </div>
  );
}
