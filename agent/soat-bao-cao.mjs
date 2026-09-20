// SOÁT BÁO CÁO — "trưởng phòng bằng code".
//
//   node soat-bao-cao.mjs <id-việc>
//   → in JSON, exit 0 nếu qua, exit 1 nếu trượt.
//
// KHÔNG nhận file báo cáo nữa. Trước đây agent khai `file_da_doi` rồi script so với
// bản nháp để bắt khai man và giấu file. Nay script tự đọc bản nháp, nên không còn
// lời khai nào để man — hai lỗi đó không bị BẮT nữa mà là KHÔNG XẢY RA ĐƯỢC.
//
// Còn lại bốn phép kiểm, cả bốn đều so với sự thật trên ổ đĩa:
//   1 · có sửa gì không
//   2 · sửa lấn ra ngoài phạm vi Skill
//   3 · thiếu đầu ra bắt buộc (brief: file_phai_doi)
//   4 · ĐÃ MỞ LẠI FILE SAU LẦN SỬA CUỐI — thay cho luật "chấm 5/5 phải có ô đã-tự-kiểm".
//       Luật cũ agent viết bừa 11 chữ là qua. Luật này không mở lại thì không qua được.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { xétFile, khớpMẫu } from './pham-vi.mjs';
import { soSánh } from './anh-chup.mjs';
import { THƯ_MỤC_NHÁP } from './phong.mjs';

const here = dirname(fileURLToPath(import.meta.url));
// VP_NHAT_KY: bài thử trỏ sang thư mục riêng để không làm bẩn nhật ký thật.
const THƯ_MỤC_NHẬT_KÝ = process.env.VP_NHAT_KY || resolve(here, '..', 'nhat-ky');

const [id] = process.argv.slice(2);
if (!id) { console.error('Dùng: node soat-bao-cao.mjs <id-việc>'); process.exit(1); }

const sổFile = join(THƯ_MỤC_NHÁP, id, 'so.json');
if (!existsSync(sổFile)) { console.error(`Chưa mở bản nháp cho ${id}.`); process.exit(1); }
const sổ = JSON.parse(readFileSync(sổFile, 'utf8'));
const nháp = join(THƯ_MỤC_NHÁP, id, 'nhap');
const pv = { goc: sổ.goc, duoc_sua: sổ.duoc_sua, chi_sua: sổ.chi_sua };

const lỗi = [];

// ── 1 · có sửa gì không ────────────────────────────────────────────────────
const { sửa, thêm, xoá } = soSánh(sổ.ke_khai, nháp);
const đãĐổi = [...new Set([...sửa, ...thêm, ...xoá])];
if (!đãĐổi.length) lỗi.push('Báo xong nhưng bản nháp không đổi file nào.');

// ── 2 · sửa lấn ────────────────────────────────────────────────────────────
const ngoàiPhạmVi = đãĐổi.filter(f => !xétFile(pv, join(sổ.goc, f)).được);
for (const f of ngoàiPhạmVi) {
  lỗi.push(`SỬA LẤN: "${f}" nằm ngoài phạm vi Skill cho phép — sẽ không được chép về.`);
}

// ── 3 · đầu ra bắt buộc ────────────────────────────────────────────────────
// Biến một luật "chỉ bằng chữ" (nhớ ghi log bug) thành luật code giữ được.
const thiếuĐầuRa = (sổ.file_phai_doi ?? []).filter(m => !đãĐổi.some(f => khớpMẫu(m, f)));
for (const m of thiếuĐầuRa) {
  lỗi.push(`THIẾU ĐẦU RA: chưa đụng file nào khớp "${m}" (brief: file_phai_doi).`);
}

// ── 4 · đã mở lại file sau lần sửa cuối ────────────────────────────────────
// Đọc nhật ký hook. Chỉ xét hành động trong đúng bản nháp của việc này.
function việcNàyTrongNhậtKý() {
  const dấu = `_nhap/${id}/nhap/`;
  const ra = [];
  for (const ngày of [new Date(Date.now() - 864e5), new Date()].map(d => d.toLocaleDateString('sv-SE'))) {
    const f = join(THƯ_MỤC_NHẬT_KÝ, `${ngày}.jsonl`);
    if (!existsSync(f)) continue;
    for (const dòng of readFileSync(f, 'utf8').split('\n')) {
      if (!dòng.trim()) continue;
      let d; try { d = JSON.parse(dòng); } catch { continue; }
      if (d.loai !== 'lam' || !String(d.dich ?? '').includes(dấu)) continue;
      ra.push({ luc: d.luc, cong_cu: d.cong_cu, file: String(d.dich).split(dấu)[1] ?? '' });
    }
  }
  return ra;
}

const SỬA = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const hànhĐộng = việcNàyTrongNhậtKý();
const iSửaCuối = hànhĐộng.findLastIndex(h => SỬA.has(h.cong_cu));
const đọcSauSửa = iSửaCuối >= 0
  ? hànhĐộng.slice(iSửaCuối + 1).find(h => h.cong_cu === 'Read')
  : null;

if (!hànhĐộng.length) {
  lỗi.push('Nhật ký không có hành động nào trong bản nháp này — không kiểm được đã tự kiểm hay chưa.');
} else if (iSửaCuối < 0) {
  lỗi.push('Nhật ký không thấy lần sửa nào trong bản nháp này.');
} else if (!đọcSauSửa) {
  lỗi.push(`CHƯA TỰ KIỂM: sau lần sửa cuối (${hànhĐộng[iSửaCuối].luc} · ${hànhĐộng[iSửaCuối].file}) `
         + 'không có lần mở lại file nào. Mở lại file vừa sửa để tự kiểm rồi chạy lại.');
}

// ── kết luận ───────────────────────────────────────────────────────────────
const qua = lỗi.length === 0;
try {
  execFileSync('node', [join(here, 'nhat-ky.mjs'), 'cong', qua ? 'G5' : 'G4', id,
    qua ? 'qua' : 'truot', lỗi[0] ?? ''], { stdio: 'ignore' });
} catch {}

console.log(JSON.stringify({
  id, qua, loi: lỗi,
  file_da_doi: đãĐổi.filter(f => !ngoàiPhạmVi.includes(f)),
  file_ngoai_pham_vi: ngoàiPhạmVi,
  da_tu_kiem: đọcSauSửa ? { luc: đọcSauSửa.luc, file: đọcSauSửa.file } : null,
  cac_buoc: hànhĐộng.map(h => `${h.luc} · ${h.cong_cu} · ${h.file}`),
}, null, 2));
process.exit(qua ? 0 : 1);
