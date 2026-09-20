// SOÁT BÁO CÁO — "trưởng phòng bằng code".
// So lời khai của trưởng phòng với sự thật trong bản nháp. Một agent đọc báo cáo của
// agent khác vẫn có thể tin lời bịa; script so file thì không.
//
//   node soat-bao-cao.mjs <id-việc> <bao-cao.json>
//   → in JSON, exit 0 nếu qua, exit 1 nếu trượt.
//
// Thư ký chỉ được ghi kết quả sau khi script này cho qua.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { xétFile, khớpMẫu } from './pham-vi.mjs';
import { soSánh } from './anh-chup.mjs';
import { SỐ_PHƯƠNG_ÁN } from './nhan.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { THƯ_MỤC_NHÁP } from './phong.mjs';

const [id, fileBáoCáo] = process.argv.slice(2);
if (!id || !fileBáoCáo) { console.error('Dùng: node soat-bao-cao.mjs <id-việc> <bao-cao.json>'); process.exit(1); }

const MỤC = ['id', 'vi_tri', 'xong', 'da_lam', 'cac_buoc', 'vuong', 'file_da_doi',
             'ket_qua', 'tin_cay', 'link_san_pham', 'diem_dung_da_gap', 'da_tu_kiem'];

const sổFile = join(THƯ_MỤC_NHÁP, id, 'so.json');
if (!existsSync(sổFile)) { console.error(`Chưa mở bản nháp cho ${id}.`); process.exit(1); }
const sổ = JSON.parse(readFileSync(sổFile, 'utf8'));
const nháp = join(THƯ_MỤC_NHÁP, id, 'nhap');
const pv = { goc: sổ.goc, duoc_sua: sổ.duoc_sua };

const lỗi = [];        // trượt hẳn: khai man, giấu, sửa lấn
const thiếu = [];      // thiếu mục hoặc sai khuôn: cho bổ sung một lần

let bc;
try { bc = JSON.parse(readFileSync(fileBáoCáo, 'utf8')); }
catch (e) {
  console.log(JSON.stringify({ id, qua: false, thieu: ['báo cáo không phải JSON hợp lệ: ' + e.message] }, null, 2));
  process.exit(1);
}

// ── 1 · đủ mục và đúng kiểu ────────────────────────────────────────────────
for (const m of MỤC) if (!Object.hasOwn(bc, m)) thiếu.push(`thiếu mục "${m}"`);
if (bc.id && bc.id !== id) lỗi.push(`báo cáo ghi id "${bc.id}" nhưng đang soát việc ${id}`);
if (typeof bc.xong !== 'boolean') thiếu.push('"xong" phải là true hoặc false');
if (!Number.isInteger(bc.tin_cay) || bc.tin_cay < 1 || bc.tin_cay > 5) thiếu.push('"tin_cay" phải là số nguyên 1–5');
if (!bc.da_lam?.trim()) thiếu.push('"da_lam" trống');
if (!Array.isArray(bc.file_da_doi)) thiếu.push('"file_da_doi" phải là danh sách');
if (!Array.isArray(bc.cac_buoc) || !bc.cac_buoc.length) thiếu.push('"cac_buoc" phải là danh sách, mỗi bước một dòng');
if (bc.vuong !== null && bc.vuong !== undefined && typeof bc.vuong !== 'object') {
  thiếu.push('"vuong" phải là null hoặc { cau_hoi, phuong_an }');
}

// ── 2 · vướng và điểm dừng phải nhất quán với "xong" ───────────────────────
if (bc.vuong && typeof bc.vuong === 'object' && !Array.isArray(bc.vuong)) {
  const pa = bc.vuong.phuong_an;
  if (!bc.vuong.cau_hoi?.trim()) thiếu.push('"vuong" có nhưng thiếu cau_hoi');
  if (!Array.isArray(pa) || pa.length !== SỐ_PHƯƠNG_ÁN) {
    thiếu.push(`"vuong" phải kèm đúng ${SỐ_PHƯƠNG_ÁN} gợi ý (app tự thêm ô cho sếp gõ)`);
  }
  if (bc.xong === true) lỗi.push('vừa báo vướng vừa báo xong');
}
const cóĐiểmDừng = typeof bc.diem_dung_da_gap === 'string' ? bc.diem_dung_da_gap.trim().length > 0
  : Array.isArray(bc.diem_dung_da_gap) ? bc.diem_dung_da_gap.length > 0 : !!bc.diem_dung_da_gap;
if (cóĐiểmDừng && bc.xong === true) lỗi.push('gặp điểm dừng nhưng vẫn báo xong');

// ── 3 · xong thì phải có gì để sếp kiểm ────────────────────────────────────
if (bc.xong === true) {
  if (!bc.link_san_pham?.trim()) thiếu.push('báo xong nhưng không có link sản phẩm để sếp xem');
  if (!bc.ket_qua?.trim()) thiếu.push('báo xong nhưng không nói sếp mở đâu để kiểm');
  if (Array.isArray(bc.file_da_doi) && !bc.file_da_doi.length) lỗi.push('báo xong nhưng không sửa file nào');
}

// ── 4 · đối chiếu với bản nháp: khai man · giấu · sửa lấn ──────────────────
const { sửa, thêm, xoá } = soSánh(sổ.ke_khai, nháp);
const thậtSựĐổi = new Set([...sửa, ...thêm, ...xoá]);
// Trưởng phòng hay khai đường dẫn tuyệt đối hoặc kèm tiền tố bản nháp.
// Đưa hết về đường dẫn tương đối tính từ gốc bản nháp rồi mới so.
const vềTươngĐối = (f) => {
  let x = String(f).replace(/\\/g, '/');
  const nhápChuẩn = nháp.replace(/\\/g, '/');
  if (x.startsWith(nhápChuẩn)) x = x.slice(nhápChuẩn.length);
  else {
    const i = x.indexOf('/nhap/');
    if (x.startsWith('/') && i >= 0) x = x.slice(i + '/nhap/'.length);
  }
  return x.replace(/^\.?\//, '');
};
const khai = new Set((bc.file_da_doi ?? []).map(vềTươngĐối));

for (const f of khai) {
  if (!thậtSựĐổi.has(f)) lỗi.push(`KHAI MAN: nói đã sửa "${f}" nhưng file không đổi trong bản nháp`);
  else if (!xétFile(pv, join(sổ.goc, f)).được) lỗi.push(`SỬA LẤN: "${f}" không nằm trong file_duoc_sua`);
}
const ngoàiPhạmVi = [...thậtSựĐổi].filter(f => !xétFile(pv, join(sổ.goc, f)).được);
for (const f of ngoàiPhạmVi) if (!khai.has(f)) lỗi.push(`SỬA LẤN (không khai): "${f}" ngoài phạm vi, sẽ không được chép về`);
const giấu = [...thậtSựĐổi].filter(f => !khai.has(f) && !ngoàiPhạmVi.includes(f));
for (const f of giấu) lỗi.push(`GIẤU: "${f}" đã đổi trong bản nháp nhưng không khai`);

if (Array.isArray(bc.vuong) && bc.vuong.length) {
  thiếu.push('"vuong" là danh sách: phải viết thành { cau_hoi, phuong_an } với đúng 3 gợi ý');
}

// ── 5 · đầu ra bắt buộc trong brief (ví dụ: phải ghi log bug) ──────────────
// Đây là chỗ biến một luật "chỉ bằng chữ" thành luật code giữ được.
if (bc.xong === true) {
  for (const mẫu of sổ.file_phai_doi ?? []) {
    if (![...thậtSựĐổi].some(f => khớpMẫu(mẫu, f))) {
      thiếu.push(`báo xong nhưng chưa có đầu ra bắt buộc khớp "${mẫu}" (brief: file_phai_doi)`);
    }
  }
}

// ── 6 · trần tin cậy: chưa tự kiểm thì tối đa 4/5 ─────────────────────────
// Bằng chứng phải là việc agent tự mở lại sản phẩm trong phiên này, không phải lời khẳng định.
const đãTựKiểm = Array.isArray(bc.da_tu_kiem)
  ? bc.da_tu_kiem.join(' ').trim().length > 10
  : typeof bc.da_tu_kiem === 'string' && bc.da_tu_kiem.trim().length > 10;
let trầnTinCậy = 5;
if (!đãTựKiểm) {
  trầnTinCậy = 4;
  if ((bc.tin_cay ?? 0) > 4) {
    thiếu.push('chấm 5/5 nhưng mục "da_tu_kiem" trống: chưa tự mở lại sản phẩm thì trần là 4/5');
  }
  if (bc.xong === true) thiếu.push('báo xong nhưng mục "da_tu_kiem" trống, chưa nói đã mở lại cái gì');
}

// ── kết luận ───────────────────────────────────────────────────────────────
const qua = lỗi.length === 0 && thiếu.length === 0;
const đềNghị = qua
  ? (bc.xong ? 'cho_duyet' : 'hoi_sep')        // chưa xong (vướng/điểm dừng) → hỏi sếp kèm 3 gợi ý
  : (lỗi.length ? 'hoi_sep' : 'bo_sung_mot_lan');

try {
  execFileSync('node', [join(dirname(fileURLToPath(import.meta.url)), 'nhat-ky.mjs'), 'cong',
    qua ? 'G6' : 'G5', id, qua ? 'qua' : 'truot', [...lỗi, ...thiếu][0] ?? ''], { stdio: 'ignore' });
} catch {}

console.log(JSON.stringify({
  id, qua,
  loi: lỗi,                       // trượt hẳn, KHÔNG cho làm lại — ghi blocked kèm lỗi nguyên văn
  thieu: thiếu,                   // cho trưởng phòng bổ sung một lần rồi soát lại
  file_that_su_doi: [...thậtSựĐổi],
  file_ngoai_pham_vi: ngoàiPhạmVi,
  nhan_de_nghi: đềNghị,
  tin_cay_bao_cao: bc.tin_cay ?? null,
  tin_cay_toi_da: trầnTinCậy,
  da_tu_kiem: đãTựKiểm,
  link_san_pham: bc.link_san_pham ?? null,
}, null, 2));
process.exit(qua ? 0 : 1);
