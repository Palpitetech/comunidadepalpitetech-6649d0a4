import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function FeedHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Comunidade
        </h1>
      </div>
      <Button
        onClick={() => navigate("/criar-post")}
        className="gap-2"
        size="sm"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Criar Post</span>
      </Button>
    </div>
  );
}
