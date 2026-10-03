/* ==========================================================================
   Trívia Clean - Limpeza Especializada
   Comportamentos compartilhados por TODAS as páginas.

   Cada página tem seu arquivo em js/paginas/, que importa e chama initSite():
     <script type="module" src="js/paginas/home.js"></script>
   ========================================================================== */
import { initHeader } from "./componentes/cabecalho.js";
import { loadPartials } from "./componentes/partials.js";
import { initQuoteForm, initServiceLinks } from "./componentes/orcamento.js";
import { initWhatsAppLinks } from "./componentes/whatsapp.js";
import { initReveal } from "./componentes/animacoes.js";
import { initSmoothScroll } from "./componentes/rolagem.js";

// Avisa o CSS que o JS está ativo (as animações de entrada só se aplicam com JS)
document.documentElement.classList.add("js");

export async function initSite() {
  initHeader();
  initSmoothScroll();

  // O topo e o resto da página animam já, sem esperar os blocos de partials/
  initReveal();

  // O formulário, os links e as animações desses blocos dependem deles já estarem na página
  await loadPartials();

  initWhatsAppLinks();
  initQuoteForm();
  initServiceLinks();
  initReveal();
}
