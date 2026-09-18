// Đóng phiên ngày — cổng G9. Chỉ đóng được khi mọi việc đã ghi vào file gốc hoặc bị bỏ.
// Còn việc chờ sếp thì phiên để mở, việc thành tồn sang ngày sau.
// Dùng: node dong-phien.mjs <id-phiên> "tóm tắt"
import { db, hômNay, in_ } from './lib.mjs';
import { NHÃN, CHỜ_SẾP } from './nhan.mjs';

const [id, tómTắt = ''] = process.argv.slice(2);
if (!id) { console.error('Dùng: node dong-phien.mjs <id-phiên> "tóm tắt"'); process.exit(1); }

const ngày = hômNay();
const việc = await db.đọc('tasks', 'order=ngay.asc,thu_tu.asc');
const sống = việc.filter(t => !NHÃN[t.trang_thai]?.kết_thúc);
const chờSếp = sống.filter(t => CHỜ_SẾP.includes(t.trang_thai));
const chờGhi = sống.filter(t => t.trang_thai === 'da_duyet_kq');
const đangLàm = sống.filter(t => ['da_chot', 'doing', 'lam_lai'].includes(t.trang_thai));

if (chờSếp.length || chờGhi.length || đangLàm.length) {
  in_({
    chặn: true,
    lý_do: 'Chưa đóng được phiên ngày.',
    còn_chờ_sếp: chờSếp.map(t => ({ id: t.id, nhãn: NHÃN[t.trang_thai]?.tên })),
    đã_duyệt_chưa_ghi: chờGhi.map(t => t.id),
    đang_làm: đangLàm.map(t => t.id),
    nhắc: chờGhi.length ? 'Chạy ban-nhap.mjs ghi-het rồi kiem-sau-ghi.mjs trước.'
                        : 'Việc còn lại sẽ thành việc tồn sang mai. Không đóng phiên.',
  });
  process.exit(1);
}

const đãGhi = việc.filter(t => t.trang_thai === 'da_ghi' && t.ngay === ngày).length;
await db.sửa('agent_runs', `id=eq.${id}`, {
  ket_thuc: new Date().toISOString(),
  so_task_lam: đãGhi,
  so_viec_da_ghi: đãGhi,
  tom_tat: tómTắt,
});
in_({ chặn: false, phien: id, so_viec_da_ghi: đãGhi, tom_tat: tómTắt });
