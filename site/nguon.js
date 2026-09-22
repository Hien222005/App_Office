/* NGUỒN DỮ LIỆU — app đọc ghi Supabase, hoặc chạy dữ liệu mẫu nếu chưa đăng nhập.
 *
 * Ba chế độ, app luôn nói rõ đang ở chế độ nào:
 *   'mau'      — chưa có cấu hình, hoặc chưa đăng nhập → dùng dữ liệu mẫu trong bộ nhớ
 *   'chua-doi' — đã đăng nhập nhưng database chưa chạy doi-2-workflow.sql (thiếu cột mới)
 *   'that'     — đọc ghi thật
 *
 * Khoá anon là khoá công khai; RLS trong Supabase chỉ cho email chủ nhân đọc ghi.
 */
(() => {
  const C = window.CAU_HINH || {};
  const KHOA_PHIEN = 'vp_phien';
  const NG = {
    cheDo: C.url && C.anon ? 'chua-dang-nhap' : 'mau',
    loi: null,
    email: null,
  };

  const phiên = () => { try { return JSON.parse(localStorage.getItem(KHOA_PHIEN) || 'null'); } catch { return null; } };
  const lưuPhiên = (p) => { try { localStorage.setItem(KHOA_PHIEN, JSON.stringify(p)); } catch {} };
  const xoáPhiên = () => { try { localStorage.removeItem(KHOA_PHIEN); } catch {} };

  async function gọi(đường, opt = {}, thửLại = true) {
    const p = phiên();
    const r = await fetch(`${C.url}${đường}`, {
      ...opt,
      headers: {
        apikey: C.anon,
        Authorization: `Bearer ${p?.access_token || C.anon}`,
        'Content-Type': 'application/json',
        ...opt.headers,
      },
    });
    // Hết hạn thẻ vào cửa thì xin thẻ mới bằng refresh_token rồi gọi lại một lần.
    if (r.status === 401 && p?.refresh_token && thửLại) {
      const ok = await làmMớiPhiên(p.refresh_token);
      if (ok) return gọi(đường, opt, false);
    }
    const text = await r.text();
    if (!r.ok) {
      const e = new Error(text.slice(0, 300));
      e.status = r.status;
      try { e.chiTiet = JSON.parse(text); } catch {}
      throw e;
    }
    return text ? JSON.parse(text) : null;
  }

  // `xoáNếuHỏng`: chỉ ĐÚNG khi đây là phiên đang lưu và nó đã chết — xoá cho sạch.
  // Khi chuỗi refresh do NGƯỜI GÕ VÀO (mã chuyển) thì tuyệt đối KHÔNG xoá: gõ nhầm một
  // chữ mà bị đăng xuất khỏi phiên đang dùng tốt là mất dữ liệu của người ta.
  // Nhiều yêu cầu cùng gặp 401 (tai() gửi bốn cái một lúc) → chỉ xin thẻ MỘT lần, các cái
  // kia chờ chung. Supabase thu hồi refresh_token sau lần dùng đầu; xin lần hai bằng chính
  // token đó sẽ hỏng, và nhánh xoáNếuHỏng sẽ đăng xuất sếp oan.
  const đangXin = new Map();
  function làmMớiPhiên(refresh, xoáNếuHỏng = true) {
    if (!đangXin.has(refresh)) {
      đangXin.set(refresh, xinThẻ(refresh, xoáNếuHỏng).finally(() => đangXin.delete(refresh)));
    }
    return đangXin.get(refresh);
  }
  async function xinThẻ(refresh, xoáNếuHỏng) {
    try {
      const r = await fetch(`${C.url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { apikey: C.anon, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!r.ok) { if (xoáNếuHỏng) xoáPhiên(); return false; }
      const d = await r.json();
      lưuPhiên(d);
      return true;
    } catch { return false; }
  }

  /* ── đăng nhập bằng magic link ────────────────────────────────────────── */
  NG.guiLink = async (email) => {
    // Nói rõ muốn quay về đúng trang đang mở. Không có tham số này thì Supabase
    // dùng Site URL trong dashboard, và link trong email sẽ nhảy sai chỗ.
    const về = encodeURIComponent(location.origin + location.pathname);
    await fetch(`${C.url}/auth/v1/otp?redirect_to=${về}`, {
      method: 'POST',
      headers: { apikey: C.anon, 'Content-Type': 'application/json' },
      // create_user: true để lần đăng nhập đầu tạo luôn người dùng.
      // An toàn không đổi: RLS chỉ cho đúng email chủ nhân đọc ghi, email khác vào cũng thấy trống.
      body: JSON.stringify({ email, create_user: true, gotrue_meta_security: {} }),
    }).then(async (r) => { if (!r.ok) throw new Error((await r.text()).slice(0, 200)); });
  };

  /* Xác nhận bằng MÃ 6 SỐ trong email, không qua link.
   *
   * VÌ SAO CẦN: iOS cho app "Thêm vào màn hình chính" một KHO LƯU TRỮ RIÊNG, tách hẳn
   * Safari. Phiên đăng nhập bên Safari không sang được. Mà magic link thì LUÔN mở bằng
   * Safari — nên đăng nhập bằng link thì không đời nào vào được app ngoài màn hình chính.
   *
   * Mã 6 số gõ thẳng trong app, không rời app lần nào, nên kho nào cũng vào được.
   */
  /* Nhận CẢ HAI: link chép từ email, hoặc mã 6 số.
   *
   * Gói Supabase Free KHÔNG cho sửa mẫu email (phải gắn SMTP riêng mới mở khoá), nên
   * mẫu mặc định chỉ có link, không in mã 6 số ra. Nhưng chính cái link đó đã mang sẵn
   * token — chép link dán vào đây là đủ, không phải đụng gì tới dashboard.
   *
   * Link có dạng:
   *   https://<project>.supabase.co/auth/v1/verify?token=<hash>&type=magiclink&redirect_to=…
   * Bản GoTrue mới đặt tên tham số là `token_hash`. Đọc cả hai tên.
   */
  NG.xacNhanVao = async (email, thô) => {
    const v = String(thô || '').trim();
    if (!v) throw new Error('Chưa dán gì vào ô này');

    // 1 · mã chuyển phiên từ Safari — đổi thẳng ra phiên mới
    if (v.startsWith('VP1.')) {
      const ok = await làmMớiPhiên(v.slice(4).trim(), false);   // gõ nhầm KHÔNG được đăng xuất
      if (!ok) throw new Error('Mã chuyển không còn dùng được. Sang Safari bấm "Lấy mã mới" rồi chép lại.');
      return true;
    }

    // 2 · sếp dán nhầm địa chỉ Safari hiện ra SAU khi link đã hỏng — nói thẳng ra
    if (/[#?&]error(_code)?=/.test(v)) {
      const m = v.match(/error_code=([a-z_]+)/);
      throw new Error(m?.[1] === 'otp_expired'
        ? 'Đây là màn hình lỗi, không phải link đăng nhập. Link email đã bị Gmail bấm thử trước — dùng MÃ CHUYỂN từ Safari.'
        : 'Đây là địa chỉ báo lỗi, không phải link đăng nhập.');
    }

    let thân;
    if (/^\d{4,8}$/.test(v)) {
      // mã số — cần email đi kèm để Supabase biết hỏi ai
      if (!email) throw new Error('Gõ email vào ô trên trước');
      thân = { email, token: v, type: 'email' };
    } else {
      let q;
      try { q = new URL(v).searchParams; }
      catch { throw new Error('Không đọc được. Dán mã chuyển lấy từ Safari (bắt đầu bằng VP1.).'); }
      const hash = q.get('token_hash') || q.get('token');
      if (!hash) throw new Error('Link này không có token. Chép lại link "Sign in" trong email.');
      // type trong link: magiclink · email · signup · recovery
      thân = { token_hash: hash, type: q.get('type') || 'magiclink' };
    }

    const r = await fetch(`${C.url}/auth/v1/verify`, {
      method: 'POST',
      headers: { apikey: C.anon, 'Content-Type': 'application/json' },
      body: JSON.stringify(thân),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.access_token) {
      const l = d.error_description || d.msg || d.message || '';
      throw new Error(/expired|invalid/i.test(l)
        ? 'Link hoặc mã đã dùng rồi hoặc hết hạn. Bấm "Gửi link mới" rồi chép link mới nhất.'
        : (l || 'Không vào được'));
    }
    lưuPhiên(d);
    return true;
  };

  // Link trong email trả token về ở phần sau dấu # của địa chỉ.
  NG.batTokenTuLink = () => {
    const h = location.hash.slice(1);
    if (!h.includes('access_token')) return false;
    const q = new URLSearchParams(h);
    lưuPhiên({ access_token: q.get('access_token'), refresh_token: q.get('refresh_token') });
    history.replaceState(null, '', location.pathname);
    return true;
  };

  /* MÃ CHUYỂN PHIÊN — đường vào chắc chắn nhất cho app ngoài màn hình chính.
   *
   * Vì sao không dùng link email nữa: Gmail TỰ QUÉT và bấm thử link trong thư, nên
   * token một-lần bị đốt trước khi sếp chạm vào. Bấm lần nào cũng ra otp_expired.
   * Đo được trên máy sếp 21/09.
   *
   * Safari đã đăng nhập rồi thì trong đó có sẵn refresh_token — thứ đổi được ra phiên
   * mới bất cứ lúc nào. Chép chuỗi đó sang app là xong, không qua email lần nào.
   * Tiền tố VP1. để phân biệt dứt khoát với link và với mã số.
   */
  NG.maChuyen = () => {
    const p = phiên();
    if (!p?.refresh_token) return null;
    return 'VP1.' + p.refresh_token;
  };

  NG.dangXuat = () => { xoáPhiên(); NG.cheDo = C.url && C.anon ? 'chua-dang-nhap' : 'mau'; };
  NG.daDangNhap = () => !!phiên()?.access_token;

  /* ── đọc ── */
  const COT_MOI = ['han_chot', 'brief', 'link_san_pham', 'cac_buoc', 'so_lan_lam_lai'];

  NG.tai = async () => {
    if (!C.url || !C.anon) { NG.cheDo = 'mau'; return null; }
    if (!NG.daDangNhap()) { NG.cheDo = 'chua-dang-nhap'; return null; }
    // Bốn yêu cầu gửi CÙNG LÚC, không nối đuôi nhau: trước đây mỗi yêu cầu chờ cái trước
    // xong, mở app mất bốn vòng mạng (~3 giây trên 4G). Nay chỉ còn một vòng.
    const [ai, việcR, hỏiR, khR] = await Promise.allSettled([
      gọi('/auth/v1/user'),
      gọi(`/rest/v1/tasks?select=*&order=ngay.asc,thu_tu.asc`),
      gọi(`/rest/v1/questions?select=*&order=tao_luc.desc&limit=20`),
      gọi('/rest/v1/ke_hoach?select=*&order=thu.asc,thu_tu.asc,tao_luc.asc'),
    ]);
    NG.email = ai.status === 'fulfilled' ? ai.value?.email ?? null : null;

    // Thử đọc kèm cột mới. Thiếu cột nghĩa là chưa chạy doi-2-workflow.sql.
    try {
      if (việcR.status === 'rejected') throw việcR.reason;
      if (hỏiR.status === 'rejected') throw hỏiR.reason;
      const việc = việcR.value, hỏi = hỏiR.value;
      const thiếu = việc.length ? COT_MOI.filter((c) => !(c in việc[0])) : [];
      if (thiếu.length) { NG.cheDo = 'chua-doi'; NG.loi = `Database còn thiếu cột: ${thiếu.join(', ')}`; return null; }
      NG.cheDo = 'that';
      NG.loi = null;
      return { viec: việc.map(doiSangApp), hoi: hỏi.filter((h) => !h.tra_loi).map(doiHoi)[0] ?? null,
               // Kế hoạch hỏng thì để null — index.html tải lại riêng, việc vẫn phải hiện.
               kehoach: khR.status === 'fulfilled' ? khR.value : null };
    } catch (e) {
      NG.cheDo = 'chua-doi';
      NG.loi = e.chiTiet?.message || e.message || 'không đọc được dữ liệu';
      return null;
    }
  };

  const gioNgan = (s) => (s ? new Date(s).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '');

  function doiSangApp(t) {
    return {
      id: t.id, mang: t.mang, ngay: t.ngay, tieu_de: t.tieu_de,
      chi_tiet: t.chi_tiet || '',
      tt: t.trang_thai, phan_hoi: t.phan_hoi_cua_toi || '',
      ket: t.ghi_chu_agent || '',            // kỳ vọng kết quả — thứ duy nhất agent tự khai
      link: t.link_san_pham || '',
      files: Array.isArray(t.file_da_doi) ? t.file_da_doi : [],   // máy lấy từ bản nháp
      han: t.han_chot ? gioNgan(t.han_chot) : 'chưa có hạn',
      hanISO: t.han_chot || null,
      tre: !!t.han_chot && new Date(t.han_chot) < new Date() && !['da_ghi', 'bo'].includes(t.trang_thai),
      lan: t.so_lan_lam_lai || 0,
      brief: t.brief || null,
      nk: Array.isArray(t.cac_buoc) ? t.cac_buoc : [],
    };
  }
  const doiHoi = (h) => ({ id: h.id, task_id: h.task_id, cau_hoi: h.cau_hoi, pa: h.phuong_an || [], tl: h.tra_loi ?? null, tuGo: '' });

  /* ── ghi · chỉ những nhãn của sếp ─────────────────────────────────────── */
  const NHAN_SEP = ['da_chot', 'bo', 'da_duyet'];

  NG.doiNhan = async (id, nhãn, thêm = {}) => {
    if (!NHAN_SEP.includes(nhãn)) throw new Error(`Nhãn "${nhãn}" không phải của sếp`);
    return gọi(`/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ trang_thai: nhãn, cap_nhat_luc: new Date().toISOString(), ...thêm }),
    });
  };

  NG.traLoi = async (idHỏi, trảLời, tựGõ) => gọi(`/rest/v1/questions?id=eq.${encodeURIComponent(idHỏi)}`, {
    method: 'PATCH',
    body: JSON.stringify({ tra_loi: trảLời, tra_loi_tu_go: !!tựGõ, tra_loi_luc: new Date().toISOString() }),
  });

  // Chốt ngày: đánh dấu mọi việc đã duyệt là chờ ghi — phần ghi vào file gốc do lệnh `chot` trên Mac làm.
  NG.chotNgay = async (ids) => Promise.all(ids.map((id) => NG.doiNhan(id, 'da_duyet')));

  /* ── KẾ HOẠCH TUẦN ────────────────────────────────────────────────────────
   * Bảng sếp tự ghi. `/report` mỗi sáng đọc nó rồi lập phiếu việc, thay cho việc
   * agent tự đọc nguồn từng phòng rồi tự nghĩ ra việc.
   *
   * `tuan` để trống = LẶP MỌI TUẦN. Đây là cột đáng giá nhất của bảng: việc lặp theo
   * ngày thì ghi một lần, tuần nào cũng tự lên bảng — đúng thứ sếp cần nhất.
   */
  NG.taiKeHoach = async () => {
    if (NG.cheDo !== 'that') return [];
    return gọi('/rest/v1/ke_hoach?select=*&order=thu.asc,thu_tu.asc,tao_luc.asc');
  };

  NG.themKeHoach = async (k) => {
    const id = 'k-' + Date.now().toString(36);
    const [ra] = await gọi('/rest/v1/ke_hoach', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ id, bat: true, ...k }),
    });
    return ra;
  };

  NG.suaKeHoach = async (id, vá) => gọi(`/rest/v1/ke_hoach?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(vá),
  });

  NG.xoaKeHoach = async (id) => gọi(`/rest/v1/ke_hoach?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });

  /* ── TỰ CẬP NHẬT · Supabase Realtime ─────────────────────────────────────
   * Trước đây app chỉ tải lúc mở và lúc bấm nút Cập nhật, nên Mac nộp bài xong mà điện
   * thoại vẫn hiện bảng cũ. Database đã bật Realtime cho tasks, questions, ke_hoach
   * (schema.sql) — nay app nghe thẳng, có thay đổi thì gọi `khiĐổi()`.
   *
   * Đi thẳng WebSocket theo giao thức Phoenix của Realtime, không thêm thư viện: cùng
   * cách nguon.js vốn gọi REST trần. Gửi kèm access_token nên RLS vẫn áp — chỉ chủ nhân
   * nhận được sự kiện.
   *
   * iOS cắt socket khi app vào nền. Nên: ẩn app thì tự đóng, hiện lại thì nối lại —
   * phần thay đổi lỡ mất lúc ẩn do index.html tải lại một lần khi app hiện lên.
   */
  const BẢNG_NGHE = ['tasks', 'questions', 'ke_hoach'];
  const CHỦ_ĐỀ = 'realtime:van-phong';
  const nghe = { ws: null, khiĐổi: null, nhịp: null, hẹnNối: null, hẹnThẻ: null, chờ: null, lầnLỗi: 0, ref: 0, tắt: true, lượt: 0 };

  const hạnThẻ = (jwt) => {
    try { return JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000; }
    catch { return 0; }
  };

  // Thẻ còn dưới 1 phút thì xin thẻ mới trước khi nối — Realtime từ chối thẻ hết hạn.
  async function thẻCònHạn() {
    const p = phiên();
    if (!p?.access_token) return null;
    if (hạnThẻ(p.access_token) - Date.now() > 60e3) return p.access_token;
    if (!p.refresh_token || !(await làmMớiPhiên(p.refresh_token))) return null;
    return phiên()?.access_token ?? null;
  }

  const gửi = (topic, event, payload) => {
    if (nghe.ws?.readyState !== 1) return;
    const ref = String(++nghe.ref);
    nghe.ws.send(JSON.stringify({ topic, event, payload, ref, join_ref: topic === CHỦ_ĐỀ ? '1' : undefined }));
  };

  function dọn() {
    clearInterval(nghe.nhịp); clearTimeout(nghe.hẹnNối); clearTimeout(nghe.hẹnThẻ);
    nghe.nhịp = nghe.hẹnNối = nghe.hẹnThẻ = null;
    if (nghe.ws) { nghe.ws.onclose = null; try { nghe.ws.close(); } catch {} nghe.ws = null; }
  }

  // Nhiều dòng đổi liền nhau (xong = đổi nhãn + ghi link + ghi nhật ký) → gộp thành một lần tải.
  const báoĐổi = () => { clearTimeout(nghe.chờ); nghe.chờ = setTimeout(() => nghe.khiĐổi?.(), 400); };

  async function nối() {
    dọn();
    if (nghe.tắt || !C.url || !C.anon) return;
    // Hai lần nối chồng nhau (đang chờ xin thẻ thì bị gọi lại) → chỉ lần mới nhất được mở socket.
    const lượt = ++nghe.lượt;
    nghe.đangNối = true;
    const thẻ = await thẻCònHạn().finally(() => { if (lượt === nghe.lượt) nghe.đangNối = false; });
    if (!thẻ || nghe.tắt || lượt !== nghe.lượt) return;

    const ws = new WebSocket(`${C.url.replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${C.anon}&vsn=1.0.0`);
    nghe.ws = ws;
    ws.onopen = () => {
      gửi(CHỦ_ĐỀ, 'phx_join', {
        config: {
          broadcast: { self: false }, presence: { key: '' },
          postgres_changes: BẢNG_NGHE.map((table) => ({ event: '*', schema: 'public', table })),
        },
        access_token: thẻ,
      });
      nghe.nhịp = setInterval(() => gửi('phoenix', 'heartbeat', {}), 25e3);
      // Đổi thẻ cho kênh trước khi thẻ hết hạn, khỏi phải cắt nối lại.
      nghe.hẹnThẻ = setTimeout(async () => {
        const mới = await thẻCònHạn();
        if (mới) gửi(CHỦ_ĐỀ, 'access_token', { access_token: mới });
      }, Math.max(30e3, hạnThẻ(thẻ) - Date.now() - 120e3));
    };
    ws.onmessage = (e) => {
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (m.topic !== CHỦ_ĐỀ) return;
      if (m.event === 'phx_reply' && m.payload?.status === 'ok') nghe.lầnLỗi = 0;
      if (m.event === 'postgres_changes') báoĐổi();
      // Server đóng kênh (thẻ hết hạn, lỗi cấu hình) → nối lại từ đầu.
      if (m.event === 'phx_close' || m.event === 'phx_error' ||
          (m.event === 'system' && m.payload?.status === 'error')) ws.close();
    };
    ws.onclose = () => {
      clearInterval(nghe.nhịp);
      if (nghe.tắt) return;
      // Lỗi liên tiếp thì giãn dần: 2s, 4s, 8s… tối đa 60s.
      const chờ = Math.min(60e3, 2e3 * 2 ** nghe.lầnLỗi++);
      nghe.hẹnNối = setTimeout(nối, chờ);
    };
  }

  NG.batNghe = (khiĐổi) => {
    nghe.khiĐổi = khiĐổi;
    if (!nghe.tắt && nghe.ws) return;       // đang nghe rồi thì thôi
    if (!nghe.tắt && nghe.đangNối) return;   // đang chờ xin thẻ để nối
    nghe.tắt = false; nghe.lầnLỗi = 0;
    nối();
  };
  NG.tatNghe = () => { nghe.tắt = true; clearTimeout(nghe.chờ); dọn(); };
  NG.dangNghe = () => nghe.ws?.readyState === 1;

  const dangXuatCu = NG.dangXuat;
  NG.dangXuat = () => { NG.tatNghe(); dangXuatCu(); };

  window.NGUON = NG;
})();
