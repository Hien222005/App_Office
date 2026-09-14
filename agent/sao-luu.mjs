// Dump toàn bộ bảng ra JSON để commit vào repo. Chạy mỗi tối.
// Gói Supabase Free KHÔNG có sao lưu tự động — đây là bản sao duy nhất của bạn.
import { db, hômNay } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BẢNG = ['muc_tieu','food_db','daily_report','tasks','questions','food_log','agent_notes','agent_runs'];
const thư = join(dirname(fileURLToPath(import.meta.url)), '..', 'sao-luu', hômNay());
mkdirSync(thư, { recursive: true });

for (const b of BẢNG) {
  const rows = await db.đọc(b, 'select=*');
  writeFileSync(join(thư, `${b}.json`), JSON.stringify(rows, null, 2));
  console.log(`${b.padEnd(14)} ${rows.length} dòng`);
}
console.log('→', thư);
