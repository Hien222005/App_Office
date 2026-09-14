// Agent gặp chỗ mơ hồ thì hỏi — BẮT BUỘC kèm 2–4 phương án chọn sẵn.
// Database sẽ từ chối nếu thiếu phương án, nên không thể hỏi câu trống.
//   node hoi-sep.mjs t-0149 "Dùng bản SCORM nào?" "bản v2" "bản v1" "để tôi xem"
import { db, hômNay } from './lib.mjs';

const [taskId, câuHỏi, ...phươngÁn] = process.argv.slice(2);
if (!taskId || !câuHỏi || phươngÁn.length < 2 || phươngÁn.length > 4) {
  console.error('Dùng: node hoi-sep.mjs <task_id> "câu hỏi" "phương án 1" "phương án 2" [3] [4]');
  console.error('Phải có 2–4 phương án. Không được hỏi câu trống phương án.');
  process.exit(1);
}

const id = 'q-' + Date.now().toString(36);
await db.thêm('questions', { id, task_id: taskId, ngay: hômNay(), cau_hoi: câuHỏi, phuong_an: phươngÁn });
await db.sửa('tasks', `id=eq.${taskId}`, { trang_thai: 'blocked', cap_nhat_luc: new Date().toISOString() });
console.log(`Đã hỏi (${id}) · ${taskId} → blocked. Đi tiếp việc khác, đừng đoán.`);
