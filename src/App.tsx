import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { GatedPage } from "@/components/shared/GatedPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import RecuperarSenha from "./pages/RecuperarSenha";
import Comunidade from "./pages/Comunidade";
import Chat from "./pages/Chat";
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
import AdminIndex from "./pages/admin/AdminIndex";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminBots from "./pages/admin/AdminBots";
import AdminCustos from "./pages/admin/AdminCustos";
import AdminConvites from "./pages/admin/AdminConvites";
import AdminVendas from "./pages/admin/AdminVendas";
import AnaliseDoDia from "./pages/AnaliseDoDia";
import TabelaMovimentacao from "./pages/TabelaMovimentacao";
import FrequenciaDezenas from "./pages/FrequenciaDezenas";
import DezenasporPosicao from "./pages/DezenasporPosicao";
import NotFound from "./pages/NotFound";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import Home from "./pages/Home";
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
import FechamentoDuplaSena from "./pages/duplasena/FechamentoDuplaSena";

const queryClient = new QueryClient();

// Main App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/privacidade" element={<Privacidade />} />

            {/* Rotas Protegidas - Requer Login */}
            <Route path="/home" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
            <Route path="/comunidade" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
            <Route path="/chat" element={<AdminRoute><Chat /></AdminRoute>} />
            <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
            <Route path="/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
            <Route path="/tendencias" element={<ProtectedRoute><GatedPage feature="tendencias"><Tendencias /></GatedPage></ProtectedRoute>} />
            <Route path="/linhas-colunas" element={<ProtectedRoute><GatedPage feature="linhas_colunas"><LinhasColunas /></GatedPage></ProtectedRoute>} />
            <Route path="/frequencia" element={<ProtectedRoute><GatedPage feature="quentes_frias"><Frequencia /></GatedPage></ProtectedRoute>} />
            <Route path="/smart-gerador" element={<ProtectedRoute><GatedPage feature="gerador"><Gerador /></GatedPage></ProtectedRoute>} />
            <Route path="/desdobramento" element={<ProtectedRoute><GatedPage feature="desdobramento"><Desdobramento /></GatedPage></ProtectedRoute>} />
            <Route path="/fechamento" element={<ProtectedRoute><GatedPage feature="fechamento"><Fechamento /></GatedPage></ProtectedRoute>} />
            <Route path="/meus-palpites" element={<ProtectedRoute><GatedPage feature="palpites_salvos"><MeusPalpites /></GatedPage></ProtectedRoute>} />
            <Route path="/boloes" element={<AdminRoute><Boloes /></AdminRoute>} />
            <Route path="/analise-do-dia" element={<ProtectedRoute><GatedPage feature="analise_do_dia"><AnaliseDoDia /></GatedPage></ProtectedRoute>} />
            <Route path="/tabela-movimentacao" element={<ProtectedRoute><GatedPage feature="tabela_movimentacao"><TabelaMovimentacao /></GatedPage></ProtectedRoute>} />
            <Route path="/frequencia-dezenas" element={<ProtectedRoute><GatedPage feature="frequencia_dezenas"><FrequenciaDezenas /></GatedPage></ProtectedRoute>} />
            <Route path="/dezenas-por-posicao" element={<ProtectedRoute><GatedPage feature="dezenas_por_posicao"><DezenasporPosicao /></GatedPage></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/criar-post" element={<ProtectedRoute><CriarPost /></ProtectedRoute>} />
            <Route path="/comunidade/post/:id" element={<PostDetalhes />} />
            <Route path="/convites" element={<ProtectedRoute><GatedPage feature="comunidade_full"><Convites /></GatedPage></ProtectedRoute>} />
            <Route path="/bloqueado" element={<Bloqueado />} />
            <Route path="/planos" element={<Planos />} />
            
            {/* Rotas Mega Sena */}
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
            
            {/* Rotas Dupla Sena */}
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
            
            {/* Rotas Admin */}
            <Route path="/admin" element={<AdminRoute><AdminIndex /></AdminRoute>} />
            <Route path="/admin/planos" element={<AdminRoute><AdminPlanos /></AdminRoute>} />
            <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />
            <Route path="/admin/bots" element={<AdminRoute><AdminBots /></AdminRoute>} />
            <Route path="/admin/custos" element={<AdminRoute><AdminCustos /></AdminRoute>} />
            <Route path="/admin/convites" element={<AdminRoute><AdminConvites /></AdminRoute>} />
            <Route path="/admin/vendas" element={<AdminRoute><AdminVendas /></AdminRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
