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
import AdminIndex from "./pages/admin/AdminIndex";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminBots from "./pages/admin/AdminBots";
import PalpiteDoDia from "./pages/PalpiteDoDia";
import NotFound from "./pages/NotFound";
import ResultadosMegaSena from "./pages/megasena/ResultadosMegaSena";
import TendenciasMegaSena from "./pages/megasena/TendenciasMegaSena";
import FrequenciaMegaSena from "./pages/megasena/FrequenciaMegaSena";
import GeradorMegaSena from "./pages/megasena/GeradorMegaSena";

const queryClient = new QueryClient();

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

            {/* Rotas Protegidas - Requer Login */}
            <Route path="/" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
            <Route path="/comunidade" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
            <Route path="/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
            <Route path="/tendencias" element={<ProtectedRoute><Tendencias /></ProtectedRoute>} />
            <Route path="/linhas-colunas" element={<ProtectedRoute><LinhasColunas /></ProtectedRoute>} />
            <Route path="/frequencia" element={<ProtectedRoute><Frequencia /></ProtectedRoute>} />
            <Route path="/smart-gerador" element={<ProtectedRoute><Gerador /></ProtectedRoute>} />
            <Route path="/desdobramento" element={<ProtectedRoute><Desdobramento /></ProtectedRoute>} />
            <Route path="/fechamento" element={<ProtectedRoute><Fechamento /></ProtectedRoute>} />
            <Route path="/meus-palpites" element={<ProtectedRoute><MeusPalpites /></ProtectedRoute>} />
            <Route path="/boloes" element={<ProtectedRoute><Boloes /></ProtectedRoute>} />
            <Route path="/palpite-do-dia" element={<ProtectedRoute><PalpiteDoDia /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/criar-post" element={<ProtectedRoute><CriarPost /></ProtectedRoute>} />
            <Route path="/comunidade/post/:id" element={<ProtectedRoute><PostDetalhes /></ProtectedRoute>} />
            <Route path="/bloqueado" element={<Bloqueado />} />
            
            {/* Rotas Mega Sena */}
            <Route path="/megasena/resultados" element={<ProtectedRoute><ResultadosMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/tendencias" element={<ProtectedRoute><TendenciasMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/frequencia" element={<ProtectedRoute><FrequenciaMegaSena /></ProtectedRoute>} />
            <Route path="/megasena/gerador" element={<ProtectedRoute><GeradorMegaSena /></ProtectedRoute>} />
            
            {/* Rotas Admin */}
            <Route path="/admin" element={<AdminRoute><AdminIndex /></AdminRoute>} />
            <Route path="/admin/planos" element={<AdminRoute><AdminPlanos /></AdminRoute>} />
            <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />
            <Route path="/admin/bots" element={<AdminRoute><AdminBots /></AdminRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
