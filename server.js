const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
// Older Render setups stored the REST endpoint here; normalize both forms.
const SUPABASE_URL = (process.env.SUPABASE_URL || '')
  .replace(/\/$/, '')
  .replace(/\/rest\/v1$/, '');
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

function serviceHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function readJson(response) {
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text }; }
  if (!response.ok) {
    throw new Error(data.message || data.error_description || data.error || `Supabase returned ${response.status}`);
  }
  return data;
}

// Verifies the access token and checks the role server-side. The browser's
// displayed role is never trusted for sensitive actions.
async function requireAdmin(req) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error('Server staff management is not configured.');
    error.status = 503;
    throw error;
  }

  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    const error = new Error('Please sign in again.');
    error.status = 401;
    throw error;
  }

  const accessToken = authorization.slice(7);
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const user = await readJson(userResponse);

  const profileResponse = await fetch(
    `${SUPABASE_REST_URL}/profiles?select=role&id=eq.${encodeURIComponent(user.id)}`,
    { headers: serviceHeaders() }
  );
  const profiles = await readJson(profileResponse);

  if (profiles[0]?.role !== 'admin') {
    const error = new Error('Only an Admin can add staff users.');
    error.status = 403;
    throw error;
  }
  return user;
}

app.get('/health', (req, res) => {
  res.json({ ok: true, version: '2.1.1' });
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

// Creates both the Auth account and the corresponding staff profile. This
// endpoint requires an authenticated Admin and uses a Render-only service key.
app.post('/api/staff', async (req, res) => {
  let createdUserId;
  try {
    await requireAdmin(req);
    const fullName = String(req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Use a password with at least 8 characters.' });
    }

    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: serviceHeaders(),
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      })
    });
    const authUser = await readJson(authResponse);
    createdUserId = authUser.id;

    const profileResponse = await fetch(`${SUPABASE_REST_URL}/profiles`, {
      method: 'POST',
      headers: { ...serviceHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({ id: createdUserId, full_name: fullName, role: 'staff' })
    });
    const profile = await readJson(profileResponse);

    res.status(201).json({
      message: 'Staff user created.',
      staff: { id: createdUserId, full_name: profile[0]?.full_name || fullName, email }
    });
  } catch (error) {
    // Avoid an unusable Auth account if its matching profile could not be made.
    if (createdUserId && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${createdUserId}`, {
          method: 'DELETE',
          headers: serviceHeaders()
        });
      } catch (_) {}
    }
    res.status(error.status || 500).json({ error: error.message || 'Could not create staff user.' });
  }
});

// Kept for the existing working app; Version 2 frontend uses the authenticated
// Supabase client for data operations once RLS is enabled.
app.get('/api/transactions', async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_REST_URL}/transactions?select=*&order=date.desc,created_at.desc`, {
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
    const response = await fetch(`${SUPABASE_REST_URL}/transactions`, {
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
  console.log(`WUTNYANG BUSINESS CENTER v2.1.1 running on port ${PORT}`);
});
