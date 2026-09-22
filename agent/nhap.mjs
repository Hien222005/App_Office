// BẢN NHÁP — trưởng phòng chỉ được làm trong bản sao. Sếp duyệt kết quả mới chép về file thật.
//
//   node nhap.mjs mo    <brief.json>   → in đường dẫn bản nháp
//   node nhap.mjs xem   <id-việc>      → file nào đổi, cái nào sẽ chép về
//   node nhap.mjs duyet <id-việc>      → chép phần trong phạm vi về thư mục thật
//   node nhap.mjs ghi-het              → cuối ngày: chép cả loạt mọi việc sếp đã duyệt
//   node nhap.mjs kiem                 → so mã băm sau khi ghi, sai thì hoàn tác cả loạt
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
import { db, hômNay } from './lib.mjs';
import { đượcChuyển } from './nhan.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Mỗi cổng ghi một dòng vào nhật ký: qua hay trượt, kèm lý do.
const NK = join(dirname(fileURLToPath(import.meta.url)), 'nhat-ky.mjs');
const nhậtKý = (mã, việc, kq, lý) => {
  try { execFileSync('node', [NK, 'cong', mã, việc ?? '-', kq, lý ?? ''], { stdio: 'ignore' }); } catch {}
};

const [lệnh, thamSố] = process.argv.slice(2);
const DÙNG = 'Dùng: node nhap.mjs mo <brief.json> | xem|duyet|bo <id-việc> | ghi-het | kiem';
if (!['mo', 'xem', 'duyet', 'bo', 'ghi-het', 'kiem'].includes(lệnh)) { console.error(DÙNG); process.exit(1); }
if (!['ghi-het', 'kiem'].includes(lệnh) && !thamSố) { console.error(DÙNG); process.exit(1); }

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


// ── hàm dùng chung cho cả `xem`, `duyet` và `ghi-het` ────────────────────
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
    console.error('Thiếu ' + dsFile + '. Chạy `node agent/viec.mjs tinh-trang --ghi-danh-sach` trước.');
    process.exit(1);
  }
  const ds = JSON.parse(readFileSync(dsFile, 'utf8'));
  // Danh sách cũ còn nằm lại thì sẽ chép nhầm việc của ngày khác — chặn ngay.
  if (ds.ngay !== hômNay()) {
    console.error(`da-duyet.json là của ngày ${ds.ngay}, không phải hôm nay (${hômNay()}). `
                + 'Chạy `node agent/viec.mjs tinh-trang --ghi-danh-sach` trước.');
    process.exit(1);
  }
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

// ══════════════════════════════════════════════════════════════════════════
// KIEM — cổng G8, chạy ngay sau `ghi-het`. So mã băm từng file vừa chép với bản
// nháp. Sai một file thì HOÀN TÁC CẢ LOẠT, đưa mọi file về trạng thái trước khi
// ghi, rồi báo sếp. Gộp từ file kiem-sau-ghi.mjs.
// ══════════════════════════════════════════════════════════════════════════
if (lệnh === 'kiem') {


// Chỉ xét đúng loạt ghi vừa xong, không quét cả _nhap.
const fileLoạt = join(THƯ_MỤC_NHÁP, 'loat-ghi.json');
if (!existsSync(fileLoạt)) {
  console.error('Không thấy loat-ghi.json. Chạy `node agent/nhap.mjs ghi-het` trước.');
  process.exit(1);
}
const loạt = JSON.parse(readFileSync(fileLoạt, 'utf8'));
const cầnKiểm = [];
for (const id of loạt.ids ?? []) {
  const f = join(THƯ_MỤC_NHÁP, id, 'bien-nhan-ghi.json');
  if (!existsSync(f)) { console.error(`Việc ${id} trong loạt ghi mà không có biên nhận.`); process.exit(1); }
  cầnKiểm.push({ id, bn: JSON.parse(readFileSync(f, 'utf8')) });
}
if (!cầnKiểm.length) { console.error('Loạt ghi trống.'); process.exit(1); }

const sai = [];
for (const { id, bn } of cầnKiểm) {
  const sổ = JSON.parse(readFileSync(join(THƯ_MỤC_NHÁP, id, 'so.json'), 'utf8'));
  const pv = { goc: sổ.goc, duoc_sua: sổ.duoc_sua, chi_sua: sổ.chi_sua };
  for (const { file, loai, bam_nhap } of bn.da_chep) {
    const thật = join(bn.goc, file);
    if (loai === 'xoá') {
      if (existsSync(thật)) sai.push({ id, file, lý_do: 'lẽ ra đã xoá mà vẫn còn' });
      continue;
    }
    if (!existsSync(thật)) { sai.push({ id, file, lý_do: 'không thấy file sau khi ghi' }); continue; }
    if (băm(thật) !== bam_nhap) sai.push({ id, file, lý_do: 'nội dung khác bản nháp' });
    if (!xétFile(pv, thật).được) sai.push({ id, file, lý_do: 'nằm ngoài phạm vi mà vẫn được ghi' });
  }
  for (const { file } of bn.xung_dot) sai.push({ id, file, lý_do: 'xung đột: sếp đã tự sửa file này' });
}

// Sai thì trả mọi file về trạng thái trước khi ghi, lấy từ bản chụp lúc mở bản nháp.
const đãHoànTác = [];
if (sai.length) {
  for (const { id, bn } of cầnKiểm) {
    for (const { file, loai } of bn.da_chep) {
      const thật = join(bn.goc, file);
      const cũ = join(THƯ_MỤC_NHÁP, id, 'truoc', file);       // bản trước khi đè
      const đãXoá = join(THƯ_MỤC_NHÁP, id, 'da-xoa', file);   // file bị dời đi
      if (loai === 'xoá' && existsSync(đãXoá)) { chépMột(đãXoá, thật); đãHoànTác.push({ id, file, cách: 'trả lại file đã dời' }); }
      else if (existsSync(cũ)) { chépMột(cũ, thật); đãHoànTác.push({ id, file, cách: 'chép bản cũ về' }); }
      else if (loai === 'thêm' && existsSync(thật)) { rmSync(thật); đãHoànTác.push({ id, file, cách: 'xoá file mới vừa ghi' }); }
      else đãHoànTác.push({ id, file, cách: 'không có bản cũ — sếp xem lại tay', loai });
    }
  }
}

nhậtKý('G8', '-', sai.length ? 'truot' : 'qua', sai[0]?.lý_do ?? `${cầnKiểm.length} việc ghi đúng`);

// Đạt thì đóng nhãn da_duyet → da_ghi. Đây là bước của "script cuối ngày" trong
// nhan.mjs — chỉ chạy sau khi mã băm khớp, nên nhãn da_ghi luôn có bằng chứng.
// Việc đã ở da_ghi (chạy kiem lần hai) thì bỏ qua, không báo lỗi.
// Việc không có trong bảng tasks (việc thử của thu-nhanh.mjs) thì chỉ ghi chú, không tính lỗi.
const đãĐóngNhãn = [], lỗiNhãn = [], khôngCóTrongDb = [];
if (!sai.length) {
  for (const { id } of cầnKiểm) {
    try {
      const [v] = await db.đọc('tasks', `id=eq.${id}&select=id,trang_thai`);
      if (!v) { khôngCóTrongDb.push(id); continue; }
      if (v.trang_thai === 'da_ghi') continue;
      if (!đượcChuyển(v.trang_thai, 'da_ghi', 'script')) {
        lỗiNhãn.push({ id, lý_do: `đang ở "${v.trang_thai}", không sang da_ghi được` });
        continue;
      }
      await db.sửa('tasks', `id=eq.${id}`, { trang_thai: 'da_ghi', cap_nhat_luc: new Date().toISOString() });
      đãĐóngNhãn.push(id);
    } catch (e) { lỗiNhãn.push({ id, lý_do: String(e.message).split('\n')[0] }); }
  }
}

// Đạt và đóng nhãn xong thì bỏ dấu loạt ghi. Còn lỗi nhãn thì giữ lại để chạy kiem lần nữa.
if (!sai.length && !lỗiNhãn.length) { try { rmSync(fileLoạt); } catch {} }

in_({
  so_viec: cầnKiểm.length,
  loat_luc: loạt.luc,
  so_file_da_ghi: cầnKiểm.reduce((a, c) => a + c.bn.da_chep.length, 0),
  dat: sai.length === 0,
  sai,
  da_hoan_tac: đãHoànTác,
  da_dong_nhan: đãĐóngNhãn,
  loi_nhan: lỗiNhãn,
  khong_co_trong_db: khôngCóTrongDb,
  ms: ms(),
  nhac: sai.length
    ? 'Đã hoàn tác. Báo sếp, KHÔNG tự chạy ghi-het lại.'
    : lỗiNhãn.length
      ? 'File ghi đúng nhưng chưa đóng được nhãn. Sửa lỗi rồi chạy lại `nhap.mjs kiem`.'
      : 'Ghi đúng, đã đóng nhãn. Chạy `viec.mjs dong-phien` để đóng phiên ngày.',
});
process.exit(sai.length || lỗiNhãn.length ? 1 : 0);
}
