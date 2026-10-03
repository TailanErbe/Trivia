/* ==========================================================================
   Animações de entrada ao rolar a página (estilo em css/componentes/animacoes.css)
   .reveal / .reveal--mask   o próprio elemento aparece
   .reveal-group             os filhos aparecem em sequência (o JS numera cada um em --i)
   .reveal-stagger           os itens .reveal da lista entram um depois do outro

   Funciona nos dois sentidos: ao sair da tela o elemento volta a ficar escondido.
   Se saiu por cima, recebe .reveal--from-top e, ao rolar para cima, entra descendo.

   Pode ser chamada mais de uma vez: cada chamada só prepara os elementos novos
   (ex.: o topo anima logo, sem esperar os blocos de partials/ carregarem).
   ========================================================================== */
import { prefersReducedMotion } from "../utils/preferencias.js";

let showObserver = null;
let hideObserver = null;

export function initReveal() {
  // --i = posição na sequência; --n = total (para inverter a ordem quando entra por cima)
  document.querySelectorAll(".reveal-group:not([data-reveal]), .reveal-stagger:not([data-reveal])").forEach((group) => {
    group.dataset.reveal = "";
    const children = Array.from(group.children);
    children.forEach((child, i) => {
      child.style.setProperty("--i", i);
      child.style.setProperty("--n", children.length);
    });
  });

  const items = document.querySelectorAll(".reveal:not([data-reveal-observado]), .reveal-group:not([data-reveal-observado])");
  if (!items.length) return;
  items.forEach((item) => {
    item.dataset.revealObservado = "";
  });

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  // Ajusta o lado de entrada sem animar a troca (o elemento ainda está escondido)
  const setSide = (element, fromTop) => {
    if (element.classList.contains("reveal--from-top") === fromTop) return;
    element.classList.add("reveal--instant");
    element.classList.toggle("reveal--from-top", fromTop);
    void element.offsetWidth; // aplica a posição inicial antes de animar
    element.classList.remove("reveal--instant");
  };

  // Mostra quando uma parte do elemento entra na tela.
  // Se o topo dele está acima da tela, ele está entrando por cima (rolagem para cima)
  // Os dois observadores são criados uma vez e servem a todas as chamadas
  showObserver ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target.classList.contains("is-visible")) return;
        setSide(entry.target, entry.boundingClientRect.top < 0);
        entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  // Esconde só quando o elemento sai totalmente da tela, e anota por qual lado saiu
  hideObserver ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) return;
        entry.target.classList.remove("is-visible");
        setSide(entry.target, entry.boundingClientRect.bottom <= 0);
      });
    },
    { threshold: 0 }
  );

  items.forEach((item) => {
    showObserver.observe(item);
    hideObserver.observe(item);
  });
}
