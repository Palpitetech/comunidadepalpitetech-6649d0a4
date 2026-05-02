import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { GatedPage } from "@/components/shared/GatedPage";
import { UpsellProvider } from "@/contexts/UpsellContext";
import { CodeProtection } from "@/components/shared/CodeProtection";
import { PWAUpdateHandler } from "@/components/pwa/PWAUpdateHandler";
import { useUTM } from "@/hooks/useUTM";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
// RecuperarSenha removido
import Comunidade from "./pages/Comunidade";
import Notificacoes from "./pages/Notificacoes";
import Resultados from "./pages/Resultados";
import Tendencias from "./pages/Tendencias";
import LinhasColunas from "./pages/LinhasColunas";
import Frequencia from "./pages/Frequencia";
import Gerador from "./pages/Gerador";
import Desdobramento from "./pages/Desdobramento";
import Fechamento from "./pages/Fechamento";
import MeusPalpites from "./pages/MeusPalpites";
import Boloes from "./pages/Boloes";
import Perfil from "./pages/Perfil";
import CriarPost from "./pages/CriarPost";
import PostDetalhes from "./pages/PostDetalhes";
import Bloqueado from "./pages/Bloqueado";
import Convites from "./pages/Convites";
import Planos from "./pages/Planos";
import PlanosPublico from "./pages/PlanosPublico";
import EmailUnsubscribe from "./pages/EmailUnsubscribe";
import AdminIndex from "./pages/admin/AdminIndex";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminCustos from "./pages/admin/AdminCustos";
import AdminAssinaturasOperacionais from "./pages/admin/AdminAssinaturasOperacionais";
import AdminChipCelulares from "./pages/admin/AdminChipCelulares";
import AdminCustosOperacionais from "./pages/admin/AdminCustosOperacionais";
import AdminConvites from "./pages/admin/AdminConvites";
import AdminVendas from "./pages/admin/AdminVendas";
import AdminEventos from "./pages/admin/AdminEventos";
import AdminWhatsApp from "./pages/admin/AdminWhatsApp";
import Integracoes from "./pages/admin/Integracoes";
import AdminMetricas from "./pages/admin/AdminMetricas";
import AdminBI from "./pages/admin/AdminBI";
import AdminAtribuicaoAuditoria from "./pages/admin/AdminAtribuicaoAuditoria";
import AdminBackfill from "./pages/admin/AdminBackfill";
import AdminForceUpdate from "./pages/admin/AdminForceUpdate";
import NovoBolao from "./pages/admin/boloes/NovoBolao";

import ListagemBolao from "./pages/admin/boloes/ListagemBolao";
import ResgatesBolao from "./pages/admin/boloes/ResgatesBolao";
import ComprasSaldo from "./pages/admin/boloes/ComprasSaldo";
import ComprasCotas from "./pages/admin/boloes/ComprasCotas";
import BoloesPagamento from "./pages/admin/boloes/BoloesPagamento";
import Premiacao from "./pages/admin/boloes/Premiacao";
import Carteira from "./pages/admin/boloes/Carteira";
import AnaliseDoDia from "./pages/AnaliseDoDia";
import TabelaMovimentacao from "./pages/TabelaMovimentacao";
import FrequenciaDezenas from "./pages/FrequenciaDezenas";
import DezenasporPosicao from "./pages/DezenasporPosicao";
import NotFound from "./pages/NotFound";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import ChatAdmin from "./pages/admin/ChatAdmin";

// AtivarConta e VerificarEmail removidos
import ResultadosMegaSena from "./pages/megasena/ResultadosMegaSena";
import TendenciasMegaSena from "./pages/megasena/TendenciasMegaSena";
import FrequenciaMegaSena from "./pages/megasena/FrequenciaMegaSena";
import GeradorMegaSena from "./pages/megasena/GeradorMegaSena";
import FechamentoMegaSena from "./pages/megasena/FechamentoMegaSena";
import DesdobramentoMegaSena from "./pages/megasena/DesdobramentoMegaSena";
import LinhasColunasMegaSena from "./pages/megasena/LinhasColunasMegaSena";
import AnaliseDoDiaMegaSena from "./pages/megasena/AnaliseDoDiaMegaSena";
import TabelaMovimentacaoMegaSena from "./pages/megasena/TabelaMovimentacaoMegaSena";
import FrequenciaDecenasMegaSena from "./pages/megasena/FrequenciaDecenasMegaSena";
import DezenasporPosicaoMegaSena from "./pages/megasena/DezenasporPosicaoMegaSena";
import HubMegaSena from "./pages/megasena/HubMegaSena";
import ResultadosDuplaSena from "./pages/duplasena/ResultadosDuplaSena";
import TendenciasDuplaSena from "./pages/duplasena/TendenciasDuplaSena";
import FrequenciaDuplaSena from "./pages/duplasena/FrequenciaDuplaSena";
import DezenasporPosicaoDuplaSena from "./pages/duplasena/DezenasporPosicaoDuplaSena";
import LinhasColunasDuplaSena from "./pages/duplasena/LinhasColunasDuplaSena";
import AnaliseDoDiaDuplaSena from "./pages/duplasena/AnaliseDoDiaDuplaSena";
import GeradorDuplaSena from "./pages/duplasena/GeradorDuplaSena";
import DesdobramentoDuplaSena from "./pages/duplasena/DesdobramentoDuplaSena";
import FrequenciaDecenasDuplaSena from "./pages/duplasena/FrequenciaDecenasDuplaSena";
import TabelaMovimentacaoDuplaSena from "./pages/duplasena/TabelaMovimentacaoDuplaSena";
import HubDuplaSena from "./pages/duplasena/HubDuplaSena";
import FechamentoDuplaSena from "./pages/duplasena/FechamentoDuplaSena";
import ProximosConcursos from "./pages/ProximosConcursos";
import ResultadosQuina from "./pages/quina/ResultadosQuina";
import TendenciasQuina from "./pages/quina/TendenciasQuina";
import FrequenciaQuina from "./pages/quina/FrequenciaQuina";
import FrequenciaDezenasQuina from "./pages/quina/FrequenciaDezenasQuina";
import DezenasporPosicaoQuina from "./pages/quina/DezenasporPosicaoQuina";
import LinhasColunasQuina from "./pages/quina/LinhasColunasQuina";
import TabelaMovimentacaoQuina from "./pages/quina/TabelaMovimentacaoQuina";
import GeradorQuina from "./pages/quina/GeradorQuina";
import DesdobramentoQuina from "./pages/quina/DesdobramentoQuina";
import AnaliseDoDiaQuina from "./pages/quina/AnaliseDoDiaQuina";
import HubQuina from "./pages/quina/HubQuina";
import ResultadosDiaDeSorte from "./pages/diadesorte/ResultadosDiaDeSorte";
import HubDiaDeSorte from "./pages/diadesorte/HubDiaDeSorte";
import ResultadosLotomania from "./pages/lotomania/ResultadosLotomania";
import HubLotomania from "./pages/lotomania/HubLotomania";
import HubLotofacil from "./pages/lotofacil/HubLotofacil";
import GeradorEstudo from "./pages/lotofacil/GeradorEstudo";
import GravacaoLotofacil from "./pages/admin/gravacao/GravacaoLotofacil";
import GravacaoQuina from "./pages/admin/gravacao/GravacaoQuina";
import GravacaoMegasena from "./pages/admin/gravacao/GravacaoMegasena";
import GravacaoEstudos from "./pages/admin/gravacao/GravacaoEstudos";
import PosicoesFinaisMegaSena from "./pages/admin/gravacao/estudos/PosicoesFinaisMegaSena";
import SmartLinkRedirect from "./pages/SmartLinkRedirect";
import GerarNovoPix from "./pages/GerarNovoPix";
import PerfilDados from "./pages/PerfilDados";
import PerfilTransacoes from "./pages/PerfilTransacoes";
import PerfilAssinatura from "./pages/PerfilAssinatura";
import PerfilSeguranca from "./pages/PerfilSeguranca";
import GerarJogos from "./pages/GerarJogos";
import Central from "./pages/Central";
import VerificarWhatsApp from "./pages/VerificarWhatsApp";
import PalpitesEstudos from "./pages/PalpitesEstudos";

const queryClient = new QueryClient();

function UTMCapture() {
  useUTM();
  return null;
}

function ForceUpdateWatcher() {
  useForceUpdate();
  return null;
}

/** Normaliza paths com letras maiúsculas para minúsculas (ex: /Admin → /admin) */
function LowercaseRedirect() {
  const location = useLocation();
  if (location.pathname !== location.pathname.toLowerCase()) {
    return <Navigate to={location.pathname.toLowerCase() + location.search + location.hash} replace />;
  }
  return null;
}

// Main App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <PermissionProvider>
          <TooltipProvider>
            <UpsellProvider>
              <UTMCapture />
              <ForceUpdateWatcher />
              <CodeProtection />
              <PWAUpdateHandler />
              <Toaster />
              <Sonner />
              <LowercaseRedirect />
              <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<Central />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                {/* RecuperarSenha removido */}
{/* AtivarConta e VerificarEmail removidos */}
                <Route path="/termos" element={<Termos />} />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="/proximos-concursos" element={<ProximosConcursos />} />
                <Route path="/verificar-whatsapp" element={<VerificarWhatsApp />} />
                <Route path="/palpites-estudos" element={<PalpitesEstudos />} />
                <Route path="/g/:slug" element={<SmartLinkRedirect />} />
                <Route path="/gerar-novo-pix/:slug" element={<GerarNovoPix />} />
                <Route path="/email/descadastrar" element={<EmailUnsubscribe />} />
                <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />


                {/* Rotas Protegidas - Requer Login */}
                <Route path="/gerar-jogos" element={<ProtectedRoute><GerarJogos /></ProtectedRoute>} />
                <Route path="/home" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
                <Route path="/comunidade" element={<Navigate to="/home" replace />} />
                <Route path="/chat" element={<Navigate to="/home" replace />} />
                <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
                <Route path="/lotofacil" element={<ProtectedRoute><HubLotofacil /></ProtectedRoute>} />
                <Route path="/lotofacil/gerador-estudo" element={<ProtectedRoute><GatedPage feature="gerador"><GeradorEstudo loteria="lotofacil" /></GatedPage></ProtectedRoute>} />
                <Route path="/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
                <Route path="/tendencias" element={<ProtectedRoute><GatedPage feature="tendencias"><Tendencias /></GatedPage></ProtectedRoute>} />
                <Route path="/linhas-colunas" element={<ProtectedRoute><GatedPage feature="linhas_colunas"><LinhasColunas /></GatedPage></ProtectedRoute>} />
                <Route path="/frequencia" element={<ProtectedRoute><GatedPage feature="quentes_frias"><Frequencia /></GatedPage></ProtectedRoute>} />
                <Route path="/smart-gerador" element={<ProtectedRoute><GatedPage feature="gerador"><Gerador /></GatedPage></ProtectedRoute>} />
                <Route path="/desdobramento" element={<ProtectedRoute><GatedPage feature="desdobramento"><Desdobramento /></GatedPage></ProtectedRoute>} />
                <Route path="/fechamento" element={<ProtectedRoute><GatedPage feature="fechamento"><Fechamento /></GatedPage></ProtectedRoute>} />
                <Route path="/meus-palpites" element={<ProtectedRoute><GatedPage feature="palpites_salvos"><MeusPalpites /></GatedPage></ProtectedRoute>} />
                <Route path="/boloes" element={<ProtectedRoute><Boloes /></ProtectedRoute>} />
                <Route path="/analise-do-dia" element={<ProtectedRoute><GatedPage feature="analise_do_dia"><AnaliseDoDia /></GatedPage></ProtectedRoute>} />
                <Route path="/tabela-movimentacao" element={<ProtectedRoute><GatedPage feature="tabela_movimentacao"><TabelaMovimentacao /></GatedPage></ProtectedRoute>} />
                <Route path="/frequencia-dezenas" element={<ProtectedRoute><GatedPage feature="frequencia_dezenas"><FrequenciaDezenas /></GatedPage></ProtectedRoute>} />
                <Route path="/dezenas-por-posicao" element={<ProtectedRoute><GatedPage feature="dezenas_por_posicao"><DezenasporPosicao /></GatedPage></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/perfil/dados" element={<ProtectedRoute><PerfilDados /></ProtectedRoute>} />
                <Route path="/perfil/transacoes" element={<ProtectedRoute><PerfilTransacoes /></ProtectedRoute>} />
                <Route path="/perfil/assinatura" element={<ProtectedRoute><PerfilAssinatura /></ProtectedRoute>} />
                <Route path="/perfil/seguranca" element={<ProtectedRoute><PerfilSeguranca /></ProtectedRoute>} />
                <Route path="/criar-post" element={<ProtectedRoute><CriarPost /></ProtectedRoute>} />
                <Route path="/comunidade/post/:slug" element={<PostDetalhes />} />
                <Route path="/convites" element={<ProtectedRoute><GatedPage feature="comunidade_full"><Convites /></GatedPage></ProtectedRoute>} />
                <Route path="/bloqueado" element={<Bloqueado />} />
                <Route path="/planos" element={<Planos />} />
                <Route path="/planos-publico" element={<PlanosPublico />} />
                
                {/* Rotas Mega Sena */}
                <Route path="/megasena" element={<ProtectedRoute><HubMegaSena /></ProtectedRoute>} />
                <Route path="/megasena/resultados" element={<ProtectedRoute><ResultadosMegaSena /></ProtectedRoute>} />
                <Route path="/megasena/tendencias" element={<ProtectedRoute><GatedPage feature="tendencias"><TendenciasMegaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/megasena/frequencia" element={<ProtectedRoute><GatedPage feature="quentes_frias"><FrequenciaMegaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/megasena/gerador" element={<ProtectedRoute><GatedPage feature="gerador"><GeradorMegaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/megasena/fechamento" element={<ProtectedRoute><GatedPage feature="fechamento"><FechamentoMegaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/megasena/desdobramento" element={<ProtectedRoute><GatedPage feature="desdobramento"><DesdobramentoMegaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/megasena/linhas-colunas" element={<ProtectedRoute><GatedPage feature="linhas_colunas"><LinhasColunasMegaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/megasena/analise-do-dia" element={<ProtectedRoute><GatedPage feature="analise_do_dia"><AnaliseDoDiaMegaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/megasena/tabela-movimentacao" element={<ProtectedRoute><GatedPage feature="tabela_movimentacao"><TabelaMovimentacaoMegaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/megasena/frequencia-dezenas" element={<ProtectedRoute><GatedPage feature="frequencia_dezenas"><FrequenciaDecenasMegaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/megasena/dezenas-por-posicao" element={<ProtectedRoute><GatedPage feature="dezenas_por_posicao"><DezenasporPosicaoMegaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/megasena/gerador-estudo" element={<ProtectedRoute><GatedPage feature="gerador"><GeradorEstudo loteria="megasena" /></GatedPage></ProtectedRoute>} />
                
                {/* Rotas Dupla Sena */}
                <Route path="/duplasena" element={<ProtectedRoute><HubDuplaSena /></ProtectedRoute>} />
                <Route path="/duplasena/resultados" element={<ProtectedRoute><ResultadosDuplaSena /></ProtectedRoute>} />
                <Route path="/duplasena/tendencias" element={<ProtectedRoute><GatedPage feature="tendencias"><TendenciasDuplaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/duplasena/frequencia" element={<ProtectedRoute><GatedPage feature="quentes_frias"><FrequenciaDuplaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/duplasena/dezenas-por-posicao" element={<ProtectedRoute><GatedPage feature="dezenas_por_posicao"><DezenasporPosicaoDuplaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/duplasena/linhas-colunas" element={<ProtectedRoute><GatedPage feature="linhas_colunas"><LinhasColunasDuplaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/duplasena/analise-do-dia" element={<ProtectedRoute><GatedPage feature="analise_do_dia"><AnaliseDoDiaDuplaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/duplasena/gerador" element={<ProtectedRoute><GatedPage feature="gerador"><GeradorDuplaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/duplasena/desdobramento" element={<ProtectedRoute><GatedPage feature="desdobramento"><DesdobramentoDuplaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/duplasena/frequencia-dezenas" element={<ProtectedRoute><GatedPage feature="frequencia_dezenas"><FrequenciaDecenasDuplaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/duplasena/tabela-movimentacao" element={<ProtectedRoute><GatedPage feature="tabela_movimentacao"><TabelaMovimentacaoDuplaSena /></GatedPage></ProtectedRoute>} />
                <Route path="/duplasena/fechamento" element={<ProtectedRoute><GatedPage feature="fechamento"><FechamentoDuplaSena /></GatedPage></ProtectedRoute>} />
                
                {/* Rotas Quina */}
                <Route path="/quina" element={<ProtectedRoute><HubQuina /></ProtectedRoute>} />
                <Route path="/quina/resultados" element={<ProtectedRoute><ResultadosQuina /></ProtectedRoute>} />
                <Route path="/quina/tendencias" element={<ProtectedRoute><GatedPage feature="tendencias"><TendenciasQuina /></GatedPage></ProtectedRoute>} />
                <Route path="/quina/frequencia" element={<ProtectedRoute><GatedPage feature="quentes_frias"><FrequenciaQuina /></GatedPage></ProtectedRoute>} />
                <Route path="/quina/frequencia-dezenas" element={<ProtectedRoute><GatedPage feature="frequencia_dezenas"><FrequenciaDezenasQuina /></GatedPage></ProtectedRoute>} />
                <Route path="/quina/dezenas-posicao" element={<ProtectedRoute><GatedPage feature="dezenas_por_posicao"><DezenasporPosicaoQuina /></GatedPage></ProtectedRoute>} />
                <Route path="/quina/linhas-colunas" element={<ProtectedRoute><GatedPage feature="linhas_colunas"><LinhasColunasQuina /></GatedPage></ProtectedRoute>} />
                <Route path="/quina/tabela-movimentacao" element={<ProtectedRoute><GatedPage feature="tabela_movimentacao"><TabelaMovimentacaoQuina /></GatedPage></ProtectedRoute>} />
                <Route path="/quina/gerador" element={<ProtectedRoute><GatedPage feature="gerador"><GeradorQuina /></GatedPage></ProtectedRoute>} />
                <Route path="/quina/desdobramento" element={<ProtectedRoute><GatedPage feature="desdobramento"><DesdobramentoQuina /></GatedPage></ProtectedRoute>} />
                <Route path="/quina/analise-do-dia" element={<ProtectedRoute><GatedPage feature="analise_do_dia"><AnaliseDoDiaQuina /></GatedPage></ProtectedRoute>} />

                {/* Rotas Dia de Sorte */}
                <Route path="/diadesorte" element={<ProtectedRoute><HubDiaDeSorte /></ProtectedRoute>} />
                <Route path="/diadesorte/resultados" element={<ProtectedRoute><ResultadosDiaDeSorte /></ProtectedRoute>} />
                
                {/* Rotas Lotomania */}
                <Route path="/lotomania" element={<ProtectedRoute><HubLotomania /></ProtectedRoute>} />
                <Route path="/lotomania/resultados" element={<ProtectedRoute><ResultadosLotomania /></ProtectedRoute>} />
                
                {/* Rotas Admin */}
                <Route path="/admin" element={<AdminRoute><AdminIndex /></AdminRoute>} />
                <Route path="/admin/planos" element={<AdminRoute><AdminPlanos /></AdminRoute>} />
                <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />
                <Route path="/admin/custos" element={<AdminRoute><AdminCustos /></AdminRoute>} />
                <Route path="/admin/assinaturas-operacionais" element={<AdminRoute><AdminAssinaturasOperacionais /></AdminRoute>} />
                <Route path="/admin/chip-celulares" element={<AdminRoute><AdminChipCelulares /></AdminRoute>} />
                <Route path="/admin/custos-operacionais" element={<AdminRoute><AdminCustosOperacionais /></AdminRoute>} />
                <Route path="/admin/convites" element={<AdminRoute><AdminConvites /></AdminRoute>} />
                <Route path="/admin/vendas" element={<AdminRoute><AdminVendas /></AdminRoute>} />
                <Route path="/admin/eventos" element={<AdminRoute><AdminEventos /></AdminRoute>} />
                <Route path="/admin/whatsapp" element={<AdminRoute><AdminWhatsApp /></AdminRoute>} />
                <Route path="/admin/integracoes" element={<AdminRoute><Integracoes /></AdminRoute>} />
                <Route path="/admin/metricas" element={<AdminRoute><AdminMetricas /></AdminRoute>} />
                <Route path="/admin/metricas/auditoria-atribuicao" element={<AdminRoute><AdminAtribuicaoAuditoria /></AdminRoute>} />
                <Route path="/admin/backfill" element={<AdminRoute><AdminBackfill /></AdminRoute>} />
                <Route path="/admin/force-update" element={<AdminRoute><AdminForceUpdate /></AdminRoute>} />
                <Route path="/admin/novo-bolao" element={<AdminRoute><NovoBolao /></AdminRoute>} />

                <Route path="/admin/listagem-bolao" element={<AdminRoute><ListagemBolao /></AdminRoute>} />
                <Route path="/admin/solicitacao-resgate" element={<AdminRoute><ResgatesBolao /></AdminRoute>} />
                <Route path="/admin/compras-saldo" element={<AdminRoute><ComprasSaldo /></AdminRoute>} />
                <Route path="/admin/compras-cotas" element={<AdminRoute><ComprasCotas /></AdminRoute>} />
                <Route path="/admin/boloes-pagamento" element={<AdminRoute><BoloesPagamento /></AdminRoute>} />
                <Route path="/admin/premiacao" element={<AdminRoute><Premiacao /></AdminRoute>} />
                <Route path="/admin/carteira" element={<AdminRoute><Carteira /></AdminRoute>} />
                <Route path="/admin/gravacao/lotofacil" element={<AdminRoute><GravacaoLotofacil /></AdminRoute>} />
                <Route path="/admin/gravacao/quina" element={<AdminRoute><GravacaoQuina /></AdminRoute>} />
                <Route path="/admin/gravacao/megasena" element={<AdminRoute><GravacaoMegasena /></AdminRoute>} />
                <Route path="/admin/gravacao/resultado/lotofacil" element={<AdminRoute><GravacaoLotofacil /></AdminRoute>} />
                <Route path="/admin/gravacao/resultado/quina" element={<AdminRoute><GravacaoQuina /></AdminRoute>} />
                <Route path="/admin/gravacao/resultado/megasena" element={<AdminRoute><GravacaoMegasena /></AdminRoute>} />
                <Route path="/admin/gravacao/estudos/:loteria" element={<AdminRoute><GravacaoEstudos /></AdminRoute>} />
                <Route path="/admin/gravacao-estudo/megasena/posicoes-finais" element={<AdminRoute><PosicoesFinaisMegaSena /></AdminRoute>} />

                <Route path="/admin/chat" element={<AdminRoute><ChatAdmin /></AdminRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </UpsellProvider>
          </TooltipProvider>
        </PermissionProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
