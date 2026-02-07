import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Ticket, MessageCircle, Clock, TrendingUp } from "lucide-react";

// Dados simulados para demonstração
const boloesSimulados = [
  {
    id: 1,
    nome: "Bolão Quentes do Mês",
    descricao: "Estratégia baseada nas 10 dezenas mais sorteadas nos últimos 30 concursos. Foco em números quentes!",
    cotasTotal: 20,
    cotasVendidas: 17,
    valorCota: 15.00,
    concurso: 3245,
    qtdPalpites: 8,
    qtdDezenas: 16,
  },
  {
    id: 2,
    nome: "Bolão Moldura Premiada",
    descricao: "Combinação estratégica priorizando dezenas da moldura externa do volante. Alta frequência histórica.",
    cotasTotal: 15,
    cotasVendidas: 12,
    valorCota: 20.00,
    concurso: 3245,
    qtdPalpites: 5,
    qtdDezenas: 17,
  },
  {
    id: 3,
    nome: "Bolão Equilibrado",
    descricao: "Mix perfeito: 8 pares, 7 ímpares, 5 primos e 8 dezenas de moldura. Baseado em estatísticas vencedoras.",
    cotasTotal: 25,
    cotasVendidas: 22,
    valorCota: 12.00,
    concurso: 3245,
    qtdPalpites: 10,
    qtdDezenas: 15,
  },
  {
    id: 4,
    nome: "Bolão Repetidas",
    descricao: "Foco em dezenas que se repetiram nos últimos 3 sorteios. Tendência forte de continuidade!",
    cotasTotal: 10,
    cotasVendidas: 8,
    valorCota: 25.00,
    concurso: 3245,
    qtdPalpites: 6,
    qtdDezenas: 18,
  },
];

const Boloes = () => {
  const isMobile = useIsMobile();
  const handleComprar = (bolao: typeof boloesSimulados[0]) => {
    const mensagem = encodeURIComponent(
      `Olá! Tenho interesse no *${bolao.nome}* para o concurso ${bolao.concurso}. Valor da cota: R$ ${bolao.valorCota.toFixed(2)}`
    );
    window.open(`https://wa.me/5511999999999?text=${mensagem}`, "_blank");
  };

  return (
    <MainLayout>
      {isMobile && <PageHeader title="Bolões" />}
      <div className="container-senior pt-4 pb-8">
        {/* Header - Desktop only */}
        {!isMobile && (
          <div className="flex items-center gap-3 mb-6">
            <Ticket className="h-7 w-7 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Bolões
            </h1>
          </div>
        )}

        {/* Banner informativo */}
        <Card className="bg-primary/5 border-primary/20 mb-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Users className="h-6 w-6 text-primary mt-0.5 shrink-0" />
              <div>
                <h2 className="font-semibold text-foreground mb-1">
                  Jogue em grupo e aumente suas chances!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Nossos bolões são montados com estratégias baseadas em análises estatísticas. 
                  Escolha o seu e garanta sua cota!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Bolões */}
        <div className="grid gap-4 md:grid-cols-2">
          {boloesSimulados.map((bolao) => {
            const cotasRestantes = bolao.cotasTotal - bolao.cotasVendidas;
            const porcentagemVendida = (bolao.cotasVendidas / bolao.cotasTotal) * 100;
            const urgente = cotasRestantes <= 3;

            return (
              <Card 
                key={bolao.id} 
                className={`relative overflow-hidden ${urgente ? 'border-accent' : ''}`}
              >
                {urgente && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-accent text-accent-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Últimas vagas!
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">
                        {bolao.nome}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Concurso {bolao.concurso}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Badges de Palpites e Dezenas */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      <Ticket className="h-3 w-3 mr-1" />
                      {bolao.qtdPalpites} palpites
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {bolao.qtdDezenas} dezenas
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <CardDescription className="text-sm leading-relaxed">
                      {bolao.descricao}
                    </CardDescription>
                  </div>

                  {/* Barra de progresso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cotas vendidas</span>
                      <span className={`font-medium ${urgente ? 'text-accent' : 'text-foreground'}`}>
                        {bolao.cotasVendidas}/{bolao.cotasTotal}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${urgente ? 'bg-accent' : 'bg-primary'}`}
                        style={{ width: `${porcentagemVendida}%` }}
                      />
                    </div>
                    <p className={`text-sm font-medium ${urgente ? 'text-accent' : 'text-muted-foreground'}`}>
                      {cotasRestantes === 1 
                        ? 'Falta apenas 1 cota!' 
                        : `Faltam ${cotasRestantes} cotas`}
                    </p>
                  </div>

                  {/* Valor e botão */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor da cota</p>
                      <p className="text-xl font-bold text-primary">
                        R$ {bolao.valorCota.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleComprar(bolao)}
                      className="gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Comprar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Aviso */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Após clicar em "Comprar", você será direcionado para o WhatsApp para finalizar sua compra.
        </p>
      </div>
    </MainLayout>
  );
};

export default Boloes;
