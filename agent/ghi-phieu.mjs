// Phiên sáng ghi phiếu: nhận xét dinh dưỡng + danh sách việc, mỗi việc kèm BRIEF.
//   cat phieu.json | node ghi-phieu.mjs
//
// { "dinh_duong_nhan_xet": "...",
//   "viec": [ { ...brief theo khuon-brief.md... } ] }
//
// CHỐT AN TOÀN:
//  · mọi việc luôn ghi nhãn "draft" — duyệt kế hoạch là việc của sếp, không phải của agent;
//  · việc thiếu mục brief bắt buộc thì KHÔNG được ghi vào phiếu, in ra để thư ký sửa.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, hômNay } from './lib.mjs';

const MỤC_BẮT_BUỘC = ['mang', 'ten', 'nhiem_vu', 'boi_canh', 'file_can_doc', 'file_duoc_sua',
                      'viec_khong_lam', 'xong_khi', 'diem_dung', 'link_san_pham', 'han_chot'];
const THƯ_MỤC_BRIEF = resolve(dirname(fileURLToPath(import.meta.url)), '..', '_brief');

const vào = JSON.parse(await new Response(process.stdin).text());
const ngày = hômNay();

const hợpLệ = [], loại = [];
(vào.viec ?? []).forEach((v, i) => {
  const thiếu = MỤC_BẮT_BUỘC.filter(m => {
    const x = v[m];
    return x == null || x === '' || (Array.isArray(x) && !x.length);
  });
  const id = v.id ?? `t-${Date.now().toString(36)}-${i}`;
  if (thiếu.length) loại.push({ id, ten: v.ten ?? '(chưa có tên)', thiếu });
  else hợpLệ.push({ ...v, id });
});

await db.nhét('daily_report', [{
  ngay: ngày,
  dinh_duong_nhan_xet: vào.dinh_duong_nhan_xet ?? null,
  lab_tom_tat: vào.lab_tom_tat ?? null,
  lab_nguon: vào.lab_nguon ?? null,
  lab_noi_bo: vào.lab_noi_bo ?? false,
  trang_thai: 'pending',         // LUÔN pending. Duyệt là việc của sếp.
}]);

if (hợpLệ.length) {
  mkdirSync(THƯ_MỤC_BRIEF, { recursive: true });
  for (const v of hợpLệ) {
    // Brief nằm ở file cho tới khi bảng tasks có cột `brief` (giai đoạn B).
    writeFileSync(join(THƯ_MỤC_BRIEF, `${v.id}.json`), JSON.stringify(v, null, 2));
  }
  await db.nhét('tasks', hợpLệ.map((v, i) => ({
    id: v.id, ngay: ngày, mang: v.mang, tieu_de: v.ten,
    chi_tiet: v.nhiem_vu, tieu_chi_xong: v.xong_khi,
    han_chot: v.han_chot,        // G2 bắt buộc có hạn chót
    brief: v,                    // brief đầy đủ, nguồn của phạm vi file_duoc_sua
    trang_thai: 'cho_chot',  // KHÔNG việc nào được chốt sẵn
    thu_tu: i,
  })));
}

console.log(JSON.stringify({
  ngay: ngày,
  da_ghi: hợpLệ.map(v => ({ id: v.id, mang: v.mang, ten: v.ten, han_chot: v.han_chot })),
  khong_ghi_vi_brief_thieu_muc: loại,
  nhac: 'Tất cả đang ở nhãn chờ sếp chốt. Sếp chốt trên app thì lệnh lam mới làm.',
}, null, 2));
