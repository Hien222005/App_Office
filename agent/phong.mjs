// Ba phòng: nguồn để đọc, và thư mục GỐC mà bản nháp nhân bản từ đó.
// Đường dẫn thật lấy từ agent/.env, không viết cứng ở đây.
import { existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dựÁn = resolve(here, '..');

// .env đọc trực tiếp: các script khác nạp qua lib.mjs, nhưng phong.mjs phải
// dùng được cả khi chưa có khoá Supabase (lúc chạy thử).
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

export const PHÒNG = {
  // MỘT gốc cho mỗi phòng. Trước đây phòng Lab có hai: `nguồn` để đọc và `gốc` để
  // ghi, trỏ vào hai thư mục khác hẳn nhau — nên mẫu đường dẫn trong Skill (tính từ
  // gốc) không bao giờ khớp chỗ thật sự đọc. `nguồn` lại không script nào dùng.
  // Nay DIR_LAB trỏ vào thư mục chứa CẢ HAI: repo/ để đọc, san-pham/ để ghi.
  lab: {
    tên: 'Lab Coach',
    gốc: () => env('DIR_LAB'),
    tự_tạo_gốc: true,
  },
  elearn: { tên: 'E-learning', gốc: () => env('DIR_ELEARNING') },
  biz:    { tên: 'Kinh doanh', gốc: () => env('DIR_BIZ'), tắt: true },
};

export const THƯ_MỤC_NHÁP = join(dựÁn, '_nhap');

export function gốcCủaPhòng(mảng) {
  const p = PHÒNG[mảng];
  if (!p) throw new Error(`Không có phòng "${mảng}". Chỉ có: ${Object.keys(PHÒNG).join(', ')}`);
  if (p.tắt) throw new Error(`Phòng ${p.tên} đang tắt. Xem khối đầu .claude/skills/phong-${mảng}/SKILL.md`);
  const g = p.gốc();
  if (!g) throw new Error(`Thiếu đường dẫn phòng ${p.tên} trong agent/.env`);
  if (!existsSync(g)) {
    if (!p.tự_tạo_gốc) throw new Error(`Không thấy thư mục phòng ${p.tên}: ${g}`);
    mkdirSync(g, { recursive: true });
  }
  return g;
}

// Bản nháp chụp `goc` lúc MỞ và không đọc lại .env. Đổi DIR_* sau đó (hoặc mở bằng
// biến môi trường tạm) thì bản nháp cũ trỏ vào thư mục khác — chép về sẽ vào nhầm chỗ.
// Ba script đọc so.json đều gọi hàm này, nên không nơi nào sót.
export function kiểmGốc(sổ, id) {
  let hiệnHành;
  try { hiệnHành = gốcCủaPhòng(sổ.mang); } catch { return; }   // phòng chưa khai đường dẫn
  const thật = (p) => { try { return realpathSync(p); } catch { return p; } };
  if (thật(hiệnHành) === thật(sổ.goc)) return;
  console.error(
    `BẢN NHÁP TRỎ SAI CHỖ — ${id} mở từ một thư mục gốc khác thư mục hiện hành.\n` +
    `  bản nháp mở từ : ${sổ.goc}\n` +
    `  .env hiện trỏ  : ${hiệnHành}\n` +
    `Chép về sẽ vào nhầm thư mục. Bỏ rồi mở lại:\n` +
    `  node agent/nhap.mjs bo ${id} && node agent/nhap.mjs mo _brief/${id}.json`);
  process.exit(1);
}
