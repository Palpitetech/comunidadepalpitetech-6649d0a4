import { useState, useEffect, useCallback } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Links inteligentes para convite de grupos WhatsApp</p>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Novo Smart Link</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Criar Smart Link</DialogTitle></DialogHeader>
            <Tabs defaultValue="auto" className="pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="auto" className="flex-1">Automático</TabsTrigger>
                <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
              </TabsList>

              {/* ===== AUTOMÁTICO ===== */}
              <TabsContent value="auto" className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Instância</Label>
                  <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                    <SelectTrigger><SelectValue placeholder="Selecione uma instância" /></SelectTrigger>
                    <SelectContent>
                      {instances.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.evolution_instance_id} {inst.phone_number ? `(${inst.phone_number})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedInstance && (
                  <div className="space-y-1.5">
                    <Label>Grupo</Label>
                    {loadingGroups ? (
                      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando grupos...
                      </div>
                    ) : (
                      <Select value={selectedGroup} onValueChange={(v) => {
                        setSelectedGroup(v);
                        const g = groups.find(g => g.id === v);
                        if (g) setAutoGroupName(g.subject);
                      }}>
                        <SelectTrigger><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
                        <SelectContent>
                          {groups.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {selectedGroup && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Nome do grupo (editável)</Label>
                      <Input value={autoGroupName} onChange={e => setAutoGroupName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Slug personalizado (opcional)</Label>
                      <div className="text-xs text-muted-foreground mb-1">{BASE_URL}/g/{autoSlug || "auto"}</div>
                      <Input placeholder="grupo-vip" value={autoSlug} onChange={e => setAutoSlug(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())} />
                    </div>
                  </>
                )}

                <Button onClick={handleCreateAuto} disabled={creating || !selectedGroup} className="w-full">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Smart Link
                </Button>
              </TabsContent>

              {/* ===== MANUAL ===== */}
              <TabsContent value="manual" className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Link do grupo WhatsApp *</Label>
                  <Input placeholder="https://chat.whatsapp.com/AbC123XyZ" value={originalUrl} onChange={e => setOriginalUrl(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nome do grupo (opcional)</Label>
                  <Input placeholder="Ex: Grupo VIP Lotofácil" value={groupName} onChange={e => setGroupName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug personalizado (opcional)</Label>
                  <div className="text-xs text-muted-foreground mb-1">{BASE_URL}/g/{customSlug || "auto"}</div>
                  <Input placeholder="grupo-vip" value={customSlug} onChange={e => setCustomSlug(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())} />
                </div>
                <Button onClick={handleCreateManual} disabled={creating || !originalUrl.trim()} className="w-full">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Smart Link
                </Button>
              </TabsContent>
            </Tabs>
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
          {links.map(link => (
            <Card key={link.id} className={!link.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{link.group_name || link.slug}</CardTitle>
                  <Switch checked={link.is_active} onCheckedChange={v => handleToggle(link.id, v)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">{BASE_URL}/g/{link.slug}</code>
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
