/* ==========================================================================
   Dados de contato usados pelo JavaScript (um lugar só para trocar)
   ========================================================================== */

// WhatsApp da Trívia Clean, só números, com 55 + DDD: (27) 99718-1451
export const WHATSAPP = "5527997181451";

// Mensagem pronta dos botões de WhatsApp sem mensagem própria
export const MENSAGEM_PADRAO = "Olá! Encontrei a Trívia Clean pelo site e gostaria de um orçamento.";

export function linkWhatsApp(mensagem = MENSAGEM_PADRAO) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}
