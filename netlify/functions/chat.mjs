// Cầu nối tới Gemini. Khoá API nằm Ở ĐÂY, phía máy chủ — không bao giờ
// xuống trình duyệt. Đặt biến GEMINI_API_KEY trong Netlify → Environment variables.

// Đổi model không cần sửa code: đặt biến GEMINI_MODEL trên Netlify.
// gemini-3.6-flash  → mặc định. Google đã ngừng cấp gemini-2.5-flash cho
//                     người dùng mới (14/09/2026), chính Google chỉ sang bản này.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const CHI_DAN = `Bạn là trợ lý trong app "Văn Phòng Agent" của một người quản lý bốn mảng việc:
Lab Coach (dạy lab), E-learning (sửa bug khoá học), Kinh doanh (Fitness Tracker), Dinh dưỡng.

Người dùng là SẾP. Một agent khác làm việc dưới máy, sếp chỉ duyệt.

Quy tắc trả lời:
- Tiếng Việt, xưng "tôi", gọi người dùng là "sếp".
- NGẮN. Hai đến bốn câu là đủ. Không gạch đầu dòng trừ khi liệt kê từ 3 mục trở lên.
- CHỈ dựa vào dữ liệu trong BỐI CẢNH. Không có thì nói thẳng là chưa có, đừng bịa.
- Nói số cụ thể khi bối cảnh có số.
- Việc có tin_cay từ 1 đến 2 là việc sếp nên xem kỹ — chủ động nhắc.
- Không chào hỏi dài dòng, vào thẳng câu trả lời.
- Khi sếp hỏi thống kê, đếm từ dữ liệu và nói ra con số, đừng nói chung chung.
- Câu trả lời có thể được ĐỌC TO lên, nên viết như nói: không markdown, không ký hiệu lạ.`;

export default async (req) => {
  const json = (d, s = 200) =>
    new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return json({ loi: 'Chỉ nhận POST' }, 405);

  // .trim() vì dán vào ô web rất hay lẫn dấu cách hoặc ký tự xuống dòng ở cuối
  const KEY = (process.env.GEMINI_API_KEY || '').trim();
  if (!KEY) return json({ loi: 'Máy chủ chưa có GEMINI_API_KEY' }, 500);
  // Google đang phát hành hai định dạng: "AIza..." (cũ, 39 ký tự) và "AQ..." (mới,
  // dài hơn). Nhận cả hai. Chỗ này chỉ để bắt lỗi dán nhầm — đúng sai thật thì
  // để Google trả lời, đừng tự chặn khoá hợp lệ.
  if (!/^(AIza[\w-]{30,}|AQ[\w.-]{20,})$/.test(KEY)) {
    return json({ loi:
      (KEY.startsWith('eyJ')
        ? 'GEMINI_API_KEY đang chứa một khoá JWT — nhiều khả năng dán nhầm khoá Supabase. '
        : `GEMINI_API_KEY không đúng dạng khoá Gemini (dài ${KEY.length} ký tự, ` +
          `bắt đầu bằng "${KEY.slice(0, 4)}"). `) +
      'Khoá Gemini bắt đầu bằng "AIza" hoặc "AQ". ' +
      'Vào aistudio.google.com/apikey lấy khoá rồi dán lại.' }, 500);
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
  // gắn bối cảnh vào lượt hỏi cuối
  const cuoi = contents[contents.length - 1];
  if (cuoi?.role === 'user') {
    cuoi.parts[0].text =
      `BỐI CẢNH HÔM NAY (JSON):\n${JSON.stringify(body.boi_canh ?? {})}\n\nCÂU HỎI: ${cuoi.parts[0].text}`;
  }

  const DIA_CHI = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  // Model Gemini 3 mặc định "nghĩ" ở mức cao, và phần nghĩ ĐẾM CHUNG vào
  // maxOutputTokens — để 600 như cũ thì nghĩ hết sạch, câu trả lời bị cụt giữa chừng.
  // Việc ở đây chỉ là tóm tắt và đếm số, không cần nghĩ sâu: hạ mức nghĩ, nới trần chữ.
  const CAU_HINH = { temperature: 0.4, maxOutputTokens: 2000 };
  if (/^gemini-3/.test(MODEL)) CAU_HINH.thinkingConfig = { thinkingLevel: 'LOW' };

  const THAN = JSON.stringify({
    contents,
    systemInstruction: { parts: [{ text: CHI_DAN }] },
    generationConfig: CAU_HINH,
  });
  // HẠN THỜI GIAN. Trước đây không có: Gemini treo thì hàm treo theo, tới khi cổng
  // Netlify tự cắt và trả về trang "Inactivity Timeout" — sếp nhận được một trang HTML
  // lạ hoắc thay vì câu báo lỗi. Đo 21/09: đúng lỗi này, /api/chat trả 504.
  // Cắt ở 8 giây để còn kịp trả JSON trước khi cổng cắt ở 10 giây.
  const HAN_MS = Number(process.env.GEMINI_TIMEOUT_MS || 8000);
  const goi = (xac_thuc) => {
    const bo = new AbortController();
    const hen = setTimeout(() => bo.abort(), HAN_MS);
    return fetch(DIA_CHI, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...xac_thuc },
      body: THAN,
      signal: bo.signal,
    }).finally(() => clearTimeout(hen));
  };

  // CHẨN ĐOÁN: gọi /api/chat?chan_doan=1 để biết máy chủ đang thấy gì, mà KHÔNG lộ khoá.
  if (new URL(req.url).searchParams.get('chan_doan')) {
    const bo = new AbortController();
    const hen = setTimeout(() => bo.abort(), HAN_MS);
    let ds = null, loiDs = null;
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models',
        { headers: { 'x-goog-api-key': KEY }, signal: bo.signal });
      const d = await r.json();
      ds = r.ok
        ? (d.models || []).map(m => m.name.replace('models/', '')).filter(n => /flash|pro/.test(n)).slice(0, 12)
        : null;
      if (!r.ok) loiDs = d?.error?.message || `HTTP ${r.status}`;
    } catch (e) { loiDs = e.name === 'AbortError' ? `quá ${HAN_MS}ms không trả lời` : e.message; }
    finally { clearTimeout(hen); }
    return json({
      model_dang_dung: MODEL,
      khoa: { co: true, dai: KEY.length, bat_dau: KEY.slice(0, 4) },
      han_thoi_gian_ms: HAN_MS,
      goi_duoc_google: ds !== null,
      model_google_dang_cap: ds,
      loi_khi_hoi_google: loiDs,
    });
  }

  try {
    let r = await goi({ 'x-goog-api-key': KEY });
    // Khoá "AQ..." là loại xác thực mới. Tài liệu Google vẫn bảo gửi qua
    // x-goog-api-key nên thử cách chuẩn trước; bị chặn thì thử lại kiểu Bearer.
    if ((r.status === 401 || r.status === 403) && KEY.startsWith('AQ'))
      r = await goi({ Authorization: `Bearer ${KEY}` });

    const d = await r.json();
    if (!r.ok) {
      const goc = d?.error?.message || `Gemini trả lỗi ${r.status}`;
      let them = '';
      if (/API key not valid|API_KEY_INVALID/i.test(goc))
        them = '\n\nBa chỗ nên kiểm tra, theo thứ tự hay gặp:\n' +
               '1. Khoá bị giới hạn theo website (HTTP referrer). Gọi từ máy chủ thì không có ' +
               'referrer nên bị chặn — phải để Application restrictions = None.\n' +
               '2. Khoá thuộc project chưa bật Generative Language API.\n' +
               '3. Khoá dán thiếu ký tự. Tạo khoá mới ở aistudio.google.com/apikey là nhanh nhất.';
      else if (/quota|RESOURCE_EXHAUSTED/i.test(goc))
        them = '\n\nHết hạn mức free của hôm nay. Đợi sang ngày mới hoặc đổi sang model nhẹ hơn.';
      else if (/not found|NOT_FOUND/i.test(goc))
        them = `\n\nModel "${MODEL}" không tồn tại. Sửa biến GEMINI_MODEL trên Netlify.`;
      return json({ loi: goc + them }, 502);
    }
    const text = d?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
    if (!text) return json({ loi: d?.candidates?.[0]?.finishReason === 'MAX_TOKENS'
      ? 'Gemini nghĩ hết sạch hạn mức chữ nên không còn chỗ trả lời. Nới maxOutputTokens hoặc hạ thinkingLevel trong chat.mjs.'
      : 'Gemini không trả về nội dung' }, 502);
    return json({ tra_loi: text });
  } catch (e) {
    if (e.name === 'AbortError') {
      return json({ loi:
        `Gemini không trả lời trong ${HAN_MS / 1000} giây nên tôi cắt.\n\n` +
        `Model đang gọi: "${MODEL}". Hai chỗ hay gặp:\n` +
        `1. Tên model sai hoặc đã ngừng phục vụ — mở /api/chat?chan_doan=1 để xem Google ` +
        `đang cấp những model nào, rồi sửa biến GEMINI_MODEL trên Netlify.\n` +
        `2. Câu hỏi quá dài nên model nghĩ lâu. Hỏi ngắn lại thử xem.` }, 504);
    }
    return json({ loi: 'Không gọi được Gemini: ' + e.message }, 502);
  }
};
