import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Dices, Sparkles, ChevronRight } from "lucide-react";

export default function GerarJogos() {
  const generators = [
    {
      name: "Lotofácil",
      path: "/smart-gerador",
      color: "from-purple-500 to-purple-600",
      iconColor: "text-purple-500",
      description: "Gerador inteligente para Lotofácil"
    },
    {
      name: "Mega-Sena",
      path: "/megasena/gerador",
      color: "from-green-500 to-green-600",
      iconColor: "text-green-500",
      description: "Gerador inteligente para Mega-Sena"
    },
    {
      name: "Quina",
      path: "/quina/gerador",
      color: "from-blue-500 to-blue-600",
      iconColor: "text-blue-500",
      description: "Gerador inteligente para Quina"
    },
    {
      name: "Dupla Sena",
      path: "/duplasena/gerador",
      color: "from-red-500 to-red-600",
      iconColor: "text-red-500",
      description: "Gerador inteligente para Dupla Sena"
    }
  ];

  return (
    <MainLayout pageTitle="Gerar Jogos">
      <div className="container-senior py-6 space-y-6 max-w-md mx-auto">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Gerar Jogos inteligentes</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Escolha uma loteria para gerar palpites baseados em análise estatística.
          </p>
        </div>

        <div className="grid gap-4">
          {generators.map((gen) => (
            <Link key={gen.name} to={gen.path}>
              <Card className="hover:border-primary transition-all cursor-pointer overflow-hidden group active:scale-[0.98]">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${gen.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <Dices className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{gen.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {gen.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

