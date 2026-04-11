import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Dices, Sparkles } from "lucide-react";

export default function GerarJogos() {
  const generators = [
    {
      name: "Lotofácil",
      path: "/smart-gerador",
      color: "bg-purple-500",
      description: "Gerador inteligente para Lotofácil"
    },
    {
      name: "Mega-Sena",
      path: "/megasena/gerador",
      color: "bg-green-500",
      description: "Gerador inteligente para Mega-Sena"
    },
    {
      name: "Quina",
      path: "/quina/gerador",
      color: "bg-blue-600",
      description: "Gerador inteligente para Quina"
    },
    {
      name: "Dupla Sena",
      path: "/duplasena/gerador",
      color: "bg-red-500",
      description: "Gerador inteligente para Dupla Sena"
    }
  ];

  return (
    <MainLayout pageTitle="Gerar Jogos">
      <div className="container-senior py-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Gerar Jogos inteligentes</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {generators.map((gen) => (
            <Link key={gen.name} to={gen.path}>
              <Card className="hover:border-primary transition-all cursor-pointer overflow-hidden group">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${gen.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                      <Dices className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{gen.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {gen.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
