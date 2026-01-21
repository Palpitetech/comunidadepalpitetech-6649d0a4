import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Plus, X } from "lucide-react";
import { DIAS_SEMANA } from "@/types/bots";
import type { BotWithStats, BotSchedule } from "@/types/bots";

interface BotAutomationTabProps {
  bot: BotWithStats;
  onUpdated: () => void;
}

export function BotAutomationTab({ bot, onUpdated }: BotAutomationTabProps) {
  const [loading, setLoading] = useState(false);
  const [autoReply, setAutoReply] = useState(bot.auto_reply_enabled);
  const [frequencia, setFrequencia] = useState(bot.frequencia_posts);
  const [schedule, setSchedule] = useState<BotSchedule>(bot.post_schedule);
  const [newHorario, setNewHorario] = useState("");

  const toggleDia = (dia: number) => {
    setSchedule((prev) => ({
      ...prev,
      dias: prev.dias.includes(dia)
        ? prev.dias.filter((d) => d !== dia)
        : [...prev.dias, dia].sort((a, b) => a - b),
    }));
  };

  const addHorario = () => {
    if (!newHorario || schedule.horarios.includes(newHorario)) return;

    setSchedule((prev) => ({
      ...prev,
      horarios: [...prev.horarios, newHorario].sort(),
    }));
    setNewHorario("");
  };

  const removeHorario = (horario: string) => {
    setSchedule((prev) => ({
      ...prev,
      horarios: prev.horarios.filter((h) => h !== horario),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("guide_personas")
        .update({
          auto_reply_enabled: autoReply,
          frequencia_posts: frequencia,
          post_schedule: JSON.parse(JSON.stringify(schedule)),
        })
        .eq("id", bot.id);

      if (error) throw error;

      toast.success("Automação atualizada com sucesso");
      onUpdated();
    } catch (err) {
      console.error("Erro ao atualizar automação:", err);
      toast.error("Erro ao atualizar automação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-resposta */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <Label className="text-base">Responder Comentários Automaticamente</Label>
          <p className="text-sm text-muted-foreground">
            Bot responde automaticamente a comentários de usuários
          </p>
        </div>
        <Switch checked={autoReply} onCheckedChange={setAutoReply} />
      </div>

      {/* Frequência */}
      <div className="space-y-2">
        <Label htmlFor="frequencia">Frequência de Posts (por dia)</Label>
        <Input
          id="frequencia"
          type="number"
          value={frequencia}
          onChange={(e) => setFrequencia(parseInt(e.target.value) || 1)}
          min={0}
          max={10}
          className="w-32"
        />
        <p className="text-xs text-muted-foreground">
          Máximo de posts automáticos por dia
        </p>
      </div>

      {/* Dias da Semana */}
      <div className="space-y-3">
        <Label>Dias de Postagem</Label>
        <div className="flex flex-wrap gap-2">
          {DIAS_SEMANA.map((dia) => (
            <Button
              key={dia.value}
              type="button"
              variant={schedule.dias.includes(dia.value) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleDia(dia.value)}
            >
              {dia.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {schedule.dias.length === 0
            ? "Nenhum dia selecionado"
            : `Selecionados: ${schedule.dias.map((d) => DIAS_SEMANA[d].label).join(", ")}`}
        </p>
      </div>

      {/* Horários */}
      <div className="space-y-3">
        <Label>Horários de Postagem</Label>
        <div className="flex gap-2">
          <Input
            type="time"
            value={newHorario}
            onChange={(e) => setNewHorario(e.target.value)}
            className="w-32"
          />
          <Button type="button" variant="outline" size="icon" onClick={addHorario}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {schedule.horarios.map((horario) => (
            <Badge key={horario} variant="secondary" className="gap-1 pr-1">
              {horario}
              <button
                type="button"
                onClick={() => removeHorario(horario)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {schedule.horarios.length === 0 && (
            <span className="text-sm text-muted-foreground">Nenhum horário configurado</span>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium mb-2">Resumo da Automação:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • Auto-resposta: <strong>{autoReply ? "Ativada" : "Desativada"}</strong>
          </li>
          <li>
            • Máximo de posts: <strong>{frequencia}/dia</strong>
          </li>
          <li>
            • Dias ativos: <strong>{schedule.dias.length || "Nenhum"}</strong>
          </li>
          <li>
            • Horários: <strong>{schedule.horarios.length || "Nenhum"}</strong>
          </li>
        </ul>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar Automação
      </Button>
    </form>
  );
}
