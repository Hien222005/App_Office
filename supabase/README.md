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
| 6 | `doi-4-dem-dung.sql` | Sửa cột `dang_lam` trong `v_tinh_trang` (view này bị bỏ ở doi-5) |
| 7 | `doi-5-nhan-gon.sql` | **Rút nhãn 10 → 7 · bỏ cột `tin_cay` · bỏ 2 view không ai dùng** |

Chạy xong `doi-5` thì kiểm bằng câu này — ra đúng **bốn số `7 · 0 · 0 · 0`**:

```sql
select
  (select count(*) from unnest(array['cho_chot','da_chot','bo','dang_lam',
                                     'cho_duyet','da_duyet','da_ghi']) n
     where pg_get_constraintdef(c.oid) like '%''' || n || '''%')            as nhan_moi_du_7,
  (select count(*) from unnest(array['cho_sep_chot','doing','cho_duyet_kq',
          'da_duyet_kq','lam_lai','can_sep_sua','can_sep_duyet']) n
     where pg_get_constraintdef(c.oid) like '%''' || n || '''%')            as nhan_cu_con_lai,
  (select count(*) from information_schema.columns
     where table_name='tasks' and column_name in ('tin_cay','da_tu_kiem'))  as cot_tin_cay_con,
  (select count(*) from information_schema.views where table_schema='public'
     and table_name in ('v_van_phong','v_tinh_trang'))                      as view_cu_con
from pg_constraint c where c.conname = 'tasks_trang_thai_check';
```

> Đừng đọc `pg_get_constraintdef` bằng mắt: ô kết quả của Supabase hẹp nên nó cắt
> mất đuôi, dễ tưởng là thiếu nhãn.

## Kiểm tra sau khi chạy

```sql
-- phải ra 8 dòng, rowsecurity đều = true
select tablename, rowsecurity from pg_tables
where schemaname = 'public' order by tablename;

-- phải ra 36 món
select count(*) from food_db;

-- đếm việc theo phòng (thay cho view v_van_phong đã bỏ ở doi-5)
select mang, trang_thai, count(*) from tasks group by mang, trang_thai;
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
