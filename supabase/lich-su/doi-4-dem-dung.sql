-- Sửa cột dang_lam trong v_tinh_trang: đếm đủ ba nhãn agent đang giữ việc,
-- khớp với cách app đếm (da_chot · doing · lam_lai). Trước đó chỉ đếm 'doing'
-- nên việc sếp vừa chốt không hiện ở đâu cả.
create or replace view v_tinh_trang as
select m.mang,
  count(t.id) filter (where t.trang_thai in
    ('cho_sep_chot','can_sep_duyet','can_sep_sua','cho_duyet_kq'))        as cho_sep,
  count(t.id) filter (where t.trang_thai in ('da_chot','doing','lam_lai')) as dang_lam,
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
