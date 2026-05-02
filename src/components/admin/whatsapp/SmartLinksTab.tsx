import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractInviteCode, generateSlug } from "@/lib/smartLinkRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, CheckCheck, Plus, Link2, QrCode, Trash2, 
  ExternalLink, Loader2, RefreshCw, Hash, Info, Calendar, MousePointer2, Play, Pause
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";
import { AdminListContainer, AdminListItem } from "../AdminListComponents";
import { MobileInfoRow } from "./shared/MobileInfoRow";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [selectedLink, setSelectedLink] = useState<SmartLink | null>(null);
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
      toast({ title: "Código de convite não encontrado", variant: "destructive" });
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
      toast({ title: "Erro ao criar", description: error.message.includes("unique") ? "Slug em uso" : error.message, variant: "destructive" });
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
      toast({ title: "URL inválida", variant: "destructive" });
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
      toast({ title: "Erro ao criar", variant: "destructive" });
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
    if (selectedLink?.id === id) setSelectedLink({ ...selectedLink, is_active: active });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    await supabase.from("whatsapp_smart_links").delete().eq("id", id);
    setLinks(prev => prev.filter(l => l.id !== id));
    toast({ title: "Excluído" });
  };

  const handleCopy = async (slug: string, id: string) => {
    await navigator.clipboard.writeText(`${BASE_URL}/g/${slug}`);
    setCopiedId(id);
    toast({ title: "Copiado!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getQrUrl = (slug: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${BASE_URL}/g/${slug}`)}`;

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={<ActionButton label="Novo Smart Link" icon={Plus} onClick={() => setDialogOpen(true)} variant="default" />}
        right={<ActionButton label="Atualizar" icon={RefreshCw} onClick={fetchLinks} />}
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
        {/* Desktop View */}
        <div className="hidden md:grid gap-3 md:grid-cols-2">
          {links.map((link) => (
            <UnifiedCardItem key={link.id} className={cn("space-y-3", !link.is_active && "opacity-60 grayscale-[0.5]")}>
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
                <Badge variant="secondary" className="h-5 px-2 font-bold tabular-nums">{link.clicks} cliques</Badge>
                <span className="truncate opacity-70">Convite: {link.group_invite_code.slice(0, 10)}...</span>
              </div>
              <div className="flex items-center gap-1 pt-2 border-t border-border">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopy(link.slug, link.id)}>
                  {copiedId === link.id ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setQrSlug(qrSlug === link.slug ? null : link.slug)}><QrCode className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(`/g/${link.slug}`, "_blank")}><ExternalLink className="h-3.5 w-3.5" /></Button>
                <div className="flex-1" />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(link.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </UnifiedCardItem>
          ))}
        </div>

        {/* Mobile View - Eventos Style */}
        <div className="md:hidden border-t border-border/40">
          <AdminListContainer loading={loading && links.length === 0}>
            {links.map((link) => (
              <AdminListItem
                key={link.id}
                onClick={() => setSelectedLink(link)}
                title={link.group_name || link.slug}
                badge={{
                  text: `${link.clicks} cliques`,
                  color: "bg-blue-500/10 text-blue-700 border-blue-200/50",
                  icon: MousePointer2
                }}
                subtitle={`${BASE_URL}/g/${link.slug}`}
                timestamp={format(new Date(link.created_at), "HH:mm", { locale: ptBR })}
              />
            ))}
          </AdminListContainer>
        </div>
      </UnifiedList>

      {/* Mobile Detail View */}
      {selectedLink && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-white shrink-0 z-50 relative">
            <Button variant="ghost" size="icon" onClick={() => setSelectedLink(null)} className="text-gray-500"><X size={24} /></Button>
            <h2 className="text-base font-bold absolute left-1/2 -translate-x-1/2">Link Inteligente</h2>
            <Button variant="ghost" size="icon" onClick={fetchLinks} className="text-gray-500"><RefreshCw size={22} /></Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-white p-4 space-y-6">
            <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4 border border-gray-100/50">
              <div className={cn("p-3 rounded-2xl shrink-0 flex items-center justify-center", selectedLink.is_active ? "bg-green-500/10" : "bg-gray-100")}>
                <Link2 size={28} className={selectedLink.is_active ? "text-green-600" : "text-gray-400"} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedLink.group_name || selectedLink.slug}</h3>
                <p className="text-sm text-gray-500 mt-0.5 font-medium">{format(new Date(selectedLink.created_at), "dd 'de' MMMM", { locale: ptBR })}</p>
                <Badge variant={selectedLink.is_active ? "default" : "secondary"} className="mt-2">{selectedLink.is_active ? "Ativo" : "Pausado"}</Badge>
              </div>
            </div>
            <div className="space-y-5 px-1">
              <MobileInfoRow icon={Link2} label="URL Curta" value={`${BASE_URL}/g/${selectedLink.slug}`} copyable />
              <MobileInfoRow icon={ExternalLink} label="URL Destino" value={selectedLink.original_url} copyable />
              <MobileInfoRow icon={MousePointer2} label="Cliques Totais" value={String(selectedLink.clicks)} />
              <MobileInfoRow icon={Hash} label="ID" value={selectedLink.id} copyable />
            </div>

            <div className="bg-gray-50 rounded-[18px] p-6 border border-gray-100 flex flex-col items-center gap-3">
               <h4 className="text-sm font-semibold text-gray-600">QR Code para Divulgação</h4>
               <img src={getQrUrl(selectedLink.slug)} alt="QR Code" width={200} height={200} className="bg-white p-2 rounded-xl shadow-sm" />
               <Button variant="outline" className="w-full mt-2" onClick={() => handleCopy(selectedLink.slug, selectedLink.id)}>Copiar Link</Button>
            </div>

            <div className="pt-4 space-y-3">
              <Button variant="outline" className="w-full h-14 border-border rounded-[18px] text-lg font-bold" onClick={() => handleToggle(selectedLink.id, !selectedLink.is_active)}>
                {selectedLink.is_active ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                {selectedLink.is_active ? "Desativar Link" : "Ativar Link"}
              </Button>
              <Button variant="ghost" className="w-full h-12 text-destructive font-bold" onClick={() => { handleDelete(selectedLink.id); setSelectedLink(null); }}>Excluir Link</Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sheet View */}
      <Sheet open={!!selectedLink && window.innerWidth >= 768} onOpenChange={(open) => !open && setSelectedLink(null)}>
        <SheetContent side="right" className="p-0 flex flex-col md:max-w-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <SheetTitle>Detalhes do Smart Link</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setSelectedLink(null)}><X className="h-5 w-5" /></Button>
          </div>
          <ScrollArea className="flex-1 bg-white p-4">
            {selectedLink && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4">
                  <div className={cn("p-3 rounded-2xl", selectedLink.is_active ? "bg-green-500/10" : "bg-gray-100")}>
                    <Link2 size={28} className={selectedLink.is_active ? "text-green-600" : "text-gray-400"} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{selectedLink.group_name || selectedLink.slug}</h3>
                    <p className="text-sm text-gray-500">{format(new Date(selectedLink.created_at), "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <MobileInfoRow icon={Link2} label="URL Curta" value={`${BASE_URL}/g/${selectedLink.slug}`} copyable />
                  <MobileInfoRow icon={ExternalLink} label="URL Destino" value={selectedLink.original_url} />
                  <MobileInfoRow icon={MousePointer2} label="Cliques" value={String(selectedLink.clicks)} />
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Novo Smart Link</DialogTitle></DialogHeader>
          <Tabs defaultValue="auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Automático</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            <TabsContent value="auto" className="space-y-4 pt-4">
               <div className="space-y-2">
                  <Label>Instância WhatsApp</Label>
                  <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{instances.map(i => <SelectItem key={i.id} value={i.id}>{i.evolution_instance_id}</SelectItem>)}</SelectContent>
                  </Select>
               </div>
               <Button className="w-full" onClick={handleCreateAuto} disabled={creating || !selectedGroup}>{creating ? "Criando..." : "Criar"}</Button>
            </TabsContent>
            <TabsContent value="manual" className="space-y-4 pt-4">
               <div className="space-y-2">
                  <Label>URL do Grupo</Label>
                  <Input placeholder="https://chat.whatsapp.com/..." value={originalUrl} onChange={e => setOriginalUrl(e.target.value)} />
               </div>
               <Button className="w-full" onClick={handleCreateManual} disabled={creating || !originalUrl}>{creating ? "Criando..." : "Criar"}</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </UnifiedLayout>
  );
}
