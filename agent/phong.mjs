// PHÒNG — danh sách mảng việc, ĐỌC RA TỪ SKILL. Không khai ở đâu khác.
//
// Trước 21/09, thêm một mảng việc mới phải sửa NĂM chỗ:
//   agent/.env · agent/phong.mjs · ràng buộc SQL · site/index.html · Skill
// Bốn chỗ đầu chỉ để khai một cái tên, trong đó có một lần đụng database thật.
//
// Nay: THÊM MỘT MẢNG = TẠO MỘT THƯ MỤC SKILL. Một chỗ.
// Skill vốn đã khai phạm vi file rồi thì khai luôn mảng, ngay trong frontmatter:
//
//   ---
//   name: hoc-thac-si
//   description: …
//   mang: thacsi                     ← có dòng này thì Skill này khai một mảng
//   ten_mang: Thạc sĩ                 ← tên hiện trên app
//   thu_muc: ~/Documents/Thac si      ← thư mục gốc; hoặc $DIR_THACSI để lấy từ .env
//   mau: '#7B61FF'                    ← màu trên app
//   tat: true                         ← tạm dừng mảng này
//   ---
//
// `agent/.env` nay chỉ còn giữ KHOÁ. Đường dẫn thư mục thuộc về Skill.
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dựÁn = resolve(here, '..');
const THƯ_MỤC_SKILL = join(dựÁn, '.claude', 'skills');

// .env đọc trực tiếp: các script khác nạp qua lib.mjs, nhưng phong.mjs phải dùng được
// cả khi chưa có khoá Supabase (lúc chạy thử).
function env(tên) {
  if (process.env[tên]) return process.env[tên];
  try {
    for (const dòng of readFileSync(join(here, '.env'), 'utf8').split('\n')) {
      const m = dòng.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m && m[1] === tên) return m[2];
    }
  } catch { /* chưa có .env */ }
  return null;
}

// `~/…` và `$BIẾN` đều dùng được. `$BIẾN` giữ cho ba mảng cũ vẫn lấy đường dẫn từ .env.
function mởĐường(thô) {
  if (!thô) return null;
  const s = String(thô).trim().replace(/^['"]|['"]$/g, '');
  if (s.startsWith('$')) return env(s.slice(1));
  if (s === '~' || s.startsWith('~/')) return join(homedir(), s.slice(1));
  return s;
}

// Frontmatter giữa hai dòng `---` ở đầu file. Đủ dùng cho `khoá: giá trị` một dòng —
// không nạp thư viện YAML cho bốn dòng chữ.
function đọcFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const ra = {};
  for (const dòng of m[1].split('\n')) {
    const k = dòng.match(/^\s*([a-z_]+)\s*:\s*(.*?)\s*$/);
    if (k) ra[k[1]] = k[2].replace(/^['"]|['"]$/g, '');
  }
  return ra;
}

// ── Quét Skill, dựng danh sách mảng ───────────────────────────────────────
function quét() {
  const ra = {};
  let thưMục = [];
  try { thưMục = readdirSync(THƯ_MỤC_SKILL, { withFileTypes: true }).filter(d => d.isDirectory()); }
  catch { return ra; }

  for (const d of thưMục.sort((a, b) => a.name.localeCompare(b.name))) {
    const f = join(THƯ_MỤC_SKILL, d.name, 'SKILL.md');
    if (!existsSync(f)) continue;
    const fm = đọcFrontmatter(readFileSync(f, 'utf8'));
    if (!fm.mang) continue;                       // Skill không khai mảng (ví dụ van-phong)

    const mới = {
      tên: fm.ten_mang || fm.mang,
      màu: fm.mau || '#8792A8',
      tắt: fm.tat === 'true',
      tự_tạo_gốc: fm.tu_tao_thu_muc === 'true',
      skill: d.name,
      _thư_mục: fm.thu_muc ?? null,
      gốc: () => mởĐường(fm.thu_muc),
    };

    // Hai Skill cùng một mảng thì được — một mảng có thể có nhiều loại việc. Nhưng chúng
    // phải khai GIỐNG NHAU về mảng đó, kẻo app hiện một tên mà agent ghi vào một thư mục khác.
    const cũ = ra[fm.mang];
    if (cũ) {
      const lệch = ['tên', 'màu', 'tắt', '_thư_mục'].filter(k => cũ[k] !== mới[k]);
      if (lệch.length) {
        throw new Error(
          `Hai Skill khai mảng "${fm.mang}" khác nhau ở: ${lệch.join(', ')}.\n` +
          `  ${cũ.skill}/SKILL.md  và  ${d.name}/SKILL.md\n` +
          `Sửa cho khớp — một mảng chỉ được có một tên, một màu, một thư mục.`);
      }
      cũ.skill_khác = [...(cũ.skill_khác ?? []), d.name];
      continue;
    }
    ra[fm.mang] = mới;
  }
  return ra;
}

export const PHÒNG = quét();
export const THƯ_MỤC_NHÁP = join(dựÁn, '_nhap');

// Bài thử `thu-nhanh.mjs` diễn lại trọn vòng trên một phòng giả lập. Phòng đó có thể
// đang tắt ngoài đời thật, nên bài thử bật riêng nó lên bằng biến môi trường — KHAI ĐÍCH
// DANH từng phòng, không phải một công tắc "bỏ qua mọi kiểm tra".
const bậtRiêng = (mảng) =>
  (process.env.VP_BAT_PHONG ?? '').split(',').map(s => s.trim()).includes(mảng);

export function gốcCủaPhòng(mảng) {
  const p = PHÒNG[mảng];
  if (!p) {
    throw new Error(`Không có mảng "${mảng}". Đang có: ${Object.keys(PHÒNG).join(', ') || '(chưa Skill nào khai mảng)'}.\n`
                  + `Thêm mảng mới: tạo .claude/skills/<tên>/SKILL.md có dòng "mang:" trong frontmatter.`);
  }
  if (p.tắt && !bậtRiêng(mảng)) {
    throw new Error(`Mảng ${p.tên} đang TẠM DỪNG. Bật lại: bỏ dòng "tat: true" trong `
                  + `.claude/skills/${p.skill}/SKILL.md và xoá khối ⛔ ở đầu file.`);
  }
  const g = p.gốc();
  if (!g) throw new Error(`Mảng ${p.tên} chưa khai "thu_muc" trong .claude/skills/${p.skill}/SKILL.md`);
  if (!existsSync(g)) {
    if (!p.tự_tạo_gốc) throw new Error(`Không thấy thư mục mảng ${p.tên}: ${g}`);
    mkdirSync(g, { recursive: true });
  }
  return g;
}

// Bản nháp chụp `goc` lúc MỞ và không đọc lại cấu hình. Đổi thư mục sau đó (hoặc mở bằng
// biến môi trường tạm) thì bản nháp cũ trỏ vào thư mục khác — chép về sẽ vào nhầm chỗ.
// Ba script đọc so.json đều gọi hàm này, nên không nơi nào sót.
export function kiểmGốc(sổ, id) {
  let hiệnHành;
  try { hiệnHành = gốcCủaPhòng(sổ.mang); } catch { return; }   // mảng chưa khai đường dẫn
  const thật = (p) => { try { return realpathSync(p); } catch { return p; } };
  if (thật(hiệnHành) === thật(sổ.goc)) return;
  console.error(
    `BẢN NHÁP TRỎ SAI CHỖ — ${id} mở từ một thư mục gốc khác thư mục hiện hành.\n` +
    `  bản nháp mở từ : ${sổ.goc}\n` +
    `  Skill hiện trỏ : ${hiệnHành}\n` +
    `Chép về sẽ vào nhầm thư mục. Bỏ rồi mở lại:\n` +
    `  node agent/nhap.mjs bo ${id} && node agent/nhap.mjs mo _brief/${id}.json`);
  process.exit(1);
}
