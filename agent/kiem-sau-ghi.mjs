// KIỂM SAU KHI GHI — cổng G8. Chạy ngay sau `ban-nhap.mjs ghi-het`.
// So mã băm từng file vừa chép với bản nháp. Sai một file thì HOÀN TÁC CẢ LOẠT,
// đưa mọi file về đúng trạng thái trước khi ghi, rồi báo sếp.
//
//   node kiem-sau-ghi.mjs
import { readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { băm, chépMột } from './anh-chup.mjs';
import { THƯ_MỤC_NHÁP } from './phong.mjs';
import { xétFile } from './pham-vi.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const in_ = (x) => console.log(JSON.stringify(x, null, 2));
const t0 = performance.now();

const việc = existsSync(THƯ_MỤC_NHÁP)
  ? readdirSync(THƯ_MỤC_NHÁP, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name) : [];

const cần = [];   // biên nhận của những việc vừa ghi
for (const id of việc) {
  const f = join(THƯ_MỤC_NHÁP, id, 'bien-nhan-ghi.json');
  if (existsSync(f)) cần.push({ id, bn: JSON.parse(readFileSync(f, 'utf8')) });
}
if (!cần.length) { console.error('Không có biên nhận ghi nào. Chạy ban-nhap.mjs ghi-het trước.'); process.exit(1); }

const sai = [];
for (const { id, bn } of cần) {
  const sổ = JSON.parse(readFileSync(join(THƯ_MỤC_NHÁP, id, 'so.json'), 'utf8'));
  const pv = { goc: sổ.goc, duoc_sua: sổ.duoc_sua };
  for (const { file, loai, bam_nhap } of bn.da_chep) {
    const thật = join(bn.goc, file);
    if (loai === 'xoá') {
      if (existsSync(thật)) sai.push({ id, file, lý_do: 'lẽ ra đã xoá mà vẫn còn' });
      continue;
    }
    if (!existsSync(thật)) { sai.push({ id, file, lý_do: 'không thấy file sau khi ghi' }); continue; }
    if (băm(thật) !== bam_nhap) sai.push({ id, file, lý_do: 'nội dung khác bản nháp' });
    if (!xétFile(pv, thật).được) sai.push({ id, file, lý_do: 'nằm ngoài phạm vi mà vẫn được ghi' });
  }
  for (const { file } of bn.xung_dot) sai.push({ id, file, lý_do: 'xung đột: sếp đã tự sửa file này' });
}

// Sai thì trả mọi file về trạng thái trước khi ghi, lấy từ bản chụp lúc mở bản nháp.
const đãHoànTác = [];
if (sai.length) {
  for (const { id, bn } of cần) {
    for (const { file, loai } of bn.da_chep) {
      const thật = join(bn.goc, file);
      const cũ = join(THƯ_MỤC_NHÁP, id, 'truoc', file);       // bản trước khi đè
      const đãXoá = join(THƯ_MỤC_NHÁP, id, 'da-xoa', file);   // file bị dời đi
      if (loai === 'xoá' && existsSync(đãXoá)) { chépMột(đãXoá, thật); đãHoànTác.push({ id, file, cách: 'trả lại file đã dời' }); }
      else if (existsSync(cũ)) { chépMột(cũ, thật); đãHoànTác.push({ id, file, cách: 'chép bản cũ về' }); }
      else if (loai === 'thêm' && existsSync(thật)) { rmSync(thật); đãHoànTác.push({ id, file, cách: 'xoá file mới vừa ghi' }); }
      else đãHoànTác.push({ id, file, cách: 'không có bản cũ — sếp xem lại tay', loai });
    }
  }
}

try {
  execFileSync('node', [join(dirname(fileURLToPath(import.meta.url)), 'nhat-ky.mjs'), 'cong', 'G8', '-',
    sai.length ? 'truot' : 'qua', sai[0]?.lý_do ?? `${cần.length} việc ghi đúng`], { stdio: 'ignore' });
} catch {}

in_({
  so_viec: cần.length,
  so_file_da_ghi: cần.reduce((a, c) => a + c.bn.da_chep.length, 0),
  dat: sai.length === 0,
  sai,
  da_hoan_tac: đãHoànTác,
  ms: Math.round(performance.now() - t0),
  nhac: sai.length
    ? 'Đã hoàn tác. Báo sếp, KHÔNG tự chạy ghi-het lại.'
    : 'Ghi đúng. Chạy dong-phien.mjs để đóng phiên ngày.',
});
process.exit(sai.length ? 1 : 0);
