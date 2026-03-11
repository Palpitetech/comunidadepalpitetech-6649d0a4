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
            <p className="text-sm text-muted-foreground">Última atualização: 11 de março de 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-senior-lg font-semibold">1. Aceitação dos Termos</h2>
              <p className="text-senior-base text-muted-foreground">
                Ao acessar e utilizar a plataforma Palpite Tech, você declara ter lido, compreendido e concordado
                integralmente com estes Termos de Uso. Se não concordar com qualquer disposição, não utilize o serviço.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">2. Natureza do Serviço — Finalidade Exclusivamente Educativa</h2>
              <p className="text-senior-base text-muted-foreground">
                O Palpite Tech é uma plataforma de análise estatística e educacional voltada ao estudo de padrões
                numéricos em loterias da Caixa Econômica Federal. Todas as ferramentas — incluindo gerador de palpites,
                análise de frequência, fechamentos, desdobramentos e chat com IA — possuem finalidade exclusivamente
                educativa, estatística e de entretenimento.
              </p>
              <p className="text-senior-base text-muted-foreground font-semibold">
                A plataforma NÃO incentiva, promove ou recomenda a prática de apostas ou jogos de azar.
                Recomendamos expressamente que os usuários NÃO apostem dinheiro com base nas análises fornecidas.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">3. Isenção Total de Garantia de Resultados</h2>
              <p className="text-senior-base text-muted-foreground">
                O Palpite Tech NÃO garante, promete ou sugere, de forma direta ou indireta, qualquer tipo de
                prêmio, acerto ou resultado positivo em sorteios de loteria. Loterias são jogos de azar com
                resultados aleatórios e imprevisíveis. As análises estatísticas apresentadas refletem dados
                históricos e não possuem qualquer poder preditivo sobre resultados futuros.
              </p>
              <p className="text-senior-base text-muted-foreground">
                Qualquer decisão de apostar é de inteira e exclusiva responsabilidade do usuário. O Palpite Tech
                não se responsabiliza por perdas financeiras, frustrações ou quaisquer danos decorrentes do uso
                das informações disponibilizadas na plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">4. Restrição de Idade — Apenas Maiores de 18 Anos</h2>
              <p className="text-senior-base text-muted-foreground">
                O uso da plataforma Palpite Tech é restrito a pessoas com 18 (dezoito) anos de idade ou mais.
                Ao criar uma conta, você declara ser maior de idade conforme a legislação brasileira. Caso
                identifiquemos o uso por menores de 18 anos, a conta será suspensa ou excluída imediatamente,
                sem aviso prévio.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">5. Jogo Responsável — Diga Não ao Vício</h2>
              <p className="text-senior-base text-muted-foreground">
                O Palpite Tech apoia e incentiva o jogo responsável. Se você ou alguém que conhece apresenta
                sinais de dependência ou comportamento compulsivo relacionado a jogos de azar, procure ajuda
                profissional. Algumas orientações importantes:
              </p>
              <ul className="list-disc pl-6 text-senior-base text-muted-foreground space-y-1">
                <li>Nunca aposte mais do que pode perder</li>
                <li>Não use dinheiro destinado a necessidades básicas para apostas</li>
                <li>Estabeleça limites de gastos e respeite-os</li>
                <li>Se o jogo deixou de ser diversão, pare e busque orientação</li>
                <li>Ligue para o CVV (188) se precisar de apoio emocional</li>
              </ul>
              <p className="text-senior-base text-muted-foreground font-semibold">
                A plataforma é uma ferramenta educacional e estatística. Não nos responsabilizamos pelo uso
                indevido das informações para fins de aposta.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">6. Relação com a Caixa Econômica Federal</h2>
              <p className="text-senior-base text-muted-foreground">
                O Palpite Tech NÃO possui qualquer vínculo, parceria, afiliação ou associação com a Caixa
                Econômica Federal, suas subsidiárias ou qualquer órgão governamental. Os dados de resultados
                de loterias utilizados na plataforma são de domínio público e obtidos de fontes publicamente
                acessíveis. As marcas "Lotofácil", "Mega-Sena", "Dupla Sena" e outras são de propriedade
                exclusiva da Caixa Econômica Federal e são mencionadas apenas para fins de referência e
                identificação dos jogos analisados.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">7. Cadastro e Conta</h2>
              <p className="text-senior-base text-muted-foreground">
                Para utilizar o serviço, é necessário criar uma conta fornecendo informações válidas e verdadeiras.
                Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as
                atividades realizadas em sua conta. O fornecimento de informações falsas pode resultar no
                encerramento da conta.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">8. Uso Adequado</h2>
              <p className="text-senior-base text-muted-foreground">
                Você concorda em utilizar a plataforma de forma legal e ética. É expressamente proibido:
                utilizar o serviço para atividades ilegais; tentar acessar dados de outros usuários; interferir
                no funcionamento da plataforma; redistribuir, copiar ou revender o conteúdo sem autorização;
                utilizar bots ou scripts automatizados; e promover conteúdo enganoso na comunidade.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">9. Planos e Pagamentos</h2>
              <p className="text-senior-base text-muted-foreground">
                O serviço oferece planos gratuitos e pagos. Os pagamentos são processados por plataformas
                terceirizadas. Os valores cobrados referem-se exclusivamente ao acesso às ferramentas de
                análise estatística da plataforma e NÃO constituem apostas, jogos ou qualquer forma de
                investimento. Cancelamentos e reembolsos seguem as políticas do processador de pagamentos
                e a legislação do consumidor vigente.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">10. Propriedade Intelectual</h2>
              <p className="text-senior-base text-muted-foreground">
                Todo o conteúdo da plataforma, incluindo mas não limitado a código-fonte, algoritmos, design,
                textos, gráficos e análises geradas, é de propriedade exclusiva do Palpite Tech e protegido
                pela legislação de direitos autorais. É vedada a reprodução, distribuição ou uso comercial
                sem autorização expressa.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">11. Limitação de Responsabilidade</h2>
              <p className="text-senior-base text-muted-foreground">
                Na máxima extensão permitida pela legislação aplicável, o Palpite Tech, seus sócios,
                funcionários e prestadores de serviço não serão responsáveis por quaisquer danos diretos,
                indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso ou
                impossibilidade de uso da plataforma, incluindo, sem limitação, perdas financeiras em
                apostas, perda de dados ou interrupção do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">12. Exclusão de Conta</h2>
              <p className="text-senior-base text-muted-foreground">
                Você pode solicitar a exclusão de sua conta a qualquer momento através da página de Perfil.
                Ao excluir sua conta, todos os seus dados pessoais serão removidos permanentemente, conforme
                a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">13. Modificações dos Termos</h2>
              <p className="text-senior-base text-muted-foreground">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas
                serão comunicadas através da plataforma. O uso continuado após as alterações constitui aceitação
                dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">14. Legislação Aplicável e Foro</h2>
              <p className="text-senior-base text-muted-foreground">
                Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Fica eleito o
                foro da comarca do domicílio do usuário para dirimir quaisquer questões decorrentes destes termos,
                conforme o Código de Defesa do Consumidor.
              </p>
            </section>

            <section>
              <h2 className="text-senior-lg font-semibold">15. Contato</h2>
              <p className="text-senior-base text-muted-foreground">
                Para dúvidas sobre estes termos, entre em contato através do suporte disponível na plataforma.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
