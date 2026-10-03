/* ==========================================================================
   Cabeçalho: linha e sombra ao rolar, e menu do celular
   ========================================================================== */
import { prefersReducedMotion } from "../utils/preferencias.js";

/* ---------- Linha e sombra ao rolar ---------- */
function initHeaderScroll() {
  const header = document.getElementById("header");
  if (!header) return;

  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

/* ---------- Menu do celular ---------- */
function initMobileMenu() {
  const header = document.getElementById("header");
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav");
  if (!header || !toggle || !nav) return;

  const setOpen = (open) => {
    header.classList.toggle("is-menu-open", open);
    toggle.classList.toggle("is-open", open);
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("is-locked", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));

  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || !nav.classList.contains("is-open")) return;

    setOpen(false);

    // Com a rolagem travada, a âncora nativa não rola; rola depois de destravar
    const target = link.hash && link.pathname === window.location.pathname && document.querySelector(link.hash);
    if (target) {
      event.preventDefault();
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Voltando para a tela grande com o menu aberto, destrava a página
  window.matchMedia("(min-width: 1025px)").addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

export function initHeader() {
  initHeaderScroll();
  initMobileMenu();
}
