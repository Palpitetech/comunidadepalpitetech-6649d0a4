import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MobileInfoRowProps {
  icon: any;
  label: string;
  value: string;
  copyable?: boolean;
}

export function MobileInfoRow({ icon: Icon, label, value, copyable }: MobileInfoRowProps) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="mt-1 p-0.5 text-gray-400 shrink-0">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0 border-b border-gray-50 pb-4 last:border-0 overflow-hidden text-left">
        <p className="text-xs font-medium text-gray-400 mb-0.5 tracking-tight uppercase">{label}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-bold text-gray-900 truncate leading-snug break-all">
            {value || <span className="text-gray-300 italic font-normal text-sm">Não informado</span>}
          </p>
          {copyable && value && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-300 hover:text-gray-500 hover:bg-gray-50 shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(value);
                toast.success(`${label} copiado!`);
              }}
            >
              <Copy size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
