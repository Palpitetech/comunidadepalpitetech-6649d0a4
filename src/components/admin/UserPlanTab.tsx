import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard, Calendar, Copy, ExternalLink, Clock, User } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ExtendedProfile, Plan, StatusAssinatura } from "@/types/plans";

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

interface UserPlanTabProps {
  user: UserWithPlan;
  plans: Plan[];
  onUserUpdated: () => void;
}

const STATUS_CONFIG: Record<StatusAssinatura, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  ativa: { label: "Ativa", variant: "default", className: "bg-emerald-600 hover:bg-emerald-700" },
  cancelada: { label: "Cancelada", variant: "destructive" },
  inadimplente: { label: "Inadimplente", variant: "secondary", className: "bg-amber-500 hover:bg-amber-600 text-white" },
  inativa: { label: "Sem assinatura", variant: "outline" },
};

export function UserPlanTab({ user, plans, onUserUpdated }: UserPlanTabProps) {
  const [saving, setSaving] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(user.plan_id || "");
  const [validadeManual, setValidadeManual] = useState(
    user.validade_assinatura ? format(new Date(user.validade_assinatura), "yyyy-MM-dd") : ""
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: Record<string, any> = { 
        plan_id: selectedPlanId || null 
      };
      
      // Só atualiza validade se foi alterada
      if (validadeManual) {
        updateData.validade_assinatura = new Date(validadeManual).toISOString();
      }

      const { error } = await supabase
        .from("perfis")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Alterações salvas");
      onUserUpdated();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const statusAssinatura = (user.status_assinatura || "inativa") as StatusAssinatura;
  const statusConfig = STATUS_CONFIG[statusAssinatura];
  
  const diasRestantes = user.validade_assinatura 
    ? differenceInDays(new Date(user.validade_assinatura), new Date())
    : null;

  const hasChanges = selectedPlanId !== user.plan_id || 
    (validadeManual && validadeManual !== (user.validade_assinatura ? format(new Date(user.validade_assinatura), "yyyy-MM-dd") : ""));

  return (
    <div className="space-y-6">
      {/* Seção 1: Plano Atual */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Plano Atual</h3>
        </div>
        
        <div className="space-y-2">
          <Label>Selecionar Plano</Label>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um plano" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} - R$ {plan.price.toFixed(2).replace(".", ",")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPlan && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{selectedPlan.name}</span>
              <Badge variant="secondary">
                R$ {selectedPlan.price.toFixed(2).replace(".", ",")}/mês
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {Object.values(selectedPlan.features).filter(Boolean).length} recursos incluídos
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Seção 2: Status da Assinatura */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Status da Assinatura</h3>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">Estado atual da assinatura</p>
              </div>
            </div>
            <Badge variant={statusConfig.variant} className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Validade</p>
                {user.validade_assinatura ? (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(user.validade_assinatura), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Não definida</p>
                )}
              </div>
            </div>
            {diasRestantes !== null && (
              <Badge 
                variant={diasRestantes > 7 ? "outline" : diasRestantes > 0 ? "secondary" : "destructive"}
                className={diasRestantes > 7 ? "text-emerald-600 border-emerald-600" : ""}
              >
                {diasRestantes > 0 
                  ? `${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`
                  : diasRestantes === 0 
                    ? "Expira hoje"
                    : `Expirou há ${Math.abs(diasRestantes)} dia${Math.abs(diasRestantes) !== 1 ? 's' : ''}`
                }
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Seção 3: Dados Asaas */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Integração Asaas</h3>
        </div>

        <div className="space-y-3">
          {user.asaas_customer_id ? (
            <>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground">Customer ID</p>
                  <p className="text-sm font-mono">{user.asaas_customer_id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(user.asaas_customer_id!, "Customer ID")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {user.asaas_subscription_id && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground">Subscription ID</p>
                    <p className="text-sm font-mono">{user.asaas_subscription_id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(user.asaas_subscription_id!, "Subscription ID")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {user.cpf && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground">CPF</p>
                    <p className="text-sm font-mono">{user.cpf}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(user.cpf!, "CPF")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(`https://www.asaas.com/customerAccount/show/${user.asaas_customer_id}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver no Painel Asaas
              </Button>
            </>
          ) : (
            <div className="p-4 border rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma integração Asaas vinculada a este usuário.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O vínculo será criado automaticamente ao processar o primeiro pagamento.
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Seção 4: Ações Manuais */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Ações Manuais</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="validade-manual">Estender Validade (Cortesia)</Label>
          <Input
            id="validade-manual"
            type="date"
            value={validadeManual}
            onChange={(e) => setValidadeManual(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Defina uma data para conceder acesso manual sem passar pelo Asaas.
          </p>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className="w-full"
      >
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Salvar Alterações
      </Button>
    </div>
  );
}
