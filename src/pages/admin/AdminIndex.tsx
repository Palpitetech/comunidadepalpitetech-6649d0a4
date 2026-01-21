import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, ArrowRight } from "lucide-react";

export default function AdminIndex() {
  return (
    <AdminLayout>
      <div className="container-senior py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Painel Administrativo</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Planos */}
          <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg text-white">
                <FileText className="h-6 w-6 text-white/80" />
                Gerenciar Planos
              </CardTitle>
              <CardDescription className="text-senior-base text-white/70">
                Criar, editar e configurar planos e features do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/planos">
                <Button className="w-full gap-2 h-12 text-senior-base bg-white text-[#1E3A5F] hover:bg-white/90">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Usuários */}
          <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-senior-lg text-white">
                <Users className="h-6 w-6 text-white/80" />
                Gerenciar Usuários
              </CardTitle>
              <CardDescription className="text-senior-base text-white/70">
                Administrar perfis, planos e permissões de usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/usuarios">
                <Button className="w-full gap-2 h-12 text-senior-base bg-white text-[#1E3A5F] hover:bg-white/90">
                  Acessar <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
