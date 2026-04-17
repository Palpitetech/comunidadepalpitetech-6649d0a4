import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Central = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F1F0FB]">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Palpite Tech" 
            className="h-8 w-8 rounded-lg"
          />
          <span className="font-bold text-xl text-primary">Palpite Tech</span>
        </div>
        <Button 
          onClick={() => navigate("/login")}
          className="bg-primary hover:bg-primary/90 text-white font-semibold px-6"
        >
          Entrar
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Central completa para você fazer sua fézinha o que deseja fazer agora?
        </h1>
      </main>
    </div>
  );
};

export default Central;
