import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Inst = {
  id: string;
  evolution_instance_id: string;
  friendly_name: string | null;
  status: string | null;
};

export function ProfilePictureCard() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [instances, setInstances] = useState<Inst[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadInstances();
  }, []);

  async function loadInstances() {
    const { data } = await supabase
      .from("whatsapp_instances" as any)
      .select("id, evolution_instance_id, friendly_name, status");
    setInstances(((data as any[]) ?? []) as Inst[]);
  }

  const onlineCount = instances.filter((i) => i.status === "online").length;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem (JPG ou PNG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2 MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `profile-pictures/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("whatsapp-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("whatsapp-assets").getPublicUrl(path);
      setImageUrl(pub.publicUrl);
      toast.success("Imagem enviada. Pronta para aplicar.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function applyToAll() {
    if (!imageUrl) {
      toast.error("Envie uma imagem ou cole uma URL primeiro.");
      return;
    }
    const targets = instances.filter((i) => i.status === "online");
    if (targets.length === 0) {
      toast.error("Nenhuma instância online para receber a foto.");
      return;
    }
    setApplying(true);
    let ok = 0;
    const failed: string[] = [];
    for (let i = 0; i < targets.length; i++) {
      const inst = targets[i];
      try {
        const { data, error } = await supabase.functions.invoke("evolution-proxy", {
          body: {
            action: "updateProfilePicture",
            instanceName: inst.evolution_instance_id,
            picture: imageUrl,
          },
        });
        if (error) throw error;
        if (data && (data as any).error) throw new Error((data as any).error);
        ok++;
      } catch (err: any) {
        failed.push(`${inst.friendly_name || inst.evolution_instance_id}: ${err?.message || "erro"}`);
      }
      // Pequeno delay anti rate-limit entre instâncias
      if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 1500));
    }
    setApplying(false);

    if (failed.length === 0) {
      toast.success(`Foto aplicada em ${ok} de ${targets.length} instâncias.`);
    } else {
      toast.warning(`${ok}/${targets.length} aplicadas. Falhas: ${failed.join(" | ")}`, {
        duration: 8000,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-4 w-4" />
          Foto de perfil das instâncias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[140px_1fr] items-start">
          <div className="relative w-[140px] h-[140px] rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Pré-visualização" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Imagem (JPG ou PNG, máx. 2 MB)</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFile}
                  disabled={uploading || applying}
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin self-center" />}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">ou cole uma URL pública</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={uploading || applying}
              />
            </div>

            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Apenas instâncias <strong>online</strong> recebem a foto. A atualização pode levar alguns minutos para
              aparecer no celular (cache do WhatsApp). {onlineCount} de {instances.length} instâncias estão online.
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full"
              disabled={!imageUrl || applying || uploading || onlineCount === 0}
            >
              {applying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aplicando em {onlineCount} instâncias...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Aplicar em todas as instâncias online ({onlineCount})
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Trocar foto de {onlineCount} instâncias?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação atualizará a foto de perfil do WhatsApp em todas as instâncias online. O processo
                leva cerca de {Math.ceil((onlineCount * 1.5) / 60)} minutos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={applyToAll}>Confirmar e aplicar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
