// BẢN NHÁP — trưởng phòng chỉ được làm trong bản sao. Sếp duyệt kết quả mới chép về file thật.
//
//   node ban-nhap.mjs mo    <brief.json>   → in đường dẫn bản nháp
//   node ban-nhap.mjs xem   <id-việc>      → file nào đổi, cái nào sẽ chép về
//   node ban-nhap.mjs duyet <id-việc>      → chép phần trong phạm vi về thư mục thật
//   node ban-nhap.mjs ghi-het              → cuối ngày: chép cả loạt mọi việc sếp đã duyệt
//   node ban-nhap.mjs bo    <id-việc>      → vứt bản nháp
//
// Nhân bản bằng APFS clone (`cp -c`): tức thì và không tốn thêm ổ đĩa, vì hai bản
// dùng chung khối dữ liệu cho tới khi một bên bị sửa.
//
// Không dùng git worktree: thư mục Elearning để `courses/` trong .gitignore,
// nên worktree sinh ra sẽ không có module-04 — đúng chỗ cần sửa.
import { writeFileSync, readFileSync, existsSync, rmSync, renameSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { phạmViTừBrief, xétFile } from './pham-vi.mjs';
import { nhânBản, chépMột, kêKhai, soSánh, băm } from './anh-chup.mjs';
import { gốcCủaPhòng, THƯ_MỤC_NHÁP } from './phong.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Mỗi cổng ghi một dòng vào nhật ký: qua hay trượt, kèm lý do.
const NK = join(dirname(fileURLToPath(import.meta.url)), 'nhat-ky.mjs');
const nhậtKý = (mã, việc, kq, lý) => {
  try { execFileSync('node', [NK, 'cong', mã, việc ?? '-', kq, lý ?? ''], { stdio: 'ignore' }); } catch {}
};

const [lệnh, thamSố] = process.argv.slice(2);
const DÙNG = 'Dùng: node ban-nhap.mjs mo <brief.json> | xem|duyet|bo <id-việc> | ghi-het';
if (!['mo', 'xem', 'duyet', 'bo', 'ghi-het'].includes(lệnh)) { console.error(DÙNG); process.exit(1); }
if (lệnh !== 'ghi-het' && !thamSố) { console.error(DÙNG); process.exit(1); }

const in_ = (x) => console.log(JSON.stringify(x, null, 2));
const t0 = performance.now(), ms = () => Math.round(performance.now() - t0);
const thưMụcViệc = (id) => join(THƯ_MỤC_NHÁP, id);
const đườngNháp = (id) => join(thưMụcViệc(id), 'nhap');
const fileSổ = (id) => join(thưMụcViệc(id), 'so.json');

function đọcSổ(id) {
  if (!existsSync(fileSổ(id))) {
    console.error(`Chưa mở bản nháp cho ${id}. Chạy: node ban-nhap.mjs mo <brief.json>`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(fileSổ(id), 'utf8'));
}

// ── mo ────────────────────────────────────────────────────────────────────
if (lệnh === 'mo') {
  const brief = JSON.parse(readFileSync(thamSố, 'utf8'));
  if (!brief.id || !brief.mang) { console.error('Brief thiếu id hoặc mang.'); process.exit(1); }
  const gốc = gốcCủaPhòng(brief.mang);
  const pv = phạmViTừBrief(brief, gốc);            // ném lỗi nếu brief thiếu file_duoc_sua
  if (existsSync(đườngNháp(brief.id))) { console.error(`Bản nháp ${brief.id} đang mở rồi.`); process.exit(1); }

  nhânBản(gốc, đườngNháp(brief.id));
  writeFileSync(fileSổ(brief.id), JSON.stringify({
    id: brief.id, mang: brief.mang, goc: gốc, duoc_sua: pv.duoc_sua,
    file_phai_doi: brief.file_phai_doi ?? [],      // đầu ra bắt buộc, soát sẽ đòi
    mo_luc: new Date().toISOString(),
    ke_khai: kêKhai(đườngNháp(brief.id)),           // trạng thái lúc mở, để biết agent đổi gì
  }));
  nhậtKý('G3', brief.id, 'qua', 'mở bản nháp');
  in_({ id: brief.id, ban_nhap: đườngNháp(brief.id), goc: gốc, duoc_sua: pv.duoc_sua, ms: ms() });
  process.exit(0);
}


// ── hàm dùng chung cho cả `xem`, `duyet` và `ghi-het` ────────────────────
function thayĐổiCủa(id) {
  const sổ = đọcSổ(id), nháp = đườngNháp(id);
  const pv = { goc: sổ.goc, duoc_sua: sổ.duoc_sua };
  const { sửa, thêm, xoá } = soSánh(sổ.ke_khai, nháp);
  const tất = [...sửa.map(f => [f, 'sửa']), ...thêm.map(f => [f, 'thêm']), ...xoá.map(f => [f, 'xoá'])];
  const trong = [], ngoài = [];
  for (const [file, loai] of tất) (xétFile(pv, join(sổ.goc, file)).được ? trong : ngoài).push({ file, loai });
  return { sổ, nháp, trong, ngoài };
}

// Chép phần trong phạm vi từ bản nháp về thư mục thật.
// Ghi biên nhận ra kho để kiem-sau-ghi.mjs so lại và hoàn tác được nếu sai.
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
      // Sao lưu bản cũ trước khi đè, để kiem-sau-ghi.mjs hoàn tác được nguyên trạng.
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

// ── ghi-het ───────────────────────────────────────────────────────────────
// Cổng G7: chỉ chạy khi MỌI việc trong ngày đã được sếp duyệt kết quả.
// Danh sách việc được duyệt do tinh-trang.mjs quyết, script này không tự đọc DB.
if (lệnh === 'ghi-het') {
  const dsFile = join(THƯ_MỤC_NHÁP, 'da-duyet.json');
  if (!existsSync(dsFile)) {
    console.error('Thiếu ' + dsFile + '. Chạy `node agent/tinh-trang.mjs --ghi-danh-sach` trước.');
    process.exit(1);
  }
  const ds = JSON.parse(readFileSync(dsFile, 'utf8'));
  if (!Array.isArray(ds.da_duyet) || !ds.da_duyet.length) { console.error('Không có việc nào đã duyệt.'); process.exit(1); }
  if (ds.con_cho?.length) {
    nhậtKý('G7', '-', 'truot', `còn ${ds.con_cho.length} việc sếp chưa duyệt`);
    console.error(`Còn ${ds.con_cho.length} việc sếp chưa duyệt: ${ds.con_cho.join(', ')}. Chưa ghi được.`);
    process.exit(1);
  }
  const kq = [];
  for (const idViệc of ds.da_duyet) kq.push(chépVề(idViệc));
  const xungĐột = kq.flatMap(k => k.xung_dot_khong_chep);
  // Ghi rõ loạt này gồm việc nào. kiem-sau-ghi.mjs CHỈ xét đúng danh sách này,
  // không quét cả _nhap — biên nhận cũ của việc thử từng làm nó hoàn tác oan việc thật.
  writeFileSync(join(THƯ_MỤC_NHÁP, 'loat-ghi.json'), JSON.stringify({
    luc: new Date().toISOString(), ids: ds.da_duyet,
  }, null, 2));
  nhậtKý('G7', '-', xungĐột.length ? 'truot' : 'qua', `${kq.length} việc, ${xungĐột.length} xung đột`);
  in_({ lenh: 'ghi-het', so_viec: kq.length, ket_qua: kq,
        co_xung_dot: xungĐột.length > 0, ms: ms() });
  process.exit(xungĐột.length ? 1 : 0);       // có xung đột thì kiem-sau-ghi sẽ hoàn tác
}

const id = thamSố;

// ── xem ───────────────────────────────────────────────────────────────────
if (lệnh === 'xem') {
  const { nháp, trong, ngoài } = thayĐổiCủa(id);
  in_({ id, se_chep_ve: trong, bo_qua_vi_ngoai_pham_vi: ngoài, ban_nhap: nháp, ms: ms() });
  process.exit(0);
}

// ── duyet · chép về một việc ──────────────────────────────────────────────
// Dùng khi thử một việc lẻ. Cuối ngày thì chạy `ghi-het`.
if (lệnh === 'duyet') {
  const kq = chépVề(id);
  in_({ ...kq, ms: ms() });
  process.exit(0);
}

// ── bo ────────────────────────────────────────────────────────────────────
if (lệnh === 'bo') {
  // Giữ sổ và phần đã dời (da-xoa) lại, chỉ vứt bản sao đang làm.
  rmSync(đườngNháp(id), { recursive: true, force: true });
  in_({ id, da_bo_ban_nhap: true, ms: ms() });
}
