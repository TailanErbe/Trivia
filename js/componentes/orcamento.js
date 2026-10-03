/* ==========================================================================
   Pedido de orçamento (partials/orcamento.html)
   - Validação, máscara do WhatsApp e data mínima (hoje)
   - Links com data-servico (ex.: "Pedir orçamento de pós-obra") levam ao formulário
     com o serviço já escolhido
   - Enquanto o site não tem servidor de e-mail, o envio monta a mensagem com todos os
     dados e abre o WhatsApp da Trívia Clean. Na publicação, o envio passa a ir também
     por e-mail (SMTP), pelo atributo action do formulário.
   ========================================================================== */
import { linkWhatsApp } from "../config.js";

/* ---------- Serviço pré-escolhido por links ---------- */
export function initServiceLinks() {
  const select = document.getElementById("orcamento-servico");
  if (!select) return;

  const choose = (value) => {
    if (!value || !select.querySelector(`option[value="${value}"]`)) return;
    select.value = value;
    // Um brilho rápido mostra que o serviço já veio escolhido
    select.classList.remove("is-preenchido");
    void select.offsetWidth;
    select.classList.add("is-preenchido");
    select.dispatchEvent(new Event("change"));
  };

  // A página pode definir o serviço padrão: <main data-servico-padrao="pos-obra">
  choose(document.querySelector("[data-servico-padrao]")?.dataset.servicoPadrao);

  document.querySelectorAll("[data-servico]").forEach((link) => {
    link.addEventListener("click", () => choose(link.dataset.servico));
  });
}

/* ---------- Formulário ---------- */
const formatPhone = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatDate = (iso) => {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
};

// Texto da opção escolhida (ex.: "Limpeza pós-obra"), ou "" se nada foi escolhido
const optionText = (select) => (select.value ? select.options[select.selectedIndex].text : "");

// Regras de cada campo: obrigatório e/ou formato. Os demais campos são opcionais.
const RULES = {
  nome: { required: true, test: (v) => v.length >= 2, message: "Informe seu nome." },
  whatsapp: {
    required: true,
    test: (v) => v.replace(/\D/g, "").length >= 10,
    message: "Informe um WhatsApp com DDD.",
  },
  email: {
    required: false,
    test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    message: "Confira o e-mail.",
  },
  servico: { required: true, test: (v) => v !== "", message: "Escolha o tipo de serviço." },
  cidade: { required: true, test: (v) => v !== "", message: "Escolha a cidade." },
  aceite: { required: true, message: "É preciso aceitar a Política de Privacidade." },
};

function buildMessage(form) {
  const el = form.elements;
  const value = (name) => el[name].value.trim();

  const imovel = [optionText(el.imovel), value("metragem") && `${value("metragem")} m²`].filter(Boolean).join(" · ");
  const local = [value("bairro"), optionText(el.cidade)].filter(Boolean).join(", ");

  // Cada bloco junta só as linhas preenchidas; os blocos ficam separados por uma linha em branco
  const bloco = (...linhas) => linhas.filter(Boolean).join("\n");

  return [
    "Olá! Vim pelo site e gostaria de um orçamento.",
    bloco(
      `*Serviço:* ${optionText(el.servico)}`,
      imovel && `*Imóvel:* ${imovel}`,
      local && `*Local:* ${local}`,
      value("data") && `*Data desejada:* ${formatDate(value("data"))}`
    ),
    bloco(`*Nome:* ${value("nome")}`, `*WhatsApp:* ${value("whatsapp")}`, value("email") && `*E-mail:* ${value("email")}`),
    value("mensagem") && `*Mensagem:* ${value("mensagem")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function initQuoteForm() {
  const form = document.getElementById("form-orcamento");
  if (!form) return;

  const status = form.querySelector(".form__status");
  const phone = form.elements.whatsapp;
  const date = form.elements.data;

  // Não deixa escolher uma data que já passou
  if (date) {
    const hoje = new Date();
    hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    date.min = hoje.toISOString().slice(0, 10);
  }

  const fieldValue = (field) => (field.type === "checkbox" ? field.checked : field.value.trim());

  const isValid = (field) => {
    const rule = RULES[field.name];
    const value = fieldValue(field);
    if (field.type === "checkbox") return !rule.required || value;
    if (!value) return !rule.required;
    return rule.test ? rule.test(value) : true;
  };

  const setError = (field, show) => {
    const wrapper = field.closest(".form__campo");
    const error = wrapper.querySelector(".form__erro");
    wrapper.classList.toggle("has-error", show);
    if (error) error.textContent = show ? RULES[field.name].message : "";
    field.setAttribute("aria-invalid", String(show));
  };

  const setStatus = (text, type) => {
    status.textContent = text;
    status.classList.toggle("is-success", type === "success");
    status.classList.toggle("is-error", type === "error");
  };

  // Na ordem em que aparecem na página (o foco vai para o primeiro erro de cima para baixo)
  const fields = Array.from(form.elements).filter((field) => RULES[field.name]);

  phone.addEventListener("input", () => {
    phone.value = formatPhone(phone.value);
  });

  fields.forEach((field) => {
    const check = () => {
      if (field.closest(".has-error") && isValid(field)) setError(field, false);
    };
    field.addEventListener("input", check);
    field.addEventListener("change", check);
    field.addEventListener("blur", () => {
      if (fieldValue(field) && field.type !== "checkbox") setError(field, !isValid(field));
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const invalid = fields.filter((field) => !isValid(field));
    fields.forEach((field) => setError(field, invalid.includes(field)));
    if (invalid.length) {
      invalid[0].focus();
      setStatus("Confira os campos marcados.", "error");
      return;
    }

    const url = linkWhatsApp(buildMessage(form));
    // Sem "noopener" no window.open: com ele o retorno é sempre null e não daria para saber se abriu
    const janela = window.open(url, "_blank");
    if (janela) {
      janela.opener = null;
    } else {
      // O navegador bloqueou a nova aba: abre na mesma
      window.location.href = url;
    }

    setStatus("Pronto! Abrimos o WhatsApp com o seu pedido. É só tocar em enviar.", "success");
  });
}
