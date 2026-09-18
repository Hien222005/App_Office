// Lấy mọi thứ thư ký cần đầu phiên. In ra JSON để Claude Code đọc.
//
//   node doc-viec.mjs                 → phiên trưa: chặn nếu phiếu chưa duyệt
//   node doc-viec.mjs --kinh-nghiem   → chỉ lấy kinh nghiệm cũ (phiên sáng dùng, không chặn)
//
// CHỐT AN TOÀN: phiên trưa chỉ nhận việc có nhãn trong PHIÊN_TRƯA_NHẬN. Phiếu chưa duyệt
// thì trả về {chặn: true} — không phụ thuộc thư ký có nhớ đọc prompt hay không.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, hômNay, in_ } from './lib.mjs';
import { PHIÊN_NHẬN, NHÃN, trễHạn, làViệcTồn, TRẦN_LÀM_LẠI } from './nhan.mjs';

const THƯ_MỤC_BRIEF = resolve(dirname(fileURLToPath(import.meta.url)), '..', '_brief');
// Brief tạm nằm ở file cho tới khi bảng tasks có cột `brief` (giai đoạn B).
const đọcBrief = (id) => {
  const f = join(THƯ_MỤC_BRIEF, `${id}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
};

const ngày = hômNay();
const chỉKinhNghiệm = process.argv.includes('--kinh-nghiem');

if (chỉKinhNghiệm) {
  const ghiChú = await db.đọc('agent_notes', 'order=ngay.desc&limit=40');
  in_({ ngày, kinh_nghiệm: ghiChú.map(g => g.bai_hoc) });
  process.exit(0);
}

const [phiếu] = await db.đọc('daily_report', `ngay=eq.${ngày}`);
if (!phiếu) {
  in_({ chặn: true, lý_do: 'Chưa có phiếu cho hôm nay. Chạy phiên sáng trước.' });
  process.exit(0);
}
// Phiếu hôm nay chưa được sếp chốt thì không có việc nào để làm — trừ việc tồn của ngày trước.
const chưaChốt = phiếu.trang_thai !== 'approved';

const [việc, hỏi, ghiChú] = await Promise.all([
  db.đọc('tasks', `trang_thai=in.(${PHIÊN_NHẬN.join(',')})&order=ngay.asc,thu_tu.asc`),
  db.đọc('questions', `ngay=eq.${ngày}`),
  db.đọc('agent_notes', 'order=ngay.desc&limit=40'),
]);

const thiếuBrief = [];
const raViệc = việc.map(t => {
  const brief = đọcBrief(t.id);
  if (!brief) thiếuBrief.push(t.id);
  return {
    id: t.id, mảng: t.mang, tên: t.tieu_de,
    nhãn: t.trang_thai, nhãn_đọc: NHÃN[t.trang_thai]?.tên ?? t.trang_thai,
    làm_lại: t.trang_thai === 'lam_lai',
    lần_làm_lại: t.so_lan_lam_lai ?? 0,
    còn_được_làm_lại: TRẦN_LÀM_LẠI - (t.so_lan_lam_lai ?? 0),
    tồn_từ_ngày: làViệcTồn(t, ngày) ? t.ngay : null,
    trễ_hạn: trễHạn({ han_chot: t.han_chot, trang_thai: t.trang_thai }),
    brief,                                            // giao nguyên văn cho trưởng phòng
    DẶN_THÊM_CỦA_SẾP: t.phan_hoi_cua_toi || null,     // đè lên brief, đọc trước khi làm
  };
});

const việcTồn = raViệc.filter(v => v.tồn_từ_ngày);
if (chưaChốt && !việcTồn.length) {
  in_({ chặn: true, lý_do: 'Phiếu hôm nay sếp CHƯA CHỐT, và không có việc tồn. Dừng lại, không làm gì.' });
  process.exit(0);
}

in_({
  chặn: false,
  phiếu_hôm_nay_đã_chốt: !chưaChốt,
  việc_tồn: việcTồn.map(v => ({ id: v.id, tồn_từ: v.tồn_từ_ngày, tên: v.tên })),
  ngày,
  kinh_nghiệm: ghiChú.map(g => g.bai_hoc),
  câu_hỏi_đã_trả_lời: hỏi.filter(h => h.tra_loi).map(h => ({ hỏi: h.cau_hoi, đáp: h.tra_loi })),
  câu_hỏi_còn_treo: hỏi.filter(h => !h.tra_loi).map(h => ({ id: h.id, task: h.task_id, hỏi: h.cau_hoi })),
  việc: raViệc,
  // Không có brief thì không mở được bản nháp: đừng đoán, hỏi sếp hoặc bỏ việc đó.
  việc_thiếu_brief: thiếuBrief,
});
