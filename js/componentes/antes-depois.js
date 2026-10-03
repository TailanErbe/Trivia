/* ==========================================================================
   Comparador antes e depois (estilo em css/componentes/antes-depois.css)
   - Arrastar com mouse ou dedo em qualquer ponto da foto
   - Teclado e leitores de tela: um input range invisível (setas, Home, End)
   - Ao aparecer na tela pela primeira vez, a divisória "balança" uma vez para
     mostrar que dá para arrastar (menos quem pediu menos movimento)
   ========================================================================== */
import { prefersReducedMotion } from "../utils/preferencias.js";

function initOne(quadro) {
  const controle = quadro.querySelector(".antes-depois__controle");
  if (!controle) return;

  const setPos = (valor) => {
    const pos = Math.min(100, Math.max(0, valor));
    quadro.style.setProperty("--pos", `${pos}%`);
    controle.value = String(Math.round(pos));
  };

  const posDoPonteiro = (event) => {
    const caixa = quadro.getBoundingClientRect();
    return ((event.clientX - caixa.left) / caixa.width) * 100;
  };

  quadro.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    quadro.setPointerCapture(event.pointerId);
    quadro.classList.add("is-arrastando");
    setPos(posDoPonteiro(event));
  });

  quadro.addEventListener("pointermove", (event) => {
    if (!quadro.hasPointerCapture(event.pointerId)) return;
    setPos(posDoPonteiro(event));
  });

  const soltar = (event) => {
    if (quadro.hasPointerCapture(event.pointerId)) quadro.releasePointerCapture(event.pointerId);
    quadro.classList.remove("is-arrastando");
  };
  quadro.addEventListener("pointerup", soltar);
  quadro.addEventListener("pointercancel", soltar);

  controle.addEventListener("input", () => setPos(Number(controle.value)));

  setPos(Number(controle.value) || 50);

  // Dica de movimento: 50% → 70% → 35% → 50%, uma vez
  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      const pontos = [50, 70, 35, 50];
      const duracao = 1600;
      let inicio = null;
      const passo = (agora) => {
        if (quadro.classList.contains("is-arrastando")) return;
        inicio ??= agora;
        const t = Math.min(1, (agora - inicio) / duracao);
        const trecho = Math.min(pontos.length - 2, Math.floor(t * (pontos.length - 1)));
        const local = t * (pontos.length - 1) - trecho;
        const suave = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
        setPos(pontos[trecho] + (pontos[trecho + 1] - pontos[trecho]) * suave);
        if (t < 1) window.requestAnimationFrame(passo);
      };
      window.setTimeout(() => window.requestAnimationFrame(passo), 500);
    },
    { threshold: 0.6 }
  );
  observer.observe(quadro);
}

export function initBeforeAfter() {
  document.querySelectorAll("[data-antes-depois]").forEach(initOne);
}
