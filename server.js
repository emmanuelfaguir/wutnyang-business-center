const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function sbHeaders(accessToken) {
  const token = accessToken || SUPABASE_KEY;
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

app.get('/health', (req, res) => {
  res.json({ ok: true, version: '2.0.0' });
});

// Supabase Auth helper used by the Version 2 login screen.
app.get('/api/auth/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Not signed in' });
    const token = auth.slice(7);
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: sbHeaders(token)
    });
    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Kept for the existing working app; Version 2 frontend uses the authenticated
// Supabase client for data operations once RLS is enabled.
app.get('/api/transactions', async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/transactions?select=*&order=date.desc,created_at.desc`, {
      headers: sbHeaders()
    });
    const text = await response.text();
    res.status(response.status).type('application/json').send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/transactions`, {
      method: 'POST',
      headers: { ...sbHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    res.status(response.status).type('application/json').send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`WUTNYANG BUSINESS CENTER v2 running on port ${PORT}`);
});
