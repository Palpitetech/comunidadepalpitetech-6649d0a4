import { RefObject, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface SnapshotButtonProps {
  targetRef: RefObject<HTMLElement>;
  defaultTitle?: string;
}

export function SnapshotButton({ targetRef, defaultTitle }: SnapshotButtonProps) {
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    if (!targetRef.current) {
      toast.error("Elemento não encontrado para captura");
      return;
    }

    setIsCapturing(true);

    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imageDataUrl = canvas.toDataURL("image/png");

      // Navega para criar post com a imagem no state
      navigate("/criar-post", {
        state: {
          snapshotImage: imageDataUrl,
          snapshotTitle: defaultTitle || "Minha análise",
        },
      });

      toast.success("Captura realizada! Complete seu post.");
    } catch (error) {
      console.error("Erro ao capturar:", error);
      toast.error("Erro ao capturar a tela");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCapture}
      disabled={isCapturing}
      className="gap-2"
      title="Postar análise"
    >
      <Camera className="h-4 w-4" />
      <span className="hidden sm:inline">
        {isCapturing ? "Capturando..." : "Postar"}
      </span>
    </Button>
  );
}
