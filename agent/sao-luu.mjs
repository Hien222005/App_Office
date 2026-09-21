// Dump toàn bộ bảng ra JSON để commit vào repo. Chạy mỗi tối.
// Gói Supabase Free KHÔNG có sao lưu tự động — đây là bản sao duy nhất của bạn.
import { db, hômNay } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Danh sách GỘP cả bảng cũ lẫn bảng mới. Bảng nào không có thì bỏ qua và báo, KHÔNG chết —
// sao lưu phải chạy được ở cả hai phía một lần đổi schema, vì đó chính là lúc cần nó nhất.
// (`daily_report` bị bỏ ở doi-6; giữ trong danh sách để bản sao lưu cuối cùng còn kịp ôm nó.)
const BẢNG = ['muc_tieu','food_db','ke_hoach','tasks','questions','food_log',
              'agent_notes','agent_runs','daily_report'];
const thư = join(dirname(fileURLToPath(import.meta.url)), '..', 'sao-luu', hômNay());
mkdirSync(thư, { recursive: true });

let đãLưu = 0;
for (const b of BẢNG) {
  let rows;
  try { rows = await db.đọc(b, 'select=*'); }
  catch (e) {
    // PGRST205 = bảng không có trong schema. Mọi lỗi khác thì phải dừng: sao lưu thiếu
    // mà tưởng là đủ còn nguy hơn không sao lưu.
    if (!String(e.message).includes('PGRST205')) throw e;
    console.log(`${b.padEnd(14)} — không có bảng này, bỏ qua`);
    continue;
  }
  writeFileSync(join(thư, `${b}.json`), JSON.stringify(rows, null, 2));
  console.log(`${b.padEnd(14)} ${rows.length} dòng`);
  đãLưu++;
}
console.log(`→ ${đãLưu} bảng · ${thư}`);
