// TÌNH TRẠNG CÔNG VIỆC — nguồn số liệu duy nhất cho skill `bao-cao`.
// Agent không được tự đếm; skill bắt buộc lấy số từ đây.
//
//   node tinh-trang.mjs                  → bảng theo phòng + việc tồn + việc trong vòng làm lại
//   node tinh-trang.mjs --ghi-danh-sach  → ghi _nhap/da-duyet.json cho lệnh `chot`
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { db, hômNay, in_ } from './lib.mjs';
import { NHÃN, CHỜ_SẾP, trễHạn, làViệcTồn, TRẦN_LÀM_LẠI } from './nhan.mjs';
import { PHÒNG, THƯ_MỤC_NHÁP } from './phong.mjs';

const ngày = hômNay();
const việc = await db.đọc('tasks', 'order=ngay.asc,thu_tu.asc');
const sống = việc.filter(t => !NHÃN[t.trang_thai]?.kết_thúc || t.ngay === ngày);

const dòngPhòng = Object.keys(PHÒNG).map(m => {
  const l = sống.filter(t => t.mang === m);
  return {
    phòng: PHÒNG[m].tên, mã: m, tắt: !!PHÒNG[m].tắt,
    chờ_sếp: l.filter(t => CHỜ_SẾP.includes(t.trang_thai)).length,
    đang_làm: l.filter(t => t.trang_thai === 'doing').length,
    đã_duyệt_chờ_ghi: l.filter(t => t.trang_thai === 'da_duyet_kq').length,
    đã_ghi: l.filter(t => t.trang_thai === 'da_ghi').length,
    trễ_hạn: l.filter(t => trễHạn(t)).length,
    tổng: l.length,
  };
});

const việcTồn = sống.filter(t => làViệcTồn(t, ngày)).map(t => ({
  id: t.id, tồn_từ: t.ngay, tên: t.tieu_de, phòng: PHÒNG[t.mang]?.tên,
  đang_chờ: NHÃN[t.trang_thai]?.tên ?? t.trang_thai,
}));

const đangLàmLại = sống.filter(t => (t.so_lan_lam_lai ?? 0) > 0 && !NHÃN[t.trang_thai]?.kết_thúc).map(t => ({
  id: t.id, tên: t.tieu_de, lần_thứ: t.so_lan_lam_lai,
  còn_được: Math.max(0, TRẦN_LÀM_LẠI - t.so_lan_lam_lai),
  nhận_xét_lần_trước: t.phan_hoi_cua_toi || null,
}));

const cầnSếpSửa = sống.filter(t => t.trang_thai === 'can_sep_sua')
  .map(t => ({ id: t.id, tên: t.tieu_de, lý_do: `đã bị trả lại ${t.so_lan_lam_lai ?? TRẦN_LÀM_LẠI} lần` }));

const hômNayLàm = sống.filter(t => t.ngay === ngày || làViệcTồn(t, ngày));
const đãDuyệt = hômNayLàm.filter(t => t.trang_thai === 'da_duyet_kq').map(t => t.id);
const cònChờ = hômNayLàm.filter(t => CHỜ_SẾP.includes(t.trang_thai)).map(t => t.id);

// Lệnh `chot` đọc file này. Còn việc chờ sếp thì ban-nhap.mjs ghi-het sẽ từ chối.
if (process.argv.includes('--ghi-danh-sach')) {
  mkdirSync(THƯ_MỤC_NHÁP, { recursive: true });
  writeFileSync(join(THƯ_MỤC_NHÁP, 'da-duyet.json'),
    JSON.stringify({ ngay: ngày, da_duyet: đãDuyệt, con_cho: cònChờ }, null, 2));
}

in_({
  ngày,
  bảng_theo_phòng: dòngPhòng,
  việc_tồn: việcTồn,
  đang_trong_vòng_làm_lại: đangLàmLại,
  cần_sếp_sửa: cầnSếpSửa,
  đã_duyệt_chờ_ghi: đãDuyệt,
  còn_chờ_sếp: cònChờ,
  đóng_được_phiên: cònChờ.length === 0 && đãDuyệt.length === 0,
});
