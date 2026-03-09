import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, ArrowRight, Bot, DollarSign, Gift } from "lucide-react";
import { BotHealthWidget } from "@/components/admin/BotHealthWidget";

export default function AdminIndex() {
  return (
    <MainLayout>
      <div className="container-senior py-8">
        <h1 className="text-3xl font-bold mb-8">Painel Administrativo</h1>
        
        {/* Bot Health Widget */}
        <div className="mb-8">
          <BotHealthWidget />
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Planos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg">
                <FileText className="h-6 w-6 text-primary" />
                Gerenciar Planos
              </CardTitle>
              <CardDescription className="text-senior-base">
                Criar, editar e configurar planos e features do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/planos">
                <Button className="w-full gap-2 h-12 text-senior-base">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Usuários */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg">
                <Users className="h-6 w-6 text-primary" />
                Gerenciar Usuários
              </CardTitle>
              <CardDescription className="text-senior-base">
                Administrar perfis, planos e permissões de usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/usuarios">
                <Button className="w-full gap-2 h-12 text-senior-base">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Bots */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg">
                <Bot className="h-6 w-6 text-primary" />
                Gerenciar Bots
              </CardTitle>
              <CardDescription className="text-senior-base">
                Administrar especialistas virtuais e automação de posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/bots">
                <Button className="w-full gap-2 h-12 text-senior-base">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Custos IA */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg">
                <DollarSign className="h-6 w-6 text-primary" />
                Custos de IA
              </CardTitle>
              <CardDescription className="text-senior-base">
                Monitorar gastos com tokens, bots e ferramentas de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/custos">
                <Button className="w-full gap-2 h-12 text-senior-base">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
