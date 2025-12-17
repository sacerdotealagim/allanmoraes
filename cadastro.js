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

// Brasil/Exterior
const brBox = document.getElementById("brBox");
const extBox = document.getElementById("extBox");
const pais = document.getElementById("pais");
const cidadeExterior = document.getElementById("cidadeExterior");
const cidadeBR = document.getElementById("cidade");

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
  const value = (v || "").trim();
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => {
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
function updateLocalidadeUI() {
  const tipo = getCheckedValue("localidadeTipo"); // "", "Brasil" ou "Exterior"
  const isExterior = tipo === "Exterior";
  const isBrasil = tipo === "Brasil";

  // se ainda não escolheu nada:
  if (!tipo) {
    brBox?.classList.add("hidden");
    extBox?.classList.add("hidden");

    setRequired(estado, false);
    setRequired(cidadeBR, false);
    setRequired(pais, false);
    setRequired(cidadeExterior, false);
    return;
  }

  if (isExterior) {
    extBox?.classList.remove("hidden");
    brBox?.classList.add("hidden");

    if (estado) estado.value = "";
    if (cidadeBR) cidadeBR.value = "";
  }

  if (isBrasil) {
    brBox?.classList.remove("hidden");
    extBox?.classList.add("hidden");

    if (pais) pais.value = "";
    if (cidadeExterior) cidadeExterior.value = "";
  }

  setRequired(estado, isBrasil);
  setRequired(cidadeBR, isBrasil);

  setRequired(pais, isExterior);
  setRequired(cidadeExterior, isExterior);
}


// Listeners UI
document
  .querySelectorAll('input[name="ondeEncontrou"]')
  .forEach((r) => r.addEventListener("change", updateOndeEncontrouUI));

document
  .querySelectorAll('input[name="modalidade"]')
  .forEach((r) => r.addEventListener("change", updateModalidadeUI));

document
  .querySelectorAll('input[name="localidadeTipo"]')
  .forEach((r) => r.addEventListener("change", updateLocalidadeUI));

// Inicializa UI
updateOndeEncontrouUI();
updateModalidadeUI();
updateLocalidadeUI();

// =============================
//  INPUT FORMATTING
// =============================
telefone.addEventListener("input", () => {
  const pos = telefone.selectionStart;
  const before = telefone.value;

  telefone.value = formatBRPhone(before);

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

// UF só faz sentido quando Brasil
estado.addEventListener("input", () => {
  const tipo = getCheckedValue("localidadeTipo");
  if (tipo === "Brasil") {
    estado.value = normalizeEstadoUF(estado.value);
  }
});

// =============================
//  SUBMIT
// =============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const tipoLocalidade = getCheckedValue("localidadeTipo"); // Brasil/Exterior
  const isExterior = tipoLocalidade === "Exterior";

  const payload = {
    nome: document.getElementById("nome").value.trim(),
    nomeMae: document.getElementById("nomeMae").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),

    // Localidade
    localidadeTipo: tipoLocalidade,
    pais: isExterior ? (pais?.value || "").trim() : "Brasil",
    estado: isExterior ? "" : normalizeEstadoUF(estado?.value || ""),
    cidade: isExterior ? (cidadeExterior?.value || "").trim() : (cidadeBR?.value || "").trim(),

    // resto
    ondeEncontrou: getCheckedValue("ondeEncontrou"),
    indicacaoNome: (indicacaoNome?.value || "").trim(),
    formaPagamento: getCheckedValue("formaPagamento"),
    pagamento: getCheckedValue("pagamentoPercent"),
    modalidade: getCheckedValue("modalidade"),
  };

  // anexos
  const frenteFile = rgFrente.files?.[0] || null;
  const versoFile = rgVerso.files?.[0] || null;

  const frente64 = await fileToBase64(frenteFile);
  const verso64 = await fileToBase64(versoFile);

  payload.rgFrente = frente64?.dataUrl || "";
  payload.rgVerso = verso64?.dataUrl || "";

  try {
    await fetch(WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload),
    });

    alert("Cadastro concluído com sucesso!");
    form.reset();
    updateOndeEncontrouUI();
    updateModalidadeUI();
    updateLocalidadeUI();
  } catch (err) {
    console.error(err);
    alert("Erro ao enviar cadastro. Tente novamente.");
  }
});
