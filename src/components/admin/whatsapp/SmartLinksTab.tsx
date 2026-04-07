import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractInviteCode, generateSlug } from "@/lib/smartLinkRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, CheckCheck, Plus, Link2, QrCode, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SmartLink {
  id: string;
  slug: string;
  group_invite_code: string;
  group_name: string | null;
  original_url: string;
  clicks: number;
  is_active: boolean;
  created_at: string;
}

const BASE_URL = window.location.origin;

export function SmartLinksTab() {
  const { toast } = useToast();
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [originalUrl, setOriginalUrl] = useState("");
  const [groupName, setGroupName] = useState("");
  const [customSlug, setCustomSlug] = useState("");

  // QR modal
  const [qrSlug, setQrSlug] = useState<string | null>(null);

  const fetchLinks = async () => {
    const { data } = await supabase
      .from("whatsapp_smart_links")
      .select("*")
      .order("created_at", { ascending: false });
    setLinks((data as SmartLink[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCreate = async () => {
    const code = extractInviteCode(originalUrl);
    if (!code) {
      toast({ title: "URL inválida", description: "Cole um link válido do formato https://chat.whatsapp.com/XXXXX", variant: "destructive" });
      return;
    }

    setCreating(true);
    const slug = customSlug.trim() || generateSlug();

    const { error } = await supabase.from("whatsapp_smart_links").insert({
      slug,
      group_invite_code: code,
      group_name: groupName.trim() || null,
      original_url: originalUrl.trim(),
    });

    if (error) {
      toast({ title: "Erro ao criar", description: error.message.includes("unique") ? "Esse slug já está em uso" : error.message, variant: "destructive" });
    } else {
      toast({ title: "Smart Link criado!" });
      setOriginalUrl("");
      setGroupName("");
      setCustomSlug("");
      setDialogOpen(false);
      fetchLinks();
    }
    setCreating(false);
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("whatsapp_smart_links").update({ is_active: active }).eq("id", id);
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, is_active: active } : l)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este smart link?")) return;
    await supabase.from("whatsapp_smart_links").delete().eq("id", id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Smart link excluído" });
  };

  const handleCopy = async (slug: string, id: string) => {
    await navigator.clipboard.writeText(`${BASE_URL}/g/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getQrUrl = (slug: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${BASE_URL}/g/${slug}`)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Links inteligentes para convite de grupos WhatsApp
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Novo Smart Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Smart Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Link do grupo WhatsApp *</Label>
                <Input
                  placeholder="https://chat.whatsapp.com/AbC123XyZ"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nome do grupo (opcional)</Label>
                <Input
                  placeholder="Ex: Grupo VIP Lotofácil"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug personalizado (opcional)</Label>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <span>{BASE_URL}/g/</span>
                  <span className="font-medium">{customSlug || "auto"}</span>
                </div>
                <Input
                  placeholder="grupo-vip (deixe vazio para gerar)"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating || !originalUrl.trim()} className="w-full">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar Smart Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {links.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum smart link criado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <Card key={link.id} className={!link.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {link.group_name || link.slug}
                  </CardTitle>
                  <Switch
                    checked={link.is_active}
                    onCheckedChange={(v) => handleToggle(link.id, v)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">
                    {BASE_URL}/g/{link.slug}
                  </code>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => handleCopy(link.slug, link.id)}>
                    {copiedId === link.id ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setQrSlug(qrSlug === link.slug ? null : link.slug)}>
                    <QrCode className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => window.open(`/g/${link.slug}`, "_blank")}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => handleDelete(link.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {qrSlug === link.slug && (
                  <div className="flex justify-center pt-2">
                    <img src={getQrUrl(link.slug)} alt="QR Code" className="rounded-lg border" width={200} height={200} />
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>{link.clicks} cliques</span>
                  <span>Código: {link.group_invite_code.slice(0, 12)}...</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
