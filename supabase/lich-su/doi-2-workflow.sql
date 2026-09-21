-- ============================================================
-- VĂN PHÒNG AGENT · doi-2-workflow.sql
-- Đưa database theo workflow chốt 18/09: một phiên mỗi ngày, vòng lặp duyệt,
-- ghi vào file gốc một lần cuối ngày, việc chưa duyệt thì tồn sang ngày sau.
--
-- TRƯỚC KHI CHẠY:
--   1. node agent/sao-luu.mjs        ← bắt buộc, gói Free không có sao lưu tự động
--   2. Đọc hết file này một lượt
--   3. Supabase → SQL Editor → dán → Run
--
-- Chạy lại nhiều lần không sao: mọi câu đều `if not exists` hoặc `do $$ ... $$`.
-- ============================================================

-- 1 · CỘT MỚI CHO BẢNG TASKS ----------------------------------
-- han_chot      : G2 bắt buộc có hạn chót, app tính trễ hạn từ đây
-- brief         : brief sếp đã chốt, nguồn của phạm vi file_duoc_sua
-- link_san_pham : G6 — sếp mở cái này để tự kiểm, không đọc lời khai
-- da_tu_kiem    : agent đã mở lại sản phẩm chưa; trống thì trần tin cậy là 4
-- cac_buoc      : agent tự thuật từng bước, nhật ký đọc từ đây
-- so_lan_lam_lai: đếm vòng lặp; chạm 3 thì chuyển can_sep_sua
-- ngay_chot_viec: ngày sếp chốt việc này, để tính việc tồn
alter table tasks add column if not exists han_chot        timestamptz;
alter table tasks add column if not exists brief           jsonb;
alter table tasks add column if not exists link_san_pham   text;
alter table tasks add column if not exists da_tu_kiem      text;
alter table tasks add column if not exists cac_buoc        text[];
alter table tasks add column if not exists so_lan_lam_lai  smallint not null default 0;
alter table tasks add column if not exists ngay_chot_viec  date;

-- 2 · BỘ NHÃN MỚI ---------------------------------------------
-- Phải khớp đúng agent/nhan.mjs. Lệch một chữ là script và app hiểu khác nhau.
--   cho_sep_chot · da_chot · bo · doing · can_sep_duyet · can_sep_sua
--   cho_duyet_kq · lam_lai · da_duyet_kq · da_ghi
do $$
begin
  -- đổi dữ liệu cũ sang nhãn mới trước, rồi mới thay ràng buộc
  alter table tasks drop constraint if exists tasks_trang_thai_check;
  update tasks set trang_thai = case trang_thai
    when 'draft'    then 'cho_sep_chot'
    when 'approved' then 'da_chot'
    when 'rejected' then 'bo'
    when 'blocked'  then 'can_sep_duyet'
    when 'redo'     then 'lam_lai'
    when 'done'     then 'da_ghi'
    else trang_thai end
  where trang_thai in ('draft','approved','rejected','blocked','redo','done');
  alter table tasks add constraint tasks_trang_thai_check check (trang_thai in (
    'cho_sep_chot','da_chot','bo','doing','can_sep_duyet','can_sep_sua',
    'cho_duyet_kq','lam_lai','da_duyet_kq','da_ghi'));
end $$;

alter table tasks alter column trang_thai set default 'cho_sep_chot';

-- Trần 3 lần làm lại là luật, không phải lời dặn: quá 3 thì database từ chối.
alter table tasks drop constraint if exists tran_lam_lai;
alter table tasks add constraint tran_lam_lai check (so_lan_lam_lai between 0 and 3);

-- Báo xong (chờ duyệt kết quả) thì bắt buộc có link sản phẩm để sếp tự kiểm.
alter table tasks drop constraint if exists co_link_khi_cho_duyet;
alter table tasks add constraint co_link_khi_cho_duyet check (
  trang_thai <> 'cho_duyet_kq' or (link_san_pham is not null and length(btrim(link_san_pham)) > 0));

-- Chưa tự kiểm thì trần tin cậy là 4. Chấm 5 mà da_tu_kiem trống là bị từ chối.
alter table tasks drop constraint if exists tran_tin_cay_khi_chua_tu_kiem;
alter table tasks add constraint tran_tin_cay_khi_chua_tu_kiem check (
  tin_cay is null or tin_cay < 5 or (da_tu_kiem is not null and length(btrim(da_tu_kiem)) > 10));

-- 3 · CÂU HỎI CHO SẾP: ĐÚNG 3 GỢI Ý ---------------------------
-- App luôn thêm ô thứ tư để sếp tự gõ, nên 3 gợi ý là đủ và là bắt buộc.
do $$
begin
  alter table questions drop constraint if exists co_phuong_an;
  alter table questions add constraint co_phuong_an check (
    jsonb_typeof(phuong_an) = 'array' and jsonb_array_length(phuong_an) = 3);
exception when check_violation then
  raise notice 'Có câu hỏi cũ không đúng 3 phương án. Sửa dữ liệu rồi chạy lại phần này.';
end $$;

-- Sếp tự gõ câu trả lời khác ba gợi ý thì lưu vào đây.
alter table questions add column if not exists tra_loi_tu_go boolean not null default false;

-- 4 · PHIÊN NGÀY ----------------------------------------------
-- Một ngày một phiên, thay cho hai phiên sáng/trưa.
alter table agent_runs drop constraint if exists agent_runs_phien_check;
alter table agent_runs add constraint agent_runs_phien_check check (phien in ('ngay','sang','trua'));
alter table agent_runs add column if not exists so_viec_da_ghi int not null default 0;
create unique index if not exists agent_runs_mot_phien_moi_ngay
  on agent_runs (ngay) where phien = 'ngay';

-- 5 · VIEW CHO APP VÀ SKILL BÁO CÁO ---------------------------
-- Bảng tình trạng theo phòng. VALUES đảm bảo luôn đủ 3 phòng, kể cả khi 0 việc.
create or replace view v_tinh_trang as
select m.mang,
  count(t.id) filter (where t.trang_thai in
    ('cho_sep_chot','can_sep_duyet','can_sep_sua','cho_duyet_kq'))        as cho_sep,
  count(t.id) filter (where t.trang_thai = 'doing')                        as dang_lam,
  count(t.id) filter (where t.trang_thai = 'da_duyet_kq')                  as da_duyet_cho_ghi,
  count(t.id) filter (where t.trang_thai = 'da_ghi')                       as da_ghi,
  count(t.id) filter (where t.han_chot < now()
                        and t.trang_thai not in ('da_ghi','bo'))           as tre_han,
  count(t.id) filter (where t.ngay < current_date
                        and t.trang_thai not in ('da_ghi','bo'))           as ton_hom_truoc,
  round(avg(t.tin_cay), 1)                                                 as tin_cay_tb
from (values ('lab'),('elearn'),('biz')) as m(mang)
left join tasks t on t.mang = m.mang
  and (t.ngay = current_date or (t.ngay < current_date and t.trang_thai not in ('da_ghi','bo')))
group by m.mang;

-- Việc tồn: mọi việc của ngày trước mà chưa ghi và chưa bỏ.
create or replace view v_viec_ton as
select id, ngay as ton_tu_ngay, mang, tieu_de, trang_thai, so_lan_lam_lai, han_chot,
       current_date - ngay as so_ngay_ton
from tasks
where ngay < current_date and trang_thai not in ('da_ghi','bo')
order by ngay asc, thu_tu asc;

create index if not exists tasks_ton_idx on tasks (ngay) where trang_thai not in ('da_ghi','bo');

-- 6 · KIỂM SAU KHI CHẠY ---------------------------------------
-- Chạy riêng đoạn này, phải ra đúng như ghi chú bên phải:
--   select trang_thai, count(*) from tasks group by 1;          → chỉ thấy nhãn mới
--   select * from v_tinh_trang;                                 → 3 dòng
--   select count(*) from v_viec_ton;                            → số việc tồn
--   select tablename, rowsecurity from pg_tables
--     where schemaname='public';                                → 8 dòng, rowsecurity đều true
