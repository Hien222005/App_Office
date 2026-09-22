// Sinh site/cau-hinh.js từ biến môi trường hoặc agent/.env.
// Khoá anon là khoá công khai (RLS chặn ai không phải chủ nhân), nhưng vẫn KHÔNG commit:
// file sinh ra nằm trong .gitignore. Netlify thì đặt biến trong Project configuration → Environment.
//
// Sinh luôn DANH SÁCH MẢNG VIỆC cho app, quét ra từ frontmatter của các Skill. Trước đây
// app viết cứng PHONG/TEN/NEON trong site/index.html, nên thêm một mảng là phải sửa cả ở đó.
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

// Mảng việc: một nguồn duy nhất là Skill. Mảng đang tạm dừng vẫn gửi sang app (kèm
// `tat: true`) để việc cũ của mảng đó còn hiện đúng tên và đúng màu, thay vì thành ô trống.
// `sua` = "File được sửa" của Skill, để màn chi tiết việc hiện đúng phạm vi agent được
// đụng vào. Skill chưa khai (vd Kinh doanh đang chờ sếp điền) thì để trống.
const { PHÒNG } = await import('./agent/phong.mjs');
const { phạmViTừSkill } = await import('./agent/pham-vi.mjs');
const sửaĐược = (skill) => { try { return phạmViTừSkill(skill).duoc_sua; } catch { return []; } };
const mang = Object.fromEntries(Object.entries(PHÒNG).map(([mã, p]) =>
  [mã, { ten: p.tên, mau: p.màu, tat: !!p.tắt, skill: p.skill, sua: sửaĐược(p.skill) }]));

const nội = `/* Sinh tự động bởi tao-cau-hinh.mjs — đừng sửa tay, đừng commit. */
window.CAU_HINH = ${JSON.stringify({ url, anon, mang }, null, 2)};
`;
writeFileSync(join(gốc, 'site', 'cau-hinh.js'), nội);
const tênMảng = Object.entries(mang).map(([m, v]) => v.tat ? `${m}(tắt)` : m).join(' · ');
console.log(url && anon
  ? `Đã sinh site/cau-hinh.js · ${url}`
  : 'Đã sinh site/cau-hinh.js nhưng THIẾU khoá — app sẽ chạy dữ liệu mẫu.');
console.log(`Mảng việc quét từ Skill: ${tênMảng || '(chưa có)'}`);
