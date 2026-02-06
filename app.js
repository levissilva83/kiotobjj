// ====================================
// ACADEMY JIU JITSU - APP.JS v4
// Professor Levi Silva
// URL do Backend atualizada
// ====================================

// ✅ URL ATUALIZADA DO BACKEND
const API_URL = "https://script.google.com/macros/s/AKfycbyvGxWKUwjerOlChtAWIPOxjTh4NX_j_MMzz-KCkNRhxpXvVzfcHGd66GIHGYw1CAJzpQ/exec";

console.log("✅ App.js carregado");
console.log("📤 API URL:", API_URL);

// ===== API REQUEST =====
async function apiRequest(action, dados = {}) {
  try {
    console.log(`📡 Requisição: ${action}`);
    
    const response = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({ action, ...dados })
    });
    
    const text = await response.text();
    console.log(`✅ Resposta recebida para: ${action}`);
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("❌ Erro ao parsear JSON:", text);
      return { sucesso: false, mensagem: "Erro ao processar resposta" };
    }
  } catch (erro) {
    console.error(`❌ Erro na requisição ${action}:`, erro);
    return { sucesso: false, mensagem: "Erro de conexão: " + erro.message };
  }
}

// ===== API FUNCTIONS =====
async function fazerLogin(email, senha) {
  return apiRequest("login", { email, senha });
}

async function fazerLoginAdmin(chave) {
  return apiRequest("loginAdmin", { chave });
}

async function registrarAluno(nome, email, senha, faixa, ct) {
  return apiRequest("registro", { nome, email, senha, faixa, ct });
}

async function obterEstatisticasAluno(alunoID) {
  return apiRequest("obterAluno", { alunoID });
}

async function obterAlunosPendentes(adminToken) {
  return apiRequest("obterPendentes", { adminToken });
}

async function aprovarAluno(alunoID, adminToken) {
  return apiRequest("aprovarAluno", { alunoID, adminToken });
}

async function obterTodosAlunos(adminToken) {
  return apiRequest("obterTodosAlunos", { adminToken });
}

async function obterTodosCTs() {
  return apiRequest("obterTodosCTs", {});
}

async function cadastrarCT(nome, cidade, estado, responsavel, adminToken) {
  return apiRequest("cadastrarCT", { nome, cidade, estado, responsavel, adminToken });
}

async function alterarGrau(alunoID, novoGrau, adminToken) {
  return apiRequest("alterarGrau", { alunoID, novoGrau, adminToken });
}

// ===== SESSION MANAGEMENT =====
function salvarSessao(dados) {
  sessionStorage.setItem("academy_user", JSON.stringify(dados));
  console.log("✅ Sessão salva:", dados.nome);
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
