/* ==========================================================================
   Monta a pasta para publicar o site estático: dist/site/

   node ferramentas/empacotar.mjs                            (prévia aponta para o GitHub Pages)
   node ferramentas/empacotar.mjs https://www.exemplo.com.br  (prévia aponta para o endereço final)

   - CSS: css/global.css e todos os @import viram um arquivo só, sem comentários
     (menos pedidos ao servidor: o topo aparece mais rápido no celular)
   - JS: cada página ganha <link rel="modulepreload"> para todos os módulos que usa,
     e o navegador busca tudo de uma vez, em vez de um depois do outro; os blocos
     de partials/ também começam a baixar junto com a página
   - Com outro endereço, a prévia do link (og:image e og:url) passa a apontar para ele
   - _headers (Netlify e Cloudflare Pages): mantém o protótipo fora do Google e
     guarda imagens e fontes em cache
   - Ficam de fora: documentos internos, guia de estilo, referências e esta pasta
   - No fim, lista os dados de exemplo (data-ficticio) que ainda estão no site
   ========================================================================== */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(RAIZ, "dist", "site");
const ENDERECO = (process.argv[2] || "").replace(/\/+$/, "");
const PROTOTIPO = "https://tailanerbe.github.io/Trivia";

const PAGINAS = ["index.html", "servico-pos-obra.html", "politica-de-privacidade.html", "proximos-passos.html"];
const PASTAS = ["assets", "partials", "js"];

const ler = (arquivo) => readFileSync(arquivo, "utf8");
const barra = (caminho) => caminho.split(sep).join("/");

/* ---------- CSS: junta os @import num arquivo só ---------- */
function semComentarios(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .join("\n");
}

// Lê um arquivo CSS e acerta os url() para continuarem certos a partir da pasta de destino
function juntarCss(arquivo, pastaDestino) {
  const pasta = dirname(arquivo);
  let css = ler(arquivo).replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g, (trecho, aspas, caminho) => {
    if (/^(data:|https?:|\/|#)/.test(caminho)) return trecho;
    const novo = barra(relative(pastaDestino, resolve(pasta, caminho)));
    return `url("${novo}")`;
  });
  css = css.replace(/@import\s+url\(\s*"([^"]+)"\s*\)\s*;/g, (_, importado) => {
    // O url() do @import já foi reescrito acima: resolve a partir da pasta de destino
    return juntarCss(resolve(pastaDestino, importado), pastaDestino);
  });
  return css;
}

/* ---------- JS: lista todos os módulos que uma página usa ---------- */
function modulosDe(arquivo, vistos = new Set()) {
  const codigo = ler(arquivo);
  const importacoes = [...codigo.matchAll(/^\s*import\s+(?:[^"';]+?\s+from\s+)?["']([^"']+)["']/gm)].map((m) => m[1]);
  importacoes
    .filter((caminho) => caminho.startsWith("."))
    .forEach((caminho) => {
      const alvo = resolve(dirname(arquivo), caminho);
      if (vistos.has(alvo)) return;
      vistos.add(alvo);
      modulosDe(alvo, vistos);
    });
  return vistos;
}

/* ---------- Monta a pasta ---------- */
// Esvazia a pasta em vez de apagá-la: no Windows, um servidor aberto nela impede apagar a pasta em si
if (existsSync(DESTINO)) {
  readdirSync(DESTINO).forEach((item) => rmSync(join(DESTINO, item), { recursive: true, force: true }));
}
mkdirSync(join(DESTINO, "css", "paginas"), { recursive: true });

PASTAS.forEach((pasta) => cpSync(join(RAIZ, pasta), join(DESTINO, pasta), { recursive: true }));

const pastaCss = join(RAIZ, "css");
writeFileSync(join(DESTINO, "css", "global.css"), semComentarios(juntarCss(join(pastaCss, "global.css"), pastaCss)) + "\n");

readdirSync(join(pastaCss, "paginas"))
  .filter((arquivo) => arquivo.endsWith(".css") && arquivo !== "estilo.css")
  .forEach((arquivo) => {
    writeFileSync(join(DESTINO, "css", "paginas", arquivo), semComentarios(ler(join(pastaCss, "paginas", arquivo))) + "\n");
  });

let totalModulos = 0;
PAGINAS.forEach((pagina) => {
  let html = ler(join(RAIZ, pagina));

  const entrada = html.match(/<script type="module" src="([^"]+)"><\/script>/);
  if (entrada) {
    const modulos = [...modulosDe(join(RAIZ, entrada[1]))].map((arquivo) => barra(relative(RAIZ, arquivo)));
    totalModulos += modulos.length;
    const links = modulos.map((modulo) => `  <link rel="modulepreload" href="${modulo}">`).join("\n");
    html = html.replace(entrada[0], `${entrada[0]}\n${links}`);
  }

  // Os blocos de partials/ (orçamento, rodapé) começam a baixar junto com a página
  const blocos = [...html.matchAll(/data-include="([^"]+)"/g)].map((m) => m[1]);
  if (blocos.length) {
    const links = blocos.map((bloco) => `  <link rel="preload" href="${bloco}" as="fetch" crossorigin>`).join("\n");
    html = html.replace("</head>", `${links}\n</head>`);
  }

  // As páginas apontam a prévia do link (og:image e og:url) para o protótipo no GitHub Pages;
  // com outro endereço, tudo passa a apontar para ele
  if (ENDERECO) html = html.split(PROTOTIPO).join(ENDERECO);

  writeFileSync(join(DESTINO, pagina), html);
});

writeFileSync(
  join(DESTINO, "_headers"),
  [
    "# Protótipo: fora do Google (Netlify e Cloudflare Pages leem este arquivo)",
    "/*",
    "  X-Robots-Tag: noindex, nofollow",
    "",
    "/assets/*",
    "  Cache-Control: public, max-age=604800",
    "",
  ].join("\n")
);

const tamanho = (pasta) =>
  readdirSync(pasta, { withFileTypes: true }).reduce(
    (soma, item) => soma + (item.isDirectory() ? tamanho(join(pasta, item.name)) : readFileSync(join(pasta, item.name)).length),
    0
  );

console.log(`Pronto: ${barra(relative(RAIZ, DESTINO))}/`);
console.log(`  ${PAGINAS.length} páginas, CSS em 1 arquivo, ${totalModulos} módulos JS pré-carregados`);
console.log(`  ${(tamanho(DESTINO) / 1024 / 1024).toFixed(1)} MB no total`);
console.log(`  Prévia do link: ${ENDERECO || PROTOTIPO}/assets/img/compartilhar.jpg`);

// Dados de exemplo (data-ficticio): podem ir no protótipo, nunca na publicação oficial
const ficticios = [...PAGINAS, ...readdirSync(join(RAIZ, "partials")).map((arquivo) => `partials/${arquivo}`)]
  .map((arquivo) => [arquivo, (ler(join(RAIZ, arquivo)).match(/data-ficticio/g) || []).length])
  .filter(([, n]) => n > 0);
if (ficticios.length) {
  const total = ficticios.reduce((soma, [, n]) => soma + n, 0);
  console.log(`\n  Atenção: ${total} dados de exemplo (data-ficticio) ainda no site:`);
  ficticios.forEach(([arquivo, n]) => console.log(`    ${arquivo}: ${n}`));
  console.log("  Tudo bem no protótipo; troque pelos dados reais antes da publicação oficial.");
}
if (!existsSync(join(DESTINO, "index.html"))) process.exit(1);
