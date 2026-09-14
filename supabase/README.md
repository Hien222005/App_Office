# Văn Phòng Agent · Giai đoạn 1

Chạy ba file theo **đúng thứ tự** trong Supabase → SQL Editor → New query.

| # | File | Trước khi chạy cần sửa gì |
|---|------|---------------------------|
| 1 | `schema.sql` | Không. Dán và Run. |
| 2 | `rls.sql` | Thay `YOUR_EMAIL_HERE` bằng email đăng nhập của bạn. |
| 3 | `seed_food.sql` | Bỏ comment 5 dòng cuối, điền mục tiêu kcal/protein thật. |

## Kiểm tra sau khi chạy

```sql
-- phải ra 8 dòng, rowsecurity đều = true
select tablename, rowsecurity from pg_tables
where schemaname = 'public' order by tablename;

-- phải ra 36 món
select count(*) from food_db;

-- phải ra 3 sàn, số 0 hết vì chưa có task
select * from v_van_phong;
```

## Khoá API

Sau khi tạo project, lấy khoá ở Settings → API và dán **thẳng vào
`.env.local`** trên máy. Đừng gửi qua khung chat.

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # chỉ dùng phía máy chủ + script agent
```

`SUPABASE_SERVICE_ROLE_KEY` đi vòng qua mọi chính sách RLS.
Không bao giờ để nó vào code chạy ở trình duyệt, không bao giờ commit.

## Trạng thái hiện tại

Ba file này **đã chạy xong** trên project `dwissbrcqrbknaxniwhz` ngày 13/09/2026.
Trong database thật, `la_chu_nhan()` đang gắn với email đăng nhập thật —
ở file này để `YOUR_EMAIL_HERE` cho khỏi lộ email ra repo.

Muốn đổi chủ nhân app:

```sql
create or replace function la_chu_nhan() returns boolean
language sql stable as $$ select auth.jwt() ->> 'email' = 'email-moi@...'; $$;
```
