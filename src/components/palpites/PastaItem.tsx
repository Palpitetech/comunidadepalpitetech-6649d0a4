import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, ChevronDown, Folder, MoreVertical, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Pasta {
  id: string;
  nome: string;
  cor: string;
  count?: number;
}

interface PastaItemProps {
  pasta: Pasta;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: (nome: string) => void;
  onDelete: () => void;
  children?: React.ReactNode;
}

export function PastaItem({
  pasta,
  isExpanded,
  onToggle,
  onRename,
  onDelete,
  children,
}: PastaItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(pasta.nome);

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(pasta.nome);
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg border bg-card transition-colors",
          isExpanded && "bg-muted/50"
        )}
      >
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Folder 
            className="h-5 w-5" 
            style={{ color: pasta.cor }}
          />
          
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-7 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                <Check className="h-4 w-4 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <span className="font-medium flex-1">{pasta.nome}</span>
              {pasta.count !== undefined && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {pasta.count}
                </span>
              )}
            </>
          )}
        </button>

        {!isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem 
                onClick={() => setIsEditing(true)} 
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Excluir pasta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {isExpanded && children && (
        <div className="pl-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
