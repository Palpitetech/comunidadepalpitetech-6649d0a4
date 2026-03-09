import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, ShoppingCart, Trophy, Gift, Check, Loader2 } from "lucide-react";

interface Reward {
  id: string;
  milestone_type: string;
  milestone_count: number;
  days_granted: number;
  created_at: string;
  claimed_at: string | null;
}

interface MilestoneProgressProps {
  totalConvidados: number;
  totalVendas: number;
  progressCadastros: number;
  progressVendas: number;
  totalDaysEarned: number;
  totalDaysClaimed: number;
  unclaimedRewards: Reward[];
  isClaiming: boolean;
  onClaimReward: (rewardId: string) => void;
}

export const MilestoneProgress: React.FC<MilestoneProgressProps> = ({
  totalConvidados,
  totalVendas,
  progressCadastros,
  progressVendas,
  totalDaysEarned,
  totalDaysClaimed,
  unclaimedRewards,
  isClaiming,
  onClaimReward,
}) => {
  const cadastroPercent = (progressCadastros / 50) * 100;
  const vendaPercent = (progressVendas / 10) * 100;

  const getMilestoneLabel = (type: string, count: number) => {
    if (type === "cadastros") {
      return `${count} cadastros`;
    }
    return `${count} vendas`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Suas metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Unclaimed rewards */}
        {unclaimedRewards.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Recompensas disponíveis para reinvindicar
            </p>
            {unclaimedRewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3"
              >
                <div>
                  <p className="font-medium text-sm">
                    🎉 {reward.days_granted} dias grátis
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Meta atingida: {getMilestoneLabel(reward.milestone_type, reward.milestone_count)}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onClaimReward(reward.id)}
                  disabled={isClaiming}
                >
                  {isClaiming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-1" />
                      Reinvindicar
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

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
                {totalDaysClaimed > 0 ? (
                  <>
                    <Check className="inline h-4 w-4 mr-1 text-green-500" />
                    {totalDaysClaimed} dias reinvindicados
                  </>
                ) : (
                  `${totalDaysEarned} dias disponíveis`
                )}
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
