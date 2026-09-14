// Lấy mọi thứ agent cần đầu phiên trưa. In ra JSON để Claude Code đọc.
// Dùng: node doc-viec.mjs
import { db, hômNay, in_ } from './lib.mjs';

const ngày = hômNay();
const [phiếu] = await db.đọc('daily_report', `ngay=eq.${ngày}`);

if (!phiếu) {
  in_({ chặn: true, lý_do: 'Chưa có phiếu cho hôm nay. Chạy phiên sáng trước.' });
  process.exit(0);
}
if (phiếu.trang_thai !== 'approved') {
  in_({ chặn: true, lý_do: 'Phiếu hôm nay CHƯA ĐƯỢC DUYỆT. Dừng lại, không làm gì.' });
  process.exit(0);
}

const [việc, hỏi, ghiChú] = await Promise.all([
  db.đọc('tasks', `ngay=eq.${ngày}&trang_thai=eq.approved&order=thu_tu.asc`),
  db.đọc('questions', `ngay=eq.${ngày}`),
  db.đọc('agent_notes', 'order=ngay.desc&limit=40'),
]);

in_({
  chặn: false,
  ngày,
  kinh_nghiệm: ghiChú.map(g => g.bai_hoc),
  câu_hỏi_đã_trả_lời: hỏi.filter(h => h.tra_loi).map(h => ({ hỏi: h.cau_hoi, đáp: h.tra_loi })),
  câu_hỏi_còn_treo:  hỏi.filter(h => !h.tra_loi).map(h => ({ id: h.id, task: h.task_id, hỏi: h.cau_hoi })),
  việc: việc.map(t => ({
    id: t.id, mảng: t.mang, tiêu_đề: t.tieu_de, chi_tiết: t.chi_tiet,
    xong_khi: t.tieu_chi_xong,
    DẶN_THÊM_CỦA_SẾP: t.phan_hoi_cua_toi || null,   // đọc kỹ trước khi làm
  })),
});
