-- ============================================================
-- VĂN PHÒNG AGENT · doi-3-gio-vn.sql
-- Sửa lỗi lệch múi giờ: Postgres tính current_date theo UTC, còn script trên Mac
-- tính ngày theo giờ Việt Nam. Nửa đêm giờ VN thì hai bên lệch nhau một ngày,
-- làm bảng tình trạng báo 0 việc dù việc đã có.
--
-- Đo được lúc 00:10 ngày 19/09: task ngay='2026-09-19' nhưng current_date (UTC) = '2026-09-18'.
--
-- Chạy: Supabase → SQL Editor → dán → Run. Chạy lại nhiều lần không sao.
-- ============================================================

-- Ngày hôm nay theo giờ Việt Nam. Mọi nơi so ngày đều dùng hàm này.
create or replace function hom_nay_vn() returns date
language sql stable
as $$ select (now() at time zone 'Asia/Ho_Chi_Minh')::date $$;

create or replace view v_tinh_trang as
select m.mang,
  count(t.id) filter (where t.trang_thai in
    ('cho_sep_chot','can_sep_duyet','can_sep_sua','cho_duyet_kq'))        as cho_sep,
  count(t.id) filter (where t.trang_thai = 'doing')                        as dang_lam,
  count(t.id) filter (where t.trang_thai = 'da_duyet_kq')                  as da_duyet_cho_ghi,
  count(t.id) filter (where t.trang_thai = 'da_ghi')                       as da_ghi,
  count(t.id) filter (where t.han_chot < now()
                        and t.trang_thai not in ('da_ghi','bo'))           as tre_han,
  count(t.id) filter (where t.ngay < hom_nay_vn()
                        and t.trang_thai not in ('da_ghi','bo'))           as ton_hom_truoc,
  round(avg(t.tin_cay), 1)                                                 as tin_cay_tb
from (values ('lab'),('elearn'),('biz')) as m(mang)
left join tasks t on t.mang = m.mang
  and (t.ngay = hom_nay_vn() or (t.ngay < hom_nay_vn() and t.trang_thai not in ('da_ghi','bo')))
group by m.mang;

create or replace view v_viec_ton as
select id, ngay as ton_tu_ngay, mang, tieu_de, trang_thai, so_lan_lam_lai, han_chot,
       hom_nay_vn() - ngay as so_ngay_ton
from tasks
where ngay < hom_nay_vn() and trang_thai not in ('da_ghi','bo')
order by ngay asc, thu_tu asc;

-- Kiểm sau khi chạy:
--   select hom_nay_vn();          → phải ra ngày theo giờ Việt Nam
--   select * from v_tinh_trang;   → phòng nào có việc hôm nay phải hiện số
