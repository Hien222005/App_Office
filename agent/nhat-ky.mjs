// NHẬT KÝ — agent nghĩ gì, làm gì, cổng nào trượt.
// Một file mỗi ngày: nhat-ky/<ngày>.jsonl, chỉ ghi thêm vào cuối, không sửa dòng cũ.
//
//   node nhat-ky.mjs xem [ngày]                      → in dòng thời gian đọc được
//   node nhat-ky.mjs cong <mã> <việc> qua|truot "lý do"   → cổng tự ghi verdict
//   echo '<json hook>' | node nhat-ky.mjs hook       → hook PostToolUse ghi hành động
//   node nhat-ky.mjs suy-nghi <file phiên.jsonl>     → bóc khối suy nghĩ từ bản ghi phiên
//
// Bốn nguồn, ba nguồn đầu chắc chắn. Nguồn suy nghĩ dựa vào định dạng nội bộ của
// Claude Code (không được tài liệu hoá) nên có thể ngừng chạy; mất nó thì nhật ký vẫn còn.
import { appendFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const THƯ_MỤC = process.env.VP_NHAT_KY
  || resolve(dirname(fileURLToPath(import.meta.url)), '..', 'nhat-ky');
const ngàyNay = () => new Date().toLocaleDateString('sv-SE');
const giờ = () => new Date().toLocaleTimeString('vi-VN', { hour12: false });

function ghi(dòng, ngày = ngàyNay()) {
  mkdirSync(THƯ_MỤC, { recursive: true });
  appendFileSync(join(THƯ_MỤC, `${ngày}.jsonl`), JSON.stringify({ luc: giờ(), ...dòng }) + '\n');
}

const [lệnh, ...còn] = process.argv.slice(2);

// ── nguồn 1 · hành động, do hook PostToolUse gọi ──────────────────────────
if (lệnh === 'hook') {
  let vào = {};
  try { vào = JSON.parse(await new Response(process.stdin).text()); } catch { process.exit(0); }
  const t = vào.tool_input ?? {};
  const đích = t.file_path ?? t.notebook_path ?? t.pattern ?? t.command ?? t.path ?? '';
  // Không ghi nội dung file hay lệnh đầy đủ: nhật ký để truy vết, không phải chỗ chứa dữ liệu.
  ghi({ loai: 'lam', ai: process.env.VP_AI ?? 'agent', cong_cu: vào.tool_name,
        dich: String(đích).replace(process.env.HOME ?? '', '~').slice(0, 160) });
  process.exit(0);
}

// ── nguồn 2 · verdict từng cổng ───────────────────────────────────────────
if (lệnh === 'cong') {
  const [mã, việc, kq, lý_do] = còn;
  if (!mã || !kq) { console.error('Dùng: node nhat-ky.mjs cong <mã cổng> <việc> qua|truot "lý do"'); process.exit(1); }
  ghi({ loai: 'cong', cong: mã, viec: việc || null, ket_qua: kq, ly_do: lý_do || null });
  process.exit(0);
}

// ── nguồn 3 · bước agent tự thuật, lấy từ mục cac_buoc trong báo cáo ──────
if (lệnh === 'buoc') {
  const [việc, ai, ...bước] = còn;
  if (!việc || !bước.length) { console.error('Dùng: node nhat-ky.mjs buoc <việc> <ai> "bước 1" "bước 2"...'); process.exit(1); }
  for (const b of bước) ghi({ loai: 'buoc', viec: việc, ai, noi_dung: b });
  process.exit(0);
}

// ── nguồn 4 · suy nghĩ, bóc từ bản ghi phiên của Claude Code ──────────────
// Định dạng này Anthropic không cam kết. Không đọc được thì bỏ qua êm, không làm hỏng nhật ký.
if (lệnh === 'suy-nghi') {
  const tệp = còn[0];
  if (!tệp || !existsSync(tệp)) { console.error('Không thấy file bản ghi phiên.'); process.exit(1); }
  let đếm = 0;
  for (const dòng of readFileSync(tệp, 'utf8').split('\n')) {
    if (!dòng.trim()) continue;
    let j; try { j = JSON.parse(dòng); } catch { continue; }
    const khối = j?.message?.content;
    if (!Array.isArray(khối)) continue;
    for (const k of khối) {
      if (k?.type !== 'thinking' || !k.thinking?.trim()) continue;
      ghi({ loai: 'nghi', ai: j.agentId ?? 'chinh', noi_dung: k.thinking.trim().slice(0, 300) });
      đếm++;
    }
  }
  console.log(JSON.stringify({ da_boc: đếm, tep: basename(tệp) }));
  process.exit(0);
}

// ── xem ───────────────────────────────────────────────────────────────────
if (lệnh === 'xem') {
  const ngày = còn[0] ?? ngàyNay();
  const tệp = join(THƯ_MỤC, `${ngày}.jsonl`);
  if (!existsSync(tệp)) {
    const có = existsSync(THƯ_MỤC) ? readdirSync(THƯ_MỤC).map(f => f.replace('.jsonl', '')) : [];
    console.error(`Chưa có nhật ký ngày ${ngày}.` + (có.length ? ` Có: ${có.join(', ')}` : ''));
    process.exit(1);
  }
  const NHÃN = { lam: '', cong: 'cổng', nghi: 'nghĩ', buoc: 'bước' };
  console.log(`\n  NHẬT KÝ ${ngày}\n`);
  for (const dòng of readFileSync(tệp, 'utf8').split('\n').filter(Boolean)) {
    const d = JSON.parse(dòng);
    const ai = (d.ai ?? '').padEnd(20).slice(0, 20);
    if (d.loai === 'cong') {
      const dấu = d.ket_qua === 'qua' ? '✓' : '✕';
      console.log(`  ${d.luc}  ${dấu} ${d.cong} ${d.viec ?? ''} · ${d.ket_qua}`);
      if (d.ly_do) console.log(`              ${d.ly_do}`);
    } else if (d.loai === 'lam') {
      console.log(`  ${d.luc}  ${ai} ${d.cong_cu}  ${d.dich}`);
    } else {
      console.log(`  ${d.luc}  ${ai} ${NHÃN[d.loai]}  "${(d.noi_dung ?? '').slice(0, 110)}"`);
    }
  }
  console.log();
  process.exit(0);
}

console.error(`Dùng: node nhat-ky.mjs xem [ngày] | cong <mã> <việc> qua|truot "lý do" | buoc <việc> <ai> "..." | hook | suy-nghi <file>`);
process.exit(1);
