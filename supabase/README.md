# Văn Phòng Agent · database

## Máy mới — chạy BA file, đúng thứ tự

Supabase → SQL Editor → New query.

| # | File | Trước khi chạy cần sửa gì |
|---|------|---------------------------|
| 1 | `schema.sql` | Không. Dán và Run. |
| 2 | `rls.sql` | Thay `YOUR_EMAIL_HERE` bằng email đăng nhập của bạn. |
| 3 | `seed_food.sql` | Bỏ comment 5 dòng cuối, điền mục tiêu kcal/protein thật. |

Trước 21/09 phải chạy **bảy** file, trong đó `doi-3` và `doi-4` dựng view mà `doi-5` xoá
ngay sau đó, còn `schema.sql` đọc lên thì thấy bộ nhãn tiếng Anh từ ba đời trước. Nay gộp
hết vào `schema.sql`; các bản vá cũ chuyển sang [`lich-su/`](lich-su), chỉ để đọc lại.

## Database ĐANG CHẠY — còn một file phải chạy

Project `dwissbrcqrbknaxniwhz` đang ở trạng thái `doi-5`. Để dùng được code từ 21/09:

| Bước | Làm gì |
|---|---|
| 1 | `node agent/sao-luu.mjs` — **bắt buộc, chạy trước**, lúc `daily_report` hãy còn |
| 2 | `doi-6-don-nen.sql` — bỏ ràng buộc `mang`, thêm `ke_hoach`, bỏ `daily_report`, dọn cột chết |
| 3 | **chạy lại `rls.sql`** — bảng `ke_hoach` vừa tạo chưa có policy nào |

> **Chưa chạy `doi-6` thì `/report` sẽ hỏng.** Hai chỗ: `agent_runs.phien` là `not null`
> mà code mới không còn ghi cột đó, và `tasks.ngay` vẫn có khoá ngoại trỏ sang
> `daily_report` mà code mới không còn tạo dòng ở đó. `/lam` và `/chot` không ảnh hưởng.

## Kiểm bộ nhãn — ra đúng **bốn số `7 · 0 · 0 · 0`**:

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

Database dựng ngày 13/09/2026 trên project `dwissbrcqrbknaxniwhz`, đã qua `doi-5`.
**Chưa chạy `doi-6-don-nen.sql`** — xem mục trên.
Trong database thật, `la_chu_nhan()` đang gắn với email đăng nhập thật —
ở file này để `YOUR_EMAIL_HERE` cho khỏi lộ email ra repo.

Muốn đổi chủ nhân app:

```sql
create or replace function la_chu_nhan() returns boolean
language sql stable as $$ select auth.jwt() ->> 'email' = 'email-moi@...'; $$;
```
