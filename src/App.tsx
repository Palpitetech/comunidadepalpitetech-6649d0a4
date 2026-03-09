import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
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
import AnaliseDoDia from "./pages/AnaliseDoDia";
import TabelaMovimentacao from "./pages/TabelaMovimentacao";
import FrequenciaDezenas from "./pages/FrequenciaDezenas";
import DezenasporPosicao from "./pages/DezenasporPosicao";
import NotFound from "./pages/NotFound";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
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
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/privacidade" element={<Privacidade />} />

            {/* Rotas Protegidas - Requer Login */}
            <Route path="/" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
            <Route path="/comunidade" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
            <Route path="/chat" element={<AdminRoute><Chat /></AdminRoute>} />
            <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
            <Route path="/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
            <Route path="/tendencias" element={<ProtectedRoute><Tendencias /></ProtectedRoute>} />
            <Route path="/linhas-colunas" element={<ProtectedRoute><LinhasColunas /></ProtectedRoute>} />
            <Route path="/frequencia" element={<ProtectedRoute><Frequencia /></ProtectedRoute>} />
            <Route path="/smart-gerador" element={<ProtectedRoute><Gerador /></ProtectedRoute>} />
            <Route path="/desdobramento" element={<ProtectedRoute><Desdobramento /></ProtectedRoute>} />
            <Route path="/fechamento" element={<ProtectedRoute><Fechamento /></ProtectedRoute>} />
            <Route path="/meus-palpites" element={<ProtectedRoute><MeusPalpites /></ProtectedRoute>} />
            <Route path="/boloes" element={<AdminRoute><Boloes /></AdminRoute>} />
            <Route path="/analise-do-dia" element={<ProtectedRoute><AnaliseDoDia /></ProtectedRoute>} />
            <Route path="/tabela-movimentacao" element={<ProtectedRoute><TabelaMovimentacao /></ProtectedRoute>} />
            <Route path="/frequencia-dezenas" element={<ProtectedRoute><FrequenciaDezenas /></ProtectedRoute>} />
            <Route path="/dezenas-por-posicao" element={<ProtectedRoute><DezenasporPosicao /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/criar-post" element={<ProtectedRoute><CriarPost /></ProtectedRoute>} />
            <Route path="/comunidade/post/:id" element={<PostDetalhes />} />
            <Route path="/convites" element={<ProtectedRoute><Convites /></ProtectedRoute>} />
            <Route path="/bloqueado" element={<Bloqueado />} />
            <Route path="/planos" element={<ProtectedRoute><Planos /></ProtectedRoute>} />
            
            {/* Rotas Mega Sena */}
            <Route path="/megasena/resultados" element={<ProtectedRoute><ResultadosMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/tendencias" element={<ProtectedRoute><TendenciasMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/frequencia" element={<ProtectedRoute><FrequenciaMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/gerador" element={<ProtectedRoute><GeradorMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/fechamento" element={<ProtectedRoute><FechamentoMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/desdobramento" element={<ProtectedRoute><DesdobramentoMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/linhas-colunas" element={<ProtectedRoute><LinhasColunasMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/analise-do-dia" element={<ProtectedRoute><AnaliseDoDiaMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/tabela-movimentacao" element={<ProtectedRoute><TabelaMovimentacaoMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/frequencia-dezenas" element={<ProtectedRoute><FrequenciaDecenasMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/dezenas-por-posicao" element={<ProtectedRoute><DezenasporPosicaoMegaSena /></ProtectedRoute>} />
            
            {/* Rotas Dupla Sena */}
            <Route path="/duplasena/resultados" element={<ProtectedRoute><ResultadosDuplaSena /></ProtectedRoute>} />
            <Route path="/duplasena/tendencias" element={<ProtectedRoute><TendenciasDuplaSena /></ProtectedRoute>} />
            <Route path="/duplasena/frequencia" element={<ProtectedRoute><FrequenciaDuplaSena /></ProtectedRoute>} />
            <Route path="/duplasena/dezenas-por-posicao" element={<ProtectedRoute><DezenasporPosicaoDuplaSena /></ProtectedRoute>} />
            <Route path="/duplasena/linhas-colunas" element={<ProtectedRoute><LinhasColunasDuplaSena /></ProtectedRoute>} />
            <Route path="/duplasena/analise-do-dia" element={<ProtectedRoute><AnaliseDoDiaDuplaSena /></ProtectedRoute>} />
            <Route path="/duplasena/gerador" element={<ProtectedRoute><GeradorDuplaSena /></ProtectedRoute>} />
            <Route path="/duplasena/desdobramento" element={<ProtectedRoute><DesdobramentoDuplaSena /></ProtectedRoute>} />
            <Route path="/duplasena/frequencia-dezenas" element={<ProtectedRoute><FrequenciaDecenasDuplaSena /></ProtectedRoute>} />
            <Route path="/duplasena/tabela-movimentacao" element={<ProtectedRoute><TabelaMovimentacaoDuplaSena /></ProtectedRoute>} />
            <Route path="/duplasena/fechamento" element={<ProtectedRoute><FechamentoDuplaSena /></ProtectedRoute>} />
            
            {/* Rotas Admin */}
            <Route path="/admin" element={<AdminRoute><AdminIndex /></AdminRoute>} />
            <Route path="/admin/planos" element={<AdminRoute><AdminPlanos /></AdminRoute>} />
            <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />
            <Route path="/admin/bots" element={<AdminRoute><AdminBots /></AdminRoute>} />
            <Route path="/admin/custos" element={<AdminRoute><AdminCustos /></AdminRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
