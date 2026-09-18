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
  return khớp
    ? { được: true, tươngĐối, khớp }
    : { được: false, lý_do: 'không có trong danh sách file sếp đã duyệt', tươngĐối };
}
