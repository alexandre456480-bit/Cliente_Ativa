// ===================================================
// DATA.JS — Camada de dados conectada ao Supabase
// via Backend Node.js com autenticação JWT
// ===================================================

const DATA_KEY = 'dashboardAtivaData'; // mantido para compatibilidade de eventos
const API_BASE = '/api';

// === Cache local para performance ===
let _dataCache = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 2000; // 2 segundos

function getToken() {
  return localStorage.getItem('ativa_token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

// === GUARD: Verifica autenticação ===
async function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  try {
    const res = await fetch(API_BASE + '/verify', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) {
      localStorage.removeItem('ativa_token');
      localStorage.removeItem('ativa_user');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  } catch (e) {
    // Se o servidor estiver offline, permite usar cache
    console.warn('Servidor offline, usando cache local');
    return true;
  }
}

// === CARREGAR DADOS (do Supabase via API) ===
function loadData() {
  // Retorna o cache síncrono para manter compatibilidade com o frontend
  if (_dataCache !== null) return _dataCache;
  // Se não tem cache, retorna array vazio (dados serão carregados async)
  return [];
}

async function loadDataAsync() {
  // Se o cache ainda é válido, retorna ele
  if (_dataCache !== null && (Date.now() - _cacheTimestamp) < CACHE_TTL) {
    return _dataCache;
  }
  try {
    const res = await fetch(API_BASE + '/data', { headers: authHeaders() });
    if (res.status === 401) {
      window.location.href = 'login.html';
      return [];
    }
    if (!res.ok) throw new Error('Erro ao carregar dados');
    const data = await res.json();
    _dataCache = data;
    _cacheTimestamp = Date.now();
    return data;
  } catch (err) {
    console.error('loadDataAsync error:', err);
    // Fallback: retorna cache se existir
    if (_dataCache !== null) return _dataCache;
    return [];
  }
}

// === SALVAR (não usado diretamente, mantido para compatibilidade) ===
function saveData(d) {
  // Atualiza apenas o cache local
  _dataCache = d;
  _cacheTimestamp = Date.now();
}

// === ADICIONAR REGISTRO ===
function addEntry(e) {
  e.id = Date.now() + '_' + Math.random().toString(36).substr(2, 5);

  // Atualiza cache local imediatamente (otimistic update)
  if (_dataCache) {
    _dataCache.push(e);
    _cacheTimestamp = Date.now();
  }

  // Envia para o backend de forma assíncrona
  fetch(API_BASE + '/data', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(e)
  }).then(res => {
    if (!res.ok) {
      console.error('Erro ao salvar no Supabase');
      showToast('Erro ao salvar no servidor!', 'error');
    }
  }).catch(err => {
    console.error('addEntry error:', err);
    showToast('Erro de conexão!', 'error');
  });

  return e;
}

// === REMOVER REGISTRO ===
function removeEntry(id) {
  // Atualiza cache local imediatamente
  if (_dataCache) {
    _dataCache = _dataCache.filter(d => d.id !== id);
    _cacheTimestamp = Date.now();
  }

  // Remove no backend de forma assíncrona
  fetch(API_BASE + '/data/' + id, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(res => {
    if (!res.ok) {
      console.error('Erro ao remover no Supabase');
      showToast('Erro ao remover no servidor!', 'error');
    }
  }).catch(err => {
    console.error('removeEntry error:', err);
  });
}

// === POR CATEGORIA ===
function getByCategory(c) {
  return loadData().filter(d => d.categoria === c);
}

// === INIT: Carrega dados do Supabase ao abrir a página ===
async function initSupabaseData() {
  const authed = await checkAuth();
  if (!authed) return;

  try {
    const data = await loadDataAsync();
    _dataCache = data;
    _cacheTimestamp = Date.now();

    // Dispara evento para que as páginas saibam que os dados estão prontos
    window.dispatchEvent(new Event('dataReady'));
  } catch (err) {
    console.error('initSupabaseData error:', err);
  }
}

// === NÃO usar mais initTestData — dados ficam no Supabase ===
function initTestData() {
  // Desativado — migração para Supabase
  // Dados de teste devem ser inseridos via Cadastro ou SQL
}

// ========================
// FILTROS (inalterados)
// ========================
function filterByPeriod(data, period) {
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const toStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = toStr(today);
  switch (period) {
    case 'day': return data.filter(d => d.data === todayStr);
    case 'week':
      const ws = new Date(today); const dow = ws.getDay(); ws.setDate(ws.getDate() - (dow === 0 ? 6 : dow - 1));
      const wsStr = toStr(ws); return data.filter(d => d.data >= wsStr && d.data <= todayStr);
    case 'month':
      const ms = toStr(new Date(today.getFullYear(), today.getMonth(), 1));
      return data.filter(d => d.data >= ms && d.data <= todayStr);
    default: return data;
  }
}

function getPrevPeriodData(data, period) {
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const toStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  switch (period) {
    case 'week':
      const ws = new Date(today); const dow = ws.getDay(); ws.setDate(ws.getDate() - (dow === 0 ? 6 : dow - 1));
      const pe = new Date(ws); pe.setDate(pe.getDate() - 1); const ps = new Date(pe); ps.setDate(ps.getDate() - 6);
      return data.filter(d => d.data >= toStr(ps) && d.data <= toStr(pe));
    case 'month':
      const lme = new Date(today.getFullYear(), today.getMonth(), 0);
      const lms = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return data.filter(d => d.data >= toStr(lms) && d.data <= toStr(lme));
    default: return [];
  }
}

function sumByType(data, tipo) { return data.filter(d => d.tipo === tipo).reduce((s, d) => s + d.valor, 0) }
function calcGrowth(cur, prev) { if (prev === 0) return cur > 0 ? 100 : 0; return ((cur - prev) / prev * 100) }

function aggregateData(data, groupBy) {
  const g = {};
  data.forEach(d => {
    let key, sortKey;
    const date = new Date(d.data + 'T12:00:00');
    if (groupBy === 'year') {
      key = String(date.getFullYear()); sortKey = key;
    } else if (groupBy === 'month') {
      const ms = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      key = ms[date.getMonth()] + '/' + date.getFullYear().toString().slice(-2);
      sortKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    } else if (groupBy === 'week') {
      const ws = new Date(date); ws.setDate(ws.getDate() - ws.getDay());
      key = String(ws.getDate()).padStart(2, '0') + '/' + String(ws.getMonth() + 1).padStart(2, '0');
      sortKey = ws.getTime();
    } else {
      key = String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0');
      sortKey = d.data;
    }
    if (!g[sortKey]) g[sortKey] = { label: key, f: 0, d: 0, cases: 0, items: [] };
    if (d.tipo === 'Faturamento') g[sortKey].f += d.valor;
    if (d.tipo === 'Despesa') g[sortKey].d += d.valor;
    g[sortKey].cases++;
    g[sortKey].items.push(d);
  });
  const sortedKeys = Object.keys(g).sort();
  return {
    labels: sortedKeys.map(k => g[k].label),
    map: (fn) => sortedKeys.map(k => fn(g[k]))
  };
}

function getTimeSeries(data) {
  const agg = aggregateData(data, 'day');
  return { labels: agg.labels, faturamento: agg.map(x=>x.f), despesa: agg.map(x=>x.d) }
}

function getProfitSeries(data) {
  const agg = aggregateData(data, 'day');
  return {
    labels: agg.labels,
    lucro: agg.map(x=>x.f - x.d),
    margem: agg.map(x=>x.f > 0 ? ((x.f - x.d) / x.f * 100) : 0)
  }
}

function getTopClients(data, n = 10) {
  const g = {}; data.filter(d => d.categoria === 'Clientes' && d.tipo === 'Faturamento').forEach(d => { g[d.nome] = (g[d.nome] || 0) + d.valor });
  return Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function getDistinctNames(data, cat) { return [...new Set(data.filter(d => d.categoria === cat).map(d => d.nome))] }

function getEmployeeData(data, tipo) {
  const nomes = ['Paulo', 'Hamilton', 'Joice', 'Peninha', 'Ecione'];
  const g = {}; nomes.forEach(n => g[n] = 0);
  data.filter(d => d.categoria === 'Funcionários' && d.tipo === tipo).forEach(d => { g[d.nome] = (g[d.nome] || 0) + d.valor });
  return { names: nomes, values: nomes.map(n => g[n]) }
}

function getEmployeeOrders(data) {
  const nomes = ['Paulo', 'Hamilton', 'Joice', 'Peninha', 'Ecione'];
  const g = {}; nomes.forEach(n => g[n] = 0);
  data.filter(d => d.categoria === 'Funcionários' && d.tipo === 'Faturamento').forEach(d => { g[d.nome] = (g[d.nome] || 0) + 1 });
  return { names: nomes, values: nomes.map(n => g[n]) }
}

function getOrdersSeries(data) {
  const g = {}; data.filter(d => d.categoria === 'Clientes').forEach(d => { g[d.data] = (g[d.data] || 0) + 1 });
  const dates = Object.keys(g).sort();
  return { labels: dates.map(formatDateShort), values: dates.map(d => g[d]) }
}

function generateSummary(data) {
  const rev = sumByType(data, 'Faturamento'), exp = sumByType(data, 'Despesa'), profit = rev - exp;
  const margin = rev > 0 ? (profit / rev * 100) : 0; const orders = data.filter(d => d.categoria === 'Clientes').length;
  const clients = getDistinctNames(data, 'Clientes').length;
  let mood = margin > 30 ? 'excelente' : margin > 15 ? 'positivo' : margin > 0 ? 'moderado' : 'preocupante';
  return `A empresa apresenta desempenho <strong>${mood}</strong> com margem de lucro de <strong>${margin.toFixed(1)}%</strong>. ` +
    `Faturamento de <strong>${formatCurrency(rev)}</strong> contra <strong>${formatCurrency(exp)}</strong> em despesas, ` +
    `resultando em lucro de <strong>${formatCurrency(profit)}</strong>. ` +
    `São <strong>${orders}</strong> pedidos de <strong>${clients}</strong> clientes ativos no período.`;
}

// === UTILITÁRIOS ===
function formatCurrency(v) { return parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function formatDateShort(s) { const p = s.split('-'); return p[2] + '/' + p[1] }
function formatDateFull(s) { const p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0] }

function showToast(msg, type = 'success') {
  const old = document.querySelector('.toast'); if (old) old.remove();
  const t = document.createElement('div'); t.className = 'toast';
  const ic = type === 'success' ? 'fa-circle-check' : type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-xmark';
  t.innerHTML = `<i class="fa-solid ${ic}"></i> ${msg}`; document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400) }, 3000)
}

// === EXPORT/IMPORT CSV ===
function exportCSV(cat) {
  const data = cat ? getByCategory(cat) : loadData();
  if (!data.length) { showToast('Nenhum dado para exportar!', 'warning'); return }
  const h = ['Data', 'Categoria', 'Tipo', 'Classe', 'Grupo', 'Nome', 'Descrição', 'Valor'];
  let csv = '\uFEFF' + h.join(';') + '\n';
  data.forEach(d => { csv += [d.data, d.categoria, d.tipo, d.classe || '', d.grupo || '', d.nome, d.descricao || '', d.valor].map(c => `"${String(c).replace(/"/g, '""')}"`).join(';') + '\n' });
  const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const u = URL.createObjectURL(b);
  const a = document.createElement('a'); a.href = u; a.download = `dados_${cat || 'todos'}_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(u);
  showToast('CSV exportado com sucesso!')
}

function importCSV(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = async e => {
      try {
        const lines = e.target.result.split('\n').filter(l => l.trim()); if (lines.length < 2) { reject('Arquivo vazio.'); return }
        const sep = lines[0].includes(';') ? ';' : ','; const imp = [];
        for (let i = 1; i < lines.length; i++) {
          const c = lines[i].split(sep).map(x => x.replace(/^"|"$/g, '').trim()); if (c.length < 6) continue;
          if (lines[0].includes('Classe') && c.length >= 8) {
            imp.push({ id: Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 3), data: c[0], categoria: c[1], tipo: c[2], classe: c[3], grupo: c[4], nome: c[5], descricao: c[6] || '', valor: parseFloat(c[7].replace(',', '.')) || 0 })
          } else {
            imp.push({ id: Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 3), data: c[0], categoria: c[1], tipo: c[2], nome: c[3], descricao: c[4] || '', valor: parseFloat(c[5].replace(',', '.')) || 0 })
          }
        }

        // Envia para o backend em bulk
        const res = await fetch(API_BASE + '/data/bulk', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(imp)
        });

        if (!res.ok) throw new Error('Erro ao importar para o servidor');

        // Atualiza cache local
        if (_dataCache) {
          _dataCache.push(...imp);
          _cacheTimestamp = Date.now();
        }

        showToast(`${imp.length} registros importados com sucesso!`);
        resolve(imp.length);
      } catch (err) { reject('Erro: ' + err.message) }
    }; r.onerror = () => reject('Erro ao ler arquivo.'); r.readAsText(file, 'UTF-8')
  })
}

// === LOGOUT ===
function logout() {
  localStorage.removeItem('ativa_token');
  localStorage.removeItem('ativa_user');
  _dataCache = null;
  window.location.href = 'login.html';
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
  // Não roda guard no login.html
  if (window.location.pathname.includes('login.html')) return;
  initSupabaseData();
});
