/* ==========================================================================
   Carrossel (estilo em css/componentes/carrossel.css)
   - Setas: um card por vez; no fim volta ao começo (e vice-versa)
   - Arraste com o mouse; no celular, o dedo usa a rolagem nativa
   - Troca sozinho a cada INTERVALO, só quando está na tela. Para com o mouse
     em cima ou com o foco dentro, e o botão de pausa para de vez (WCAG 2.2.2).
     Quem pede menos movimento no sistema não tem troca automática.
   ========================================================================== */
import { prefersReducedMotion } from "../utils/preferencias.js";

const INTERVALO = 5500;

function initOne(carrossel) {
  const trilho = carrossel.querySelector(".carrossel__trilho");
  const itens = Array.from(trilho.children);
  const barra = carrossel.querySelector(".carrossel__barra");
  const anterior = carrossel.querySelector("[data-carrossel-anterior]");
  const proximo = carrossel.querySelector("[data-carrossel-proximo]");
  const pausa = carrossel.querySelector("[data-carrossel-pausa]");
  if (!itens.length) return;

  const comportamento = prefersReducedMotion ? "auto" : "smooth";

  // Distância entre o começo de um card e o do seguinte
  const passo = () => (itens[1] ? itens[1].offsetLeft - itens[0].offsetLeft : trilho.clientWidth);
  const maximo = () => trilho.scrollWidth - trilho.clientWidth;

  const irPara = (left) => trilho.scrollTo({ left, behavior: comportamento });

  const avancar = (direcao) => {
    const atual = trilho.scrollLeft;
    if (direcao > 0 && atual >= maximo() - 4) return irPara(0);
    if (direcao < 0 && atual <= 4) return irPara(maximo());
    const indice = Math.round(atual / passo()) + direcao;
    irPara(Math.min(maximo(), Math.max(0, indice * passo())));
  };

  // Barra de progresso: o trecho visível do trilho
  const atualizarBarra = () => {
    if (!barra) return;
    const total = trilho.scrollWidth || 1;
    barra.style.setProperty("--tamanho", `${(trilho.clientWidth / total) * 100}%`);
    barra.style.setProperty("--inicio", `${(trilho.scrollLeft / total) * 100}%`);
  };
  trilho.addEventListener("scroll", atualizarBarra, { passive: true });
  window.addEventListener("resize", atualizarBarra);
  atualizarBarra();

  /* ---------- Troca automática ---------- */
  let timer = null;
  let pausadoPeloBotao = false;
  let emCima = false;
  let comFoco = false;
  let naTela = false;

  const podeTrocar = () => !prefersReducedMotion && !pausadoPeloBotao && !emCima && !comFoco && naTela && !document.hidden;

  const agendar = () => {
    window.clearTimeout(timer);
    if (!podeTrocar()) return;
    timer = window.setTimeout(() => {
      avancar(1);
      agendar();
    }, INTERVALO);
  };

  if (prefersReducedMotion) carrossel.classList.add("sem-autoplay");

  carrossel.addEventListener("mouseenter", () => {
    emCima = true;
    agendar();
  });
  carrossel.addEventListener("mouseleave", () => {
    emCima = false;
    agendar();
  });
  carrossel.addEventListener("focusin", () => {
    comFoco = true;
    agendar();
  });
  carrossel.addEventListener("focusout", (event) => {
    if (carrossel.contains(event.relatedTarget)) return;
    comFoco = false;
    agendar();
  });
  document.addEventListener("visibilitychange", agendar);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        naTela = entries[0].isIntersecting;
        agendar();
      },
      { threshold: 0.4 }
    ).observe(carrossel);
  }

  pausa?.addEventListener("click", () => {
    pausadoPeloBotao = !pausadoPeloBotao;
    carrossel.classList.toggle("is-pausado", pausadoPeloBotao);
    pausa.setAttribute("aria-label", pausadoPeloBotao ? "Continuar a troca automática" : "Pausar a troca automática");
    agendar();
  });

  // Setas: navegar reinicia a contagem, para a troca não atropelar quem está lendo
  anterior?.addEventListener("click", () => {
    avancar(-1);
    agendar();
  });
  proximo?.addEventListener("click", () => {
    avancar(1);
    agendar();
  });

  // No celular, o dedo no trilho segura a troca até soltar
  trilho.addEventListener("touchstart", () => window.clearTimeout(timer), { passive: true });
  trilho.addEventListener("touchend", agendar, { passive: true });

  /* ---------- Arraste com o mouse ---------- */
  let inicioX = 0;
  let inicioScroll = 0;
  let arrastou = false;

  trilho.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    inicioX = event.clientX;
    inicioScroll = trilho.scrollLeft;
    arrastou = false;
    trilho.setPointerCapture(event.pointerId);
  });

  trilho.addEventListener("pointermove", (event) => {
    if (!trilho.hasPointerCapture(event.pointerId)) return;
    const dx = event.clientX - inicioX;
    if (!arrastou && Math.abs(dx) < 4) return;
    arrastou = true;
    trilho.classList.add("is-arrastando");
    trilho.scrollLeft = inicioScroll - dx;
  });

  const soltar = (event) => {
    if (!trilho.hasPointerCapture(event.pointerId)) return;
    trilho.releasePointerCapture(event.pointerId);
    if (!arrastou) return;
    // Encaixa no card mais próximo, com o encaixe da rolagem de volta
    const alvo = Math.round(trilho.scrollLeft / passo()) * passo();
    trilho.classList.remove("is-arrastando");
    irPara(Math.min(maximo(), alvo));
  };
  trilho.addEventListener("pointerup", soltar);
  trilho.addEventListener("pointercancel", soltar);
}

export function initCarousels() {
  document.querySelectorAll("[data-carrossel]").forEach(initOne);
}
