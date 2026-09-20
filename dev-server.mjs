// Máy chủ thử tại chỗ — KHÔNG tốn credit Netlify.
//
//   node dev-server.mjs
//
// Mở trên Mac:      http://localhost:8888
// Mở trên iPhone:   http://<IP-Mac>:8888   (cùng Wi-Fi, địa chỉ in ra lúc chạy)
//
// Phục vụ đúng như Netlify: tĩnh từ site/, còn /api/chat gọi thẳng
// netlify/functions/chat.mjs. Không cần cài gì, không cần netlify-cli.
//
// Lưu ý: iPhone qua http:// (không phải https) thì phần NÓI
// (webkitSpeechRecognition) sẽ không chạy — Safari chặn ngoài ngữ cảnh bảo mật.
// Phần ĐỌC TO vẫn chạy. Muốn thử giọng nói đầy đủ thì đẩy nhánh dev lên
// Netlify rồi mở bản preview https (xem TIEN-DO.md).

import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = fileURLToPath(new URL('.', import.meta.url));
const CONG = Number(process.env.PORT) || 8888;

// Khoá Gemini: để trong .env ở gốc dự án (.gitignore đã chặn file này).
try { process.loadEnvFile(join(GOC, '.env')); } catch { /* chưa có thì thôi */ }

// Sinh site/cau-hinh.js từ agent/.env để app nối được Supabase khi thử tại chỗ.
try { execFileSync('node', [join(GOC, 'tao-cau-hinh.mjs')], { stdio: 'ignore' }); } catch { /* thiếu khoá thì app chạy dữ liệu mẫu */ }

// Bản đồ đường dẫn, khớp [[redirects]] trong netlify.toml
const HAM = { '/api/chat': './netlify/functions/chat.mjs' };
// /xem/* là tiền tố, không phải đường dẫn cố định — khớp riêng.
const HAM_TIEN_TO = [['/xem/', './netlify/functions/xem.mjs']];

const KIEU = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // iOS cache web app rất dai — ép tải mới mỗi lần cho khỏi thử nhầm bản cũ
  res.setHeader('Cache-Control', 'no-store');

  const ham = HAM[url.pathname]
    ?? HAM_TIEN_TO.find(([t]) => url.pathname.startsWith(t))?.[1];
  if (ham) {
    try {
      const { default: xuLy } = await import(new URL(ham, import.meta.url));
      const than = ['GET', 'HEAD'].includes(req.method) ? undefined : req;
      const kq = await xuLy(
        new Request(url, { method: req.method, headers: req.headers, body: than, duplex: 'half' }),
        {}
      );
      res.writeHead(kq.status, Object.fromEntries(kq.headers));
      res.end(Buffer.from(await kq.arrayBuffer()));
    } catch (e) {
      console.error('Lỗi hàm', url.pathname, e);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ loi: 'Hàm lỗi: ' + e.message }));
    }
    return;
  }

  // tĩnh, chặn đi ngược ra ngoài site/
  const duong = normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
  let tep = join(GOC, 'site', duong === '/' ? 'index.html' : duong);
  try {
    let noi_dung;
    try { noi_dung = await readFile(tep); }
    catch { tep = join(GOC, 'site', 'index.html'); noi_dung = await readFile(tep); } // SPA
    res.writeHead(200, { 'Content-Type': KIEU[extname(tep)] || 'application/octet-stream' });
    res.end(noi_dung);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Không có trang này');
  }
}).listen(CONG, '0.0.0.0', () => {
  const lan = Object.values(networkInterfaces()).flat()
    .find((m) => m && m.family === 'IPv4' && !m.internal)?.address;
  console.log(`\n  Văn Phòng Agent — bản thử tại chỗ (0 credit)\n`);
  console.log(`  Mac     http://localhost:${CONG}`);
  if (lan) console.log(`  iPhone  http://${lan}:${CONG}   (cùng Wi-Fi)`);
  console.log(`\n  Ctrl+C để dừng.\n`);
});
