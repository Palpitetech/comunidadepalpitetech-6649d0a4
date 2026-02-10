import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Termos() {
  return (
    <MainLayout pageTitle="Termos de Uso">
      <div className="container-senior py-8 max-w-3xl mx-auto">
        <Link to="/login">
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-senior-2xl">Termos de Uso</CardTitle>
            <p className="text-sm text-muted-foreground">Última atualização: 10 de fevereiro de 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-senior-lg font-semibold">1. Aceitação dos Termos</h2>
              <p className="text-senior-base text-muted-foreground">
                Ao acessar e utilizar a plataforma Palpite Tech, você concorda com estes Termos de Uso. 
                Se não concordar com qualquer parte destes termos, não utilize o serviço.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">2. Descrição do Serviço</h2>
              <p className="text-senior-base text-muted-foreground">
                O Palpite Tech é uma plataforma de análise estatística de loterias que oferece ferramentas 
                como geração de palpites, análise de frequência, fechamentos e desdobramentos. 
                O serviço é fornecido exclusivamente para fins de entretenimento e análise estatística.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">3. Cadastro e Conta</h2>
              <p className="text-senior-base text-muted-foreground">
                Para utilizar o serviço, é necessário criar uma conta fornecendo informações válidas. 
                Você é responsável por manter a confidencialidade de suas credenciais de acesso e por 
                todas as atividades realizadas em sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">4. Uso Adequado</h2>
              <p className="text-senior-base text-muted-foreground">
                Você concorda em utilizar a plataforma de forma legal e ética. É proibido: utilizar o 
                serviço para atividades ilegais, tentar acessar dados de outros usuários, interferir no 
                funcionamento da plataforma ou redistribuir o conteúdo sem autorização.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">5. Isenção de Garantia</h2>
              <p className="text-senior-base text-muted-foreground">
                O Palpite Tech NÃO garante resultados em sorteios de loteria. As análises e palpites 
                gerados são baseados em estatísticas históricas e não constituem garantia de acerto. 
                O uso das informações é de inteira responsabilidade do usuário.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">6. Planos e Pagamentos</h2>
              <p className="text-senior-base text-muted-foreground">
                O serviço oferece planos gratuitos e pagos. Os pagamentos são processados por plataformas 
                terceirizadas. Cancelamentos e reembolsos seguem as políticas do processador de pagamentos.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">7. Exclusão de Conta</h2>
              <p className="text-senior-base text-muted-foreground">
                Você pode solicitar a exclusão de sua conta a qualquer momento através da página de Perfil. 
                Ao excluir sua conta, todos os seus dados pessoais serão removidos permanentemente, conforme 
                a Lei Geral de Proteção de Dados (LGPD).
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">8. Modificações</h2>
              <p className="text-senior-base text-muted-foreground">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas 
                serão comunicadas através da plataforma. O uso continuado após as alterações constitui aceitação 
                dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">9. Contato</h2>
              <p className="text-senior-base text-muted-foreground">
                Para dúvidas sobre estes termos, entre em contato através do suporte na plataforma.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
