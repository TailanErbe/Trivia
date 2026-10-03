/* ==========================================================================
   Blocos compartilhados (pasta partials/)
   Substitui cada <div data-include="partials/arquivo.html"> pelo conteúdo do arquivo.
   Precisa de servidor (http://); abrindo o arquivo direto (file://) o navegador bloqueia a leitura.
   ========================================================================== */
export async function loadPartials() {
  const slots = Array.from(document.querySelectorAll("[data-include]"));

  await Promise.all(
    slots.map(async (slot) => {
      const url = slot.dataset.include;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const template = document.createElement("template");
        template.innerHTML = await response.text();
        slot.replaceWith(template.content);
      } catch (error) {
        console.error(`Não foi possível carregar ${url}:`, error);
      }
    })
  );

  // Se a página abriu com âncora para um bloco carregado agora (ex.: #contato), rola até ele
  const target = window.location.hash && document.querySelector(window.location.hash);
  if (target) target.scrollIntoView({ behavior: "instant" });
}
