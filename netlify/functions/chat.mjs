// Cầu nối tới Gemini. Khoá API nằm Ở ĐÂY, phía máy chủ — không bao giờ
// xuống trình duyệt. Đặt biến GEMINI_API_KEY trong Netlify → Environment variables.

// Đổi model không cần sửa code: đặt biến GEMINI_MODEL trên Netlify.
// gemini-2.5-flash  → mặc định, hạn mức free rộng, đủ cho việc tóm tắt/thống kê
// gemini-2.5-pro    → thông minh hơn nhưng hạn mức free rất thấp
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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
  if (!/^AIza[\w-]{30,}$/.test(KEY)) {
    return json({ loi:
      `Khoá trên Netlify không đúng dạng khoá Gemini (dài ${KEY.length} ký tự, ` +
      `bắt đầu bằng "${KEY.slice(0, 4)}"). Khoá đúng bắt đầu bằng AIza và dài khoảng 39 ký tự. ` +
      `Vào aistudio.google.com/apikey tạo khoá mới rồi dán lại.` }, 500);
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

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: CHI_DAN }] },
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
        }),
      }
    );

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
    if (!text) return json({ loi: 'Gemini không trả về nội dung' }, 502);
    return json({ tra_loi: text });
  } catch (e) {
    return json({ loi: 'Không gọi được Gemini: ' + e.message }, 502);
  }
};
