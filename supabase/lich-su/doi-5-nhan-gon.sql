-- ĐỔI 5 · BỘ NHÃN GỌN (10 → 7) VÀ BỎ ĐIỂM TỰ TIN
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

-- 3 · BỎ ĐIỂM TỰ TIN -----------------------------------------
-- Agent tự chấm 1–5 thì luôn ra 4. Bài đo 18/09 còn bắt được Opus điền cả một câu
-- văn vào ô số. Luật cũ "chấm 5/5 phải có da_tu_kiem dài hơn 10 chữ" agent viết bừa
-- 11 chữ là qua.
--
-- Thay bằng luật máy kiểm, nằm trong agent/soat-bao-cao.mjs, không nằm trong database:
--   nhật ký hook PHẢI có một lần đọc lại file SAU lần sửa cuối.
-- Không mở lại thì không báo xong được, viết gì cũng vô ích.
alter table tasks drop constraint if exists tran_tin_cay_khi_chua_tu_kiem;
drop view if exists v_van_phong;
drop view if exists v_tinh_trang;
alter table tasks drop column if exists tin_cay;
alter table tasks drop column if exists da_tu_kiem;

-- 4 · BỎ HAI VIEW KHÔNG AI DÙNG ------------------------------
-- v_van_phong và v_tinh_trang không được script hay app nào gọi: tinh-trang.mjs
-- đếm thẳng từ bảng tasks. Bằng chứng chúng đã hỏng mà không ai biết: v_van_phong
-- vẫn đang lọc theo nhãn tiếng Anh 'draft'/'done' — bộ nhãn từ ba đời trước.
-- Giữ lại nghĩa là thêm hai chỗ phải nhớ sửa mỗi lần đổi nhãn. Bỏ.
-- (Đã drop ở mục 3 vì chúng phụ thuộc cột tin_cay.)

commit;

-- KIỂM SAU KHI CHẠY -------------------------------------------
-- Chạy câu này, phải ra đúng BỐN SỐ:  7 · 0 · 0 · 0
-- (Đừng đọc pg_get_constraintdef bằng mắt — ô kết quả của Supabase hẹp, nó cắt
--  mất đuôi và làm tưởng là thiếu nhãn.)
--
-- select
--   (select count(*) from unnest(array['cho_chot','da_chot','bo','dang_lam',
--                                      'cho_duyet','da_duyet','da_ghi']) n
--      where pg_get_constraintdef(c.oid) like '%''' || n || '''%')            as nhan_moi_du_7,
--   (select count(*) from unnest(array['cho_sep_chot','doing','cho_duyet_kq',
--           'da_duyet_kq','lam_lai','can_sep_sua','can_sep_duyet']) n
--      where pg_get_constraintdef(c.oid) like '%''' || n || '''%')            as nhan_cu_con_lai,
--   (select count(*) from information_schema.columns
--      where table_name='tasks' and column_name in ('tin_cay','da_tu_kiem'))  as cot_tin_cay_con,
--   (select count(*) from information_schema.views where table_schema='public'
--      and table_name in ('v_van_phong','v_tinh_trang'))                      as view_cu_con
-- from pg_constraint c where c.conname = 'tasks_trang_thai_check';
