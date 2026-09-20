// CHẠY THỬ NHANH — không gọi Claude, không đụng thư mục thật, không cần Supabase.
//   node agent/thu-nhanh.mjs
//
// Dựng một thư mục E-learning giả lập trong agent-app/_thu/, rồi diễn lại trọn vòng:
// mở bản nháp → trưởng phòng làm (kể cả làm lấn) → soát báo cáo thật và báo cáo khai man
// → sếp duyệt → chép về. Cuối cùng in bảng kết quả từng ca.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, appendFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { băm } from './anh-chup.mjs';
import { đượcChuyển, trễHạn, NHÃN, chạmTrần, làViệcTồn, SỐ_PHƯƠNG_ÁN, CHỜ_SẾP,
         cầnSếpSửa, đangVướng, agentNhậnĐược, vìSaoKhôngNhận } from './nhan.mjs';

const agent = dirname(fileURLToPath(import.meta.url));
const thử = resolve(agent, '..', '_thu');
const gốc = join(thử, 'Elearning-gia');
const M4 = 'courses/Test_Module 4_Coding/module-04';
const ID = 't-thu-1';

rmSync(gốc, { recursive: true, force: true });
rmSync(join(resolve(agent, '..', '_nhap'), ID), { recursive: true, force: true });
const ghi = (f, nd) => { mkdirSync(dirname(join(gốc, f)), { recursive: true }); writeFileSync(join(gốc, f), nd); };
ghi('.gitignore', 'courses/\n*.zip\n');
ghi('bugs-con-lai-can-fix-2026-08-28.md', '# Bug còn lại\n\n13. Câu hỏi sát nhau khi xem lại quiz\n');
ghi('.claude/skills/elearning-md-to-html/templates/interactive/accordion.css', '.acc{gap:12px}\n');
ghi('courses/Module 4/02_html/shared/core.css', '.quiz-review .question + .question{margin-top:12px}\n');
ghi(`${M4}/02_html/shared/core.css`, '.quiz-review .question + .question {\n  margin-top: 12px;\n}\n');
ghi(`${M4}/02_html/unit-8-quiz.html`, '<section class="quiz-review"></section>\n');
ghi(`${M4}/01_md/unit-8-quiz.md`, '# Unit 8 · Quiz\n');

const brief = {
  id: ID, mang: 'elearn', ten: 'Fix bug #13 — câu hỏi sát nhau khi xem lại quiz',
  nhiem_vu: 'Tăng khoảng cách hai câu hỏi ở chế độ xem lại, thêm đường kẻ.',
  boi_canh: 'Mục 13 trong bugs-con-lai-can-fix-2026-08-28.md',
  file_can_doc: ['bugs-con-lai-can-fix-2026-08-28.md', `${M4}/02_html/unit-8-quiz.html`],
  file_duoc_sua: [`${M4}/**`, 'bugs-con-lai-can-fix-*.md'],
  file_phai_doi: [`${M4}/**`, 'bugs-con-lai-can-fix-*.md'],
  viec_khong_lam: ['Không đồng bộ sang .claude/skills/**/templates/', 'Không sửa courses/Module 4/'],
  xong_khi: 'Câu 4 và Câu 5 cách nhau 32px và có đường kẻ phân tách.',
  diem_dung: ['Không tái hiện được bug', 'Phải sửa file ngoài file_duoc_sua mới xong được'],
  link_san_pham: `http://<IP-Mac>:8890/nhap/${ID}/${M4}/02_html/unit-8-quiz.html`,
  han_chot: '2026-09-18T14:00',
};
const fileBrief = join(thử, 'brief.json');
mkdirSync(thử, { recursive: true });
writeFileSync(fileBrief, JSON.stringify(brief, null, 2));

// VP_NHAT_KY: script con ghi và đọc nhật ký trong thư mục thử, không đụng nhật ký thật.
const môi = { ...process.env, DIR_ELEARNING: gốc, VP_NHAT_KY: join(thử, 'nhat-ky') };
const chạy = (tệp, ...args) => execFileSync('node', [join(agent, tệp), ...args], { encoding: 'utf8', env: môi });
const chạyCóLỗi = (tệp, ...args) => {
  try { return { ma: 0, ra: chạy(tệp, ...args), loi: '' }; }
  catch (e) { return { ma: e.status, ra: e.stdout ?? '', loi: e.stderr ?? '' }; }
};

const ca = [];
const kiểm = (tên, điều_kiện, ghi_chú = '') => ca.push({ ca: tên, đạt: !!điều_kiện, ghi_chú });

// ── nhãn ──────────────────────────────────────────────────────────────────
kiểm('Agent không tự chốt kế hoạch được', !đượcChuyển('cho_chot', 'da_chot', 'agent'));
kiểm('Agent không tự duyệt kết quả được', !đượcChuyển('cho_duyet', 'da_duyet', 'agent'));
kiểm('Agent không tự ghi vào file gốc được', !đượcChuyển('da_duyet', 'da_ghi', 'agent'));
kiểm('Chỉ script cuối ngày được ghi vào file gốc', đượcChuyển('da_duyet', 'da_ghi', 'script'));
kiểm('Sếp duyệt kết quả được', đượcChuyển('cho_duyet', 'da_duyet', 'sếp'));
kiểm('Sếp trả lại được (về lại đã chốt)', đượcChuyển('cho_duyet', 'da_chot', 'sếp'));
kiểm('Việc đã ghi không tính trễ hạn', !trễHạn({ han_chot: '2026-09-01', trang_thai: 'da_ghi' }));
kiểm('Trần làm lại: 2 lần chưa chạm, 3 lần là chạm', !chạmTrần(2) && chạmTrần(3));
kiểm('Chạm trần: việc thành của sếp, agent không nhận nữa',
  cầnSếpSửa({ trang_thai: 'da_chot', so_lan_lam_lai: 3 }) &&
  !cầnSếpSửa({ trang_thai: 'da_chot', so_lan_lam_lai: 2 }));
kiểm('Chạm trần thì đã kết thúc không tính là cần sếp sửa',
  !cầnSếpSửa({ trang_thai: 'da_ghi', so_lan_lam_lai: 3 }));
kiểm('Câu hỏi chưa trả lời = đang vướng',
  đangVướng([{ tra_loi: null }]) && !đangVướng([{ tra_loi: 'bản v2' }]) && !đangVướng([]));
kiểm('Việc đang treo câu hỏi thì KHÔNG giao cho agent',
  !agentNhậnĐược({ trang_thai: 'da_chot', so_lan_lam_lai: 0 }, [{ tra_loi: null }]) &&
  agentNhậnĐược({ trang_thai: 'da_chot', so_lan_lam_lai: 0 }, [{ tra_loi: 'xong' }]));
kiểm('Việc chạm trần thì KHÔNG giao cho agent',
  !agentNhậnĐược({ trang_thai: 'da_chot', so_lan_lam_lai: 3 }, []));
kiểm('Không giao thì phải nói rõ lý do',
  /trả lại/.test(vìSaoKhôngNhận({ trang_thai: 'da_chot', so_lan_lam_lai: 3 }, []) ?? '') &&
  /câu hỏi/.test(vìSaoKhôngNhận({ trang_thai: 'da_chot', so_lan_lam_lai: 0 }, [{ tra_loi: null }]) ?? '') &&
  vìSaoKhôngNhận({ trang_thai: 'da_chot', so_lan_lam_lai: 0 }, []) === null);
kiểm('Việc ngày trước chưa xong là việc tồn',
  làViệcTồn({ ngay: '2026-09-17', trang_thai: 'cho_duyet' }, '2026-09-18') &&
  !làViệcTồn({ ngay: '2026-09-17', trang_thai: 'da_ghi' }, '2026-09-18'));
kiểm('Đủ 7 nhãn, 2 nhãn chờ sếp', Object.keys(NHÃN).length === 7 && CHỜ_SẾP.length === 2);
kiểm('Câu hỏi cho sếp: đúng 3 gợi ý', SỐ_PHƯƠNG_ÁN === 3);

// ── mở bản nháp ───────────────────────────────────────────────────────────
const mở = JSON.parse(chạy('ban-nhap.mjs', 'mo', fileBrief));
const nháp = mở.ban_nhap;
kiểm('Mở bản nháp trong agent-app/_nhap', nháp.includes('/_nhap/'), `${mở.ms}ms`);
const bămTrước = {
  css: băm(join(gốc, M4, '02_html/shared/core.css')),
  tpl: băm(join(gốc, '.claude/skills/elearning-md-to-html/templates/interactive/accordion.css')),
  m4: băm(join(gốc, 'courses/Module 4/02_html/shared/core.css')),
};

// ── trưởng phòng làm: 2 việc đúng + 2 cú lấn ──────────────────────────────
writeFileSync(join(nháp, M4, '02_html/shared/core.css'),
  '.quiz-review .question + .question {\n  margin-top: 32px;\n  border-top: 1px solid #e3e7ee;\n}\n');
writeFileSync(join(nháp, 'bugs-con-lai-can-fix-2026-09-18.md', ), '# Bug\n\n13. Khoảng cách câu hỏi — 12px → 32px, thêm đường kẻ\n');
const xem = JSON.parse(chạy('ban-nhap.mjs', 'xem', ID));
kiểm('xem: đúng 2 file sẽ chép về', xem.se_chep_ve.length === 2);
kiểm('Thư mục thật chưa bị đụng trước khi duyệt',
  băm(join(gốc, M4, '02_html/shared/core.css')) === bămTrước.css);

// ── soát: máy đọc bản nháp + nhật ký, agent không khai gì ─────────────────
// Bài thử tự ghi nhật ký giả vào thư mục riêng (VP_NHAT_KY) thay cho hook.
const thưNhậtKý = join(thử, 'nhat-ky');
mkdirSync(thưNhậtKý, { recursive: true });
const fileNhậtKý = join(thưNhậtKý, new Date().toLocaleDateString('sv-SE') + '.jsonl');
const gốcNháp = `${resolve(agent, '..', '_nhap')}/${ID}/nhap/`;
const xoáNhậtKý = () => writeFileSync(fileNhậtKý, '');
const ghiNhậtKý = (côngCụ, file, giờ) =>
  appendFileSync(fileNhậtKý, JSON.stringify(
    { luc: giờ, loai: 'lam', ai: 'agent', cong_cu: côngCụ, dich: gốcNháp + file }) + '\n');

const CSS = `${M4}/02_html/shared/core.css`;
const LOG = 'bugs-con-lai-can-fix-2026-09-18.md';

const soát = (tên, mongQua, chứa) => {
  const r = chạyCóLỗi('soat-bao-cao.mjs', ID);
  let kq; try { kq = JSON.parse(r.ra); } catch { kq = { qua: false, loi: ['không ra JSON: ' + r.ra.slice(0, 80)] }; }
  const đúng = kq.qua === mongQua && (!chứa || kq.loi.some(x => x.includes(chứa)));
  ca.push({ ca: tên, đạt: đúng, ghi_chú: kq.qua ? 'qua' : (kq.loi[0] ?? '').slice(0, 70) });
  return kq;
};

// ca 1 · sửa đúng phạm vi, CÓ mở lại file sau lần sửa cuối
xoáNhậtKý();
ghiNhậtKý('Read', LOG, '10:20');
ghiNhậtKý('Edit', CSS, '10:24');
ghiNhậtKý('Edit', LOG, '10:31');
ghiNhậtKý('Read', CSS, '10:36');          // ← mở lại sau lần sửa cuối
const qua1 = soát('Sửa đúng phạm vi, có mở lại file → qua', true);
kiểm('Máy tự lấy đúng 2 file đã đổi, agent không khai', qua1.file_da_doi?.length === 2);
kiểm('Máy tự lấy các bước kèm giờ từ nhật ký', (qua1.cac_buoc ?? []).length === 4
  && qua1.cac_buoc[0].startsWith('10:20'));
kiểm('Ghi rõ đã tự kiểm lúc nào, file nào',
  qua1.da_tu_kiem?.luc === '10:36' && qua1.da_tu_kiem?.file === CSS);

// ca 2 · LUẬT MỚI: sửa xong mà không mở lại → trượt
xoáNhậtKý();
ghiNhậtKý('Read', LOG, '10:20');
ghiNhậtKý('Edit', CSS, '10:24');
ghiNhậtKý('Edit', LOG, '10:31');          // sửa cuối, không đọc lại
soát('Sửa xong mà không mở lại file → trượt', false, 'CHƯA TỰ KIỂM');

// ca 3 · đọc lại TRƯỚC lần sửa cuối thì không tính
xoáNhậtKý();
ghiNhậtKý('Edit', CSS, '10:24');
ghiNhậtKý('Read', CSS, '10:28');          // đọc lại, nhưng rồi còn sửa tiếp
ghiNhậtKý('Edit', LOG, '10:31');
soát('Mở lại rồi còn sửa tiếp → vẫn trượt', false, 'CHƯA TỰ KIỂM');

// ca 4 · nhật ký trống
xoáNhậtKý();
soát('Nhật ký trống → trượt', false, 'không có hành động nào');

// ca 5 · nhật ký chỉ có đọc, không có sửa
xoáNhậtKý();
ghiNhậtKý('Read', CSS, '10:20');
soát('Nhật ký chỉ có đọc, không sửa → trượt', false, 'không thấy lần sửa nào');

// đưa nhật ký về trạng thái hợp lệ cho các chặng sau
xoáNhậtKý();
ghiNhậtKý('Edit', CSS, '10:24');
ghiNhậtKý('Edit', LOG, '10:31');
ghiNhậtKý('Read', CSS, '10:36');

// ── chặng 2 · trưởng phòng làm lấn ra ngoài phạm vi ───────────────────────
writeFileSync(join(nháp, '.claude/skills/elearning-md-to-html/templates/interactive/accordion.css'), '.acc{gap:32px}\n');
appendFileSync(join(nháp, 'courses/Module 4/02_html/shared/core.css'), '/* đồng bộ luôn cho tiện */\n');

const xem2 = JSON.parse(chạy('ban-nhap.mjs', 'xem', ID));
kiểm('Sửa lấn: vẫn chỉ 2 file được chép về', xem2.se_chep_ve.length === 2);
kiểm('Sửa lấn: 2 file ngoài phạm vi bị bỏ lại trong nháp', xem2.bo_qua_vi_ngoai_pham_vi.length === 2);
kiểm('Sửa lấn: thư mục thật vẫn nguyên trạng',
  băm(join(gốc, '.claude/skills/elearning-md-to-html/templates/interactive/accordion.css')) === bămTrước.tpl &&
  băm(join(gốc, 'courses/Module 4/02_html/shared/core.css')) === bămTrước.m4);
const lấn = soát('Sửa lấn ra ngoài phạm vi → trượt', false, 'SỬA LẤN');
kiểm('Chỉ ra đúng 2 file sửa lấn', (lấn.file_ngoai_pham_vi ?? []).length === 2);

// ── sếp duyệt: chỉ phần trong phạm vi được chép về ────────────────────────
// Sếp tự sửa file log trong lúc chờ duyệt → phải báo xung đột, không đè.
writeFileSync(join(gốc, 'bugs-con-lai-can-fix-2026-09-18.md'), '# Bug (sếp tự ghi trước)\n');
const duyệt = JSON.parse(chạy('ban-nhap.mjs', 'duyet', ID));
kiểm('Duyệt: chép về đúng file CSS', duyệt.da_chep_ve.some(x => x.file.endsWith('core.css')) &&
  readFileSync(join(gốc, M4, '02_html/shared/core.css'), 'utf8').includes('32px'));
kiểm('Duyệt: không đè file sếp vừa sửa', duyệt.xung_dot_khong_chep.length === 1 &&
  readFileSync(join(gốc, 'bugs-con-lai-can-fix-2026-09-18.md'), 'utf8').includes('sếp tự ghi'));
kiểm('Duyệt: template và Module 4 vẫn nguyên trạng',
  băm(join(gốc, '.claude/skills/elearning-md-to-html/templates/interactive/accordion.css')) === bămTrước.tpl &&
  băm(join(gốc, 'courses/Module 4/02_html/shared/core.css')) === bămTrước.m4);
// ── chặng 3 · ghi cả loạt cuối ngày, kiểm sau khi ghi, hoàn tác khi xung đột ──
const ID2 = 't-thu-2';
rmSync(join(resolve(agent, '..', '_nhap'), ID2), { recursive: true, force: true });
const brief2 = { ...brief, id: ID2, file_duoc_sua: [`${M4}/**`], file_phai_doi: [`${M4}/**`] };
const fileBrief2 = join(thử, 'brief2.json');
writeFileSync(fileBrief2, JSON.stringify(brief2, null, 2));
const mở2 = JSON.parse(chạy('ban-nhap.mjs', 'mo', fileBrief2));
writeFileSync(join(mở2.ban_nhap, M4, '02_html/unit-8-quiz.html'),
  '<section class="quiz-review" data-sua="cuoi-ngay"></section>\n');

// Dọn biên nhận của chặng trước để kiem-sau-ghi chỉ xét loạt ghi cuối ngày.
rmSync(join(resolve(agent, '..', '_nhap'), ID, 'bien-nhan-ghi.json'), { force: true });

const dsFile = join(resolve(agent, '..', '_nhap'), 'da-duyet.json');
writeFileSync(dsFile, JSON.stringify({ ngay: '2026-09-18', da_duyet: [ID2], con_cho: ['t-con-cho'] }));
const r1 = chạyCóLỗi('ban-nhap.mjs', 'ghi-het');
kiểm('ghi-het bị chặn khi còn việc sếp chưa duyệt',
  r1.ma === 1 && /chưa duyệt/.test(r1.loi + r1.ra),
  (r1.loi || '').trim().slice(0, 60));

writeFileSync(dsFile, JSON.stringify({ ngay: '2026-09-18', da_duyet: [ID2], con_cho: [] }));
const ghiHết = JSON.parse(chạy('ban-nhap.mjs', 'ghi-het'));
kiểm('ghi-het chép về đúng 1 việc', ghiHết.so_viec === 1 && ghiHết.ket_qua[0].da_chep_ve.length === 1);
kiểm('File gốc đã nhận nội dung mới',
  readFileSync(join(gốc, M4, '02_html/unit-8-quiz.html'), 'utf8').includes('cuoi-ngay'));
const rk = chạyCóLỗi('kiem-sau-ghi.mjs');
const kiểmGhi = JSON.parse(rk.ra);
kiểm('kiem-sau-ghi: đạt khi ghi đúng', rk.ma === 0 && kiểmGhi.dat === true,
  `${kiểmGhi.so_file_da_ghi} file · ${(kiểmGhi.sai[0]?.lý_do) ?? 'không lỗi'}`);

// Đạt rồi thì dấu loạt ghi phải mất, để không ai kiểm lại một loạt đã xong.
const rk0 = chạyCóLỗi('kiem-sau-ghi.mjs');
kiểm('kiem-sau-ghi: loạt đã xong thì không kiểm lại được',
  rk0.ma === 1 && /loat-ghi/.test(rk0.loi + rk0.ra), (rk0.loi || '').trim().slice(0, 48));

// ── chặng 4 · ghi xong mà file gốc bị sửa tay → hoàn tác cả loạt ──────────
const ID3 = 't-thu-3', MD = `${M4}/01_md/unit-8-quiz.md`;
rmSync(join(resolve(agent, '..', '_nhap'), ID3), { recursive: true, force: true });
const brief3 = { ...brief, id: ID3, file_duoc_sua: [`${M4}/**`], file_phai_doi: [`${M4}/**`] };
writeFileSync(join(thử, 'brief3.json'), JSON.stringify(brief3, null, 2));
const mở3 = JSON.parse(chạy('ban-nhap.mjs', 'mo', join(thử, 'brief3.json')));
writeFileSync(join(mở3.ban_nhap, MD), '# Unit 8 · Quiz\n\nĐã sửa ở bản nháp.\n');
writeFileSync(dsFile, JSON.stringify({ ngay: '2026-09-18', da_duyet: [ID3], con_cho: [] }));
chạy('ban-nhap.mjs', 'ghi-het');
writeFileSync(join(gốc, MD), 'ai đó sửa tay sau khi ghi\n');      // giả trường hợp sai
const r2 = chạyCóLỗi('kiem-sau-ghi.mjs');
const kq2 = JSON.parse(r2.ra);
kiểm('kiem-sau-ghi: bắt được nội dung khác bản nháp', r2.ma === 1 && kq2.sai.length > 0,
  kq2.sai[0]?.lý_do ?? '');
kiểm('kiem-sau-ghi: đã hoàn tác về bản trước khi ghi',
  readFileSync(join(gốc, MD), 'utf8').trim() === '# Unit 8 · Quiz');

const bỏ = JSON.parse(chạy('ban-nhap.mjs', 'bo', ID));
kiểm('Bỏ bản nháp', bỏ.da_bo_ban_nhap && !existsSync(nháp));

// ── bảng kết quả ──────────────────────────────────────────────────────────
const đạt = ca.filter(c => c.đạt).length;
console.log(`\n  CHẠY THỬ NHANH · ${đạt}/${ca.length} ca đạt\n`);
for (const c of ca) console.log(`  ${c.đạt ? '✓' : '✗'} ${c.ca}${c.ghi_chú ? `  — ${c.ghi_chú}` : ''}`);
console.log();
process.exit(đạt === ca.length ? 0 : 1);
