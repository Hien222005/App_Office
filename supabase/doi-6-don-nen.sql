-- ============================================================
-- VĂN PHÒNG AGENT · doi-6-don-nen.sql
--
-- CHỈ DÀNH CHO DATABASE ĐANG CHẠY (project dwissbrcqrbknaxniwhz), đã qua doi-5.
-- Máy mới thì KHÔNG chạy file này — chạy thẳng `schema.sql` là ra đúng trạng thái này.
--
-- Đưa database về đúng `schema.sql` sau đợt dọn 21/09:
--   1. Bỏ ràng buộc danh sách `mang`  → thêm mảng việc mới không còn phải migration
--   2. Thêm bảng `ke_hoach`           → kế hoạch tuần, nguồn việc của /report
--   3. Bỏ bảng `daily_report`         → không ai đọc, mà đang là CHA của tasks
--   4. Bỏ 2 cột chết trong tasks
--
-- TRƯỚC KHI CHẠY:
--   node agent/sao-luu.mjs      ← BẮT BUỘC. Gói Free không có sao lưu tự động.
--                                  Chạy TRƯỚC, lúc daily_report hãy còn.
--   Đọc hết file này một lượt.
-- ============================================================

begin;

-- 1 · BỎ RÀNG BUỘC DANH SÁCH MẢNG -----------------------------
-- `check (mang in ('lab','elearn','biz'))` là thứ DUY NHẤT bắt phải chạy migration mỗi
-- lần thêm một mảng việc. Nó cũng yếu hơn luật code đang giữ: nó không biết mảng nào
-- đang tạm dừng, trong khi `agent/phong.mjs → gốcCủaPhòng()` từ chối cả hai trường hợp.
-- Danh sách mảng nay nằm ở ĐÚNG MỘT CHỖ: frontmatter của mỗi Skill.
alter table tasks drop constraint if exists tasks_mang_check;


-- 2 · BẢNG KẾ HOẠCH TUẦN --------------------------------------
create table if not exists ke_hoach (
  id       text primary key,
  mang     text not null,
  viec     text not null,
  skill    text not null,
  thu      smallint check (thu between 2 and 8),   -- 2…7 = T2…T7, 8 = CN; trống = ngày nào cũng được
  tuan     date,                                   -- Thứ Hai của tuần; TRỐNG = lặp mọi tuần
  ghi_chu  text,
  bat      boolean not null default true,
  thu_tu   int not null default 0,
  tao_luc  timestamptz not null default now()
);
create index if not exists ke_hoach_dang_bat_idx on ke_hoach (mang, thu) where bat;


-- 3 · BỎ BẢNG daily_report ------------------------------------
-- Không script hay màn hình nào ĐỌC bảng này. `viec.mjs phieu` chỉ ghi vào, còn bốn cột
-- nội dung (lab_tom_tat · lab_nguon · lab_noi_bo · dinh_duong_nhan_xet) là tàn dư của
-- thiết kế "báo cáo sáng" đã bỏ. Cột `trang_thai` từng là cổng duyệt cả phiếu một lần —
-- workflow mới sếp chốt TỪNG VIỆC, và chính viec.mjs đã ghi chú rằng cổng đó thành khoá chết.
--
-- Nhưng nó lại đang là CHA của tasks: `tasks.ngay references daily_report(ngay) on delete
-- cascade`. Xoá nhầm một phiếu ngày là mất sạch việc của ngày đó. Hai thực thể "ngày" chạy
-- song song — daily_report và agent_runs — mà chỉ một cái có việc.
--
-- Nay chỉ còn MỘT: phiên ngày trong agent_runs. `viec.mjs doc` chặn bằng câu hỏi đúng hơn:
-- "đã mở phiên hôm nay chưa", thay vì "đã có phiếu hôm nay chưa".
alter table tasks drop constraint if exists tasks_ngay_fkey;
drop table if exists daily_report cascade;


-- 4 · BỎ HAI CỘT CHẾT TRONG tasks -----------------------------
-- tieu_chi_xong  : brief 5 mục không sinh ra nó nữa, nên nó luôn rỗng. App đã đọc
--                  `brief.xong_khi` trước rồi mới ngó tới cột này — giữ một chỗ là đủ.
-- ngay_chot_viec : thêm ở doi-2, chưa script nào từng ghi hay đọc.
alter table tasks drop column if exists tieu_chi_xong;
alter table tasks drop column if exists ngay_chot_viec;


-- 5 · PHIÊN NGÀY ----------------------------------------------
-- Bỏ nốt cột `phien` và hai cột đếm trùng nhau. Một ngày một phiên đã là luật của
-- index duy nhất, không cần thêm một cột nói lại điều đó.
drop index if exists agent_runs_mot_phien_moi_ngay;
delete from agent_runs a using agent_runs b            -- giữ phiên sớm nhất của mỗi ngày
  where a.ngay = b.ngay and a.bat_dau > b.bat_dau;
alter table agent_runs drop constraint if exists agent_runs_phien_check;
alter table agent_runs drop column if exists phien;
alter table agent_runs drop column if exists so_task_lam;
create unique index if not exists agent_runs_mot_phien_moi_ngay on agent_runs (ngay);

-- Realtime cho bảng mới.
do $$ begin
  execute 'alter publication supabase_realtime add table ke_hoach';
exception when duplicate_object then null; end $$;


-- 6 · RLS CHO BẢNG MỚI ----------------------------------------
-- Làm ngay tại đây, KHÔNG bảo chạy lại rls.sql: file đó còn dòng YOUR_EMAIL_HERE và nó
-- dùng `create or replace function la_chu_nhan()`. Chạy lại nguyên xi là ghi đè email
-- thật bằng chuỗi giữ chỗ — tức tự khoá mình ra khỏi app.
--
-- Khối dưới KHÔNG đụng vào `la_chu_nhan()`. Nó chỉ bật RLS và gắn policy cho MỌI bảng
-- trong schema public chưa có, nên bảng nào mới cũng được che, không sót.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists chi_chu_nhan on %I', t);
    execute format(
      'create policy chi_chu_nhan on %I for all to authenticated
         using (la_chu_nhan()) with check (la_chu_nhan())', t);
  end loop;
end $$;

commit;

-- ============================================================
-- KHÔNG phải chạy lại rls.sql — mục 6 ở trên đã lo, và lo an toàn hơn.
--
-- KIỂM — phải ra đúng  8 · 0 · 0 · 0
--
-- select
--   (select count(*) from pg_tables where schemaname='public')                as so_bang,
--   (select count(*) from information_schema.tables
--      where table_schema='public' and table_name='daily_report')             as con_daily_report,
--   (select count(*) from information_schema.columns
--      where table_name='tasks'
--        and column_name in ('tieu_chi_xong','ngay_chot_viec','tin_cay'))     as cot_chet,
--   (select count(*) from pg_tables
--      where schemaname='public' and not rowsecurity)                         as bang_chua_co_rls;
-- ============================================================
