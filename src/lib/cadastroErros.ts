/**
 * Mapeamento centralizado dos códigos de erro retornados pelas Edge Functions
 * de cadastro (cadastro-verificar-email, cadastro-verificar-whatsapp,
 * cadastro-iniciar-whatsapp). Mantém a UI consistente sem repetir strings.
 */

export type CodigoErroCadastro =
  | "EXPIRADO"
  | "BLOQUEADO"
  | "INCORRETO"
  | "AGUARDE"
  | "JA_CADASTRADO"
  | "CELULAR_EM_USO"
  | "WHATSAPP_NAO_VERIFICADO"
  | "EMAIL_NAO_VERIFICADO"
  | string;

const MENSAGENS: Record<string, string> = {
  EXPIRADO: "Código expirado. Solicite um novo.",
  BLOQUEADO: "Muitas tentativas. Solicite um novo código.",
  INCORRETO: "Código incorreto.",
  AGUARDE: "Aguarde alguns segundos para reenviar.",
  JA_CADASTRADO: "Esse e-mail já tem conta. Use a tela de Entrar.",
  CELULAR_EM_USO: "Esse WhatsApp já tem conta cadastrada.",
  WHATSAPP_NAO_VERIFICADO: "WhatsApp ainda não confirmado.",
  EMAIL_NAO_VERIFICADO: "E-mail ainda não confirmado.",
};

/**
 * Resolve a melhor mensagem para o usuário a partir do código semântico
 * retornado pelo backend, com fallback para mensagem livre ou padrão.
 */
export function mapErroCodigo(
  erro: string | undefined | null,
  mensagemBackend?: string | null,
  fallback = "Código inválido. Tente novamente.",
): string {
  if (erro && MENSAGENS[erro]) {
    // Se o backend mandou uma mensagem mais específica para INCORRETO
    // (ex.: "Código incorreto. 2 tentativas restantes."), usa ela.
    if (erro === "INCORRETO" && mensagemBackend) return mensagemBackend;
    return MENSAGENS[erro];
  }
  return mensagemBackend || fallback;
}
