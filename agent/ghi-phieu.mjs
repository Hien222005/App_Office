// Phiên sáng ghi phiếu + danh sách việc đề xuất.
// Đọc JSON từ stdin:  cat phieu.json | node ghi-phieu.mjs
// { "lab_tom_tat": "...", "dinh_duong_nhan_xet": "...",
//   "viec": [{ "mang":"elearn","tieu_de":"...","chi_tiet":"...","tieu_chi_xong":"..." }] }
import { db, hômNay } from './lib.mjs';

const vào = JSON.parse(await new Response(process.stdin).text());
const ngày = hômNay();

await db.nhét('daily_report', [{
  ngay: ngày,
  lab_tom_tat: vào.lab_tom_tat ?? null,
  lab_nguon: vào.lab_nguon ?? null,
  lab_noi_bo: vào.lab_noi_bo ?? false,
  dinh_duong_nhan_xet: vào.dinh_duong_nhan_xet ?? null,
  trang_thai: 'pending',          // LUÔN pending. Duyệt là việc của sếp.
}]);

const rows = (vào.viec ?? []).map((v, i) => ({
  id: v.id ?? `t-${Date.now().toString(36)}-${i}`,
  ngay: ngày, mang: v.mang, tieu_de: v.tieu_de,
  chi_tiet: v.chi_tiet ?? null, tieu_chi_xong: v.tieu_chi_xong ?? null,
  trang_thai: 'draft',            // KHÔNG việc nào được approved
  thu_tu: i,
}));
if (rows.length) await db.nhét('tasks', rows);
console.log(`Đã ghi phiếu ${ngày} · ${rows.length} việc, tất cả ở trạng thái draft.`);
