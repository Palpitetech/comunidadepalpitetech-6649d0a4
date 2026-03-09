import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2, Gift, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConviteCardProps {
  referralCode: string | null;
  isGenerating: boolean;
  onGenerateCode: () => Promise<void>;
}

export const ConviteCard: React.FC<ConviteCardProps> = ({
  referralCode,
  isGenerating,
  onGenerateCode,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : "";

  const handleCopy = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "Compartilhe com seus amigos.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Junte-se à Comunidade Palpite Tech!",
          text: "Estou usando a Comunidade Palpite Tech para analisar loterias. Crie sua conta usando meu convite!",
          url: referralLink,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  if (!referralCode) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
          <Gift className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-semibold mb-1">Gere seu código de convite</h3>
            <p className="text-sm text-muted-foreground">
              Convide amigos e acompanhe quantas pessoas se cadastraram.
            </p>
          </div>
          <Button onClick={onGenerateCode} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Gerar meu código
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary" />
          Seu link de convite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={referralLink}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleCopy} variant="outline" className="flex-1">
            <Copy className="mr-2 h-4 w-4" />
            Copiar link
          </Button>
          <Button onClick={handleShare} className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Seu código: <span className="font-mono font-bold">{referralCode}</span>
        </p>
      </CardContent>
    </Card>
  );
};
