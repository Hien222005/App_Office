// Đóng phiên chạy → app tắt chấm đỏ, hiện giờ chạy xong.
// Dùng: node dong-phien.mjs <id> <số việc đã làm> "tóm tắt"
import { db } from './lib.mjs';

const [id, sốViệc = 0, tómTắt = ''] = process.argv.slice(2);
if (!id) { console.error('Dùng: node dong-phien.mjs <id> <số việc> "tóm tắt"'); process.exit(1); }

await db.sửa('agent_runs', `id=eq.${id}`, {
  ket_thuc: new Date().toISOString(),
  so_task_lam: Number(sốViệc) || 0,
  tom_tat: tómTắt,
});
console.log('Đã đóng phiên', id);
