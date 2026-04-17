import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Central = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Palpite Tech" 
            className="h-10 w-10 rounded-xl shadow-sm"
          />
          <span className="font-extrabold text-2xl text-primary tracking-tight">Palpite Tech</span>
        </div>
        <Button 
          onClick={() => navigate("/login")}
          className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          Entrar
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-20 bg-gradient-to-b from-white to-[#F1F0FB]">
        <div className="max-w-3xl w-full text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight">
            Central completa para você fazer sua <span className="text-primary">fézinha</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-medium">
            O que deseja fazer agora?
          </p>
        </div>
      </main>
    </div>
  );
};

export default Central;
