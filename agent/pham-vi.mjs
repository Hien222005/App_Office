// Phạm vi của một việc: agent được đụng vào file nào.
// Danh sách nằm ở mục `file_duoc_sua` trong brief mà sếp đã duyệt.
// ban-nhap.mjs (chép về) và soat-bao-cao.mjs (bắt sửa lấn) đọc chung hàm này,
// nên hai bên không bao giờ hiểu phạm vi khác nhau.
import { realpathSync, existsSync } from 'node:fs';
import { resolve, relative, dirname, isAbsolute, sep } from 'node:path';

// { goc, duoc_sua[] } lấy từ brief đã duyệt.
export function phạmViTừBrief(brief, gốc) {
  if (!Array.isArray(brief?.file_duoc_sua) || !brief.file_duoc_sua.length) {
    throw new Error(`Brief ${brief?.id ?? '?'} thiếu file_duoc_sua — không mở được bản nháp.`);
  }
  return { task: brief.id, goc: gốc, duoc_sua: brief.file_duoc_sua };
}

// "**" khớp mọi tầng thư mục, "*" khớp trong một tầng.
export function khớpMẫu(mẫu, đường) { return mẫuSangRegex(mẫu).test(đường); }

function mẫuSangRegex(mẫu) {
  let r = '';
  for (let i = 0; i < mẫu.length; i++) {
    const c = mẫu[i];
    if (c === '*' && mẫu[i + 1] === '*') { r += '.*'; i++; }
    else if (c === '*') r += '[^/]*';
    else r += c.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${r}$`);
}

// Đi theo symlink tới tận thư mục cha có thật, để "module-04/../../templates"
// hay một symlink trỏ ra ngoài không lách được.
function đườngThật(p) {
  let cur = p, đuôi = [];
  while (!existsSync(cur)) { đuôi.unshift(cur.split(sep).pop()); cur = dirname(cur); }
  return resolve(realpathSync(cur), ...đuôi);
}

export function xétFile(phạmVi, file, cwd = process.cwd()) {
  const gốc = realpathSync(phạmVi.goc);
  const tuyệtĐối = đườngThật(isAbsolute(file) ? file : resolve(cwd, file));
  const tươngĐối = relative(gốc, tuyệtĐối).split(sep).join('/');
  if (tươngĐối.startsWith('..') || isAbsolute(tươngĐối)) {
    return { được: false, lý_do: `nằm ngoài thư mục gốc ${phạmVi.goc}`, tươngĐối: tuyệtĐối };
  }
  const khớp = phạmVi.duoc_sua.find(m => mẫuSangRegex(m).test(tươngĐối));
  if (!khớp) return { được: false, lý_do: 'ngoài phạm vi Skill cho phép', tươngĐối };
  // `chi_sua` trong brief chỉ được THU HẸP phạm vi của Skill, không bao giờ nới rộng:
  // file phải khớp CẢ HAI. Dùng khi một việc cụ thể chỉ được đụng một module.
  if (Array.isArray(phạmVi.chi_sua) && phạmVi.chi_sua.length
      && !phạmVi.chi_sua.some(m => mẫuSangRegex(m).test(tươngĐối))) {
    return { được: false, lý_do: 'ngoài phạm vi hẹp mà brief chỉ định (chi_sua)', tươngĐối };
  }
  return { được: true, tươngĐối, khớp };
}

// ── Phạm vi lấy từ SKILL, không lấy từ brief ───────────────────────────────
// Sửa bug E-learning thì lần nào cũng đụng đúng những thư mục đó, nên phạm vi
// thuộc về LOẠI VIỆC chứ không thuộc về LẦN LÀM. Khai một lần trong Skill.
//
// Đọc ba mục trong .claude/skills/<tên>/SKILL.md, mỗi mục là một khối ```…```:
//   ## File được xem · ## File được sửa · ## Phải đổi
// Mục để trống hoặc còn dấu ✎ (sếp chưa điền) thì coi như danh sách rỗng.
import { readFileSync as đọcFile, existsSync as có } from 'node:fs';
import { dirname as thưCha, join as nối } from 'node:path';
import { fileURLToPath as từURL } from 'node:url';

const GỐC_DỰ_ÁN = nối(thưCha(từURL(import.meta.url)), '..');

function khốiSau(md, tiêuĐề) {
  const i = md.indexOf(`\n## ${tiêuĐề}`);
  if (i < 0) return [];
  const phần = md.slice(i + 1).split(/\n## /)[0];
  const m = phần.match(/```[a-z]*\n([\s\S]*?)```/);
  if (!m) return [];
  return m[1].split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('✎'));
}

export function phạmViTừSkill(tênSkill) {
  const f = nối(GỐC_DỰ_ÁN, '.claude', 'skills', tênSkill, 'SKILL.md');
  if (!có(f)) throw new Error(`Không thấy Skill "${tênSkill}" ở ${f}`);
  const md = đọcFile(f, 'utf8');
  const được_sua = khốiSau(md, 'File được sửa');
  if (!được_sua.length) {
    throw new Error(`Skill "${tênSkill}" chưa khai mục "## File được sửa" — không mở được bản nháp.`);
  }
  return {
    skill: tênSkill,
    duoc_xem: khốiSau(md, 'File được xem'),
    duoc_sua: được_sua,
    phai_doi: khốiSau(md, 'Phải đổi'),
  };
}
