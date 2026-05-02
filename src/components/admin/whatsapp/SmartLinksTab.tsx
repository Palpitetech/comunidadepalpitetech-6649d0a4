import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractInviteCode, generateSlug } from "@/lib/smartLinkRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, CheckCheck, Plus, Link2, QrCode, Trash2, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

interface WaInstance {
  id: string;
  evolution_instance_id: string;
  phone_number: string | null;
  status: string;
}

interface WaGroup {
  id: string;
  subject: string;
}

const BASE_URL = window.location.origin;

export function SmartLinksTab() {
  const { toast } = useToast();
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrSlug, setQrSlug] = useState<string | null>(null);

  // Manual form
  const [originalUrl, setOriginalUrl] = useState("");
  const [groupName, setGroupName] = useState("");
  const [customSlug, setCustomSlug] = useState("");

  // Auto form
  const [instances, setInstances] = useState<WaInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState("");
  const [groups, setGroups] = useState<WaGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [autoGroupName, setAutoGroupName] = useState("");
  const [autoSlug, setAutoSlug] = useState("");

  const fetchLinks = async () => {
    const { data } = await supabase
      .from("whatsapp_smart_links")
      .select("*")
      .order("created_at", { ascending: false });
    setLinks((data as SmartLink[]) ?? []);
    setLoading(false);
  };

  const fetchInstances = useCallback(async () => {
    const { data } = await supabase
      .from("whatsapp_instances")
      .select("id, evolution_instance_id, phone_number, status")
      .eq("status", "online");
    setInstances((data as WaInstance[]) ?? []);
  }, []);

  useEffect(() => { fetchLinks(); }, []);

  useEffect(() => {
    if (dialogOpen) fetchInstances();
  }, [dialogOpen, fetchInstances]);

  // Fetch groups when instance changes
  useEffect(() => {
    if (!selectedInstance) { setGroups([]); return; }
    const inst = instances.find(i => i.id === selectedInstance);
    if (!inst) return;

    setLoadingGroups(true);
    setSelectedGroup("");
    setGroups([]);

    supabase.functions.invoke("evolution-proxy", {
      body: { action: "fetchGroups", instanceName: inst.evolution_instance_id },
    }).then(({ data, error }) => {
      if (error) { console.error(error); setLoadingGroups(false); return; }
      const arr = Array.isArray(data) ? data : [];
      setGroups(arr.map((g: any) => ({ id: g.id || g.jid, subject: g.subject || g.name || g.id })));
      setLoadingGroups(false);
    });
  }, [selectedInstance, instances]);

  const handleCreateAuto = async () => {
    if (!selectedGroup || !selectedInstance) return;
    setCreating(true);

    const inst = instances.find(i => i.id === selectedInstance);
    if (!inst) { setCreating(false); return; }

    // Get invite code from Evolution API
    const { data: codeData, error: codeErr } = await supabase.functions.invoke("evolution-proxy", {
      body: { action: "groupInviteCode", instanceName: inst.evolution_instance_id, groupJid: selectedGroup },
    });

    if (codeErr || !codeData) {
      toast({ title: "Erro ao obter código de convite", description: codeErr?.message || "Tente novamente", variant: "destructive" });
      setCreating(false);
      return;
    }

    const inviteCode = codeData?.inviteCode || codeData?.code || codeData?.invite || "";
    if (!inviteCode) {
      toast({ title: "Código de convite não encontrado", description: "A API não retornou o código. Tente o modo manual.", variant: "destructive" });
      setCreating(false);
      return;
    }

    const group = groups.find(g => g.id === selectedGroup);
    const name = autoGroupName.trim() || group?.subject || "";
    const slug = autoSlug.trim() || generateSlug();

    const { error } = await supabase.from("whatsapp_smart_links").insert({
      slug,
      group_invite_code: inviteCode,
      group_name: name || null,
      original_url: `https://chat.whatsapp.com/${inviteCode}`,
    });

    if (error) {
      toast({ title: "Erro ao criar", description: error.message.includes("unique") ? "Esse slug já está em uso" : error.message, variant: "destructive" });
    } else {
      toast({ title: "Smart Link criado!" });
      resetForm();
      setDialogOpen(false);
      fetchLinks();
    }
    setCreating(false);
  };

  const handleCreateManual = async () => {
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
      resetForm();
      setDialogOpen(false);
      fetchLinks();
    }
    setCreating(false);
  };

  const resetForm = () => {
    setOriginalUrl(""); setGroupName(""); setCustomSlug("");
    setSelectedInstance(""); setSelectedGroup(""); setAutoGroupName(""); setAutoSlug("");
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("whatsapp_smart_links").update({ is_active: active }).eq("id", id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: active } : l));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este smart link?")) return;
    await supabase.from("whatsapp_smart_links").delete().eq("id", id);
    setLinks(prev => prev.filter(l => l.id !== id));
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
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={
          <ActionButton
            label="Novo Smart Link"
            icon={Plus}
            onClick={() => setDialogOpen(true)}
            variant="default"
          />
        }
        right={
          <ActionButton
            label="Atualizar"
            icon={RefreshCw}
            onClick={fetchLinks}
          />
        }
      />

      <UnifiedList
        isLoading={loading}
        count={links.length}
        empty={{
          icon: Link2,
          message: "Nenhum smart link criado",
          submessage: "Links inteligentes facilitam a entrada em grupos"
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {links.map((link) => (
            <UnifiedCardItem
              key={link.id}
              className={cn(
                "space-y-3",
                !link.is_active && "opacity-60 grayscale-[0.5]"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{link.group_name || link.slug}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{BASE_URL}/g/{link.slug}</p>
                  </div>
                </div>
                <Switch checked={link.is_active} onCheckedChange={(v) => handleToggle(link.id, v)} className="scale-75" />
              </div>

              <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                <Badge variant="secondary" className="h-5 px-2 font-bold tabular-nums">
                  {link.clicks} cliques
                </Badge>
                <span className="truncate opacity-70">Convite: {link.group_invite_code.slice(0, 10)}...</span>
              </div>

              <div className="flex items-center gap-1 pt-2 border-t border-border">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopy(link.slug, link.id)}>
                  {copiedId === link.id ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setQrSlug(qrSlug === link.slug ? null : link.slug)}>
                  <QrCode className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(`/g/${link.slug}`, "_blank")}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <div className="flex-1" />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(link.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {qrSlug === link.slug && (
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img src={getQrUrl(link.slug)} alt="QR Code" width={160} height={160} />
                </div>
              )}
            </UnifiedCardItem>
          ))}
        </div>
      </UnifiedList>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          {/* ... existing form content ... */}
        </DialogContent>
      </Dialog>
    </UnifiedLayout>
  );
}
