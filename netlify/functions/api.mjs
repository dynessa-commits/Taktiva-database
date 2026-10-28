// Taktiva API: akun + sinkronisasi data antar perangkat (Netlify Functions + Netlify Blobs)
import { getStore } from '@netlify/blobs';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const b64 = x => Buffer.from(x).toString('base64url');
const sig = (s, k) => createHmac('sha256', k).update(s).digest('base64url');
const sign = (p, k) => { const s = b64('{"alg":"HS256","typ":"JWT"}') + '.' + b64(JSON.stringify(p)); return s + '.' + sig(s, k); };
const verify = (t, k) => {
  try {
    const [h, d, s] = t.split('.'), e = sig(h + '.' + d, k);
    if (s.length !== e.length || !timingSafeEqual(Buffer.from(s), Buffer.from(e))) return null;
    const p = JSON.parse(Buffer.from(d, 'base64url'));
    return p.exp > Date.now() / 1000 ? p : null;
  } catch { return null; }
};
const kf = e => Buffer.from(e).toString('hex');
const MAX = 900_000;

export default async (req) => {
  const k = process.env.JWT_SECRET;
  if (!k || k.length < 16) return J({ error: 'server_not_configured' }, 500);
  const path = new URL(req.url).pathname.replace(/^\/api\/?/, '');
  if (path === 'ping') return J({ ok: true });

  const users = getStore('users'), data = getStore('data'), rl = getStore('ratelimit');

  if (req.method === 'POST' && (path === 'register' || path === 'login')) {
    let b; try { b = await req.json(); } catch { return J({ error: 'bad_request' }, 400); }
    const email = String(b.email || '').trim().toLowerCase(), pw = String(b.password || '');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 120 || pw.length < 8 || pw.length > 200) return J({ error: 'invalid' }, 400);
    const key = kf(email), u = await users.get(key, { type: 'json' });
    const token = () => sign({ sub: email, exp: Math.floor(Date.now() / 1000) + 30 * 86400 }, k);

    if (path === 'register') {
      const name = String(b.name || '').trim().slice(0, 60);
      if (!name) return J({ error: 'invalid' }, 400);
      if (u) return J({ error: 'exists' }, 409);
      const salt = randomBytes(16);
      const rec = { name, level: b.level === 'SMA/SMK' ? 'SMA/SMK' : 'Mahasiswa', salt: salt.toString('hex'), hash: scryptSync(pw, salt, 64).toString('hex'), at: Date.now() };
      await users.setJSON(key, rec);
      return J({ token: token(), user: { email, name: rec.name, level: rec.level } });
    }
    // login (dibatasi 5 percobaan gagal per 10 menit)
    const r0 = (await rl.get(key, { type: 'json' })) || { n: 0, t: 0 }, fresh = Date.now() - r0.t < 600_000;
    if (r0.n >= 5 && fresh) return J({ error: 'locked' }, 429);
    const salt = u ? Buffer.from(u.salt, 'hex') : randomBytes(16);
    const h = scryptSync(pw, salt, 64);
    if (!u || !timingSafeEqual(h, Buffer.from(u.hash, 'hex'))) {
      await rl.setJSON(key, { n: (fresh ? r0.n : 0) + 1, t: Date.now() });
      return J({ error: 'credentials' }, 401);
    }
    if (r0.n) await rl.delete(key);
    return J({ token: token(), user: { email, name: u.name, level: u.level } });
  }

  const m = /^Bearer (.+)$/.exec(req.headers.get('authorization') || ''), p = m && verify(m[1], k);
  if (!p) return J({ error: 'unauthorized' }, 401);
  const key = kf(p.sub);

  if (path === 'data' && req.method === 'GET') {
    const d = await data.get(key, { type: 'json' });
    return J(d ? { data: d.data, rev: d.rev } : { data: null, rev: 0 });
  }
  if (path === 'data' && req.method === 'PUT') {
    const txt = await req.text();
    if (txt.length > MAX) return J({ error: 'too_large' }, 413);
    let b; try { b = JSON.parse(txt); } catch { return J({ error: 'bad_request' }, 400); }
    if (!b.data || !Array.isArray(b.data.tasks) || b.data.tasks.length > 1000) return J({ error: 'invalid' }, 400);
    const cur = await data.get(key, { type: 'json' }), crev = cur ? cur.rev : 0;
    if (crev !== (+b.rev || 0)) return J({ data: cur.data, rev: crev }, 409);
    const d = b.data, clean = { prefs: d.prefs || {}, tasks: d.tasks, del: d.del || {}, pu: d.pu || 0, id: d.id || 10 };
    await data.setJSON(key, { data: clean, rev: crev + 1 });
    return J({ rev: crev + 1 });
  }
  return J({ error: 'not_found' }, 404);
};

export const config = { path: '/api/*' };
