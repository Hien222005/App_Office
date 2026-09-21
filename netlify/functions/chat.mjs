// Cầu nối tới Gemini. Khoá API nằm Ở ĐÂY, phía máy chủ — không bao giờ xuống trình duyệt.
// Đặt biến GEMINI_API_KEY trong Netlify → Environment variables.
//
// Ba thứ giữ cho hàm này không treo và không im lặng:
//   1. HẠN THỜI GIAN 8 giây. Cổng Netlify cắt ở 10 giây và trả về một trang HTML lạ
//      hoắc; cắt sớm hơn thì còn kịp trả JSON nói rõ hỏng ở đâu.
//   2. TỰ ĐỔI MODEL. Tên model chết thì hỏi Google xem đang cấp cái nào rồi dùng luôn,
//      thay vì bắt sếp vào Netlify sửa biến môi trường.
//   3. ĐƯỜNG CHẨN ĐOÁN /api/chat?chan_doan=1 — mở bằng trình duyệt là xem được, nằm
//      TRƯỚC cổng chặn GET.

// Đo thật ngày 22/09 qua /api/chat?chan_doan=1&thu=<model>:
//   gemini-3.6-flash       3.170ms  ✓        gemini-3.5-flash-lite    685ms  ✓
//   gemini-flash-latest    9.039ms  quá tải  gemini-3.8-flash         454ms  quá tải
//   gemini-3.5-flash       9.503ms  quá hạn  gemini-2.5-flash(-lite)  ngừng cấp
// Danh sách model Google cấp KHÔNG nói gì về tốc độ hay việc còn nhận người dùng mới
// hay không — phải gọi thật mới biết. Thứ tự dưới đây xếp theo số đo, không theo phỏng đoán.
const UU_TIEN = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-3.5-flash'];
const MODEL_MAC_DINH = process.env.GEMINI_MODEL || UU_TIEN[0];
const GOC = 'https://generativelanguage.googleapis.com/v1beta';

const CHI_DAN = `Bạn là trợ lý trong app "Văn Phòng Agent". Người dùng là SẾP — chủ của
hệ thống. Gọi họ là "sếp", tự xưng "tôi".

## Hệ thống này hoạt động thế nào

Một agent khác (Claude Code) làm việc dưới máy Mac. Sếp chỉ DUYỆT trên điện thoại.
Mỗi ngày một phiên, ba lệnh sếp gõ trên Mac:

  /report  agent đọc bảng kế hoạch tuần → lập phiếu việc → trình lên để sếp chốt
  /lam     agent làm trong BẢN NHÁP, không đụng file thật, nộp kèm link xem thử
  /chot    chép kết quả đã duyệt vào file gốc, so mã băm, đóng phiên ngày

Sếp đi qua HAI cổng: chốt việc (trước khi làm), và duyệt kết quả (sau khi làm).

## Bảy nhãn của một việc

  Chờ sếp chốt      agent chưa được đụng vào
  Sếp đã chốt       agent được làm, chưa làm
  Đang làm          agent đang làm dở
  Chờ sếp duyệt     đã nộp, có link, đang đợi sếp mở ra xem
  Đã duyệt · chờ ghi  sếp duyệt rồi, đợi lệnh /chot ghi vào file gốc
  Đã ghi vào file gốc  xong hẳn
  Bỏ                sếp bỏ việc này

Ba tình trạng KHÔNG phải nhãn, tính từ số liệu:
  đang làm lại   — đã bị trả lại ít nhất một lần
  cần sếp sửa    — đã trả lại 3 lần, agent không chạm nữa, việc thành của sếp
  đang vướng     — có câu hỏi agent hỏi mà sếp chưa trả lời, việc đứng im

## Việc nào bấm ở đâu — TRA BẢNG NÀY, đừng tự suy

  Việc "Chờ sếp chốt"      → sếp mở app, tab Việc, chạm việc đó, bấm "Chốt việc này"
                              (hoặc "Bỏ" nếu không làm nữa)
  Việc "Chờ sếp duyệt"     → mở link sản phẩm xem trước, rồi bấm "Duyệt kết quả"
                              hoặc "Yêu cầu làm lại" kèm nhận xét
  Việc đã trả lại 3 lần    → app đổi nút thành "Giao lại cho agent" hoặc "Bỏ việc"
  Agent đang hỏi           → tab Việc, chạm một trong ba gợi ý, hoặc gõ câu khác
  Muốn thêm việc ngày sau  → tab Kế hoạch, gõ tên việc, bấm icon lịch chọn ngày
  Không thấy việc mới      → bấm nút Cập nhật ở góc trên phải. App KHÔNG tự tải lại.

Trên Mac chỉ có ba lệnh, và chúng KHÔNG thay được nút bấm trong app:
  lệnh report  mỗi sáng, đọc kế hoạch rồi lập phiếu việc
  lệnh lam     sau khi sếp đã chốt việc trong app
  lệnh chot    sau khi sếp đã duyệt hết kết quả trong app

Gọi tên lệnh là "lệnh report", "lệnh lam", "lệnh chot". ĐỪNG đọc dấu gạch chéo thành
"xẹt" hay "slash" — câu trả lời có thể bị đọc to lên.

## Bạn làm được gì

Bạn CHỈ đọc phần BỐI CẢNH gửi kèm rồi trả lời. Bạn KHÔNG chạy được lệnh, không sửa
được việc, không duyệt thay sếp, không đọc được file trên máy.

Sếp nhờ làm việc gì đó thì nói rõ sếp cần bấm nút nào trong app, hoặc gõ lệnh nào
trên Mac — đừng nhận lời rồi không làm được.

## Luật trả lời

- Tiếng Việt. NGẮN: hai đến bốn câu. Liệt kê từ 3 mục trở lên mới dùng gạch đầu dòng.
- CHỈ dựa vào BỐI CẢNH. Bối cảnh không có thì nói thẳng "bối cảnh chưa có phần đó",
  tuyệt đối không bịa tên việc, con số, ngày tháng hay tình trạng.
- Bối cảnh có số thì nói ra con số, đừng nói "một vài", "khá nhiều".
- Chủ động nhắc thứ đang CHỜ SẾP: việc chờ chốt, kết quả chờ duyệt, câu hỏi chưa trả
  lời, việc đã trả lại 3 lần, việc trễ hạn. Đó là thứ làm cả hệ thống đứng.
- Không chào hỏi dài dòng, vào thẳng câu trả lời. Không nhắc lại câu hỏi.
- Câu trả lời có thể được ĐỌC TO lên: viết như nói, không markdown, không ký hiệu lạ,
  không emoji, không dấu sao.
- Mã việc dạng k-… hay t-… thì đọc gọn, đừng đánh vần từng ký tự.`;

// Model tốt tìm được thì NHỚ LẠI trong suốt đời của instance. Netlify giữ ấm hàm giữa
// các lần gọi, nên lần sau khỏi phải đốt một cuộc gọi vào model đã chết rồi mới đổi.
let modelTot = null;

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

// fetch có hạn giờ. Không có nó thì Gemini treo là hàm treo theo.
async function fetchCoHan(url, opt, hanMs) {
  const bo = new AbortController();
  const hen = setTimeout(() => bo.abort(), hanMs);
  try { return await fetch(url, { ...opt, signal: bo.signal }); }
  finally { clearTimeout(hen); }
}

// Hỏi Google đang cấp những model sinh văn bản nào.
async function hoiDanhSachModel(KEY, hanMs) {
  const r = await fetchCoHan(`${GOC}/models?pageSize=200`, { headers: { 'x-goog-api-key': KEY } }, hanMs);
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `HTTP ${r.status}`);
  return (d.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace('models/', ''))
    .filter((n) => /gemini/.test(n) && !/embedding|aqa|vision|tts|image|live|thinking-exp/.test(n));
}

// Trong danh sách Google cấp, chọn bản flash mới nhất — nhẹ và rẻ, hợp việc tóm tắt đếm số.
const chonModel = (ds, tru = []) => {
  const duoc = (n) => ds.includes(n) && !tru.includes(n);
  return UU_TIEN.find(duoc)
    || ds.find((n) => /flash/.test(n) && !tru.includes(n) && !/preview|exp/.test(n))
    || ds.find((n) => /flash/.test(n) && !tru.includes(n))
    || ds.find((n) => !tru.includes(n))
    || null;
};

export default async (req) => {
  const KEY = (process.env.GEMINI_API_KEY || '').trim();   // .trim(): dán vào ô web hay lẫn dấu cách
  const HAN_MS = Number(process.env.GEMINI_TIMEOUT_MS || 8000);

  // ── CHẨN ĐOÁN ──────────────────────────────────────────────────────────
  // Đặt TRƯỚC cổng chặn GET, để mở thẳng bằng trình duyệt là xem được.
  if (new URL(req.url).searchParams.get('chan_doan')) {
    if (!KEY) return json({ loi: 'Máy chủ chưa có GEMINI_API_KEY' }, 500);

    // ?chan_doan=1&thu=<model>  → gọi thật một câu ngắn và BẤM GIỜ. Dùng để tìm model
    // nào đủ nhanh, thay vì đoán. Nhiều model còn sống nhưng nghĩ quá lâu so với hạn
    // 10 giây của cổng Netlify.
    const thuModel = new URL(req.url).searchParams.get('thu');
    if (thuModel) {
      const t0 = Date.now();
      try {
        const r = await fetchCoHan(`${GOC}/models/${thuModel}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Trả lời đúng hai chữ: xin chào' }] }],
            generationConfig: /^gemini-3/.test(thuModel)
              ? { maxOutputTokens: 500, thinkingConfig: { thinkingLevel: 'LOW' } }
              : { maxOutputTokens: 500 },
          }),
        }, 9500);
        const d = await r.json();
        return json({ model: thuModel, ms: Date.now() - t0, ok: r.ok,
          tra_loi: d?.candidates?.[0]?.content?.parts?.map((x) => x.text).join('').trim() || null,
          ly_do_dung: d?.candidates?.[0]?.finishReason || null,
          loi: r.ok ? null : (d?.error?.message || '').slice(0, 220) });
      } catch (e) {
        return json({ model: thuModel, ms: Date.now() - t0, ok: false,
          loi: e.name === 'AbortError' ? 'quá 9,5 giây không trả lời' : e.message });
      }
    }

    let ds = null, loiDs = null;
    try { ds = await hoiDanhSachModel(KEY, HAN_MS); }
    catch (e) { loiDs = e.name === 'AbortError' ? `quá ${HAN_MS}ms Google không trả lời` : e.message; }
    return json({
      model_dang_dat: MODEL_MAC_DINH,
      model_nay_con_song: ds ? ds.includes(MODEL_MAC_DINH) : null,
      model_se_tu_doi_sang: ds && !ds.includes(MODEL_MAC_DINH) ? chonModel(ds, [MODEL_MAC_DINH]) : null,
      khoa: { co: true, dai: KEY.length, bat_dau: KEY.slice(0, 4) },
      han_thoi_gian_ms: HAN_MS,
      hoi_duoc_google: ds !== null,
      loi_khi_hoi_google: loiDs,
      model_google_dang_cap: ds,
    });
  }

  if (req.method !== 'POST') return json({ loi: 'Chỉ nhận POST' }, 405);
  if (!KEY) return json({ loi: 'Máy chủ chưa có GEMINI_API_KEY' }, 500);

  // Google phát hành hai dạng khoá: "AIza…" (cũ) và "AQ…" (mới). Nhận cả hai. Chỗ này
  // chỉ bắt lỗi dán nhầm — đúng sai thật thì để Google trả lời, đừng tự chặn khoá hợp lệ.
  if (!/^(AIza[\w-]{30,}|AQ[\w.-]{20,})$/.test(KEY)) {
    return json({ loi:
      (KEY.startsWith('eyJ')
        ? 'GEMINI_API_KEY đang chứa một khoá JWT — nhiều khả năng dán nhầm khoá Supabase. '
        : `GEMINI_API_KEY không đúng dạng khoá Gemini (dài ${KEY.length} ký tự, ` +
          `bắt đầu bằng "${KEY.slice(0, 4)}"). `) +
      'Khoá Gemini bắt đầu bằng "AIza" hoặc "AQ". Lấy khoá mới ở aistudio.google.com/apikey.' }, 500);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ loi: 'Body không phải JSON' }, 400); }

  const lichSu = Array.isArray(body.lich_su) ? body.lich_su.slice(-10) : [];
  if (!lichSu.length) return json({ loi: 'Chưa có câu hỏi nào' }, 400);

  const contents = lichSu.map((m) => ({
    role: m.ai === 'toi' ? 'user' : 'model',
    parts: [{ text: String(m.noi ?? '').slice(0, 4000) }],
  }));
  const cuoi = contents[contents.length - 1];
  if (cuoi?.role === 'user') {
    cuoi.parts[0].text =
      `BỐI CẢNH HÔM NAY (JSON):\n${JSON.stringify(body.boi_canh ?? {})}\n\nCÂU HỎI: ${cuoi.parts[0].text}`;
  }

  // Gemini 3 mặc định "nghĩ" ở mức cao, và phần nghĩ ĐẾM CHUNG vào maxOutputTokens —
  // để hẹp thì nghĩ hết sạch, câu trả lời cụt giữa chừng. Việc ở đây chỉ là tóm tắt và
  // đếm số: hạ mức nghĩ, nới trần chữ.
  const thanCho = (model) => {
    const cauHinh = { temperature: 0.4, maxOutputTokens: 2000 };
    if (/^gemini-3/.test(model)) cauHinh.thinkingConfig = { thinkingLevel: 'LOW' };
    return JSON.stringify({ contents, systemInstruction: { parts: [{ text: CHI_DAN }] },
                            generationConfig: cauHinh });
  };

  async function goi(model) {
    const url = `${GOC}/models/${model}:generateContent`;
    const opt = (xt) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', ...xt },
                           body: thanCho(model) });
    let r = await fetchCoHan(url, opt({ 'x-goog-api-key': KEY }), HAN_MS);
    // Khoá "AQ…" là dạng xác thực mới. Tài liệu vẫn bảo gửi qua x-goog-api-key nên thử
    // cách chuẩn trước; bị chặn thì thử lại kiểu Bearer.
    if ((r.status === 401 || r.status === 403) && KEY.startsWith('AQ'))
      r = await fetchCoHan(url, opt({ Authorization: `Bearer ${KEY}` }), HAN_MS);
    return { r, d: await r.json() };
  }

  try {
    let model = modelTot || MODEL_MAC_DINH;
    let { r, d } = await goi(model);

    // Model chết thì TỰ ĐỔI, đừng bắt sếp vào Netlify sửa biến môi trường.
    //
    // Ba kiểu từ chối, phải bắt cả ba. Kiểu thứ ba là cái đã làm chat im lặng suốt:
    //   "This model models/gemini-2.5-flash is no longer available to NEW USERS.
    //    Please update your code to use models/gemini-3.6-flash"
    // Model vẫn NẰM TRONG danh sách Google cấp, nên chỉ nhìn danh sách thì tưởng còn
    // dùng được — chỉ lúc gọi thật mới lộ.
    const loiModel = d?.error?.message || '';
    // "high demand" / 503 cũng phải đổi: model còn sống nhưng đang quá tải thì chờ
    // cũng vô ích. Đo 22/09: gemini-3.8-flash trả lời "high demand" sau 454ms.
    if (!r.ok && (/not found|NOT_FOUND|is not supported|no longer available|deprecat|high demand|overloaded|UNAVAILABLE/i.test(loiModel) || r.status === 503)) {
      // Google thường chỉ luôn bản thay thế ngay trong câu lỗi. Dùng lời nó trước.
      const goiY = [...loiModel.matchAll(/models\/([\w.-]+)/g)].map((m) => m[1]).find((n) => n !== model);
      let thay = goiY;
      if (!thay) {
        const ds = await hoiDanhSachModel(KEY, HAN_MS);
        thay = chonModel(ds, [model]);
      }
      if (!thay) return json({ loi: `Model "${model}" không dùng được, mà cũng không tìm ra bản thay thế.` }, 502);
      model = thay;
      ({ r, d } = await goi(model));
      if (r.ok) modelTot = model;        // nhớ lại, lần sau khỏi đốt một cuộc gọi vô ích
    }

    if (!r.ok) {
      const goc = d?.error?.message || `Gemini trả lỗi ${r.status}`;
      let them = '';
      if (/API key not valid|API_KEY_INVALID/i.test(goc))
        them = '\n\nBa chỗ nên kiểm, theo thứ tự hay gặp:\n' +
               '1. Khoá bị giới hạn theo website (HTTP referrer). Gọi từ máy chủ thì không có ' +
               'referrer nên bị chặn — phải để Application restrictions = None.\n' +
               '2. Khoá thuộc project chưa bật Generative Language API.\n' +
               '3. Khoá dán thiếu ký tự. Tạo khoá mới ở aistudio.google.com/apikey là nhanh nhất.';
      else if (/quota|RESOURCE_EXHAUSTED/i.test(goc))
        them = '\n\nHết hạn mức free của hôm nay. Đợi sang ngày mới hoặc hỏi ít lại.';
      return json({ loi: goc + them, model_da_goi: model }, 502);
    }

    const text = d?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
    if (!text) return json({ loi: d?.candidates?.[0]?.finishReason === 'MAX_TOKENS'
      ? 'Gemini nghĩ hết sạch hạn mức chữ nên không còn chỗ trả lời.'
      : 'Gemini không trả về nội dung', model_da_goi: model }, 502);

    return json({ tra_loi: text, model_da_goi: model });
  } catch (e) {
    if (e.name === 'AbortError') {
      return json({ loi:
        `Gemini không trả lời trong ${HAN_MS / 1000} giây nên tôi cắt.\n\n` +
        `Model đang gọi: "${MODEL_MAC_DINH}". Mở /api/chat?chan_doan=1 để xem Google đang ` +
        `cấp model nào, và khoá có gọi được không.` }, 504);
    }
    return json({ loi: 'Không gọi được Gemini: ' + e.message }, 502);
  }
};
