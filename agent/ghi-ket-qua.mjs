// Ghi kết quả một việc. Nhãn đi qua nhan.mjs, nên agent KHÔNG THỂ tự duyệt hay tự ghi xong.
//
//   node ghi-ket-qua.mjs <id> lam            → đánh dấu đang làm
//   node ghi-ket-qua.mjs <id> xong "kỳ vọng kết quả"
//
// Lệnh `xong` làm TẤT CẢ trong một bước, agent chỉ đưa vào MỘT câu:
//   1 · soát bản nháp (sửa lấn · thiếu đầu ra · đã mở lại file chưa)
//   2 · lấy danh sách file đã đổi — từ bản nháp, không phải từ lời khai
//   3 · lấy các bước kèm giờ — từ nhật ký hook, agent không viết
//   4 · đẩy bản xem thử lên Storage, lấy link cho sếp
//   5 · ghi Supabase, nhãn `cho_duyet`
//
// Trượt ở bước 1 thì in lý do và DỪNG — không ghi gì. Sửa rồi chạy lại.
// Vướng thì KHÔNG dùng lệnh này: dùng hoi-sep.mjs.
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './lib.mjs';
import { NHÃN, CHUYỂN, đượcChuyển, cầnSếpSửa, TRẦN_LÀM_LẠI } from './nhan.mjs';
import { đưaLên } from './dua-len.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const DÙNG = `Dùng:
  node ghi-ket-qua.mjs <id> lam
  node ghi-ket-qua.mjs <id> xong "kỳ vọng kết quả — sếp mở link ra sẽ thấy gì"

Vướng thì đừng dùng lệnh này:
  node hoi-sep.mjs <id> "câu hỏi" "gợi ý 1" "gợi ý 2" "gợi ý 3"`;

const [id, lệnh, kỳVọng] = process.argv.slice(2);
if (!id || !['lam', 'xong'].includes(lệnh ?? '')) { console.error(DÙNG); process.exit(1); }

const [việc] = await db.đọc('tasks', `id=eq.${id}`);
if (!việc) { console.error(`Không thấy việc ${id}.`); process.exit(1); }

if (cầnSếpSửa(việc)) {
  console.error(`${id} đã bị trả lại ${việc.so_lan_lam_lai} lần (trần ${TRẦN_LÀM_LẠI}). `
              + `Việc này thuộc về sếp: sếp tự sửa rồi giao lại. Bỏ việc này, làm việc khác.`);
  process.exit(1);
}

const nhãn = lệnh === 'lam' ? 'dang_lam' : 'cho_duyet';
if (!đượcChuyển(việc.trang_thai, nhãn, 'agent')) {
  console.error(
    `Không được chuyển ${id} từ "${việc.trang_thai}" sang "${nhãn}".\n` +
    `Từ "${việc.trang_thai}" agent chỉ được sang: ${CHUYỂN.agent[việc.trang_thai]?.join(', ') || '(không có)'}`);
  process.exit(1);
}

const sửa = { trang_thai: nhãn, cap_nhat_luc: new Date().toISOString() };

if (lệnh === 'xong') {
  if (!kỳVọng?.trim()) {
    console.error('Thiếu "kỳ vọng kết quả". Một hai câu: sếp mở link ra sẽ thấy gì.\n\n' + DÙNG);
    process.exit(1);
  }

  // ── 1 · soát. Trượt thì dừng hẳn, không ghi gì ────────────────────────────
  let soát;
  try {
    soát = JSON.parse(execFileSync('node', [join(here, 'soat-bao-cao.mjs'), id], { encoding: 'utf8' }));
  } catch (e) {
    const ra = (() => { try { return JSON.parse(e.stdout); } catch { return null; } })();
    console.error('SOÁT KHÔNG QUA — chưa ghi gì cả. Sửa những chỗ này rồi chạy lại:\n');
    for (const l of ra?.loi ?? [String(e.stderr || e.message)]) console.error('  · ' + l);
    process.exit(1);
  }

  // ── 2 · đẩy bản xem thử, lấy link ────────────────────────────────────────
  let lên;
  try { lên = await đưaLên(id); }
  catch (e) { console.error('Không đưa được bản xem thử lên Storage: ' + e.message); process.exit(1); }
  if (!lên.link) { console.error('Đẩy xong nhưng không ra link nào.'); process.exit(1); }

  // ── 3 · ghi. Mọi thứ trừ kỳ vọng đều do máy lấy ──────────────────────────
  sửa.ket_qua       = kỳVọng.trim();          // thứ DUY NHẤT agent tự khai
  sửa.link_san_pham = lên.link;
  sửa.file_da_doi   = soát.file_da_doi;
  sửa.cac_buoc      = soát.cac_buoc;
  sửa.ghi_chu_agent = null;

  await db.sửa('tasks', `id=eq.${id}`, sửa);
  console.log(JSON.stringify({
    id, nhan: nhãn, nhan_doc: NHÃN[nhãn].tên,
    ky_vong: sửa.ket_qua,
    so_file_da_doi: soát.file_da_doi.length,
    so_buoc_trong_nhat_ky: soát.cac_buoc.length,
    da_tu_kiem: soát.da_tu_kiem,
    link_san_pham: lên.link,
    file_phu_da_dua_len: lên.file_phu,
  }, null, 2));
  process.exit(0);
}

await db.sửa('tasks', `id=eq.${id}`, sửa);
console.log(`${id} → ${nhãn} (${NHÃN[nhãn].tên})`);
