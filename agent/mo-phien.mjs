// Mở một phiên chạy. Đây là thứ bật chấm đỏ "đang chạy" trên HUD của app.
// Dùng: node mo-phien.mjs sang|trua
import { db, hômNay } from './lib.mjs';

const phiên = process.argv[2];
if (!['sang', 'trua'].includes(phiên)) { console.error('Dùng: node mo-phien.mjs sang|trua'); process.exit(1); }

const [row] = await db.thêm('agent_runs', { phien: phiên, ngay: hômNay() });
console.log(row.id);   // giữ id này để đóng phiên
