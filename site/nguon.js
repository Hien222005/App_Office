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
  async function làmMớiPhiên(refresh, xoáNếuHỏng = true) {
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
    try {
      const [ai] = await Promise.all([gọi('/auth/v1/user')]);
      NG.email = ai?.email ?? null;
    } catch { NG.email = null; }

    // Thử đọc kèm cột mới. Thiếu cột nghĩa là chưa chạy doi-2-workflow.sql.
    try {
      const việc = await gọi(`/rest/v1/tasks?select=*&order=ngay.asc,thu_tu.asc`);
      const thiếu = việc.length ? COT_MOI.filter((c) => !(c in việc[0])) : [];
      if (thiếu.length) { NG.cheDo = 'chua-doi'; NG.loi = `Database còn thiếu cột: ${thiếu.join(', ')}`; return null; }
      const hỏi = await gọi(`/rest/v1/questions?select=*&order=tao_luc.desc&limit=20`);
      NG.cheDo = 'that';
      NG.loi = null;
      return { viec: việc.map(doiSangApp), hoi: hỏi.filter((h) => !h.tra_loi).map(doiHoi)[0] ?? null };
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

  window.NGUON = NG;
})();
