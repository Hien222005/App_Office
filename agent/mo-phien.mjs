// Mở phiên của hôm nay. Một ngày một phiên — mở lại thì lấy đúng phiên đang mở,
// không tạo phiên thứ hai (database có unique index chặn).
// Dùng: node mo-phien.mjs
import { db, hômNay, in_ } from './lib.mjs';
import { làViệcTồn, NHÃN } from './nhan.mjs';

const ngày = hômNay();
const [đangMở] = await db.đọc('agent_runs', `ngay=eq.${ngày}&phien=eq.ngay`);
const phiên = đangMở ?? (await db.thêm('agent_runs', { phien: 'ngay', ngay: ngày }))[0];

// Mở phiên là quét luôn việc tồn của các ngày trước — cổng G1.
const việc = await db.đọc('tasks', 'order=ngay.asc,thu_tu.asc');
const tồn = việc.filter(t => làViệcTồn(t, ngày));

in_({
  phien: phiên.id,
  ngay: ngày,
  mo_lai: !!đangMở,
  bat_dau: phiên.bat_dau,
  viec_ton: tồn.map(t => ({ id: t.id, ton_tu: t.ngay, ten: t.tieu_de, dang_cho: NHÃN[t.trang_thai]?.tên })),
  nhac: tồn.length
    ? `Có ${tồn.length} việc tồn từ ngày trước. Đưa lên đầu bảng khi báo cáo.`
    : 'Không có việc tồn.',
});
