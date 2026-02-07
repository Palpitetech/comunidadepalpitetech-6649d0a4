import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePalpitesSalvos, type PalpiteSalvo } from "@/hooks/usePalpitesSalvos";
import { formatarDezena } from "@/lib/lotofacil";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Bookmark, 
  Trash2, 
  MoreVertical, 
  Copy, 
  Calendar,
  Dices,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function MeusPalpites() {
  const { buscarPalpites, excluirPalpite, excluirVarios, isLoading } = usePalpitesSalvos();
  const [palpites, setPalpites] = useState<PalpiteSalvo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [palpiteToDelete, setPalpiteToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPalpites();
  }, []);

  const loadPalpites = async () => {
    const data = await buscarPalpites();
    setPalpites(data);
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.size === palpites.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(palpites.map(p => p.id)));
    }
  };

  const handleCopiar = async (palpite: PalpiteSalvo) => {
    const texto = palpite.dezenas.map(formatarDezena).join(" ");
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: "Dezenas copiadas para a área de transferência.",
    });
  };

  const handleDelete = async (id: string) => {
    const success = await excluirPalpite(id);
    if (success) {
      setPalpites(prev => prev.filter(p => p.id !== id));
      setSelected(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
    setPalpiteToDelete(null);
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    const success = await excluirVarios(Array.from(selected));
    if (success) {
      setPalpites(prev => prev.filter(p => !selected.has(p.id)));
      setSelected(new Set());
    }
    setDeleteDialogOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM, HH:mm", { locale: ptBR });
  };

  return (
    <MainLayout>
      <div className="container-senior py-6 space-y-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Meus Palpites</h1>
          </div>
          {palpites.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {palpites.length} salvo{palpites.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Ações em massa */}
        {palpites.length > 0 && (
          <div className="flex items-center justify-between py-2">
            <Button
              variant={selected.size === palpites.length ? "default" : "outline"}
              size="sm"
              onClick={handleSelectAll}
              className="text-xs h-8"
            >
              {selected.size === palpites.length ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
            
            {selected.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-xs h-8 gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir ({selected.size})
              </Button>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Lista vazia */}
        {!isLoading && palpites.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Dices className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Nenhum palpite salvo</p>
                <p className="text-sm text-muted-foreground">
                  Gere palpites e salve seus favoritos
                </p>
              </div>
              <Link to="/gerador">
                <Button size="sm" className="gap-2">
                  <Dices className="h-4 w-4" />
                  Ir para o Gerador
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Lista de palpites */}
        {!isLoading && palpites.length > 0 && (
          <div className="space-y-2">
            {palpites.map((palpite) => (
              <Card 
                key={palpite.id}
                className={`transition-all ${
                  selected.has(palpite.id) 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : ""
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    {/* Checkbox + Conteúdo */}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleToggleSelect(palpite.id)}
                    >
                      {/* Dezenas */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {palpite.dezenas.map((d) => (
                          <span
                            key={d}
                            className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center"
                          >
                            {formatarDezena(d)}
                          </span>
                        ))}
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(palpite.created_at)}
                        </span>
                        {palpite.periodo_analise && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {palpite.periodo_analise} concursos
                          </span>
                        )}
                        {palpite.conferido && (
                          <Badge variant="outline" className="text-[10px] h-5 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {palpite.acertos} acertos
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Menu de ações */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => handleCopiar(palpite)} className="gap-2">
                          <Copy className="h-4 w-4" />
                          Copiar dezenas
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setPalpiteToDelete(palpite.id)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmação - Excluir único */}
      <AlertDialog open={!!palpiteToDelete} onOpenChange={() => setPalpiteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir palpite?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => palpiteToDelete && handleDelete(palpiteToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação - Excluir vários */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} palpite(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
