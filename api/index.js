const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// === SUPABASE ===
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

// === CONTAS AUTORIZADAS ===
const ACCOUNTS = [
  { username: 'ativa_distribuidora', password: '221147' }
];

// === MIDDLEWARE AUTH ===
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// ========================
// ROTAS DE AUTENTICAÇÃO
// ========================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const account = ACCOUNTS.find(a => a.username === username && a.password === password);
  if (!account) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const token = jwt.sign(
    { username: account.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, username: account.username });
});

app.get('/api/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

// ========================
// ROTAS DE DADOS (CRUD)
// ========================

// GET — Buscar todos os registros do usuário
app.get('/api/data', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('registros')
      .select('*')
      .eq('account', req.user.username)
      .order('data', { ascending: true });

    if (error) throw error;

    const mapped = (data || []).map(row => ({
      id: row.id,
      data: row.data,
      categoria: row.categoria,
      tipo: row.tipo,
      classe: row.classe || undefined,
      grupo: row.grupo || undefined,
      nome: row.nome,
      descricao: row.descricao || '',
      valor: parseFloat(row.valor)
    }));

    res.json(mapped);
  } catch (err) {
    console.error('GET /api/data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST — Adicionar um registro
app.post('/api/data', authMiddleware, async (req, res) => {
  try {
    const entry = req.body;
    const row = {
      id: entry.id || (Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
      account: req.user.username,
      data: entry.data,
      categoria: entry.categoria,
      tipo: entry.tipo,
      classe: entry.classe || null,
      grupo: entry.grupo || null,
      nome: entry.nome,
      descricao: entry.descricao || '',
      valor: parseFloat(entry.valor)
    };

    const { data, error } = await supabase
      .from('registros')
      .insert([row])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('POST /api/data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST — Adicionar múltiplos registros (import CSV)
app.post('/api/data/bulk', authMiddleware, async (req, res) => {
  try {
    const entries = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Array de registros vazio' });
    }

    const rows = entries.map(entry => ({
      id: entry.id || (Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
      account: req.user.username,
      data: entry.data,
      categoria: entry.categoria,
      tipo: entry.tipo,
      classe: entry.classe || null,
      grupo: entry.grupo || null,
      nome: entry.nome,
      descricao: entry.descricao || '',
      valor: parseFloat(entry.valor)
    }));

    const { data, error } = await supabase
      .from('registros')
      .insert(rows)
      .select();

    if (error) throw error;
    res.json({ inserted: data.length });
  } catch (err) {
    console.error('POST /api/data/bulk error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE — Remover um registro
app.delete('/api/data/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('registros')
      .delete()
      .eq('id', req.params.id)
      .eq('account', req.user.username);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Export para Vercel serverless
module.exports = app;
