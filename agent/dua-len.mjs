// ĐƯA BẢN XEM THỬ LÊN SUPABASE STORAGE — nguồn của "link check".
//
//   node dua-len.mjs <id-việc>          → đẩy file đã đổi, in link
//
// Vì sao không dùng máy chủ trên Mac: đo ngày 20/09 thấy `pmset` đặt Mac ngủ sau
// 1 phút không dùng. Link trỏ về Mac chết ngay khi sếp rời máy — mà sếp duyệt
// lúc đang ở ngoài. File trên Storage sống độc lập với máy.
//
// ĐƯỜNG DẪN BÁM THEO FILE, KHÔNG BÁM THEO MÃ VIỆC:
//   xem-thu/<mã-phòng>/<đường dẫn file trong dự án>
// Sửa lại đúng file đó lần sau thì ra ĐÚNG LINK CŨ — sếp bookmark được, luôn ra bản
// mới nhất. File mới thì link mới.
//
// <mã-phòng> là chuỗi ngẫu nhiên đặt MỘT LẦN, giữ trong agent/.env. Bucket để công
// khai nên ai có link đều mở được; mã khó đoán là thứ giữ cho link không bị dò ra.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { THƯ_MỤC_NHÁP } from './phong.mjs';
import { soSánh } from './anh-chup.mjs';
import { xétFile } from './pham-vi.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const BUCKET = 'xem-thu';

function env(tên) {
  if (process.env[tên]) return process.env[tên];
  try {
    const m = readFileSync(join(here, '.env'), 'utf8').match(new RegExp(`^${tên}\\s*=\\s*(.*)$`, 'm'));
    return m ? m[1].trim() : '';
  } catch { return ''; }
}

const URL_SB = env('SUPABASE_URL');
const KHOÁ = env('SUPABASE_SERVICE_KEY');
// Link đưa cho sếp KHÔNG phải link Storage trần: Supabase trả mọi file HTML thành
// text/plain nên mở ra chỉ thấy mã nguồn. Đi vòng qua hàm /xem trên Netlify,
// nơi file được trả về đúng kiểu. Đổi APP_URL nếu đổi tên site.
const URL_APP = env('APP_URL') || 'https://courageous-sprite-17c1ff.netlify.app';

// Mã bí mật của từng phòng. Chưa có thì in ra dòng cần thêm vào .env rồi dừng —
// không tự ghi vào .env, để sếp thấy và giữ được nó.
export function mãPhòng(mảng) {
  const tên = `XEM_THU_MA_${String(mảng).toUpperCase()}`;
  const mã = env(tên);
  if (!mã) {
    console.error(`Thiếu ${tên} trong agent/.env. Thêm dòng này rồi chạy lại:\n`
                + `${tên}=${randomBytes(8).toString('hex')}`);
    process.exit(1);
  }
  return mã;
}

const KIỂU = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
};
const kiểuCủa = (f) => KIỂU[extname(f).toLowerCase()] ?? 'application/octet-stream';

async function tạoBucketNếuChưa() {
  const h = { apikey: KHOÁ, Authorization: `Bearer ${KHOÁ}` };
  const r = await fetch(`${URL_SB}/storage/v1/bucket/${BUCKET}`, { headers: h });
  if (r.ok) return;
  const t = await fetch(`${URL_SB}/storage/v1/bucket`, {
    method: 'POST', headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!t.ok) throw new Error(`Không tạo được bucket ${BUCKET}: ${await t.text()}`);
}

async function đẩyMột(đườngTrongBucket, đườngThật) {
  const r = await fetch(`${URL_SB}/storage/v1/object/${BUCKET}/${đườngTrongBucket}`, {
    method: 'POST',
    headers: {
      apikey: KHOÁ, Authorization: `Bearer ${KHOÁ}`,
      'Content-Type': kiểuCủa(đườngThật),
      'x-upsert': 'true',            // sửa lại cùng file → ghi đè, link không đổi
      'cache-control': 'max-age=60',
    },
    body: readFileSync(đườngThật),
  });
  if (!r.ok) throw new Error(`Đẩy hỏng "${đườngTrongBucket}": ${await r.text()}`);
}

const mãHoá = (p) => p.split('/').map(encodeURIComponent).join('/');

// Đẩy mọi file trong phạm vi đã đổi, CỘNG file phụ mà trang cần (css, ảnh) nếu có
// trong bản nháp — không có chúng thì mở link ra trang vỡ.
export async function đưaLên(id) {
  if (!URL_SB || !KHOÁ) throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_KEY trong agent/.env');
  const sổ = JSON.parse(readFileSync(join(THƯ_MỤC_NHÁP, id, 'so.json'), 'utf8'));
  const nháp = join(THƯ_MỤC_NHÁP, id, 'nhap');
  const pv = { goc: sổ.goc, duoc_sua: sổ.duoc_sua, chi_sua: sổ.chi_sua };

  const { sửa, thêm } = soSánh(sổ.ke_khai, nháp);
  const đổi = [...new Set([...sửa, ...thêm])].filter(f => xétFile(pv, join(sổ.goc, f)).được);
  if (!đổi.length) throw new Error('Không có file nào trong phạm vi để đưa lên.');

  // File phụ đi kèm: mọi file cùng thư mục hoặc trong shared/ mà trang HTML hay dùng.
  const phụ = new Set();
  for (const f of đổi.filter(f => f.endsWith('.html'))) {
    const thư = dirname(f);
    for (const cha of [thư, join(thư, 'shared'), join(dirname(thư), 'shared')]) {
      for (const d of ['core.css', 'quiz.css', 'accordion.css', 'core.js']) {
        const rel = join(cha, d);
        if (!đổi.includes(rel) && existsSync(join(nháp, rel))) phụ.add(rel);
      }
    }
  }

  const mã = mãPhòng(sổ.mang ?? 'elearn');
  await tạoBucketNếuChưa();

  const đã = [];
  for (const f of [...đổi, ...phụ]) {
    const thật = join(nháp, f);
    if (!existsSync(thật) || !statSync(thật).isFile()) continue;
    const trong = `${mã}/${f}`;
    await đẩyMột(trong, thật);
    đã.push({ file: f, url: `${URL_APP}/xem/${mãHoá(trong)}` });
  }

  // Link chính: file HTML đã đổi đầu tiên, không thì file đã đổi đầu tiên.
  const chính = đã.find(x => x.file.endsWith('.html') && đổi.includes(x.file)) ?? đã[0];
  return { link: chính?.url ?? null, da_dua_len: đã, file_phu: [...phụ] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [id] = process.argv.slice(2);
  if (!id) { console.error('Dùng: node dua-len.mjs <id-việc>'); process.exit(1); }
  console.log(JSON.stringify(await đưaLên(id), null, 2));
}
