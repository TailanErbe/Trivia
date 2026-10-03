/* ==========================================================================
   Links de WhatsApp com mensagem pronta
   <a href="https://wa.me/5527997181451" data-whatsapp="Olá! Quero um orçamento de pós-obra.">
   Sem texto no data-whatsapp, usa a mensagem da página (<body data-whatsapp-mensagem="...">)
   ou, se a página não tiver, a mensagem padrão de js/config.js.
   O href no HTML já funciona sem JavaScript; aqui só entra a mensagem.
   ========================================================================== */
import { linkWhatsApp } from "../config.js";

export function initWhatsAppLinks() {
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    link.href = linkWhatsApp(link.dataset.whatsapp || document.body.dataset.whatsappMensagem || undefined);
    link.target = "_blank";
    link.rel = "noopener";
  });
}
