/* ==========================================================================
   Próximos passos (proximos-passos.html)
   - Checklist: a marcação fica salva só neste aparelho (localStorage)
   - Barra de progresso
   - Botões que copiam as mensagens prontas
   ========================================================================== */
import { initSite } from "../global.js";

const CHAVE = "trivia-proximos-passos";

function ler() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || {};
  } catch (error) {
    // Sem armazenamento (ex.: aba anônima): a marcação vale só nesta visita
    return {};
  }
}

function salvar(estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch (error) {
    // Sem armazenamento: segue sem salvar
  }
}

function initChecklist() {
  const caixas = Array.from(document.querySelectorAll("[data-tarefa]"));
  const feitos = document.querySelector("[data-feitos]");
  const total = document.querySelector("[data-total]");
  const barra = document.querySelector(".passos-progresso__barra");
  if (!caixas.length) return;

  const estado = ler();
  caixas.forEach((caixa) => {
    caixa.checked = Boolean(estado[caixa.dataset.tarefa]);
  });

  const atualizar = () => {
    const n = caixas.filter((caixa) => caixa.checked).length;
    if (feitos) feitos.textContent = String(n);
    if (total) total.textContent = String(caixas.length);
    if (barra) barra.style.setProperty("--progresso", `${(n / caixas.length) * 100}%`);
  };

  caixas.forEach((caixa) => {
    caixa.addEventListener("change", () => {
      estado[caixa.dataset.tarefa] = caixa.checked;
      salvar(estado);
      atualizar();
    });
  });

  atualizar();
}

function initCopiar() {
  document.querySelectorAll("[data-copiar]").forEach((botao) => {
    const original = botao.textContent;
    botao.addEventListener("click", async () => {
      const texto = document.getElementById(botao.dataset.copiar)?.textContent.trim() || "";
      let ok = false;
      try {
        await navigator.clipboard.writeText(texto);
        ok = true;
      } catch (error) {
        // Sem a API (ex.: página sem HTTPS): seleciona o texto para copiar à mão
        const selecao = window.getSelection();
        const faixa = document.createRange();
        faixa.selectNodeContents(document.getElementById(botao.dataset.copiar));
        selecao.removeAllRanges();
        selecao.addRange(faixa);
      }
      botao.textContent = ok ? "Copiada!" : "Texto selecionado: copie com o menu";
      botao.classList.toggle("is-copiado", ok);
      window.setTimeout(() => {
        botao.textContent = original;
        botao.classList.remove("is-copiado");
      }, 2500);
    });
  });
}

initChecklist();
initCopiar();
initSite();
