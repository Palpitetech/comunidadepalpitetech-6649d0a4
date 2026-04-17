import { MainLayout } from "@/components/layout/MainLayout";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacidade() {
  return (
    <MainLayout pageTitle="Política de Privacidade">
      <Helmet>
        <title>Política de Privacidade | Palpite Tech</title>
        <meta name="description" content="Saiba como o Palpite Tech protege seus dados e respeita a sua privacidade em conformidade com a LGPD." />
      </Helmet>
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
            <p className="text-sm text-muted-foreground">Última atualização: 11 de março de 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-senior-lg font-semibold">1. Introdução</h2>
              <p className="text-senior-base text-muted-foreground">
                O Palpite Tech é uma plataforma educacional de análise estatística de loterias. Esta Política
                de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais
                em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
              </p>
              <p className="text-senior-base text-muted-foreground">
                A plataforma é destinada exclusivamente a maiores de 18 anos. Não coletamos intencionalmente
                dados de menores de idade.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">2. Dados Coletados</h2>
              <p className="text-senior-base text-muted-foreground">
                Coletamos os seguintes dados pessoais ao criar sua conta:
              </p>
              <ul className="list-disc pl-6 text-senior-base text-muted-foreground space-y-1">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Número de celular</li>
                <li>Foto de perfil (opcional)</li>
              </ul>
              <p className="text-senior-base text-muted-foreground">
                Também coletamos dados de uso da plataforma, como palpites salvos, histórico de conversas com
                a IA e interações na comunidade, com a finalidade de melhorar a experiência do usuário.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">3. Finalidade do Uso dos Dados</h2>
              <p className="text-senior-base text-muted-foreground">
                Seus dados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc pl-6 text-senior-base text-muted-foreground space-y-1">
                <li>Autenticação e login na plataforma</li>
                <li>Verificação de identidade via SMS ou e-mail</li>
                <li>Comunicação sobre o serviço e atualizações</li>
                <li>Personalização da experiência do usuário</li>
                <li>Controle de limites de uso conforme o plano contratado</li>
                <li>Cumprimento de obrigações legais</li>
              </ul>
              <p className="text-senior-base text-muted-foreground font-semibold">
                Não vendemos, compartilhamos ou cedemos seus dados a terceiros para fins comerciais,
                publicitários ou de marketing.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">4. Armazenamento e Segurança</h2>
              <p className="text-senior-base text-muted-foreground">
                Seus dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS/TLS)
                e em repouso. Senhas são armazenadas com hash criptográfico (bcrypt). Implementamos
                controles de acesso rigorosos (Row Level Security) para garantir que apenas você tenha
                acesso aos seus dados pessoais. Mantemos logs de auditoria para detectar acessos indevidos.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">5. Seus Direitos (LGPD)</h2>
              <p className="text-senior-base text-muted-foreground">
                Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem os seguintes direitos:
              </p>
              <ul className="list-disc pl-6 text-senior-base text-muted-foreground space-y-1">
                <li>Confirmar a existência de tratamento de seus dados</li>
                <li>Acessar seus dados pessoais armazenados</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
                <li>Solicitar a exclusão de seus dados (direito ao esquecimento)</li>
                <li>Revogar o consentimento para uso de dados a qualquer momento</li>
                <li>Solicitar portabilidade dos dados a outro fornecedor de serviço</li>
                <li>Ser informado sobre com quem seus dados foram compartilhados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">6. Exclusão de Dados</h2>
              <p className="text-senior-base text-muted-foreground">
                Você pode solicitar a exclusão completa de sua conta e dados pessoais a qualquer momento
                através da página de Perfil. Ao excluir sua conta, todos os dados associados serão
                removidos permanentemente de nossos servidores, incluindo: perfil, palpites salvos,
                histórico de conversas, postagens e comentários na comunidade.
              </p>
              <p className="text-senior-base text-muted-foreground">
                Dados anonimizados de uso agregado (estatísticas sem identificação pessoal) podem ser
                retidos para fins de melhoria do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">7. Cookies e Sessão</h2>
              <p className="text-senior-base text-muted-foreground">
                Utilizamos tokens de sessão (JWT) para manter você autenticado. Não utilizamos cookies
                de rastreamento de terceiros nem ferramentas de analytics que identifiquem individualmente
                os usuários. A sessão expira automaticamente e pode ser encerrada a qualquer momento
                através do logout.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">8. Serviços de Terceiros</h2>
              <p className="text-senior-base text-muted-foreground">
                Utilizamos serviços de terceiros estritamente necessários para o funcionamento da plataforma:
              </p>
              <ul className="list-disc pl-6 text-senior-base text-muted-foreground space-y-1">
                <li>Envio de SMS para verificação de conta</li>
                <li>Envio de e-mail para comunicação e recuperação de senha</li>
                <li>Processamento de pagamentos para planos pagos</li>
                <li>Modelos de inteligência artificial para o chat educacional</li>
              </ul>
              <p className="text-senior-base text-muted-foreground">
                Esses serviços recebem apenas os dados estritamente necessários para suas funções e estão
                sujeitos às suas respectivas políticas de privacidade e termos de uso.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">9. Retenção de Dados</h2>
              <p className="text-senior-base text-muted-foreground">
                Seus dados pessoais são mantidos enquanto sua conta estiver ativa. Após a exclusão da conta,
                os dados são removidos permanentemente em até 30 dias. Dados necessários para cumprimento de
                obrigações legais ou fiscais poderão ser retidos pelo prazo exigido pela legislação aplicável.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">10. Transferência Internacional de Dados</h2>
              <p className="text-senior-base text-muted-foreground">
                Os servidores utilizados pela plataforma podem estar localizados fora do Brasil. Nesses casos,
                garantimos que os provedores de infraestrutura adotam medidas de segurança equivalentes ou
                superiores às exigidas pela LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">11. Alterações nesta Política</h2>
              <p className="text-senior-base text-muted-foreground">
                Esta política pode ser atualizada periodicamente. Alterações significativas serão comunicadas
                através da plataforma. Recomendamos a revisão periódica desta página.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">12. Contato do Encarregado (DPO)</h2>
              <p className="text-senior-base text-muted-foreground">
                Para exercer seus direitos, esclarecer dúvidas sobre privacidade ou reportar incidentes de
                segurança, entre em contato através do suporte disponível na plataforma. Responderemos sua
                solicitação em até 15 dias úteis, conforme previsto na LGPD.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
