// Chụp nhanh trạng thái một thư mục và so hai lần chụp.
// Dùng APFS clone (`cp -c`): chép 3 GB mất chưa tới nửa giây và KHÔNG tốn thêm ổ đĩa,
// vì hai bản dùng chung khối dữ liệu cho tới khi một bên bị sửa.
import { readdirSync, statSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const BỎ_QUA = new Set(['.git', 'node_modules', '.DS_Store']);

export function nhânBản(nguồn, đích) {
  mkdirSync(dirname(đích), { recursive: true });
  execFileSync('cp', ['-cRp', nguồn, đích]);
}
export function chépMột(nguồn, đích) {
  mkdirSync(dirname(đích), { recursive: true });
  execFileSync('cp', ['-cp', nguồn, đích]);
}

export function băm(file) {
  return createHash('sha1').update(readFileSync(file)).digest('hex');
}

export function kêKhai(gốc) {
  const ds = {};
  (function đi(thưMục) {
    for (const e of readdirSync(thưMục, { withFileTypes: true })) {
      if (BỎ_QUA.has(e.name)) continue;
      const p = join(thưMục, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) đi(p);
      else if (e.isFile()) {
        const s = statSync(p);
        ds[relative(gốc, p).split(sep).join('/')] = [s.size, Math.round(s.mtimeMs)];
      }
    }
  })(gốc);
  return ds;
}

// So kê khai cũ với thư mục hiện tại. Kích thước + giờ sửa lệch thì băm lại cho chắc,
// để một lệnh `touch` vô hại không bị tính là "đã sửa".
export function soSánh(cũ, gốcHiệnTại, gốcBảnCũ) {
  const mới = kêKhai(gốcHiệnTại);
  const sửa = [], thêm = [], xoá = [];
  for (const [f, [kt, giờ]] of Object.entries(mới)) {
    if (!cũ[f]) { thêm.push(f); continue; }
    if (cũ[f][0] === kt && cũ[f][1] === giờ) continue;
    if (gốcBảnCũ && cũ[f][0] === kt && existsSync(join(gốcBảnCũ, f))
        && băm(join(gốcBảnCũ, f)) === băm(join(gốcHiệnTại, f))) continue;
    sửa.push(f);
  }
  for (const f of Object.keys(cũ)) if (!mới[f]) xoá.push(f);
  return { sửa, thêm, xoá };
}
