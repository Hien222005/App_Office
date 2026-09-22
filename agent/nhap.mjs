// BẢN NHÁP — trưởng phòng chỉ được làm trong bản sao. Sếp duyệt kết quả mới chép về file thật.
//
//   node nhap.mjs mo    <brief.json>   → in đường dẫn bản nháp
//   node nhap.mjs xem   <id-việc>      → file nào đổi, cái nào sẽ chép về
//   node nhap.mjs ghi   <id-việc>      → ghi MỘT việc sếp đã duyệt: chép, so mã băm, đóng nhãn
//   node nhap.mjs ghi-het              → ghi từng việc đang ở da_duyet, việc nào độc lập việc nấy
//   node nhap.mjs kiem  <id-việc>      → soát lại một việc đã ghi · chỉ báo, không hoàn tác
//   node nhap.mjs bo    <id-việc>      → vứt bản nháp
//
// PHẠM VI LẤY TỪ SKILL, không lấy từ brief: sửa bug E-learning thì lần nào cũng đụng
// đúng những thư mục đó, nên phạm vi thuộc về LOẠI VIỆC chứ không thuộc LẦN LÀM.
//
// Nhân bản bằng APFS clone (`cp -c`): tức thì và không tốn thêm ổ đĩa, vì hai bản
// dùng chung khối dữ liệu cho tới khi một bên bị sửa.
//
// Không dùng git worktree: thư mục Elearning để `courses/` trong .gitignore,
// nên worktree sinh ra sẽ không có module-04 — đúng chỗ cần sửa.
import { writeFileSync, readFileSync, existsSync, rmSync, renameSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { phạmViTừSkill, xétFile } from './pham-vi.mjs';
import { nhânBản, chépMột, kêKhai, soSánh, băm } from './anh-chup.mjs';
import { gốcCủaPhòng, THƯ_MỤC_NHÁP, kiểmGốc } from './phong.mjs';
import { db } from './lib.mjs';
import { đượcChuyển } from './nhan.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Mỗi cổng ghi một dòng vào nhật ký: qua hay trượt, kèm lý do.
const NK = join(dirname(fileURLToPath(import.meta.url)), 'nhat-ky.mjs');
const nhậtKý = (mã, việc, kq, lý) => {
  try { execFileSync('node', [NK, 'cong', mã, việc ?? '-', kq, lý ?? ''], { stdio: 'ignore' }); } catch {}
};

const [lệnh, thamSố] = process.argv.slice(2);
const DÙNG = 'Dùng: node nhap.mjs mo <brief.json> | xem|ghi|kiem|bo <id-việc> | ghi-het';
if (!['mo', 'xem', 'ghi', 'kiem', 'bo', 'ghi-het'].includes(lệnh)) { console.error(DÙNG); process.exit(1); }
if (lệnh !== 'ghi-het' && !thamSố) { console.error(DÙNG); process.exit(1); }

const in_ = (x) => console.log(JSON.stringify(x, null, 2));
const t0 = performance.now(), ms = () => Math.round(performance.now() - t0);
const thưMụcViệc = (id) => join(THƯ_MỤC_NHÁP, id);
const đườngNháp = (id) => join(thưMụcViệc(id), 'nhap');
const fileSổ = (id) => join(thưMụcViệc(id), 'so.json');

function đọcSổ(id) {
  if (!existsSync(fileSổ(id))) {
    console.error(`Chưa mở bản nháp cho ${id}. Chạy: node nhap.mjs mo <brief.json>`);
    process.exit(1);
  }
  const sổ = JSON.parse(readFileSync(fileSổ(id), 'utf8'));

  kiểmGốc(sổ, id);   // bản nháp trỏ sai thư mục gốc thì chặn ngay, xem phong.mjs
  return sổ;
}

// ── mo ────────────────────────────────────────────────────────────────────
if (lệnh === 'mo') {
  const brief = JSON.parse(readFileSync(thamSố, 'utf8'));
  if (!brief.id || !brief.mang) { console.error('Brief thiếu id hoặc mang.'); process.exit(1); }
  if (!brief.skill) { console.error('Brief thiếu mục "skill" — không biết lấy phạm vi ở đâu.'); process.exit(1); }
  const gốc = gốcCủaPhòng(brief.mang);
  const pv = phạmViTừSkill(brief.skill);           // ném lỗi nếu Skill chưa khai phạm vi
  if (existsSync(đườngNháp(brief.id))) { console.error(`Bản nháp ${brief.id} đang mở rồi.`); process.exit(1); }

  nhânBản(gốc, đườngNháp(brief.id));
  writeFileSync(fileSổ(brief.id), JSON.stringify({
    id: brief.id, mang: brief.mang, skill: brief.skill, goc: gốc, duoc_sua: pv.duoc_sua,
    chi_sua: brief.chi_sua ?? [],                  // brief thu hẹp thêm (không nới rộng được)
    file_phai_doi: brief.phai_doi ?? pv.phai_doi,  // đầu ra bắt buộc, mặc định lấy từ Skill
    mo_luc: new Date().toISOString(),
    ke_khai: kêKhai(đườngNháp(brief.id)),           // trạng thái lúc mở, để biết agent đổi gì
  }));
  nhậtKý('G3', brief.id, 'qua', 'mở bản nháp');
  in_({ id: brief.id, skill: brief.skill, ban_nhap: đườngNháp(brief.id), goc: gốc,
        duoc_sua: pv.duoc_sua, chi_sua: brief.chi_sua ?? [],
        phai_doi: brief.phai_doi ?? pv.phai_doi, ms: ms() });
  process.exit(0);
}


// ── hàm dùng chung cho cả `xem` và `ghi` ─────────────────────────────────
function thayĐổiCủa(id) {
  const sổ = đọcSổ(id), nháp = đườngNháp(id);
  const pv = { goc: sổ.goc, duoc_sua: sổ.duoc_sua, chi_sua: sổ.chi_sua };
  const { sửa, thêm, xoá } = soSánh(sổ.ke_khai, nháp);
  const tất = [...sửa.map(f => [f, 'sửa']), ...thêm.map(f => [f, 'thêm']), ...xoá.map(f => [f, 'xoá'])];
  const trong = [], ngoài = [];
  for (const [file, loai] of tất) (xétFile(pv, join(sổ.goc, file)).được ? trong : ngoài).push({ file, loai });
  return { sổ, nháp, trong, ngoài };
}

// Chép phần trong phạm vi từ bản nháp về thư mục thật.
// Ghi biên nhận để `ghi` so lại ngay sau khi chép và hoàn tác được nếu sai.
function chépVề(id) {
  const { sổ, nháp, trong, ngoài } = thayĐổiCủa(id);
  const đãChép = [], xungĐột = [];
  for (const { file, loai } of trong) {
    const thật = join(sổ.goc, file), cũ = sổ.ke_khai[file];
    // Sếp tự sửa file thật trong lúc chờ duyệt → không đè, báo xung đột.
    if (cũ && existsSync(thật)) {
      const st = statSync(thật);
      if (st.size !== cũ[0] || Math.round(st.mtimeMs) !== cũ[1]) { xungĐột.push({ file, loai }); continue; }
    }
    if (!cũ && existsSync(thật)) { xungĐột.push({ file, loai }); continue; }
    if (loai === 'xoá') {
      const giữLại = join(thưMụcViệc(id), 'da-xoa', file);   // dời đi, không xoá hẳn
      mkdirSync(dirname(giữLại), { recursive: true });
      renameSync(thật, giữLại);
    } else {
      // Sao lưu bản cũ trước khi đè, để hoàn tác được nguyên trạng.
      if (existsSync(thật)) chépMột(thật, join(thưMụcViệc(id), 'truoc', file));
      chépMột(join(nháp, file), thật);
    }
    đãChép.push({ file, loai, bam_nhap: loai === 'xoá' ? null : băm(join(nháp, file)) });
  }
  writeFileSync(join(thưMụcViệc(id), 'bien-nhan-ghi.json'), JSON.stringify({
    id, goc: sổ.goc, luc: new Date().toISOString(), da_chep: đãChép, xung_dot: xungĐột,
  }, null, 2));
  return { id, da_chep_ve: đãChép, xung_dot_khong_chep: xungĐột, bo_qua_vi_ngoai_pham_vi: ngoài };
}

// ══════════════════════════════════════════════════════════════════════════
// GHI TỪNG VIỆC — cổng G7 (chép) + G8 (kiểm) gộp làm một, chạy riêng cho TỪNG việc.
//
// Trước đây ghi cả loạt: đọc danh sách từ da-duyet.json, chép hết, ghi loat-ghi.json, rồi
// `kiem` so cả loạt — sai một file là hoàn tác cả loạt, còn một việc chờ duyệt là không
// việc nào được ghi. Ngày 22/09 vỡ hai lần đúng ở đó: danh sách cũ của 18/09 còn nằm lại,
// và không bước nào đóng nhãn da_ghi nên phiên không đóng được.
//
// Nay mỗi việc tự đi trọn: nhãn phải là da_duyet → chép → so mã băm → sai thì hoàn tác
// RIÊNG việc đó → đạt thì đóng nhãn da_ghi. Việc khác chờ duyệt hay trượt không liên quan.
// ══════════════════════════════════════════════════════════════════════════

// Nhãn đọc từ bảng tasks. Bài thử (thu-nhanh.mjs) không có Supabase thì đặt VP_NHAN_FILE:
// một file JSON {id: nhãn} đóng vai bảng tasks — cổng nhãn vẫn được thử thật.
const FILE_NHÃN = process.env.VP_NHAN_FILE;
const nhãnGiả = () => (existsSync(FILE_NHÃN) ? JSON.parse(readFileSync(FILE_NHÃN, 'utf8')) : {});
async function đọcNhãn(id) {
  if (FILE_NHÃN) return nhãnGiả()[id] ?? null;
  const [v] = await db.đọc('tasks', `id=eq.${encodeURIComponent(id)}&select=trang_thai`);
  return v?.trang_thai ?? null;
}
async function đóngNhãn(id) {
  if (FILE_NHÃN) { writeFileSync(FILE_NHÃN, JSON.stringify({ ...nhãnGiả(), [id]: 'da_ghi' })); return; }
  await db.sửa('tasks', `id=eq.${encodeURIComponent(id)}`,
    { trang_thai: 'da_ghi', cap_nhat_luc: new Date().toISOString() });
}
async function việcĐãDuyệt() {
  if (FILE_NHÃN) return Object.entries(nhãnGiả()).filter(([, n]) => n === 'da_duyet').map(([i]) => i);
  return (await db.đọc('tasks', 'trang_thai=eq.da_duyet&select=id&order=ngay.asc,thu_tu.asc')).map(v => v.id);
}

const fileBiênNhận = (id) => join(thưMụcViệc(id), 'bien-nhan-ghi.json');

// So từng file trong biên nhận với bản nháp. Trả về danh sách sai (rỗng = đạt).
function kiểmViệc(id, bn) {
  const sổ = JSON.parse(readFileSync(fileSổ(id), 'utf8'));
  const pv = { goc: sổ.goc, duoc_sua: sổ.duoc_sua, chi_sua: sổ.chi_sua };
  const sai = [];
  for (const { file, loai, bam_nhap } of bn.da_chep) {
    const thật = join(bn.goc, file);
    if (loai === 'xoá') {
      if (existsSync(thật)) sai.push({ file, lý_do: 'lẽ ra đã xoá mà vẫn còn' });
      continue;
    }
    if (!existsSync(thật)) { sai.push({ file, lý_do: 'không thấy file sau khi ghi' }); continue; }
    if (băm(thật) !== bam_nhap) sai.push({ file, lý_do: 'nội dung khác bản nháp' });
    if (!xétFile(pv, thật).được) sai.push({ file, lý_do: 'nằm ngoài phạm vi mà vẫn được ghi' });
  }
  for (const { file } of bn.xung_dot) sai.push({ file, lý_do: 'xung đột: sếp đã tự sửa file này' });
  return sai;
}

// Trả mọi file việc này vừa chép về trạng thái trước khi ghi. Chỉ việc này, không đụng việc khác.
function hoànTácViệc(id, bn) {
  const đã = [];
  for (const { file, loai } of bn.da_chep) {
    const thật = join(bn.goc, file);
    const cũ = join(thưMụcViệc(id), 'truoc', file);       // bản trước khi đè
    const đãXoá = join(thưMụcViệc(id), 'da-xoa', file);   // file bị dời đi
    if (loai === 'xoá' && existsSync(đãXoá)) { chépMột(đãXoá, thật); đã.push({ file, cách: 'trả lại file đã dời' }); }
    else if (existsSync(cũ)) { chépMột(cũ, thật); đã.push({ file, cách: 'chép bản cũ về' }); }
    else if (loai === 'thêm' && existsSync(thật)) { rmSync(thật); đã.push({ file, cách: 'xoá file mới vừa ghi' }); }
    else đã.push({ file, cách: 'không có bản cũ — sếp xem lại tay', loai });
  }
  return đã;
}

async function ghiMột(id) {
  const nhãn = await đọcNhãn(id);
  if (nhãn === 'da_ghi') return { id, dat: true, bo_qua: 'đã ghi từ trước' };
  if (!đượcChuyển(nhãn, 'da_ghi', 'script')) {
    return { id, dat: false, ly_do: `đang ở "${nhãn ?? 'không thấy việc'}" — chỉ việc sếp đã duyệt mới được ghi` };
  }
  if (!existsSync(fileSổ(id))) return { id, dat: false, ly_do: 'không có bản nháp để chép' };

  // Lần trước đã chép đạt nhưng chưa kịp đóng nhãn (mất mạng, tắt máy) → chỉ kiểm lại rồi
  // đóng nhãn. Chép lần nữa sẽ tự đụng file của chính mình và báo xung đột oan.
  if (existsSync(fileBiênNhận(id))) {
    const cũ = JSON.parse(readFileSync(fileBiênNhận(id), 'utf8'));
    if (cũ.da_chep.length && !kiểmViệc(id, cũ).length) {
      await đóngNhãn(id);
      nhậtKý('G8', id, 'qua', 'phục hồi: đã chép từ trước, nay đóng nhãn');
      return { id, dat: true, phuc_hoi: true, so_file: cũ.da_chep.length };
    }
  }

  const kq = chépVề(id);
  const bn = JSON.parse(readFileSync(fileBiênNhận(id), 'utf8'));
  const sai = kiểmViệc(id, bn);
  if (sai.length) {
    const đãHoànTác = hoànTácViệc(id, bn);
    nhậtKý('G8', id, 'truot', sai[0].lý_do);
    return { id, dat: false, sai, da_hoan_tac: đãHoànTác, bo_qua_vi_ngoai_pham_vi: kq.bo_qua_vi_ngoai_pham_vi };
  }
  await đóngNhãn(id);
  nhậtKý('G8', id, 'qua', `${bn.da_chep.length} file ghi đúng`);
  return { id, dat: true, da_chep_ve: kq.da_chep_ve, bo_qua_vi_ngoai_pham_vi: kq.bo_qua_vi_ngoai_pham_vi };
}

// ── ghi <id> · ghi-het ────────────────────────────────────────────────────
if (lệnh === 'ghi' || lệnh === 'ghi-het') {
  const ds = lệnh === 'ghi' ? [thamSố] : await việcĐãDuyệt();
  if (!ds.length) { in_({ lenh: lệnh, so_viec: 0, nhac: 'Không có việc nào sếp đã duyệt.', ms: ms() }); process.exit(0); }
  const kq = [];
  for (const i of ds) {
    // Một việc hỏng (bản nháp mất, lỗi mạng) không được kéo cả loạt dừng theo.
    try { kq.push(await ghiMột(i)); }
    catch (e) { kq.push({ id: i, dat: false, ly_do: String(e.message).split('\n')[0] }); }
  }
  const trượt = kq.filter(k => !k.dat);
  in_({ lenh: lệnh, so_viec: kq.length, dat: kq.length - trượt.length, truot: trượt.length, ket_qua: kq,
        nhac: trượt.length
          ? 'Việc trượt đã được hoàn tác riêng, nhãn vẫn là da_duyet. Báo sếp, KHÔNG tự chạy lại.'
          : 'Ghi đúng cả, đã đóng nhãn da_ghi.',
        ms: ms() });
  process.exit(trượt.length ? 1 : 0);
}

const id = thamSố;

// ── xem ───────────────────────────────────────────────────────────────────
if (lệnh === 'xem') {
  const { nháp, trong, ngoài } = thayĐổiCủa(id);
  in_({ id, se_chep_ve: trong, bo_qua_vi_ngoai_pham_vi: ngoài, ban_nhap: nháp, ms: ms() });
  process.exit(0);
}

// ── bo ────────────────────────────────────────────────────────────────────
if (lệnh === 'bo') {
  // Giữ sổ và phần đã dời (da-xoa) lại, chỉ vứt bản sao đang làm.
  rmSync(đườngNháp(id), { recursive: true, force: true });
  in_({ id, da_bo_ban_nhap: true, ms: ms() });
}

// ── kiem <id> · soát lại một việc đã ghi ──────────────────────────────────
// CHỈ BÁO, KHÔNG HOÀN TÁC: lúc chạy lệnh này sếp có thể đã sửa tay file gốc sau khi
// ghi, hoàn tác sẽ xoá mất phần sếp sửa. Hoàn tác chỉ xảy ra bên trong `ghi`, ngay lúc chép.
// Việc còn ở da_duyet mà kiểm đạt (ghi xong chưa kịp đóng nhãn) thì đóng nhãn luôn.
if (lệnh === 'kiem') {
  if (!existsSync(fileBiênNhận(id))) { console.error(`Việc ${id} chưa ghi lần nào — không có biên nhận.`); process.exit(1); }
  const bn = JSON.parse(readFileSync(fileBiênNhận(id), 'utf8'));
  const sai = kiểmViệc(id, bn);
  let đóng = false;
  if (!sai.length && (await đọcNhãn(id)) === 'da_duyet') { await đóngNhãn(id); đóng = true; }
  in_({ id, so_file: bn.da_chep.length, dat: !sai.length, sai, da_dong_nhan: đóng, ms: ms() });
  process.exit(sai.length ? 1 : 0);
}
