import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3, TrendingUp, Flame, Users } from "lucide-react";

const Index = () => {
  return (
    <MainLayout pageTitle="Início">
      <div className="container-senior pt-4 pb-8">
        {/* Cards de Acesso Rápido */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/resultados">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-senior-lg">Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Consulte o histórico completo dos sorteios
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/tendencias">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-senior-lg">Tendências</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pares, ímpares, primos e moldura
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/frequencia">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <Flame className="h-10 w-10 text-accent mb-2" />
                <CardTitle className="text-senior-lg">Quentes e Frias</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Dezenas mais e menos sorteadas
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/comunidade">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-senior-lg">Comunidade</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Compartilhe e veja palpites
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* CTA para não logados */}
        <div className="mt-8 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8">
              <h2 className="text-senior-xl font-semibold mb-4">
                Comece a analisar agora!
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crie sua conta gratuita e tenha acesso às melhores ferramentas de análise da Lotofácil.
              </p>
              <Link to="/login">
                <Button size="lg" className="h-14 px-8 text-senior-lg bg-accent hover:bg-accent/90 text-accent-foreground">
                  Criar conta grátis
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
