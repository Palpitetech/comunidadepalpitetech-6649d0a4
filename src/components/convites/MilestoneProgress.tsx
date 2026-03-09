import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, ShoppingCart, Trophy, Gift } from "lucide-react";

interface MilestoneProgressProps {
  totalConvidados: number;
  totalVendas: number;
  progressCadastros: number;
  progressVendas: number;
  totalDaysEarned: number;
}

export const MilestoneProgress: React.FC<MilestoneProgressProps> = ({
  totalConvidados,
  totalVendas,
  progressCadastros,
  progressVendas,
  totalDaysEarned,
}) => {
  const cadastroPercent = (progressCadastros / 50) * 100;
  const vendaPercent = (progressVendas / 10) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Suas metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cadastros milestone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Cadastros
            </span>
            <span className="text-muted-foreground">
              {progressCadastros}/50
            </span>
          </div>
          <Progress value={cadastroPercent} className="h-3" />
          <p className="text-xs text-muted-foreground">
            A cada 50 pessoas cadastradas = <span className="font-semibold text-primary">1 mês grátis</span>
          </p>
        </div>

        {/* Vendas milestone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              Vendas
            </span>
            <span className="text-muted-foreground">
              {progressVendas}/10
            </span>
          </div>
          <Progress value={vendaPercent} className="h-3" />
          <p className="text-xs text-muted-foreground">
            A cada 10 vendas de assinatura = <span className="font-semibold text-primary">1 mês grátis</span>
          </p>
        </div>

        {/* Summary */}
        {totalDaysEarned > 0 && (
          <div className="rounded-lg bg-primary/10 p-3 flex items-center gap-3">
            <Gift className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">
                Você já ganhou {totalDaysEarned} dias grátis!
              </p>
              <p className="text-xs text-muted-foreground">
                Total: {totalConvidados} cadastros, {totalVendas} vendas
              </p>
            </div>
          </div>
        )}

        {totalDaysEarned === 0 && (
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-sm text-muted-foreground">
              Total: {totalConvidados} cadastros, {totalVendas} vendas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
