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
import Notificacoes from "./pages/Notificacoes";
import Resultados from "./pages/Resultados";
import Tendencias from "./pages/Tendencias";
import Frequencia from "./pages/Frequencia";
import Perfil from "./pages/Perfil";
import CriarPost from "./pages/CriarPost";
import PostDetalhes from "./pages/PostDetalhes";
import Bloqueado from "./pages/Bloqueado";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import NotFound from "./pages/NotFound";

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
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/comunidade" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
            <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
            <Route path="/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
            <Route path="/tendencias" element={<ProtectedRoute><Tendencias /></ProtectedRoute>} />
            <Route path="/frequencia" element={<ProtectedRoute><Frequencia /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/criar-post" element={<ProtectedRoute><CriarPost /></ProtectedRoute>} />
            <Route path="/comunidade/post/:id" element={<ProtectedRoute><PostDetalhes /></ProtectedRoute>} />
            <Route path="/bloqueado" element={<Bloqueado />} />
            
            {/* Rotas Admin */}
            <Route path="/admin/planos" element={<AdminRoute><AdminPlanos /></AdminRoute>} />
            <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
