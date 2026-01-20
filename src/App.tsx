import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/comunidade" element={<Comunidade />} />
            <Route path="/notificacoes" element={<Notificacoes />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route path="/tendencias" element={<Tendencias />} />
            <Route path="/frequencia" element={<Frequencia />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/criar-post" element={<CriarPost />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
