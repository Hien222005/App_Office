// Ghi kết quả một việc. Nhãn đi qua nhan.mjs, nên agent KHÔNG THỂ tự duyệt hay tự ghi xong.
//
//   node ghi-ket-qua.mjs <id> doing
//   node ghi-ket-qua.mjs <id> cho_duyet_kq <tin_cậy 1-5> "căn cứ chấm điểm" "<link sản phẩm>" "file1,file2"
//   node ghi-ket-qua.mjs <id> blocked "lý do vướng"
//
// CHỐT AN TOÀN: "cho_duyet_kq" bắt buộc có chấm tin cậy VÀ link sản phẩm để sếp tự kiểm.
// Chuyển sang done/approved/rejected/redo là việc của sếp trên app, script này từ chối.
import { db } from './lib.mjs';
import { NHÃN, CHUYỂN, đượcChuyển, làNhãn, chạmTrần, TRẦN_LÀM_LẠI } from './nhan.mjs';

const [id, nhãn, ...còn] = process.argv.slice(2);
const DÙNG = `Dùng:
  node ghi-ket-qua.mjs <id> doing
  node ghi-ket-qua.mjs <id> cho_duyet_kq <tin_cậy 1-5> "căn cứ" "<link sản phẩm>" "file1,file2"
  node ghi-ket-qua.mjs <id> can_sep_duyet "lý do cần sếp quyết"`;

if (!id || !nhãn) { console.error(DÙNG); process.exit(1); }
if (!làNhãn(nhãn)) { console.error(`Không có nhãn "${nhãn}". Xem agent/nhan.mjs.`); process.exit(1); }

const [việc] = await db.đọc('tasks', `id=eq.${id}`);
if (!việc) { console.error(`Không thấy việc ${id}.`); process.exit(1); }

// Chạm trần số lần làm lại: việc thuộc sếp, agent không được chạm nữa.
if (chạmTrần(việc.so_lan_lam_lai) && việc.trang_thai === 'can_sep_sua') {
  console.error(`${id} đã bị trả lại ${việc.so_lan_lam_lai} lần nên đang ở "cần sếp sửa". ` +
                `Sếp sửa brief rồi giao lại mới làm tiếp. Bỏ việc này, làm việc khác.`);
  process.exit(1);
}

if (!đượcChuyển(việc.trang_thai, nhãn, 'agent')) {
  const củaSếp = ['da_chot', 'bo', 'da_duyet_kq', 'lam_lai', 'da_ghi'].includes(nhãn);
  console.error(
    `Không được chuyển ${id} từ "${việc.trang_thai}" sang "${nhãn}".` +
    (củaSếp ? ' Nhãn này chỉ sếp bấm trên app.' : '') +
    `\nTừ "${việc.trang_thai}" agent chỉ được sang: ${CHUYỂN.agent[việc.trang_thai]?.join(', ') || '(không có)'}`);
  process.exit(1);
}

const sửa = { trang_thai: nhãn, cap_nhat_luc: new Date().toISOString() };

if (nhãn === 'cho_duyet_kq') {
  const [tinCậy, cănCứ, link, files] = còn;
  const tin = Number(tinCậy);
  if (!Number.isInteger(tin) || tin < 1 || tin > 5) { console.error('Phải chấm tin cậy 1–5.'); process.exit(1); }
  if (!link?.trim()) { console.error('Phải có link sản phẩm để sếp tự kiểm. Xem mục "Link sản phẩm" trong Skill phòng.'); process.exit(1); }
  sửa.tin_cay = tin;
  // Chờ cột link_san_pham ở giai đoạn B; tạm ghép vào ghi chú để app và sếp vẫn thấy.
  sửa.ghi_chu_agent = `LINK: ${link.trim()}\n${cănCứ ?? ''}`.trim();
  sửa.file_da_doi = files ? files.split(',').map(s => s.trim()).filter(Boolean) : null;
} else if (nhãn === 'can_sep_duyet') {
  sửa.ghi_chu_agent = còn[0] ?? null;
}

await db.sửa('tasks', `id=eq.${id}`, sửa);
console.log(`${id} → ${nhãn} (${NHÃN[nhãn].tên})${sửa.tin_cay ? ` · tin cậy ${sửa.tin_cay}/5` : ''}`);
