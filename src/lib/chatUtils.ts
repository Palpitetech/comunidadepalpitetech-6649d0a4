import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata número de telefone para exibição
 * Ex: 5511999999999 -> (11) 99999-9999
 */
export const formatPhoneDisplay = (phone: string) => {
  if (!phone) return "";
  
  // Remove 55 se existir no início
  let cleaned = phone.startsWith("55") ? phone.substring(2) : phone;
  
  // Apenas números
  cleaned = cleaned.replace(/\D/g, "");

  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  
  return phone;
};

/**
 * Exibe hora se hoje, data se outro dia
 * Ex: 14:32 ou 29/04
 */
export const formatChatTime = (isoString: string | null) => {
  if (!isoString) return "";
  
  try {
    const date = parseISO(isoString);
    if (isToday(date)) {
      return format(date, "HH:mm");
    }
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  } catch (err) {
    return "";
  }
};

/**
 * Trunca preview da última mensagem
 */
export const truncatePreview = (text: string | null, maxLength: number = 40) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
