// MÁY CHỦ XEM THỬ BẢN NHÁP — nguồn của "link sản phẩm".
//
//   node agent/xem-thu.mjs
//
// Mở trên iPhone (cùng Wi-Fi):  http://<IP-Mac>:8890/nhap/<id-việc>/<đường dẫn trong bản nháp>
// Ví dụ:  http://192.168.1.12:8890/nhap/t-0147/courses/Test_Module%204_Coding/module-04/02_html/unit-8-quiz.html
//
// Chỉ phục vụ trong agent-app/_nhap. Không phục vụ thư mục thật, không ghi gì.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readdirSync, existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, relative, sep } from 'node:path';
import { THƯ_MỤC_NHÁP } from './phong.mjs';

const CỔNG = Number(process.env.PORT) || 8890;
const KIỂU = {
  '.html': 'text/html; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
};

const trang = (tiêuĐề, thân) => `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${tiêuĐề}</title><style>body{font:16px/1.6 -apple-system,sans-serif;margin:0;padding:20px;
background:#0C111C;color:#E9EFF8}a{color:#5BC8FF;display:block;padding:9px 0;border-bottom:1px solid #242E3F;
text-decoration:none;word-break:break-all}h1{font-size:19px}</style><h1>${tiêuĐề}</h1>${thân}`;

createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');   // iOS cache rất dai
  const url = new URL(req.url, `http://${req.headers.host}`);
  const đường = decodeURIComponent(normalize(url.pathname));

  if (đường === '/' || đường === '/nhap' || đường === '/nhap/') {
    const ds = existsSync(THƯ_MỤC_NHÁP)
      ? readdirSync(THƯ_MỤC_NHÁP, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name) : [];
    return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      .end(trang('Bản nháp đang mở', ds.length
        ? ds.map(x => `<a href="/nhap/${encodeURIComponent(x)}/">${x}</a>`).join('')
        : '<p>Chưa có bản nháp nào. Chạy <code>node agent/ban-nhap.mjs mo &lt;brief.json&gt;</code>.</p>'));
  }

  const m = đường.match(/^\/nhap\/([^/]+)(\/.*)?$/);
  if (!m) return res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Chỉ phục vụ /nhap/<id-việc>/...');

  const gốcNháp = join(THƯ_MỤC_NHÁP, m[1], 'nhap');
  const tệp = join(gốcNháp, m[2] ?? '');
  // Chặn đi ngược ra ngoài bản nháp.
  if (relative(gốcNháp, tệp).split(sep)[0] === '..') {
    return res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Ngoài bản nháp');
  }
  try {
    const st = await stat(tệp);
    if (st.isDirectory()) {
      const ds = readdirSync(tệp, { withFileTypes: true })
        .filter(e => e.name !== '.DS_Store')
        .map(e => `<a href="${encodeURI(e.name)}${e.isDirectory() ? '/' : ''}">${e.name}${e.isDirectory() ? '/' : ''}</a>`);
      return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        .end(trang(m[1] + (m[2] ?? '/'), `<a href="../">..</a>` + ds.join('')));
    }
    res.writeHead(200, { 'Content-Type': KIỂU[extname(tệp).toLowerCase()] || 'application/octet-stream' });
    res.end(await readFile(tệp));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Không có file này trong bản nháp');
  }
}).listen(CỔNG, '0.0.0.0', () => {
  const lan = Object.values(networkInterfaces()).flat()
    .find(m => m && m.family === 'IPv4' && !m.internal)?.address;
  console.log(`\n  Xem thử bản nháp (không tốn credit, không ghi gì)\n`);
  console.log(`  Mac     http://localhost:${CỔNG}/nhap/`);
  if (lan) console.log(`  iPhone  http://${lan}:${CỔNG}/nhap/   (cùng Wi-Fi)`);
  console.log(`\n  Ctrl+C để dừng.\n`);
});
