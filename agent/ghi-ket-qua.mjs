// Ghi kết quả một việc. Dùng sau khi agent làm xong từng task.
//   node ghi-ket-qua.mjs t-0147 done 4 "đã sửa 4 heading" "a.css,b.md"
//   node ghi-ket-qua.mjs t-0150 blocked 0 "thiếu link repo Lab"
import { db } from './lib.mjs';

const [id, trạngThái, tinCậy, ghiChú, files] = process.argv.slice(2);
const HỢP_LỆ = ['doing', 'done', 'blocked'];
if (!id || !HỢP_LỆ.includes(trạngThái)) {
  console.error(`Dùng: node ghi-ket-qua.mjs <id> <${HỢP_LỆ.join('|')}> <tin_cậy 1-5> "ghi chú" "file1,file2"`);
  process.exit(1);
}
const tin = Number(tinCậy);
if (trạngThái === 'done' && !(tin >= 1 && tin <= 5)) {
  console.error('Việc "done" bắt buộc phải chấm tin cậy 1–5.'); process.exit(1);
}

await db.sửa('tasks', `id=eq.${id}`, {
  trang_thai: trạngThái,
  tin_cay: tin || null,
  ghi_chu_agent: ghiChú || null,
  file_da_doi: files ? files.split(',').map(s => s.trim()).filter(Boolean) : null,
  cap_nhat_luc: new Date().toISOString(),
});
console.log(`${id} → ${trạngThái}${tin ? ` (tin cậy ${tin}/5)` : ''}`);
