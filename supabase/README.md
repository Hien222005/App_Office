# Văn Phòng Agent · Giai đoạn 1

Chạy ba file theo **đúng thứ tự** trong Supabase → SQL Editor → New query.

| # | File | Trước khi chạy cần sửa gì |
|---|------|---------------------------|
| 1 | `schema.sql` | Không. Dán và Run. |
| 2 | `rls.sql` | Thay `YOUR_EMAIL_HERE` bằng email đăng nhập của bạn. |
| 3 | `seed_food.sql` | Bỏ comment 5 dòng cuối, điền mục tiêu kcal/protein thật. |

## Các file đổi · chạy theo đúng thứ tự sau ba file trên

| # | File | Làm gì |
|---|------|--------|
| 4 | `doi-2-workflow.sql` | Bộ nhãn mới + cột `han_chot` `brief` `link_san_pham` `so_lan_lam_lai` |
| 5 | `doi-3-gio-vn.sql` | Hàm `hom_nay_vn()` — ngày tính theo giờ Việt Nam |
| 6 | `doi-4-dem-dung.sql` | Sửa cột `dang_lam` trong `v_tinh_trang` |
| 7 | `doi-5-nhan-gon.sql` | **Rút bộ nhãn 10 → 7.** Ba nhãn cũ thành điều kiện tính từ số liệu |

Đã chạy tới file nào thì kiểm bằng:

```sql
select pg_get_constraintdef(oid) from pg_constraint where conname = 'tasks_trang_thai_check';
```

Ra đúng 7 nhãn `cho_chot · da_chot · bo · dang_lam · cho_duyet · da_duyet · da_ghi`
là đã chạy tới `doi-5`.

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

Lấy khoá ở Settings → API rồi dán **thẳng vào `agent/.env`** trên máy.
Đừng gửi qua khung chat.

```bash
cp agent/.env.example agent/.env    # từ thư mục gốc dự án
```

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...        # service_role — script agent dùng
SUPABASE_ANON_KEY=eyJ...           # anon — app trên điện thoại dùng
```

| Tên biến | Ai đọc |
|---|---|
| `SUPABASE_URL` | `agent/lib.mjs` và `tao-cau-hinh.mjs` |
| `SUPABASE_SERVICE_KEY` | chỉ `agent/lib.mjs` — các script chạy trên Mac |
| `SUPABASE_ANON_KEY` | `tao-cau-hinh.mjs`, để sinh ra `site/cau-hinh.js` cho app |

`SUPABASE_SERVICE_KEY` đi vòng qua mọi chính sách RLS.
Không bao giờ để nó vào code chạy ở trình duyệt, không bao giờ commit.
`.gitignore` đã chặn `agent/.env` và `site/cau-hinh.js`.

Khi deploy lên Netlify thì không dùng file `.env`: đặt `SUPABASE_URL` và
`SUPABASE_ANON_KEY` ở Project configuration → Environment. Netlify chạy
`node tao-cau-hinh.mjs` lúc build để sinh `site/cau-hinh.js` từ hai biến đó.

## Trạng thái hiện tại

Ba file này **đã chạy xong** trên project `dwissbrcqrbknaxniwhz` ngày 13/09/2026.
Trong database thật, `la_chu_nhan()` đang gắn với email đăng nhập thật —
ở file này để `YOUR_EMAIL_HERE` cho khỏi lộ email ra repo.

Muốn đổi chủ nhân app:

```sql
create or replace function la_chu_nhan() returns boolean
language sql stable as $$ select auth.jwt() ->> 'email' = 'email-moi@...'; $$;
```
