-- ĐỔI 5 · BỘ NHÃN GỌN: 10 → 7
-- Chạy sau doi-2, doi-3, doi-4. Phải khớp đúng agent/nhan.mjs — lệch một chữ là
-- script và app hiểu khác nhau.
--
-- Ba nhãn cũ bị bỏ vì chúng không phải CHỖ ĐỨNG của việc, mà là CHUYỆN ĐANG XẢY RA
-- với việc. Nay tính từ số liệu, nên agent không thể quên đánh dấu:
--
--   lam_lai       → da_chot với so_lan_lam_lai > 0
--   can_sep_sua   → so_lan_lam_lai >= 3
--   can_sep_duyet → có dòng trong questions mà tra_loi còn trống
--
-- Bảy nhãn còn lại:
--   cho_chot · da_chot · bo · dang_lam · cho_duyet · da_duyet · da_ghi

begin;

-- 1 · ĐỔI DỮ LIỆU CŨ ------------------------------------------
do $$
begin
  alter table tasks drop constraint if exists tasks_trang_thai_check;
  alter table tasks drop constraint if exists co_link_khi_cho_duyet;

  -- TRƯỚC khi đổi nhãn: việc đang ở "can_sep_sua" phải có đủ 3 lần làm lại, vì sau khi
  -- đổi thì chốt an toàn "agent không chạm" chỉ còn dựa vào con số này.
  update tasks set so_lan_lam_lai = 3
  where trang_thai = 'can_sep_sua' and coalesce(so_lan_lam_lai, 0) < 3;

  update tasks set trang_thai = case trang_thai
    when 'cho_sep_chot'  then 'cho_chot'
    when 'doing'         then 'dang_lam'
    when 'cho_duyet_kq'  then 'cho_duyet'
    when 'da_duyet_kq'   then 'da_duyet'
    when 'lam_lai'       then 'da_chot'    -- đếm lần làm lại đã nằm ở so_lan_lam_lai
    when 'can_sep_sua'   then 'da_chot'    -- chạm trần tính từ so_lan_lam_lai
    when 'can_sep_duyet' then 'dang_lam'   -- vướng tính từ câu hỏi chưa trả lời
    else trang_thai end;

  alter table tasks add constraint tasks_trang_thai_check check (trang_thai in (
    'cho_chot','da_chot','bo','dang_lam','cho_duyet','da_duyet','da_ghi'));
end $$;

alter table tasks alter column trang_thai set default 'cho_chot';

-- 2 · RÀNG BUỘC THEO TÊN NHÃN MỚI -----------------------------
-- Báo xong thì bắt buộc có link sản phẩm để sếp tự kiểm.
alter table tasks add constraint co_link_khi_cho_duyet check (
  trang_thai <> 'cho_duyet' or (link_san_pham is not null and length(btrim(link_san_pham)) > 0));

-- 3 · VIEW TÌNH TRẠNG -----------------------------------------
-- "cho_sep" nay gồm cả việc đang treo câu hỏi, vì đó cũng là đang chờ sếp.
create or replace view v_tinh_trang as
select m.mang,
  count(t.id) filter (where t.trang_thai in ('cho_chot','cho_duyet')
                         or exists (select 1 from questions q
                                    where q.task_id = t.id and q.tra_loi is null)
                         or coalesce(t.so_lan_lam_lai, 0) >= 3)            as cho_sep,
  count(t.id) filter (where t.trang_thai in ('da_chot','dang_lam'))        as dang_lam,
  count(t.id) filter (where t.trang_thai = 'da_duyet')                     as da_duyet_cho_ghi,
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

commit;

-- KIỂM SAU KHI CHẠY -------------------------------------------
-- Phải ra đúng 7 nhãn, không còn nhãn cũ nào:
--   select unnest(enum_range(null::text[]));   -- (không dùng enum, dùng check)
-- Cách kiểm thật:
--   select distinct trang_thai from tasks;             → chỉ nằm trong 7 nhãn
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conname = 'tasks_trang_thai_check';          → liệt kê đúng 7 nhãn
--   select * from v_tinh_trang;                        → 3 dòng lab/elearn/biz
