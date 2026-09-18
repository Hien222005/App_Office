// Agent gặp chỗ mơ hồ thì hỏi — BẮT BUỘC đúng 3 phương án gợi ý.
// App luôn thêm ô thứ tư để sếp tự gõ câu trả lời khác, nên 3 gợi ý là đủ.
//   node hoi-sep.mjs t-0149 "Dùng bản SCORM nào?" "bản zip" "bản v2" "để tôi xem"
import { db, hômNay } from './lib.mjs';
import { SỐ_PHƯƠNG_ÁN } from './nhan.mjs';

const [taskId, câuHỏi, ...phươngÁn] = process.argv.slice(2);
if (!taskId || !câuHỏi || phươngÁn.length !== SỐ_PHƯƠNG_ÁN) {
  console.error(`Dùng: node hoi-sep.mjs <task_id> "câu hỏi" "gợi ý 1" "gợi ý 2" "gợi ý 3"`);
  console.error(`Phải đúng ${SỐ_PHƯƠNG_ÁN} gợi ý. App tự thêm ô để sếp gõ câu trả lời khác.`);
  process.exit(1);
}

const id = 'q-' + Date.now().toString(36);
await db.thêm('questions', { id, task_id: taskId, ngay: hômNay(), cau_hoi: câuHỏi, phuong_an: phươngÁn });
await db.sửa('tasks', `id=eq.${taskId}`, { trang_thai: 'can_sep_duyet', cap_nhat_luc: new Date().toISOString() });
console.log(`Đã hỏi (${id}) · ${taskId} → cần sếp duyệt. Đi tiếp việc khác, đừng đoán.`);
