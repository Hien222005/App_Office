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

const MODEL_MAC_DINH = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GOC = 'https://generativelanguage.googleapis.com/v1beta';

const CHI_DAN = `Bạn là trợ lý trong app "Văn Phòng Agent" của một người quản lý bốn mảng việc:
Thạc sĩ (bài vở cao học), Lab Coach (dạy lab), Kinh doanh (Fitness Tracker), Dinh dưỡng.
Mảng E-learning đang tạm dừng.

Người dùng là SẾP. Một agent khác làm việc dưới máy, sếp chỉ duyệt.

Quy tắc trả lời:
- Tiếng Việt, xưng "tôi", gọi người dùng là "sếp".
- NGẮN. Hai đến bốn câu là đủ. Không gạch đầu dòng trừ khi liệt kê từ 3 mục trở lên.
- CHỈ dựa vào dữ liệu trong BỐI CẢNH. Không có thì nói thẳng là chưa có, đừng bịa.
- Nói số cụ thể khi bối cảnh có số.
- Không chào hỏi dài dòng, vào thẳng câu trả lời.
- Khi sếp hỏi thống kê, đếm từ dữ liệu và nói ra con số, đừng nói chung chung.
- Câu trả lời có thể được ĐỌC TO lên, nên viết như nói: không markdown, không ký hiệu lạ.`;

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
const chonModel = (ds) =>
  ds.find((n) => /flash/.test(n) && !/lite|preview|exp/.test(n)) ||
  ds.find((n) => /flash/.test(n)) ||
  ds.find((n) => /pro/.test(n)) ||
  ds[0] || null;

export default async (req) => {
  const KEY = (process.env.GEMINI_API_KEY || '').trim();   // .trim(): dán vào ô web hay lẫn dấu cách
  const HAN_MS = Number(process.env.GEMINI_TIMEOUT_MS || 8000);

  // ── CHẨN ĐOÁN ──────────────────────────────────────────────────────────
  // Đặt TRƯỚC cổng chặn GET, để mở thẳng bằng trình duyệt là xem được.
  if (new URL(req.url).searchParams.get('chan_doan')) {
    if (!KEY) return json({ loi: 'Máy chủ chưa có GEMINI_API_KEY' }, 500);
    let ds = null, loiDs = null;
    try { ds = await hoiDanhSachModel(KEY, HAN_MS); }
    catch (e) { loiDs = e.name === 'AbortError' ? `quá ${HAN_MS}ms Google không trả lời` : e.message; }
    return json({
      model_dang_dat: MODEL_MAC_DINH,
      model_nay_con_song: ds ? ds.includes(MODEL_MAC_DINH) : null,
      model_se_tu_doi_sang: ds && !ds.includes(MODEL_MAC_DINH) ? chonModel(ds) : null,
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
    let model = MODEL_MAC_DINH;
    let { r, d } = await goi(model);

    // Model chết thì TỰ ĐỔI, đừng bắt sếp vào Netlify sửa biến môi trường.
    if (!r.ok && /not found|NOT_FOUND|is not supported/i.test(d?.error?.message || '')) {
      const ds = await hoiDanhSachModel(KEY, HAN_MS);
      const thay = chonModel(ds.filter((n) => n !== model));
      if (!thay) return json({ loi: `Model "${model}" không còn, mà Google cũng không cấp model nào khác dùng được.` }, 502);
      model = thay;
      ({ r, d } = await goi(model));
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
