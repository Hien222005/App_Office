// VIỆC — mọi thao tác với công việc, một cửa duy nhất.
//
//   node viec.mjs mo-phien                          mở phiên hôm nay, quét việc tồn
//   node viec.mjs ke-hoach                          việc hôm nay theo kế hoạch tuần
//   node viec.mjs doc [--kinh-nghiem]               lấy việc được giao
//   cat phieu.json | node viec.mjs phieu            ghi phiếu việc, luôn chờ sếp chốt
//   node viec.mjs lam  <id>                         đánh dấu đang làm
//   node viec.mjs xong <id> "kỳ vọng kết quả"       soát · đẩy link · ghi kết quả
//   node viec.mjs hoi  <id> "hỏi" "1" "2" "3"       chưa chắc thì hỏi, đừng đoán
//   node viec.mjs tinh-trang                        bảng số liệu, nguồn duy nhất
//   node viec.mjs dong-phien <id> "tóm tắt"         đóng phiên ngày
//
// Gộp từ bảy file rời (mo-phien · doc-viec · ghi-phieu · ghi-ket-qua · hoi-sep ·
// tinh-trang · dong-phien). Agent phải nhớ hai tên file thay vì chín.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { db, hômNay, in_ } from './lib.mjs';
import {
  NHÃN, CHUYỂN, CHỜ_SẾP, PHIÊN_NHẬN, TRẦN_LÀM_LẠI,
  đượcChuyển, chạmTrần, cầnSếpSửa, đangVướng, agentNhậnĐược, vìSaoKhôngNhận,
  trễHạn, làViệcTồn,
} from './nhan.mjs';
import { PHÒNG, gốcCủaPhòng } from './phong.mjs';
import { phạmViTừSkill } from './pham-vi.mjs';
import { đưaLên } from './dua-len.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const THƯ_MỤC_BRIEF = resolve(here, '..', '_brief');
const [lệnh, ...đối] = process.argv.slice(2);

const DÙNG = `Dùng: node viec.mjs <lệnh>

  mo-phien                        mở phiên hôm nay
  ke-hoach                        việc hôm nay theo kế hoạch tuần
  doc [--kinh-nghiem]             lấy việc được giao
  phieu                           (đọc JSON từ stdin) ghi phiếu việc
  lam  <id>                       đánh dấu đang làm
  xong <id> "kỳ vọng kết quả"     soát · đẩy link · ghi kết quả
  hoi  <id> "hỏi" "1" "2" "3"     hỏi sếp, đúng 3 gợi ý
  tinh-trang                      bảng số liệu
  dong-phien <id> "tóm tắt"       đóng phiên ngày`;

const ngày = hômNay();
const lấyViệc = async (id) => {
  const [v] = await db.đọc('tasks', `id=eq.${id}`);
  if (!v) { console.error(`Không thấy việc ${id}.`); process.exit(1); }
  return v;
};

// ══════════════════════════════════════════════════════════════════════════
// MỞ PHIÊN — một ngày một phiên. Mở lại thì lấy đúng phiên đang mở.
// ══════════════════════════════════════════════════════════════════════════
async function moPhien() {
  const [đangMở] = await db.đọc('agent_runs', `ngay=eq.${ngày}`);
  const phiên = đangMở ?? (await db.thêm('agent_runs', { ngay: ngày }))[0];
  const việc = await db.đọc('tasks', 'order=ngay.asc,thu_tu.asc');
  const tồn = việc.filter(t => làViệcTồn(t, ngày));
  in_({
    phien: phiên.id, ngay: ngày, mo_lai: !!đangMở, bat_dau: phiên.bat_dau,
    viec_ton: tồn.map(t => ({ id: t.id, ton_tu: t.ngay, ten: t.tieu_de, dang_cho: NHÃN[t.trang_thai]?.tên })),
    nhac: tồn.length ? `Có ${tồn.length} việc tồn từ ngày trước. Đưa lên đầu bảng khi báo cáo.`
                     : 'Không có việc tồn.',
  });
}

// ══════════════════════════════════════════════════════════════════════════
// KẾ HOẠCH — việc hôm nay, lấy từ bảng sếp tự ghi trên điện thoại.
//
// Đây là chỗ thay cho bước nguy hiểm nhất của workflow cũ: `/report` phải TỰ ĐỌC NGUỒN
// TỪNG PHÒNG RỒI TỰ NGHĨ RA VIỆC. Đó là chỗ duy nhất agent được phán đoán tự do — nên
// cũng là chỗ dễ sai nhất, và không lần nào giống lần nào. Nay nó chỉ còn chép.
//
// In ra ĐÚNG khuôn mà `phieu` nhận, nên nối thẳng được:
//   node agent/viec.mjs ke-hoach | node agent/viec.mjs phieu
//
// Ba cách xếp một việc, xét theo ĐÚNG thứ tự này:
//   ngay có            → chỉ đúng ngày đó, một lần. Sếp chọn trên lịch.
//   ngay trống, thu có → thứ đó, lặp mọi tuần (2…7 = T2…T7, 8 = CN)
//   cả hai trống       → ngày nào cũng lên bảng
//   tuan  thu hẹp thêm về đúng một tuần · bat false = tạm ngưng, không lấy.
// ══════════════════════════════════════════════════════════════════════════
const thứCủa = (d) => (d.getDay() === 0 ? 8 : d.getDay() + 1);      // 2=T2 … 7=T7, 8=CN
function thứHaiCủaTuần(d) {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));                   // lùi về Thứ Hai
  return x.toLocaleDateString('sv-SE');
}

async function keHoach() {
  const nay = new Date();
  const thứ = thứCủa(nay), tuần = thứHaiCủaTuần(nay);
  const [cả, đãCó] = await Promise.all([
    db.đọc('ke_hoach', 'order=thu.asc,thu_tu.asc'),
    db.đọc('tasks', `ngay=eq.${ngày}&select=id,trang_thai`),
  ]);
  const mãViệc = (k) => `${k.id}-${ngày.replaceAll('-', '')}`;
  const đãLập = new Map(đãCó.map(t => [t.id, t.trang_thai]));

  const bỏQua = [];
  const hômNayLàm = cả.filter(k => {
    if (!k.bat)                            { bỏQua.push({ id: k.id, viec: k.viec, lý_do: 'đang tạm ngưng' }); return false; }
    // Ngày cụ thể thì CHỈ xét ngày — không ngó tới thu/tuan nữa, kẻo một dòng vừa có
    // ngày vừa có thứ lại bị loại oan.
    if (k.ngay) {
      if (k.ngay !== ngày) { bỏQua.push({ id: k.id, viec: k.viec, lý_do: `xếp vào ngày ${k.ngay}` }); return false; }
      return true;
    }
    if (k.thu != null && k.thu !== thứ)    { bỏQua.push({ id: k.id, viec: k.viec, lý_do: `xếp vào thứ ${k.thu}` }); return false; }
    if (k.tuan && k.tuan !== tuần)         { bỏQua.push({ id: k.id, viec: k.viec, lý_do: `của tuần ${k.tuan}` }); return false; }
    // ĐÃ LẬP PHIẾU RỒI THÌ THÔI. Mã việc suy ra từ mã kế hoạch + ngày, mà `phieu` ghi
    // bằng upsert — không chặn ở đây thì gõ /report lần hai trong ngày sẽ ĐÈ NGƯỢC việc
    // sếp đã chốt về lại `cho_chot`, và xoá cả link sản phẩm của việc đang chờ duyệt.
    if (đãLập.has(mãViệc(k))) {
      bỏQua.push({ id: k.id, viec: k.viec, lý_do: `hôm nay đã lập phiếu rồi (đang ở "${NHÃN[đãLập.get(mãViệc(k))]?.tên ?? đãLập.get(mãViệc(k))}")` });
      return false;
    }
    return true;
  });

  // Mảng đang tắt thì loại ngay tại đây, kèm lý do đọc được — đừng để nó đi tới `phieu`
  // rồi mới bị chặn, sếp nhìn sẽ tưởng hỏng.
  const dùngĐược = [], mảngTắt = [];
  for (const k of hômNayLàm) {
    try { gốcCủaPhòng(k.mang); dùngĐược.push(k); }
    catch (e) { mảngTắt.push({ id: k.id, viec: k.viec, mang: k.mang, lý_do: e.message.split('\n')[0] }); }
  }

  // Hạn chót mặc định: 17h hôm nay. Kế hoạch không ghi giờ, mà `phieu` bắt buộc phải có hạn.
  const hạn = `${ngày}T17:00:00`;
  in_({
    ngay: ngày, thu: thứ, tuan: tuần,
    viec: dùngĐược.map((k, i) => ({
      // Mã việc suy ra từ mã dòng kế hoạch + ngày, KHÔNG sinh ngẫu nhiên. Nhờ vậy gõ
      // /report hai lần trong ngày thì lần sau ghi đè đúng dòng cũ, không đẻ việc trùng.
      id: mãViệc(k),
      mang: k.mang, skill: k.skill, ten: k.viec,
      nhiem_vu: k.ghi_chu || k.viec,
      han_chot: hạn, thu_tu: i,
    })),
    bo_qua: bỏQua,
    mang_dang_tat: mảngTắt,
    nhac: dùngĐược.length
      ? `${dùngĐược.length} việc theo kế hoạch. Nối thẳng: node agent/viec.mjs ke-hoach | node agent/viec.mjs phieu`
      : (cả.length ? 'Kế hoạch có dòng nhưng hôm nay không dòng nào tới lượt.'
                   : 'Bảng kế hoạch còn trống. Sếp mở app, tab Kế hoạch, ghi việc vào.'),
  });
}

// ══════════════════════════════════════════════════════════════════════════
// ĐỌC VIỆC — cổng quyết định agent được nhận việc nào.
// Việc đã chốt VẪN có thể không giao được: chạm trần làm lại, hoặc treo câu hỏi.
// Cả hai tính từ số liệu, không phải từ nhãn, nên agent không thể quên đánh dấu.
// ══════════════════════════════════════════════════════════════════════════
async function doc() {
  const ghiChú = await db.đọc('agent_notes', 'order=ngay.desc&limit=40');
  if (đối.includes('--kinh-nghiem')) {
    in_({ ngay: ngày, kinh_nghiem: ghiChú.map(g => g.bai_hoc) });
    return;
  }

  // Cổng: đã mở phiên hôm nay chưa. Trước đây cổng này hỏi "đã có daily_report hôm nay
  // chưa" — nhưng bảng đó không ai đọc, lại đang là CHA của tasks, nên đã bỏ. Phiên ngày
  // mới đúng là thứ /report mở ra.
  const [phiên] = await db.đọc('agent_runs', `ngay=eq.${ngày}`);
  if (!phiên) {
    in_({ chặn: true, lý_do: 'Chưa mở phiên hôm nay. Chạy /report trước.' });
    return;
  }
  // KHÔNG có cổng duyệt cả phiếu một lần. Workflow này sếp chốt TỪNG VIỆC: nhãn
  // `da_chot` của từng việc CHÍNH LÀ sự chốt, và bảng CHUYỂN chỉ cho sếp đặt nhãn đó.

  const [việc, hỏi] = await Promise.all([
    db.đọc('tasks', `trang_thai=in.(${PHIÊN_NHẬN.join(',')})&order=ngay.asc,thu_tu.asc`),
    db.đọc('questions', 'order=ngay.desc&limit=200'),
  ]);

  const hỏiCủa = (id) => hỏi.filter(h => h.task_id === id);
  const khôngGiao = việc.filter(t => !agentNhậnĐược(t, hỏiCủa(t.id)))
    .map(t => ({ id: t.id, tên: t.tieu_de, lý_do: vìSaoKhôngNhận(t, hỏiCủa(t.id)) }));

  const thiếuBrief = [];
  const raViệc = việc.filter(t => agentNhậnĐược(t, hỏiCủa(t.id))).map(t => {
    const brief = t.brief ?? đọcBriefFile(t.id);
    if (!brief) thiếuBrief.push(t.id);
    return {
      id: t.id, mảng: t.mang, tên: t.tieu_de,
      skill: brief?.skill ?? null,
      nhãn: t.trang_thai, nhãn_đọc: NHÃN[t.trang_thai]?.tên ?? t.trang_thai,
      làm_lại: (t.so_lan_lam_lai ?? 0) > 0,
      lần_làm_lại: t.so_lan_lam_lai ?? 0,
      còn_được_làm_lại: TRẦN_LÀM_LẠI - (t.so_lan_lam_lai ?? 0),
      tồn_từ_ngày: làViệcTồn(t, ngày) ? t.ngay : null,
      trễ_hạn: trễHạn(t),
      brief,
      DẶN_THÊM_CỦA_SẾP: t.phan_hoi_cua_toi || null,   // đè lên brief, đọc trước khi làm
    };
  });

  const việcTồn = raViệc.filter(v => v.tồn_từ_ngày);
  if (!raViệc.length) {
    in_({
      chặn: true,
      lý_do: khôngGiao.length
        ? 'Có việc đã chốt nhưng không giao được. Xem việc_không_giao.'
        : 'Sếp chưa chốt việc nào. Mở app, bấm "Chốt việc này" rồi gõ lại /lam.',
      việc_không_giao: khôngGiao,
    });
    return;
  }

  in_({
    chặn: false, ngày,
    việc_tồn: việcTồn.map(v => ({ id: v.id, tồn_từ: v.tồn_từ_ngày, tên: v.tên })),
    kinh_nghiệm: ghiChú.map(g => g.bai_hoc),
    câu_hỏi_đã_trả_lời: hỏi.filter(h => h.tra_loi).map(h => ({ hỏi: h.cau_hoi, đáp: h.tra_loi })),
    câu_hỏi_còn_treo: hỏi.filter(h => !h.tra_loi).map(h => ({ id: h.id, task: h.task_id, hỏi: h.cau_hoi })),
    việc: raViệc,
    việc_không_giao: khôngGiao,        // ĐỪNG tự ý làm những việc này
    việc_thiếu_brief: thiếuBrief,      // không có brief thì không mở được bản nháp
  });
}

function đọcBriefFile(id) {
  const f = join(THƯ_MỤC_BRIEF, `${id}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
}

// ══════════════════════════════════════════════════════════════════════════
// GHI PHIẾU — mọi việc luôn vào nhãn chờ sếp chốt. Agent không tự chốt được.
// Brief chỉ còn NĂM mục: phạm vi file đã nằm trong Skill, không khai lại.
// ══════════════════════════════════════════════════════════════════════════
const MỤC_BRIEF = ['mang', 'skill', 'ten', 'nhiem_vu', 'han_chot'];

async function phieu() {
  const vào = JSON.parse(await new Response(process.stdin).text());
  const hợpLệ = [], loại = [];

  (vào.viec ?? []).forEach((v, i) => {
    const thiếu = MỤC_BRIEF.filter(m => {
      const x = v[m];
      return x == null || x === '' || (Array.isArray(x) && !x.length);
    });
    const id = v.id ?? `t-${Date.now().toString(36)}-${i}`;
    if (thiếu.length) { loại.push({ id, ten: v.ten ?? '(chưa có tên)', thiếu }); return; }
    // Mảng phải có thật VÀ đang bật. Trước đây chỗ này không kiểm `mang` gì cả: luật
    // "mảng đang tắt thì bỏ qua" chỉ nằm trong report.md dưới dạng CÂU CHỮ, nên phiếu
    // cho mảng đã tắt vẫn ghi được, mãi tới lúc `nhap.mjs mo` mới vỡ. Nay chặn ngay đây,
    // bằng đúng hàm biết mảng nào đang tạm dừng.
    try { gốcCủaPhòng(v.mang); } catch (e) { loại.push({ id, ten: v.ten, thiếu: [e.message.split('\n')[0]] }); return; }
    // Skill phải tồn tại và khai được phạm vi, kẻo tới lúc làm mới vỡ.
    try { phạmViTừSkill(v.skill); } catch (e) { loại.push({ id, ten: v.ten, thiếu: [e.message] }); return; }
    hợpLệ.push({ ...v, id });
  });

  if (hợpLệ.length) {
    mkdirSync(THƯ_MỤC_BRIEF, { recursive: true });
    for (const v of hợpLệ) writeFileSync(join(THƯ_MỤC_BRIEF, `${v.id}.json`), JSON.stringify(v, null, 2));
    await db.nhét('tasks', hợpLệ.map((v, i) => ({
      id: v.id, ngay: ngày, mang: v.mang, tieu_de: v.ten,
      chi_tiet: v.nhiem_vu, han_chot: v.han_chot, brief: v,
      trang_thai: 'cho_chot', thu_tu: i,
    })));
  }

  console.log(JSON.stringify({
    ngay: ngày,
    da_ghi: hợpLệ.map(v => ({ id: v.id, mang: v.mang, skill: v.skill, ten: v.ten, han_chot: v.han_chot })),
    khong_ghi_vi_brief_thieu_muc: loại,
    nhac: 'Tất cả đang ở nhãn chờ sếp chốt. Sếp chốt trên app thì /lam mới làm.',
  }, null, 2));
}

// ══════════════════════════════════════════════════════════════════════════
// LÀM · XONG — agent chỉ tự khai MỘT câu, mọi thứ khác máy lấy.
// ══════════════════════════════════════════════════════════════════════════
async function lamHoacXong(nhãnMới) {
  const [id, kỳVọng] = đối;
  if (!id) { console.error(DÙNG); process.exit(1); }
  const việc = await lấyViệc(id);

  if (cầnSếpSửa(việc)) {
    console.error(`${id} đã bị trả lại ${việc.so_lan_lam_lai} lần (trần ${TRẦN_LÀM_LẠI}). `
                + `Việc này thuộc về sếp: sếp tự sửa rồi giao lại. Bỏ việc này, làm việc khác.`);
    process.exit(1);
  }
  // Gõ `lam` lại trên việc đang làm dở là chuyện thường — đừng báo lỗi, cứ đi tiếp.
  if (nhãnMới === 'dang_lam' && việc.trang_thai === 'dang_lam') {
    console.log(`${id} đang làm dở từ trước — làm tiếp.`);
    process.exit(0);
  }
  if (!đượcChuyển(việc.trang_thai, nhãnMới, 'agent')) {
    console.error(
      `Không được chuyển ${id} từ "${việc.trang_thai}" sang "${nhãnMới}".\n` +
      `Từ "${việc.trang_thai}" agent chỉ được sang: ${CHUYỂN.agent[việc.trang_thai]?.join(', ') || '(không có)'}`);
    process.exit(1);
  }

  const sửa = { trang_thai: nhãnMới, cap_nhat_luc: new Date().toISOString() };

  if (nhãnMới === 'dang_lam') {
    await db.sửa('tasks', `id=eq.${id}`, sửa);
    console.log(`${id} → ${nhãnMới} (${NHÃN[nhãnMới].tên})`);
    return;
  }

  if (!kỳVọng?.trim()) {
    console.error('Thiếu "kỳ vọng kết quả". Một hai câu: sếp mở link ra sẽ thấy gì.\n\n' + DÙNG);
    process.exit(1);
  }

  // 1 · soát. Trượt thì dừng hẳn, không ghi gì.
  let soát;
  try {
    soát = JSON.parse(execFileSync('node', [join(here, 'soat-bao-cao.mjs'), id], { encoding: 'utf8' }));
  } catch (e) {
    const ra = (() => { try { return JSON.parse(e.stdout); } catch { return null; } })();
    console.error('SOÁT KHÔNG QUA — chưa ghi gì cả. Sửa những chỗ này rồi chạy lại:\n');
    for (const l of ra?.loi ?? [String(e.stderr || e.message)]) console.error('  · ' + l);
    process.exit(1);
  }

  // 2 · đẩy bản xem thử, lấy link cho sếp.
  let lên;
  try { lên = await đưaLên(id); }
  catch (e) { console.error('Không đưa được bản xem thử lên Storage: ' + e.message); process.exit(1); }
  if (!lên.link) { console.error('Đẩy xong nhưng không ra link nào.'); process.exit(1); }

  // 3 · ghi. Chỉ `ket_qua` là lời agent; còn lại máy lấy từ ổ đĩa và nhật ký.
  Object.assign(sửa, {
    // Bảng tasks không có cột `ket_qua`. `ghi_chu_agent` đúng nghĩa: thứ DUY NHẤT
    // agent tự khai. Mọi cột khác dưới đây máy lấy từ ổ đĩa và nhật ký.
    ghi_chu_agent: kỳVọng.trim(),
    link_san_pham: lên.link,
    file_da_doi: soát.file_da_doi,
    cac_buoc: soát.cac_buoc,
  });
  await db.sửa('tasks', `id=eq.${id}`, sửa);

  console.log(JSON.stringify({
    id, nhan: nhãnMới, nhan_doc: NHÃN[nhãnMới].tên,
    ky_vong: sửa.ghi_chu_agent,
    so_file_da_doi: soát.file_da_doi.length,
    so_buoc_trong_nhat_ky: soát.cac_buoc.length,
    da_tu_kiem: soát.da_tu_kiem,
    link_san_pham: lên.link,
    file_phu_da_dua_len: lên.file_phu,
  }, null, 2));
}

// ══════════════════════════════════════════════════════════════════════════
// HỎI — chưa chắc thì hỏi, đúng 3 gợi ý. KHÔNG đổi nhãn: "đang vướng" tính từ
// câu hỏi chưa ai trả lời, nên agent không thể quên đánh dấu.
// ══════════════════════════════════════════════════════════════════════════
async function hoi() {
  const [taskId, câuHỏi, ...gợiÝ] = đối;
  if (!taskId || !câuHỏi || gợiÝ.length !== 3) {
    console.error('Dùng: node viec.mjs hoi <id> "câu hỏi" "gợi ý 1" "gợi ý 2" "gợi ý 3"');
    console.error('Phải đúng 3 gợi ý. App tự thêm ô để sếp gõ câu trả lời khác.');
    process.exit(1);
  }
  const id = 'q-' + Date.now().toString(36);
  await db.thêm('questions', { id, task_id: taskId, ngay: ngày, cau_hoi: câuHỏi, phuong_an: gợiÝ });
  await db.sửa('tasks', `id=eq.${taskId}`, { cap_nhat_luc: new Date().toISOString() });
  console.log(`Đã hỏi (${id}) · ${taskId} đang chờ sếp trả lời. Đi tiếp việc khác, đừng đoán.`);
}

// Xếp việc còn sống vào ba rổ. `tinh-trang` và `dong-phien` DÙNG CHUNG hàm này —
// trước đây mỗi chỗ tự tính một kiểu: tinh-trang quên đếm da_chot và dang_lam nên
// báo "đóng được phiên" trong khi dong-phien vẫn chặn. Hai nguồn thì sẽ lệch.
function xếpRổ(việc, hỏiCủa) {
  const sống = việc.filter(t => !NHÃN[t.trang_thai]?.kết_thúc);
  const chờSếp = sống.filter(t =>
    CHỜ_SẾP.includes(t.trang_thai) || đangVướng(hỏiCủa(t.id)) || chạmTrần(t.so_lan_lam_lai));
  const chờGhi = sống.filter(t => t.trang_thai === 'da_duyet');
  const đangLàm = sống.filter(t =>
    ['da_chot', 'dang_lam'].includes(t.trang_thai) && !chờSếp.includes(t));
  // Chỉ việc sếp ĐÃ DUYỆT mà chưa ghi mới giữ phiên lại: đó là việc của /chot, phải xong
  // trong ngày. Việc chờ sếp hay đang làm dở thì cứ đóng — mai nó lên đầu bảng là việc tồn.
  return { sống, chờSếp, chờGhi, đangLàm, đóngĐược: !chờGhi.length };
}

// ══════════════════════════════════════════════════════════════════════════
// TÌNH TRẠNG — nguồn số liệu DUY NHẤT. Agent không được tự đếm.
// ══════════════════════════════════════════════════════════════════════════
async function tinhTrang() {
  const [việc, hỏi] = await Promise.all([
    db.đọc('tasks', 'order=ngay.asc,thu_tu.asc'),
    db.đọc('questions', 'order=ngay.desc&limit=200'),
  ]);
  const sống = việc.filter(t => !NHÃN[t.trang_thai]?.kết_thúc || t.ngay === ngày);
  const hỏiCủa = (id) => hỏi.filter(h => h.task_id === id);
  // Chờ sếp = nhãn chờ sếp, HOẶC đang treo câu hỏi, HOẶC chạm trần làm lại.
  const chờSếp = (t) => !NHÃN[t.trang_thai]?.kết_thúc
    && (CHỜ_SẾP.includes(t.trang_thai) || đangVướng(hỏiCủa(t.id)) || chạmTrần(t.so_lan_lam_lai));

  const bảng = Object.keys(PHÒNG).map(m => {
    const l = sống.filter(t => t.mang === m);
    return {
      phòng: PHÒNG[m].tên, mã: m, tắt: !!PHÒNG[m].tắt,
      chờ_sếp: l.filter(chờSếp).length,
      đang_làm: l.filter(t => ['da_chot', 'dang_lam'].includes(t.trang_thai) && !chờSếp(t)).length,
      đã_duyệt_chờ_ghi: l.filter(t => t.trang_thai === 'da_duyet').length,
      đã_ghi: l.filter(t => t.trang_thai === 'da_ghi').length,
      trễ_hạn: l.filter(t => trễHạn(t)).length,
      tổng: l.length,
    };
  });

  const rổ = xếpRổ(việc, hỏiCủa);
  const hômNayLàm = sống.filter(t => t.ngay === ngày || làViệcTồn(t, ngày));
  const đãDuyệt = hômNayLàm.filter(t => t.trang_thai === 'da_duyet').map(t => t.id);
  const cònChờ = hômNayLàm.filter(chờSếp).map(t => t.id);
  // `nhap.mjs ghi-het` tự hỏi Supabase việc nào đang da_duyet — không còn file danh sách.

  in_({
    ngày,
    bảng_theo_phòng: bảng,
    việc_tồn: sống.filter(t => làViệcTồn(t, ngày)).map(t => ({
      id: t.id, tồn_từ: t.ngay, tên: t.tieu_de, phòng: PHÒNG[t.mang]?.tên,
      đang_chờ: NHÃN[t.trang_thai]?.tên ?? t.trang_thai,
    })),
    đang_vướng: sống.filter(t => đangVướng(hỏiCủa(t.id))).map(t => ({
      id: t.id, tên: t.tieu_de, hỏi: hỏiCủa(t.id).find(h => !h.tra_loi)?.cau_hoi,
    })),
    đang_trong_vòng_làm_lại: sống.filter(t => (t.so_lan_lam_lai ?? 0) > 0 && !NHÃN[t.trang_thai]?.kết_thúc)
      .map(t => ({
        id: t.id, tên: t.tieu_de, lần_thứ: t.so_lan_lam_lai,
        còn_được: Math.max(0, TRẦN_LÀM_LẠI - t.so_lan_lam_lai),
        nhận_xét_lần_trước: t.phan_hoi_cua_toi || null,
      })),
    cần_sếp_sửa: sống.filter(t => cầnSếpSửa(t))
      .map(t => ({ id: t.id, tên: t.tieu_de, lý_do: `đã bị trả lại ${t.so_lan_lam_lai} lần` })),
    đã_duyệt_chờ_ghi: đãDuyệt,
    còn_chờ_sếp: cònChờ,
    đang_làm_chưa_nộp: rổ.đangLàm.map(t => ({ id: t.id, tên: t.tieu_de })),
    // Cùng một phép tính với dong-phien — không còn hai chỗ tự tính riêng.
    đóng_được_phiên: rổ.đóngĐược,
  });
}

// ══════════════════════════════════════════════════════════════════════════
// ĐÓNG PHIÊN — chỉ chặn khi còn việc sếp đã duyệt mà chưa ghi. Việc dở dang sang mai.
// ══════════════════════════════════════════════════════════════════════════
async function dongPhien() {
  const [id, tómTắt = ''] = đối;
  if (!id) { console.error('Dùng: node viec.mjs dong-phien <id-phiên> "tóm tắt"'); process.exit(1); }

  const [việc, hỏi] = await Promise.all([
    db.đọc('tasks', 'order=ngay.asc,thu_tu.asc'),
    db.đọc('questions', 'order=ngay.desc&limit=200'),
  ]);
  const hỏiCủa = (i) => hỏi.filter(h => h.task_id === i);
  const { chờSếp, chờGhi, đangLàm, đóngĐược } = xếpRổ(việc, hỏiCủa);

  if (!đóngĐược) {
    in_({
      chặn: true, lý_do: 'Còn việc sếp đã duyệt mà chưa ghi vào file gốc.',
      đã_duyệt_chưa_ghi: chờGhi.map(t => t.id),
      nhắc: 'Chạy nhap.mjs ghi-het. Việc nào trượt thì báo sếp, không tự chạy lại.',
    });
    process.exit(1);
  }
  const sangMai = [...chờSếp, ...đangLàm].map(t => ({ id: t.id, tên: t.tieu_de, nhãn: NHÃN[t.trang_thai]?.tên }));

  const đãGhi = việc.filter(t => t.trang_thai === 'da_ghi' && t.ngay === ngày).length;
  await db.sửa('agent_runs', `id=eq.${id}`, {
    ket_thuc: new Date().toISOString(),
    so_viec_da_ghi: đãGhi, tom_tat: tómTắt,
  });
  in_({ chặn: false, phien: id, so_viec_da_ghi: đãGhi, sang_mai: sangMai, tom_tat: tómTắt });
}

// ══════════════════════════════════════════════════════════════════════════
const BẢNG = {
  'mo-phien': moPhien, 'ke-hoach': keHoach, doc, phieu,
  lam: () => lamHoacXong('dang_lam'),
  xong: () => lamHoacXong('cho_duyet'),
  hoi, 'tinh-trang': tinhTrang, 'dong-phien': dongPhien,
};
if (!BẢNG[lệnh]) { console.error(DÙNG); process.exit(1); }
await BẢNG[lệnh]();
