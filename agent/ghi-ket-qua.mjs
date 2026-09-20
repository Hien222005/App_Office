// Ghi kết quả một việc. Nhãn đi qua nhan.mjs, nên agent KHÔNG THỂ tự duyệt hay tự ghi xong.
//
//   node ghi-ket-qua.mjs <id> doing
//   node ghi-ket-qua.mjs <id> cho_duyet <tin_cậy 1-5> "căn cứ chấm điểm" "<link sản phẩm>" "file1,file2"
//   node ghi-ket-qua.mjs <id> blocked "lý do vướng"
//
// CHỐT AN TOÀN: "cho_duyet" bắt buộc có chấm tin cậy VÀ link sản phẩm để sếp tự kiểm.
// Chuyển sang done/approved/rejected/redo là việc của sếp trên app, script này từ chối.
import { readFileSync } from 'node:fs';
import { db } from './lib.mjs';
import { NHÃN, CHUYỂN, đượcChuyển, làNhãn, cầnSếpSửa, TRẦN_LÀM_LẠI } from './nhan.mjs';

const [id, nhãn, ...còn] = process.argv.slice(2);
const DÙNG = `Dùng:
  node ghi-ket-qua.mjs <id> doing
  node ghi-ket-qua.mjs <id> cho_duyet <tin_cậy 1-5> "căn cứ" "<link sản phẩm>" "file1,file2"

Vướng thì KHÔNG ghi kết quả — dùng: node hoi-sep.mjs <id> "câu hỏi" "gợi ý 1" "gợi ý 2" "gợi ý 3"`;

if (!id || !nhãn) { console.error(DÙNG); process.exit(1); }
if (!làNhãn(nhãn)) { console.error(`Không có nhãn "${nhãn}". Xem agent/nhan.mjs.`); process.exit(1); }

const [việc] = await db.đọc('tasks', `id=eq.${id}`);
if (!việc) { console.error(`Không thấy việc ${id}.`); process.exit(1); }

// Chạm trần số lần làm lại: việc thuộc sếp, agent không được chạm nữa.
if (cầnSếpSửa(việc)) {
  console.error(`${id} đã bị trả lại ${việc.so_lan_lam_lai} lần (trần ${TRẦN_LÀM_LẠI}). ` +
                `Việc này thuộc về sếp: sếp tự sửa rồi giao lại. Bỏ việc này, làm việc khác.`);
  process.exit(1);
}

if (!đượcChuyển(việc.trang_thai, nhãn, 'agent')) {
  const củaSếp = ['da_chot', 'bo', 'da_duyet', 'da_ghi'].includes(nhãn);
  console.error(
    `Không được chuyển ${id} từ "${việc.trang_thai}" sang "${nhãn}".` +
    (củaSếp ? ' Nhãn này chỉ sếp bấm trên app.' : '') +
    `\nTừ "${việc.trang_thai}" agent chỉ được sang: ${CHUYỂN.agent[việc.trang_thai]?.join(', ') || '(không có)'}`);
  process.exit(1);
}

const sửa = { trang_thai: nhãn, cap_nhat_luc: new Date().toISOString() };

if (nhãn === 'cho_duyet') {
  // Lấy thẳng từ báo cáo đã qua soát: đỡ gõ tay và đỡ sai lệch so với bản agent nộp.
  let [tinCậy, cănCứ, link, files, đãTựKiểm] = còn;
  let cácBước = null;
  if (còn[0] === '--bao-cao') {
    const bc = JSON.parse(readFileSync(còn[1], 'utf8'));
    tinCậy = bc.tin_cay; cănCứ = bc.ket_qua; link = bc.link_san_pham;
    files = (bc.file_da_doi ?? []).join(',');
    đãTựKiểm = Array.isArray(bc.da_tu_kiem) ? bc.da_tu_kiem.join(' · ') : bc.da_tu_kiem;
    cácBước = Array.isArray(bc.cac_buoc) ? bc.cac_buoc : null;
  }
  const tin = Number(tinCậy);
  if (!Number.isInteger(tin) || tin < 1 || tin > 5) { console.error('Phải chấm tin cậy 1–5.'); process.exit(1); }
  if (!link?.trim()) { console.error('Phải có link sản phẩm để sếp tự kiểm. Xem mục "Link sản phẩm" trong Skill phòng.'); process.exit(1); }
  if ((đãTựKiểm ?? '').trim().length <= 10 && tin > 4) {
    console.error('Chấm 5/5 thì phải nói đã tự mở lại cái gì để kiểm. Chưa kiểm thì trần là 4.');
    process.exit(1);
  }
  sửa.tin_cay = tin;
  sửa.link_san_pham = link.trim();
  sửa.da_tu_kiem = (đãTựKiểm ?? '').trim() || null;
  if (cácBước) sửa.cac_buoc = cácBước;   // nhật ký và dòng thời gian trong app đọc cột này
  sửa.ghi_chu_agent = cănCứ ?? null;
  sửa.file_da_doi = files ? files.split(',').map(s => s.trim()).filter(Boolean) : null;
}

await db.sửa('tasks', `id=eq.${id}`, sửa);
console.log(`${id} → ${nhãn} (${NHÃN[nhãn].tên})${sửa.tin_cay ? ` · tin cậy ${sửa.tin_cay}/5` : ''}`);
