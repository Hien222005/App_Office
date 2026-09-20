// CẦU XEM BẢN NHÁP — lấy file từ Supabase Storage, trả về với đúng kiểu nội dung.
//
//   https://<app>.netlify.app/xem/<mã-phòng>/<đường dẫn file>
//
// VÌ SAO PHẢI CÓ HÀM NÀY: Supabase Storage cố tình trả MỌI file HTML thành
// `text/plain` kèm `x-content-type-options: nosniff`, để không ai biến domain của
// họ thành chỗ chứa trang web. Mở link Storage trần thì thấy mã nguồn, không thấy
// trang. Đo ngày 20/09/2026: HTTP 200 nhưng `content-type: text/plain`.
//
// Hàm này đọc file từ Storage rồi trả lại với kiểu đúng. Đường dẫn giữ nguyên nên
// link tương đối trong trang (shared/core.css, ảnh) vẫn trỏ về đúng hàm này.
//
// Bucket `xem-thu` để công khai; mã phòng là chuỗi ngẫu nhiên khó đoán, không phải khoá.

const BUCKET = 'xem-thu';

const KIỂU = {
  html: 'text/html; charset=utf-8',   css: 'text/css; charset=utf-8',
  js:   'text/javascript; charset=utf-8', json: 'application/json; charset=utf-8',
  md:   'text/plain; charset=utf-8',  svg: 'image/svg+xml',
  png:  'image/png',  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif:  'image/gif',  webp: 'image/webp', woff2: 'font/woff2', woff: 'font/woff',
};

export default async (req) => {
  const gốc = process.env.SUPABASE_URL;
  if (!gốc) return new Response('Thiếu SUPABASE_URL', { status: 500 });

  // /xem/<mã>/<đường dẫn…>  →  <mã>/<đường dẫn…>
  const đường = decodeURIComponent(new URL(req.url).pathname).replace(/^\/xem\/?/, '');
  if (!đường) return new Response('Thiếu đường dẫn', { status: 400 });
  // Chặn đi ngược lên trên bucket.
  if (đường.split('/').includes('..')) return new Response('Đường dẫn không hợp lệ', { status: 400 });

  const trong = đường.split('/').map(encodeURIComponent).join('/');
  const r = await fetch(`${gốc}/storage/v1/object/public/${BUCKET}/${trong}`);
  if (!r.ok) {
    return new Response(
      `Không thấy bản xem thử này (${r.status}).\n\n` +
      `Có thể việc đã được ghi vào file gốc và bản nháp đã dọn.`,
      // Storage trả 400 cho object không có; đổi thành 404 cho đúng nghĩa.
      { status: r.status === 400 ? 404 : r.status,
        headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  const đuôi = (đường.split('.').pop() ?? '').toLowerCase();
  return new Response(r.body, {
    status: 200,
    headers: {
      'content-type': KIỂU[đuôi] ?? 'application/octet-stream',
      // Bản nháp đổi liên tục trong ngày: đừng để trình duyệt giữ bản cũ.
      'cache-control': 'no-cache, must-revalidate',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
};

export const config = { path: '/xem/*' };
