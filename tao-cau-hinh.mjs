// Sinh site/cau-hinh.js từ biến môi trường hoặc agent/.env.
// Khoá anon là khoá công khai (RLS chặn ai không phải chủ nhân), nhưng vẫn KHÔNG commit:
// file sinh ra nằm trong .gitignore. Netlify thì đặt biến trong Project configuration → Environment.
//
//   node tao-cau-hinh.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const gốc = dirname(fileURLToPath(import.meta.url));

function lấy(tên) {
  if (process.env[tên]) return process.env[tên];
  try {
    const m = readFileSync(join(gốc, 'agent', '.env'), 'utf8').match(new RegExp(`^${tên}\\s*=\\s*(.*)$`, 'm'));
    return m ? m[1].trim() : '';
  } catch { return ''; }
}

const url = lấy('SUPABASE_URL');
const anon = lấy('SUPABASE_ANON_KEY');
const nội = `/* Sinh tự động bởi tao-cau-hinh.mjs — đừng sửa tay, đừng commit. */
window.CAU_HINH = ${JSON.stringify({ url, anon }, null, 2)};
`;
writeFileSync(join(gốc, 'site', 'cau-hinh.js'), nội);
console.log(url && anon
  ? `Đã sinh site/cau-hinh.js · ${url}`
  : 'Đã sinh site/cau-hinh.js nhưng THIẾU khoá — app sẽ chạy dữ liệu mẫu.');
