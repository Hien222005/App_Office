// Kết nối Supabase dùng chung cho mọi script. Không có thư viện ngoài —
// gọi thẳng REST API nên không cần npm install gì cả.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function nạpEnv() {
  try {
    for (const dòng of readFileSync(join(here, '.env'), 'utf8').split('\n')) {
      const m = dòng.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    console.error('Thiếu agent/.env — chép từ .env.example rồi điền.');
    process.exit(1);
  }
}
nạpEnv();

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!URL || !KEY) { console.error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_KEY'); process.exit(1); }

async function gọi(đường, opt = {}) {
  const r = await fetch(`${URL}/rest/v1/${đường}`, {
    ...opt,
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: opt.prefer ?? 'return=representation',
      ...opt.headers,
    },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${đường}\n${text}`);
  return text ? JSON.parse(text) : null;
}

export const db = {
  đọc:  (bảng, q = '') => gọi(`${bảng}?${q}`),
  thêm: (bảng, rows)   => gọi(bảng, { method: 'POST', body: JSON.stringify(rows) }),
  sửa:  (bảng, q, d)   => gọi(`${bảng}?${q}`, { method: 'PATCH', body: JSON.stringify(d) }),
  nhét: (bảng, rows)   => gọi(bảng, { method: 'POST', body: JSON.stringify(rows),
                                      headers: { Prefer: 'resolution=merge-duplicates,return=representation' } }),
};

export const hômNay = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD giờ địa phương
export const in_ = (x) => console.log(JSON.stringify(x, null, 2));
