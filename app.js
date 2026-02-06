// ====================================
// ACADEMY JIU JITSU - APP.JS v5 CORRIGIDO
// Professor Levi Silva
// URL e parâmetros atualizados
// ====================================

// ✅ URL CORRIGIDA DO BACKEND
const API_URL = "https://script.google.com/macros/s/AKfycbwxKOvQkEcwFB6_1l6fkHJ-sCAvCnynIzjdM98ZmLirsm97j4hr9pQOmolWglPhKecPTw/exec";

// ✅ TIMEOUT PARA EVITAR "CARREGANDO INFINITO"
const API_TIMEOUT = 30000; // 30 segundos

console.log("✅ App.js carregado (v5 CORRIGIDO)");
console.log("📤 API URL:", API_URL);

// ===== API REQUEST COM TIMEOUT =====
async function apiRequest(acao, dados = {}) {
  try {
    console.log(`📡 Requisição: ${acao}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ acao, ...dados })
    });
    
    clearTimeout(timeoutId);
    
    const text = await response.text();
    console.log(`✅ Resposta recebida para: ${acao}`);
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("❌ Erro ao parsear JSON:", text);
      return { sucesso: false, mensagem: "Erro ao processar resposta" };
    }
  } catch (erro) {
    if (erro.name === 'AbortError') {
      console.error(`❌ Timeout na requisição ${acao}`);
      return { sucesso: false, mensagem: "Tempo limite de requisição excedido" };
    }
    console.error(`❌ Erro na requisição ${acao}:`, erro);
    return { sucesso: false, mensagem: "Erro de conexão: " + erro.message };
  }
}

// ===== API FUNCTIONS COM NOMES CORRETOS =====

// ✅ CORRIGIDO: "login" → "fazerLogin"
async function fazerLogin(email, senha) {
  console.log("🔐 Tentando login com:", email);
  const resultado = await apiRequest("fazerLogin", { email, senha });
  
  if (resultado.sucesso) {
    console.log("✅ Login bem-sucedido!");
    salvarSessao(resultado.usuario);
  } else {
    console.log("❌ Login falhou:", resultado.mensagem);
  }
  
  return resultado;
}

// ✅ CORRIGIDO: "loginAdmin" → "fazerLoginAdmin"
async function fazerLoginAdmin(chave) {
  return apiRequest("fazerLoginAdmin", { chave });
}

// ✅ CORRIGIDO: "registro" → "registrarAluno"
async function registrarAluno(nome, email, senha, faixa, ct) {
  return apiRequest("registrarAluno", { nome, email, senha, faixa, ct });
}

// ✅ CORRIGIDO: obter dados do aluno
async function obterDadosAluno(email) {
  return apiRequest("obterCheckInsAluno", { email });
}

async function obterEstatisticasAluno(alunoID) {
  return apiRequest("obterCheckInsAluno", { alunoID });
}

async function obterAlunosPendentes(adminToken) {
  return apiRequest("obterAlunosPendentes", { adminToken });
}

async function aprovarAluno(alunoID, adminToken) {
  return apiRequest("aprovarAluno", { alunoID, adminToken });
}

async function obterTodosAlunos(adminToken) {
  return apiRequest("obterRankingGeral", { adminToken });
}

// ✅ CORRIGIDO: "obterTodosCTs" → "obterCTs"
async function obterTodosCTs() {
  return apiRequest("obterCTs", {});
}

async function cadastrarCT(nome, cidade, estado, responsavel, adminToken) {
  return apiRequest("cadastrarCT", { nome, cidade, estado, responsavel, adminToken });
}

async function alterarGrau(alunoID, novoGrau, adminToken) {
  return apiRequest("alterarGrau", { alunoID, novoGrau, adminToken });
}

async function fazerCheckIn(email, ctID, data, horario) {
  return apiRequest("fazerCheckIn", { email, ctID, data, horario });
}

async function obterRankingGeral() {
  return apiRequest("obterRankingGeral", {});
}

// ===== SESSION MANAGEMENT =====
function salvarSessao(dados) {
  // Armazenar dados do usuário
  const usuarioSalvo = {
    id: dados.id || dados.usuario?.id,
    nome: dados.nome || dados.usuario?.nome,
    email: dados.email || dados.usuario?.email,
    faixa: dados.faixa || dados.usuario?.faixa,
    ct: dados.ct || dados.usuario?.ct_principal,
    status: dados.status || dados.usuario?.status,
    role: dados.role || "aluno",
    timestamp: new Date().toISOString()
  };
  
  sessionStorage.setItem("academy_user", JSON.stringify(usuarioSalvo));
  console.log("✅ Sessão salva:", usuarioSalvo.nome);
}

function obterSessao() {
  const data = sessionStorage.getItem("academy_user");
  return data ? JSON.parse(data) : null;
}

function limparSessao() {
  sessionStorage.removeItem("academy_user");
  console.log("✅ Sessão limpa");
}

function verificarLogin(redirectTo = "index.html") {
  const user = obterSessao();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

function verificarAdmin(redirectTo = "index.html") {
  const user = obterSessao();
  if (!user || user.role !== "admin") {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

function logout() {
  limparSessao();
  window.location.href = "index.html";
}

// ===== UI HELPERS =====
function mostrarMensagem(containerId, tipo, texto) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container não encontrado: ${containerId}`);
    return;
  }
  
  container.innerHTML = `<div class="msg msg-${tipo}">${texto}</div>`;
  
  setTimeout(() => {
    if (container && container.querySelector(".msg")) {
      container.innerHTML = "";
    }
  }, 5000);
}

function mostrarLoading(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Carregando...</span></div>';
}

function esconderLoading(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const loading = container.querySelector(".loading");
  if (loading) loading.remove();
}

function obterClasseFaixa(faixa) {
  if (!faixa) return "faixa-branca";
  const f = faixa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (f.includes("azul")) return "faixa-azul";
  if (f.includes("roxa")) return "faixa-roxa";
  if (f.includes("marrom")) return "faixa-marrom";
  if (f.includes("preta")) return "faixa-preta";
  return "faixa-branca";
}

function obterClasseDotFaixa(faixa) {
  if (!faixa) return "dot-branca";
  const f = faixa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (f.includes("azul")) return "dot-azul";
  if (f.includes("roxa")) return "dot-roxa";
  if (f.includes("marrom")) return "dot-marrom";
  if (f.includes("preta")) return "dot-preta";
  return "dot-branca";
}

function renderGrauDots(grau) {
  const total = 4;
  const filled = parseInt(grau) || 0;
  let html = '<span class="grau-dots">';
  for (let i = 0; i < total; i++) {
    html += `<span class="grau-dot${i < filled ? " filled" : ""}"></span>`;
  }
  html += '</span>';
  return html;
}

function renderStatusBadge(status) {
  const cls = "status-" + (status || "pendente").toLowerCase();
  return `<span class="status-badge ${cls}">${status || "Pendente"}</span>`;
}

function renderFaixaBadge(faixa) {
  const cls = obterClasseFaixa(faixa);
  const dotCls = obterClasseDotFaixa(faixa);
  return `<span class="faixa-display ${cls}"><span class="faixa-dot ${dotCls}"></span>${faixa || "Branca"}</span>`;
}

// ===== INIT USER INFO ON PAGE =====
function initNavbarUser() {
  const user = obterSessao();
  if (!user) return;

  const nameEl = document.getElementById("navbar-user-name");
  const avatarEl = document.getElementById("navbar-user-avatar");

  if (nameEl) nameEl.textContent = user.nome || "Aluno";
  if (avatarEl) avatarEl.textContent = user.nome ? user.nome.charAt(0).toUpperCase() : "?";
}

// ===== FORMAT DATE =====
function formatarData(data) {
  if (!data) return "-";
  const d = new Date(data);
  if (isNaN(d)) return data;
  return d.toLocaleDateString("pt-BR");
}

// ===== OBTER ADMIN TOKEN =====
function obterAdminToken() {
  const user = obterSessao();
  if (!user || user.role !== "admin") {
    return null;
  }
  return user.adminToken;
}

// ===== DEBUG MODE =====
function ativarDebug() {
  console.log("🔧 DEBUG ATIVADO");
  console.log("URL API:", API_URL);
  console.log("Sessão atual:", obterSessao());
  
  // Expor funções globalmente para testes
  window.debugAPI = {
    apiRequest,
    fazerLogin,
    obterSessao,
    obterTodosCTs
  };
  console.log("💡 Use: debugAPI.fazerLogin('email@example.com', 'senha')");
}
