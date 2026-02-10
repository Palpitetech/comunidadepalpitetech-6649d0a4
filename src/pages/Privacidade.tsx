import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacidade() {
  return (
    <MainLayout pageTitle="Política de Privacidade">
      <div className="container-senior py-8 max-w-3xl mx-auto">
        <Link to="/login">
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-senior-2xl">Política de Privacidade</CardTitle>
            <p className="text-sm text-muted-foreground">Última atualização: 10 de fevereiro de 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-senior-lg font-semibold">1. Dados Coletados</h2>
              <p className="text-senior-base text-muted-foreground">
                Coletamos os seguintes dados pessoais ao criar sua conta: nome completo, endereço de e-mail 
                e número de celular. Esses dados são necessários para autenticação, verificação de conta e 
                comunicação com o usuário.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">2. Finalidade do Uso</h2>
              <p className="text-senior-base text-muted-foreground">
                Seus dados são utilizados exclusivamente para: autenticação e login na plataforma, 
                verificação de identidade via SMS ou e-mail, comunicação sobre o serviço e 
                personalização da experiência do usuário. Não vendemos, compartilhamos ou cedemos 
                seus dados a terceiros para fins comerciais.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">3. Armazenamento e Segurança</h2>
              <p className="text-senior-base text-muted-foreground">
                Seus dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS/TLS) 
                e em repouso. Senhas são armazenadas com hash criptográfico (bcrypt). Implementamos 
                controles de acesso rigorosos (Row Level Security) para garantir que apenas você tenha 
                acesso aos seus dados pessoais.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">4. Seus Direitos (LGPD)</h2>
              <p className="text-senior-base text-muted-foreground">
                Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
              </p>
              <ul className="list-disc pl-6 text-senior-base text-muted-foreground space-y-1">
                <li>Acessar seus dados pessoais armazenados</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão de seus dados (direito ao esquecimento)</li>
                <li>Revogar o consentimento para uso de dados</li>
                <li>Solicitar portabilidade dos dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">5. Exclusão de Dados</h2>
              <p className="text-senior-base text-muted-foreground">
                Você pode solicitar a exclusão completa de sua conta e dados pessoais a qualquer momento 
                através da página de Perfil. Ao excluir sua conta, todos os dados associados serão 
                removidos permanentemente de nossos servidores, incluindo: perfil, palpites salvos, 
                histórico de conversas e postagens na comunidade.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">6. Cookies e Sessão</h2>
              <p className="text-senior-base text-muted-foreground">
                Utilizamos tokens de sessão (JWT) para manter você autenticado. Não utilizamos cookies 
                de rastreamento de terceiros. A sessão expira automaticamente e pode ser encerrada a 
                qualquer momento através do logout.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">7. Serviços de Terceiros</h2>
              <p className="text-senior-base text-muted-foreground">
                Utilizamos serviços de terceiros para envio de SMS (Twilio) e e-mail (Resend) durante 
                a verificação de conta. Esses serviços recebem apenas os dados necessários para o envio 
                das mensagens e estão sujeitos às suas respectivas políticas de privacidade.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">8. Contato do Encarregado</h2>
              <p className="text-senior-base text-muted-foreground">
                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato 
                através do suporte disponível na plataforma.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
