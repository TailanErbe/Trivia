/* ==========================================================================
   Rolagem suave: a roda do mouse desliza a página com inércia, em vez de pular.
   Vale só para mouse/trackpad (no celular a rolagem nativa já é suave).
   Links internos (#orcamento, #servicos...) também deslizam até a seção.
   ========================================================================== */
import { prefersReducedMotion } from "../utils/preferencias.js";

// Quanto da distância restante é percorrida a cada quadro (60fps). Menor = mais macio
const EASE = 0.09;

// true quando o elemento sob o mouse tem rolagem própria e ainda pode rolar nessa direção
function canScrollInside(element, deltaY) {
  for (let el = element; el && el !== document.body; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
      if (deltaY < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight) return true;
    }
  }
  return false;
}

export function initSmoothScroll() {
  if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;

  const root = document.documentElement;
  root.classList.add("has-smooth-scroll");

  let target = window.scrollY;
  let current = window.scrollY;
  let running = false;
  let lastTime = 0;

  const maxScroll = () => root.scrollHeight - window.innerHeight;
  const clamp = (value) => Math.min(Math.max(value, 0), maxScroll());

  const loop = (time) => {
    // Corrige pela duração real do quadro, para ter a mesma velocidade em telas de 60Hz ou 144Hz
    const frames = lastTime ? (time - lastTime) / (1000 / 60) : 1;
    lastTime = time;
    current += (target - current) * (1 - Math.pow(1 - EASE, frames));

    if (Math.abs(target - current) < 0.5) {
      current = target;
      running = false;
    }
    window.scrollTo(0, current);
    if (running) window.requestAnimationFrame(loop);
  };

  const scrollTo = (y) => {
    target = clamp(y);
    if (!running) {
      running = true;
      current = window.scrollY;
      lastTime = 0;
      window.requestAnimationFrame(loop);
    }
  };

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || document.body.classList.contains("is-locked")) return;
      // Gesto lateral (touchpad ou Shift + roda) fica com o navegador: é assim que se passa o carrossel
      if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (canScrollInside(event.target, event.deltaY)) return;

      event.preventDefault();
      const unit = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? window.innerHeight : 1;
      if (!running) target = window.scrollY;
      scrollTo(target + event.deltaY * unit);
    },
    { passive: false }
  );

  // Rolagem por teclado ou arrastando a barra: acompanha a posição real
  window.addEventListener(
    "scroll",
    () => {
      if (!running) target = current = window.scrollY;
    },
    { passive: true }
  );

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented) return;

    const id = link.getAttribute("href").slice(1);
    const section = id && document.getElementById(id);
    if (!section) return;

    event.preventDefault();
    const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    // Sem gravar #secao no endereço: assim o F5 não abre a página no meio
    scrollTo(section.getBoundingClientRect().top + window.scrollY - offset);
  });
}
