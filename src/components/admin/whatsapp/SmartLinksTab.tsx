import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractInviteCode, generateSlug } from "@/lib/smartLinkRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, CheckCheck, Plus, Link2, QrCode, Trash2, 
  ExternalLink, Loader2, RefreshCw, Hash, Info, Calendar, MousePointer2, Play, Pause, X
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
  plan_id: string | null;
  redirect_type: 'whatsapp' | 'checkout';
  plans?: {
    name: string;
    checkout_link: string | null;
  };
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
  const [plans, setPlans] = useState<{ id: string, name: string }[]>([]);

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

  // Checkout form
  const [selectedPlan, setSelectedPlan] = useState("");
  const [checkoutSlug, setCheckoutSlug] = useState("");
  const [checkoutName, setCheckoutName] = useState("");

  const fetchLinks = async () => {
    const { data } = await supabase
      .from("whatsapp_smart_links")
      .select("*, plans(name, checkout_link)")
      .order("created_at", { ascending: false });
    setLinks((data as any[]) ?? []);
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("plans")
      .select("id, name")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    setPlans(data ?? []);
  };

  const fetchInstances = useCallback(async () => {
    const { data } = await supabase
      .from("whatsapp_instances")
      .select("id, evolution_instance_id, phone_number, status")
      .eq("status", "online");
    setInstances((data as WaInstance[]) ?? []);
  }, []);

  useEffect(() => { 
    fetchLinks(); 
    fetchPlans();
  }, []);

  useEffect(() => {
    if (dialogOpen) fetchInstances();
  }, [dialogOpen, fetchInstances]);

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
      toast({ title: "Erro", description: "Falha ao obter convite", variant: "destructive" });
      setCreating(false); return;
    }

    const inviteCode = codeData?.inviteCode || codeData?.code || codeData?.invite || "";
    const group = groups.find(g => g.id === selectedGroup);
    const name = autoGroupName.trim() || group?.subject || "";
    const slug = autoSlug.trim() || generateSlug();

    const { error } = await supabase.from("whatsapp_smart_links").insert({
      slug, group_invite_code: inviteCode, group_name: name || null,
      original_url: `https://chat.whatsapp.com/${inviteCode}`,
    });

    if (!error) { toast({ title: "Link criado!" }); resetForm(); setDialogOpen(false); fetchLinks(); }
    setCreating(false);
  };

  const handleCreateManual = async () => {
    const code = extractInviteCode(originalUrl);
    if (!code) { toast({ title: "URL inválida", variant: "destructive" }); return; }
    setCreating(true);
    const slug = customSlug.trim() || generateSlug();
    const { error } = await supabase.from("whatsapp_smart_links").insert({
      slug, group_invite_code: code, group_name: groupName.trim() || null, original_url: originalUrl.trim(),
    });
    if (!error) { toast({ title: "Link criado!" }); resetForm(); setDialogOpen(false); fetchLinks(); }
    setCreating(false);
  };

  const handleCreateCheckout = async () => {
    if (!selectedPlan) return;
    setCreating(true);
    
    const plan = plans.find(p => p.id === selectedPlan);
    const slug = checkoutSlug.trim() || generateSlug();
    const name = checkoutName.trim() || plan?.name || "";

    const { error } = await supabase.from("whatsapp_smart_links").insert({
      slug,
      plan_id: selectedPlan,
      group_name: name || null,
      redirect_type: 'checkout',
      original_url: '', // Will be resolved during redirect
      group_invite_code: ''
    });

    if (!error) { 
      toast({ title: "Link de Checkout criado!" }); 
      resetForm(); 
      setDialogOpen(false); 
      fetchLinks(); 
    } else {
      toast({ title: "Erro ao criar link", variant: "destructive" });
    }
    setCreating(false);
  };

  const resetForm = () => {
    setOriginalUrl(""); setGroupName(""); setCustomSlug("");
    setSelectedInstance(""); setSelectedGroup(""); setAutoGroupName(""); setAutoSlug("");
    setSelectedPlan(""); setCheckoutSlug(""); setCheckoutName("");
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("whatsapp_smart_links").update({ is_active: active }).eq("id", id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: active } : l));
    if (selectedLink?.id === id) setSelectedLink({ ...selectedLink, is_active: active });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir?")) return;
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
        isLoading={loading} count={links.length}
        empty={{ icon: Link2, message: "Nenhum smart link", submessage: "Links inteligentes" }}
      >
        <div className="hidden md:grid gap-3 md:grid-cols-2">
          {links.map((link) => (
            <UnifiedCardItem key={link.id} className={cn("space-y-3", !link.is_active && "opacity-60")}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Link2 className="h-5 w-5 text-primary" /></div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{link.group_name || link.slug}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{BASE_URL}/g/{link.slug}</p>
                  </div>
                </div>
                <Switch checked={link.is_active} onCheckedChange={(v) => handleToggle(link.id, v)} />
              </div>
              <div className="flex items-center gap-1 pt-2 border-t border-border">
                <Button size="icon" variant="ghost" onClick={() => handleCopy(link.slug, link.id)}>{copiedId === link.id ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button>
                <Button size="icon" variant="ghost" onClick={() => setQrSlug(qrSlug === link.slug ? null : link.slug)}><QrCode className="h-4 w-4" /></Button>
                <div className="flex-1" />
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(link.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </UnifiedCardItem>
          ))}
        </div>

        <div className="md:hidden border-t border-border/40">
          <AdminListContainer loading={loading && links.length === 0}>
            {links.map((link) => (
              <AdminListItem
                key={link.id} onClick={() => setSelectedLink(link)} title={link.group_name || link.slug}
                badge={{ text: `${link.clicks} cliques`, color: "bg-blue-500/10 text-blue-700", icon: MousePointer2 }}
                subtitle={`${BASE_URL}/g/${link.slug}`}
                timestamp={format(new Date(link.created_at), "HH:mm", { locale: ptBR })}
              />
            ))}
          </AdminListContainer>
        </div>
      </UnifiedList>

      {selectedLink && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-white">
            <Button variant="ghost" size="icon" onClick={() => setSelectedLink(null)}><X size={24} /></Button>
            <h2 className="text-base font-bold">Smart Link</h2>
            <Button variant="ghost" size="icon" onClick={fetchLinks}><RefreshCw size={22} /></Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-white p-4 space-y-6">
            <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4">
              <div className={cn("p-3 rounded-2xl", selectedLink.is_active ? "bg-green-500/10" : "bg-gray-100")}><Link2 size={28} className={selectedLink.is_active ? "text-green-600" : "text-gray-400"} /></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">{selectedLink.group_name || selectedLink.slug}</h3>
                <p className="text-sm text-gray-500">{format(new Date(selectedLink.created_at), "dd/MM/yyyy")}</p>
              </div>
            </div>
            <div className="space-y-5">
              <MobileInfoRow icon={Link2} label="URL Curta" value={`${BASE_URL}/g/${selectedLink.slug}`} copyable />
              <MobileInfoRow icon={ExternalLink} label="URL Destino" value={selectedLink.original_url} copyable />
            </div>
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl border">
               <img src={getQrUrl(selectedLink.slug)} alt="QR" width={200} height={200} className="bg-white p-2" />
            </div>
          </div>
        </div>
      )}

      <Sheet open={!!selectedLink && window.innerWidth >= 768} onOpenChange={(open) => !open && setSelectedLink(null)}>
        <SheetContent side="right" className="p-0 flex flex-col md:max-w-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b"><SheetTitle>Detalhes</SheetTitle><Button variant="ghost" size="icon" onClick={() => setSelectedLink(null)}><X className="h-5 w-5" /></Button></div>
          <ScrollArea className="flex-1 bg-white p-4">
            {selectedLink && <div className="space-y-6">
              <div className="bg-gray-50 rounded-[20px] p-4 flex items-start gap-4">
                <div className={cn("p-3 rounded-2xl", selectedLink.is_active ? "bg-green-500/10" : "bg-gray-100")}><Link2 size={28} /></div>
                <div className="flex-1"><h3 className="font-bold text-gray-900">{selectedLink.group_name || selectedLink.slug}</h3></div>
              </div>
              <MobileInfoRow icon={Link2} label="URL Curta" value={`${BASE_URL}/g/${selectedLink.slug}`} copyable />
            </div>}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Novo Smart Link</DialogTitle></DialogHeader>
          <Tabs defaultValue="checkout">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checkout">Checkout</TabsTrigger>
              <TabsTrigger value="auto">Automático</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            <TabsContent value="checkout" className="space-y-4 pt-4">
               <div className="space-y-2">
                  <Label>Produto / Plano</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger><SelectValue placeholder="Selecione o produto..." /></SelectTrigger>
                    <SelectContent>
                      {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <Label>Nome Identificador (Opcional)</Label>
                  <Input value={checkoutName} onChange={e => setCheckoutName(e.target.value)} placeholder="Ex: Campanha Black Friday" />
               </div>
               <div className="space-y-2">
                  <Label>Slug Personalizado (Opcional)</Label>
                  <Input value={checkoutSlug} onChange={e => setCheckoutSlug(e.target.value)} placeholder="Ex: promo-especial" />
               </div>
               <Button className="w-full" onClick={handleCreateCheckout} disabled={creating || !selectedPlan}>
                 {creating ? "Criando..." : "Criar Link de Checkout"}
               </Button>
            </TabsContent>
               <div className="space-y-2"><Label>Instância</Label>
                  <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{instances.map(i => <SelectItem key={i.id} value={i.id}>{i.evolution_instance_id}</SelectItem>)}</SelectContent>
                  </Select>
               </div>
               <Button className="w-full" onClick={handleCreateAuto} disabled={creating}>{creating ? "Criando..." : "Criar"}</Button>
            </TabsContent>
            <TabsContent value="manual" className="space-y-4 pt-4">
               <div className="space-y-2"><Label>URL</Label><Input value={originalUrl} onChange={e => setOriginalUrl(e.target.value)} /></div>
               <Button className="w-full" onClick={handleCreateManual} disabled={creating}>{creating ? "Criando..." : "Criar"}</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </UnifiedLayout>
  );
}
