// ============================================
// APP.JS - Lógica da Aplicação
// Academy Jiu Jitsu System
// ============================================

// ========== CONFIGURAÇÕES ==========
const API_URL = 'https://script.google.com/macros/s/AKfycbwssPu16F7GoJ5Qhf4v-S-Fuwr2DCdSQDsb0PLNmmXfak3Mv2Um-6C44sXH6ODowhu-mw/exec';

const CONFIG = {
    apiUrl: API_URL,
    timeout: 10000,
    debug: true
};

// ========== VALIDAÇÃO ONLOAD ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ app.js carregado');
    console.log('🔌 API URL:', CONFIG.apiUrl);

    // Verificar se está em página de aluno ou admin
    const caminhoAtual = window.location.pathname;
    if (caminhoAtual.includes('aluno.html')) {
        verificarAutenticacaoAluno();
    } else if (caminhoAtual.includes('admin.html')) {
        verificarAutenticacaoAdmin();
    }
});

// ========== CHAMADAS À API ==========
/**
 * Faz chamada à API do Google Apps Script
 * @param {string} acao - Ação a executar (fazerLogin, registrarAluno, etc)
 * @param {object} dados - Dados a enviar
 * @returns {Promise<object>} Resposta da API
 */
async function chamarAPI(acao, dados = {}) {
    if (CONFIG.debug) {
        console.log(`📤 Chamando API: ${acao}`, dados);
    }

    try {
        const payload = {
            acao: acao,
            ...dados
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        let data;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('❌ Resposta não é JSON:', text);
            throw new Error('Resposta do servidor não é JSON');
        }

        if (CONFIG.debug) {
            console.log(`✅ Resposta: ${acao}`, data);
        }

        // Verificar se retornou erro do backend
        if (data.erro) {
            throw new Error(data.mensagem || 'Erro no backend');
        }

        return data;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('❌ Timeout na requisição');
            throw new Error('Tempo de conexão excedido. Tente novamente.');
        }

        if (error instanceof SyntaxError) {
            console.error('❌ Erro ao parsear JSON:', error);
            throw new Error('Erro ao processar resposta do servidor');
        }

        console.error(`❌ Erro na API (${acao}):`, error.message);
        throw error;
    }
}

// ========== AUTENTICAÇÃO ALUNO ==========
function verificarAutenticacaoAluno() {
    const usuario = obterSessao();

    if (!usuario) {
        console.warn('⚠️ Usuário não autenticado em aluno.html');
        window.location.href = 'index.html';
        return;
    }

    if (usuario.role && usuario.role === 'admin') {
        console.warn('⚠️ Admin tentando acessar página de aluno');
        window.location.href = 'admin.html';
        return;
    }

    console.log('✅ Aluno autenticado:', usuario.nome);
    carregarPainelAluno(usuario);
}

// ========== AUTENTICAÇÃO ADMIN ==========
function verificarAutenticacaoAdmin() {
    const usuario = obterSessao();

    if (!usuario) {
        console.warn('⚠️ Usuário não autenticado em admin.html');
        window.location.href = 'index.html';
        return;
    }

    if (usuario.role !== 'admin') {
        console.warn('⚠️ Aluno tentando acessar página de admin');
        window.location.href = 'aluno.html';
        return;
    }

    console.log('✅ Admin autenticado:', usuario.nome);
    carregarPainelAdmin(usuario);
}

// ========== PAINEL DO ALUNO ==========
function carregarPainelAluno(usuario) {
    // Preencher dados do usuário
    preencherDadosAluno(usuario);

    // Configurar botão logout
    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
        btnSair.addEventListener('click', function() {
            if (confirm('Tem certeza que quer sair?')) {
                fazerLogout();
            }
        });
    }

    // Carregar dados adicionais se necessário
    console.log('✅ Painel do aluno carregado');
}

function preencherDadosAluno(usuario) {
    // Preencher nome
    const nomeElements = document.querySelectorAll('[data-user-name]');
    nomeElements.forEach(el => {
        el.textContent = usuario.nome || 'Usuário';
    });

    // Preencher faixa
    const faixaElements = document.querySelectorAll('[data-user-belt]');
    faixaElements.forEach(el => {
        el.textContent = usuario.faixa || 'N/A';
    });

    // Preencher grau
    const grauElements = document.querySelectorAll('[data-user-degree]');
    grauElements.forEach(el => {
        const grau = usuario.grau || 0;
        el.textContent = `${grau}º Grau`;
    });

    // Preencher CT
    const ctElements = document.querySelectorAll('[data-user-ct]');
    ctElements.forEach(el => {
        el.textContent = usuario.ct_principal || 'N/A';
    });

    // Preencher email
    const emailElements = document.querySelectorAll('[data-user-email]');
    emailElements.forEach(el => {
        el.textContent = usuario.email || 'N/A';
    });
}

// ========== PAINEL DO ADMIN ==========
function carregarPainelAdmin(usuario) {
    console.log('✅ Painel admin carregado');

    // Preencher nome do admin
    const adminNameElements = document.querySelectorAll('[data-admin-name]');
    adminNameElements.forEach(el => {
        el.textContent = usuario.nome || 'Admin';
    });

    // Configurar botão logout
    const btnSair = document.getElementById('btnSairAdmin');
    if (btnSair) {
        btnSair.addEventListener('click', function() {
            if (confirm('Tem certeza que quer sair?')) {
                fazerLogout();
            }
        });
    }

    // Carregar alunos pendentes
    carregarAlunosPendentes();
}

function carregarAlunosPendentes() {
    const usuario = obterSessao();

    if (!usuario || usuario.role !== 'admin') {
        console.error('❌ Sem permissão para carregar pendentes');
        return;
    }

    chamarAPI('obterAlunosPendentes', { adminToken: usuario.adminToken })
        .then(data => {
            if (data.sucesso) {
                exibirAlunosPendentes(data.alunos || []);
            } else {
                console.error('❌ Erro ao carregar pendentes:', data.mensagem);
            }
        })
        .catch(error => {
            console.error('❌ Erro:', error);
        });
}

function exibirAlunosPendentes(alunos) {
    const container = document.getElementById('alunosPendentes');
    
    if (!container) {
        console.warn('⚠️ Container de alunos pendentes não encontrado');
        return;
    }

    if (!alunos || alunos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Nenhum aluno pendente</p>';
        return;
    }

    let html = '';
    alunos.forEach(aluno => {
        html += `
            <div style="padding: 15px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${aluno.nome}</strong><br>
                        <small style="color: #666;">${aluno.email}</small><br>
                        <small style="color: #999;">Faixa: ${aluno.faixa}</small>
                    </div>
                    <button onclick="aprovarAluno('${aluno.id}')" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ✓ Aprovar
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function aprovarAluno(alunoId) {
    const usuario = obterSessao();

    if (!usuario || usuario.role !== 'admin') {
        alert('Sem permissão');
        return;
    }

    if (!confirm('Tem certeza que quer aprovar este aluno?')) {
        return;
    }

    chamarAPI('aprovarAluno', { 
        alunoId: alunoId,
        adminToken: usuario.adminToken
    })
        .then(data => {
            if (data.sucesso) {
                alert('✅ Aluno aprovado com sucesso!');
                carregarAlunosPendentes();
            } else {
                alert('❌ Erro: ' + (data.mensagem || 'Desconhecido'));
            }
        })
        .catch(error => {
            console.error('❌ Erro:', error);
            alert('❌ Erro ao aprovar aluno');
        });
}

// ========== SESSION STORAGE ==========
function obterSessao() {
    try {
        const usuarioJson = sessionStorage.getItem('usuario');
        if (!usuarioJson) {
            return null;
        }
        return JSON.parse(usuarioJson);
    } catch (error) {
        console.error('❌ Erro ao obter sessão:', error);
        return null;
    }
}

function limparSessao() {
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('adminToken');
}

function fazerLogout() {
    limparSessao();
    window.location.href = 'index.html';
}

// ========== UTILITIES ==========
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function mostrarMensagem(texto, tipo = 'info', duracao = 5000) {
    const box = document.getElementById('messageBox');
    if (!box) {
        console.warn('⚠️ messageBox não encontrado');
        return;
    }

    box.textContent = texto;
    box.className = 'message show ' + tipo;

    if (duracao > 0) {
        setTimeout(() => {
            box.className = 'message';
        }, duracao);
    }
}

// ========== HELPERS ==========
function formatarData(dataString) {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function formatarHora(dataString) {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleTimeString('pt-BR');
}

// ========== LOG DEBUG ==========
console.log('%c🥋 ACADEMY JIU JITSU SYSTEM', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('API URL:', CONFIG.apiUrl);
console.log('Modo Debug:', CONFIG.debug);
