-- ============================================================
-- VĂN PHÒNG AGENT · rls.sql
-- CHẠY NGAY SAU schema.sql, TRƯỚC KHI NHẬP DỮ LIỆU THẬT.
--
-- Vì sao bắt buộc: khoá `anon` của Supabase là khoá CÔNG KHAI,
-- nó nằm trong JavaScript chạy ở trình duyệt, ai mở app cũng lấy
-- được. Không bật RLS = ai có khoá đó đọc sạch mọi bảng.
--
-- TRƯỚC KHI CHẠY: thay YOUR_EMAIL_HERE bằng email bạn dùng
-- để đăng nhập magic link.
-- ============================================================

-- Hàm kiểm tra: đúng là chủ nhân app?
create or replace function la_chu_nhan() returns boolean
language sql stable
as $$
  select auth.jwt() ->> 'email' = 'YOUR_EMAIL_HERE';
$$;

-- Bật RLS + gắn policy cho MỌI bảng trong schema public.
--
-- Trước đây chỗ này liệt kê cứng 8 tên bảng. Thêm một bảng mới mà quên sửa danh sách
-- thì bảng đó chạy KHÔNG có RLS — tức ai cầm khoá anon (nằm sẵn trong JavaScript của
-- app) đều đọc được. Quét cả schema thì không thể sót.
--
-- Vì vậy: THÊM BẢNG MỚI XONG THÌ CHẠY LẠI FILE NÀY. Chạy lại bao nhiêu lần cũng được.
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

-- Bucket ảnh: private, chỉ chủ nhân đọc ghi.
insert into storage.buckets (id, name, public)
values ('food-photos', 'food-photos', false)
on conflict (id) do nothing;

drop policy if exists anh_chi_chu_nhan on storage.objects;
create policy anh_chi_chu_nhan on storage.objects for all to authenticated
  using  (bucket_id = 'food-photos' and la_chu_nhan())
  with check (bucket_id = 'food-photos' and la_chu_nhan());

-- ============================================================
-- KIỂM TRA SAU KHI CHẠY — mọi dòng phải ra rowsecurity = true, KHÔNG SÓT DÒNG NÀO
-- ============================================================
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public' order by tablename;
--
-- Câu này phải ra 0 — nếu ra số khác thì có bảng chưa được bảo vệ:
-- select count(*) from pg_tables where schemaname='public' and not rowsecurity;
