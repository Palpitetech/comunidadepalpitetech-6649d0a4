import { Badge } from "@/components/ui/badge";

type Status = string | null | undefined;

const LABELS_LONG: Record<string, string> = {
  sent: "Enviada",
  failed: "Erro",
  sending: "Enviando",
  pending: "Aguardando",
};

const LABELS_SHORT: Record<string, string> = {
  sent: "Enviado",
  failed: "Falhou",
  sending: "Enviando",
  pending: "Pendente",
};

const CLASSES: Record<string, string> = {
  sent: "bg-green-500/15 text-green-700 border-green-500/30",
  failed: "bg-red-500/15 text-red-700 border-red-500/30",
  sending: "bg-blue-500/15 text-blue-700 border-blue-500/30",
};

export function MessageStatusBadge({
  status,
  variant = "long",
}: {
  status: Status;
  variant?: "long" | "short";
}) {
  const labels = variant === "short" ? LABELS_SHORT : LABELS_LONG;
  const text = (status && labels[status]) || status || "—";
  const cls = status ? CLASSES[status] : undefined;
  if (!cls) {
    return (
      <Badge variant="secondary" className="text-[11px]">
        {text}
      </Badge>
    );
  }
  return <Badge className={`${cls} text-[11px]`}>{text}</Badge>;
}

export function MessageStatusDot({ status }: { status: Status }) {
  const color =
    status === "sent"
      ? "bg-green-500"
      : status === "failed"
      ? "bg-red-500"
      : status === "sending"
      ? "bg-blue-500"
      : "bg-muted-foreground/40";
  return <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />;
}
