// =============================
//  CONFIG
// =============================
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbx0CJJOERwgsoqhU5jBjOQK17VGACfP-6MxsMVgZOjo6Y9YFR6Sz7KAoPMGWXTgS7ia/exec";

const form = document.getElementById("cadastroForm");

// UI (condicionais)
const indicacaoBox = document.getElementById("indicacaoBox");
const indicacaoNome = document.getElementById("indicacaoNome");

const rgBox = document.getElementById("rgBox");
const rgFrente = document.getElementById("rgFrente");
const rgVerso = document.getElementById("rgVerso");

// Inputs
const telefone = document.getElementById("telefone");
const email = document.getElementById("email");
const estado = document.getElementById("estado");

// =============================
//  HELPERS
// =============================

function getCheckedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function setRequired(el, isRequired) {
  if (!el) return;
  if (isRequired) el.setAttribute("required", "required");
  else el.removeAttribute("required");
}

function normalizeEstadoUF(value) {
  return (value || "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}

function onlyDigits(value) {
  return (value || "").replace(/\D/g, "");
}

function formatBRPhone(value) {
  const digits = onlyDigits(value).slice(0, 11); // BR: DDD + 9 dígitos
  const len = digits.length;

  if (len === 0) return "";
  if (len < 3) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  // 10 dígitos (fixo): (11) 2345-6789
  // 11 dígitos (cel):  (11) 92345-6789
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

function isValidEmail(v) {
  // validação simples (suficiente junto com type=email)
  const value = (v || "").trim();
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result = "data:image/png;base64,...."
      const result = String(reader.result || "");
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: result,
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// =============================
//  UI RULES
// =============================

function updateOndeEncontrouUI() {
  const onde = getCheckedValue("ondeEncontrou");
  const isIndicacao = onde === "Indicação";

  if (isIndicacao) {
    indicacaoBox.classList.remove("hidden");
  } else {
    indicacaoBox.classList.add("hidden");
    indicacaoNome.value = "";
  }

  setRequired(indicacaoNome, isIndicacao);
}

function updateModalidadeUI() {
  const mod = getCheckedValue("modalidade");
  const isPresencial = mod === "Presencial";

  if (isPresencial) rgBox.classList.remove("hidden");
  else {
    rgBox.classList.add("hidden");
    rgFrente.value = "";
    rgVerso.value = "";
  }

  setRequired(rgFrente, isPresencial);
  setRequired(rgVerso, isPresencial);
}

document
  .querySelectorAll('input[name="ondeEncontrou"]')
  .forEach((r) => r.addEventListener("change", updateOndeEncontrouUI));

document
  .querySelectorAll('input[name="modalidade"]')
  .forEach((r) => r.addEventListener("change", updateModalidadeUI));

updateOndeEncontrouUI();
updateModalidadeUI();

// =============================
//  INPUT FORMATTING
// =============================

telefone.addEventListener("input", () => {
  const pos = telefone.selectionStart;
  const before = telefone.value;

  telefone.value = formatBRPhone(before);

  // tentativa simples de manter o cursor no final quando mascara aplica
  if (pos != null) {
    const delta = telefone.value.length - before.length;
    telefone.setSelectionRange(pos + delta, pos + delta);
  }
});

email.addEventListener("input", () => {
  const v = email.value.trim();
  if (!v) {
    email.setCustomValidity("");
    return;
  }
  email.setCustomValidity(isValidEmail(v) ? "" : "E-mail inválido");
});

estado.addEventListener("input", () => {
  estado.value = normalizeEstadoUF(estado.value);
});

// =============================
//  SUBMIT
// =============================

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // validação nativa
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const payload = {
    nome: document.getElementById("nome").value.trim(),
    nomeMae: document.getElementById("nomeMae").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    estado: normalizeEstadoUF(document.getElementById("estado").value),
    cidade: document.getElementById("cidade").value.trim(),
    ondeEncontrou: getCheckedValue("ondeEncontrou"),
    indicacaoNome: document.getElementById("indicacaoNome").value.trim(),
    formaPagamento: getCheckedValue("formaPagamento"),
    pagamento: getCheckedValue("pagamentoPercent"),
    modalidade: getCheckedValue("modalidade"),
  };

  // anexos (só faz sentido no presencial; mas se vier vazio, tudo bem)
  const frenteFile = rgFrente.files?.[0] || null;
  const versoFile = rgVerso.files?.[0] || null;

  // ✅ AGORA ENVIA SÓ A STRING dataURL (compatível com o Apps Script)
  const frente64 = await fileToBase64(frenteFile);
  const verso64 = await fileToBase64(versoFile);

  payload.rgFrente = frente64?.dataUrl || "";
  payload.rgVerso = verso64?.dataUrl || "";

  try {
    await fetch(WEB_APP_URL, {
      method: "POST",
      // mode no-cors impede ler resposta, mas envia.
      mode: "no-cors",
      body: JSON.stringify(payload),
    });

    alert("Cadastro concluído com sucesso!");
    form.reset();
    updateOndeEncontrouUI();
    updateModalidadeUI();
  } catch (err) {
    console.error(err);
  }
});
