import { useState, useRef, ChangeEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, X, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LOTERIAS = [
  "Lotofácil",
  "Mega-Sena",
  "Quina",
  "Lotomania",
  "Dupla Sena",
];

interface LocationState {
  snapshotImage?: string;
  snapshotTitle?: string;
}

export default function CriarPost() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const state = location.state as LocationState | null;

  const [titulo, setTitulo] = useState(state?.snapshotTitle || "");
  const [conteudo, setConteudo] = useState("");
  const [loteria, setLoteria] = useState("Lotofácil");
  const [mediaPreview, setMediaPreview] = useState<string | null>(
    state?.snapshotImage || null
  );
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSnapshot, setIsSnapshot] = useState(!!state?.snapshotImage);

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      let mediaUrl: string | null = null;

      // Upload de mídia se houver
      if (mediaFile || isSnapshot) {
        let fileToUpload: File;

        if (isSnapshot && mediaPreview) {
          // Converter base64 para File
          const res = await fetch(mediaPreview);
          const blob = await res.blob();
          fileToUpload = new File([blob], `snapshot-${Date.now()}.png`, {
            type: "image/png",
          });
        } else if (mediaFile) {
          fileToUpload = mediaFile;
        } else {
          throw new Error("Nenhuma mídia para upload");
        }

        const fileName = `${user.id}/${Date.now()}-${fileToUpload.name}`;
        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(fileName, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("post-media")
          .getPublicUrl(fileName);

        mediaUrl = urlData.publicUrl;
      }

      // Criar post
      const { error } = await supabase.from("postagens").insert({
        user_id: user.id,
        titulo: titulo.trim() || null,
        conteudo: conteudo.trim(),
        loteria_tag: loteria,
        media_url: mediaUrl,
        media_type: mediaUrl ? "image" : null,
        tool_snapshot: isSnapshot,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Post publicado com sucesso!");
      navigate("/comunidade");
    },
    onError: (error) => {
      console.error("Erro ao criar post:", error);
      toast.error("Erro ao publicar. Tente novamente.");
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande. Máximo 5MB.");
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setIsSnapshot(false);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setIsSnapshot(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canSubmit = conteudo.trim().length > 0;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="-ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Criar Post</h1>
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título (opcional)</Label>
            <Input
              id="titulo"
              placeholder="Ex: Minha estratégia para o próximo sorteio"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Loteria */}
          <div className="space-y-2">
            <Label htmlFor="loteria">Loteria</Label>
            <Select value={loteria} onValueChange={setLoteria}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a loteria" />
              </SelectTrigger>
              <SelectContent>
                {LOTERIAS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo *</Label>
            <Textarea
              id="conteudo"
              placeholder="Compartilhe sua análise, palpite ou estratégia..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="min-h-[150px] resize-none"
            />
          </div>

          {/* Mídia */}
          <div className="space-y-2">
            <Label>Imagem (opcional)</Label>
            {mediaPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full max-h-[300px] object-contain bg-muted"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
                {isSnapshot && (
                  <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                    📷 Captura de tela
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Clique para adicionar imagem</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Botão de publicar */}
        <Button
          onClick={() => createPostMutation.mutate()}
          disabled={!canSubmit || createPostMutation.isPending}
          className="w-full h-12"
        >
          {createPostMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publicando...
            </>
          ) : (
            "Publicar"
          )}
        </Button>
      </div>
    </MainLayout>
  );
}
