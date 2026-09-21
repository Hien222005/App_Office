-- ============================================================
-- VĂN PHÒNG AGENT · schema.sql
--
-- FILE DUY NHẤT để dựng database từ đầu. Chạy một lần:
--   Supabase → SQL Editor → New query → dán → Run
-- Rồi chạy `rls.sql`, rồi `seed_food.sql`. Hết.
--
-- Trước 21/09 phải chạy BẢY file theo đúng thứ tự (schema + doi-2…doi-5), trong đó
-- doi-3 và doi-4 dựng view mà doi-5 xoá ngay sau đó. Ai mở schema.sql ra đọc thì
-- thấy bộ nhãn tiếng Anh từ ba đời trước. Nay gộp hết về đây.
-- Các file doi-* cũ chuyển sang `lich-su/`, chỉ còn để đọc lại chuyện đã qua.
--
-- Chạy lại nhiều lần không sao: mọi câu đều `if not exists` hoặc `do $$ … $$`.
-- ============================================================

create extension if not exists pgcrypto;

-- Ngày hôm nay theo giờ Việt Nam. MỌI chỗ so ngày đều dùng hàm này.
-- Postgres tính current_date theo UTC, script trên Mac tính theo giờ VN — nửa đêm
-- giờ VN thì hai bên lệch nhau một ngày. Đo được lúc 00:10 ngày 19/09/2026.
create or replace function hom_nay_vn() returns date
language sql stable
as $$ select (now() at time zone 'Asia/Ho_Chi_Minh')::date $$;


-- 1 · MỤC TIÊU DINH DƯỠNG -------------------------------------
create table if not exists muc_tieu (
  id            int primary key default 1,
  kcal_ngay     int not null,
  protein_ngay  int not null,
  cap_nhat_luc  timestamptz not null default now(),
  constraint chi_mot_dong check (id = 1)
);


-- 2 · BẢNG TRA MÓN ĂN -----------------------------------------
create table if not exists food_db (
  slug                  text primary key,
  ten                   text not null,
  kcal_100g             numeric(6,1) not null,
  protein_100g          numeric(5,1) not null,
  carb_100g             numeric(5,1),
  fat_100g              numeric(5,1),
  khau_phan_mac_dinh_g  int,
  nguon                 text,
  tao_luc               timestamptz not null default now()
);


-- 3 · KẾ HOẠCH TUẦN -------------------------------------------
-- Sếp ghi việc vào đây trên điện thoại. `/report` mỗi sáng đọc bảng này, lọc việc
-- của hôm nay rồi trình lên để sếp chốt. Trước đây agent phải TỰ ĐỌC NGUỒN TỪNG
-- PHÒNG RỒI TỰ NGHĨ RA VIỆC — chỗ duy nhất agent được phán đoán tự do, và cũng là
-- chỗ dễ sai nhất. Nay nó chỉ còn chép.
--
--   thu   2…7 = Thứ Hai…Thứ Bảy, 8 = Chủ nhật. Để TRỐNG = ngày nào trong tuần cũng được.
--   tuan  ngày Thứ Hai của tuần đó. Để TRỐNG = LẶP MỌI TUẦN — đây là cột quan trọng
--         nhất của bảng: việc lặp theo ngày thì ghi một lần, tuần nào cũng tự lên bảng.
--   bat   tạm ngưng một việc mà không phải xoá nó đi.
create table if not exists ke_hoach (
  id       text primary key,
  mang     text not null,
  viec     text not null,
  skill    text not null,
  thu      smallint check (thu between 2 and 8),
  tuan     date,
  ghi_chu  text,
  bat      boolean not null default true,
  thu_tu   int not null default 0,
  tao_luc  timestamptz not null default now()
);
create index if not exists ke_hoach_dang_bat_idx on ke_hoach (mang, thu) where bat;


-- 4 · VIỆC ----------------------------------------------------
-- `mang` KHÔNG có ràng buộc danh sách. Trước đây là `check (mang in ('lab','elearn','biz'))`,
-- nên thêm một mảng việc mới là phải chạy migration trên database thật. Luật đó vốn đã
-- được code giữ chặt hơn: `agent/phong.mjs → gốcCủaPhòng()` từ chối cả mảng lạ LẪN mảng
-- đang tạm dừng, còn ràng buộc SQL thì không biết mảng nào đang tắt.
-- Danh sách mảng nay nằm ở ĐÚNG MỘT CHỖ: frontmatter của mỗi Skill.
create table if not exists tasks (
  id                text primary key,
  ngay              date not null,
  mang              text not null,
  tieu_de           text not null,
  chi_tiet          text,
  brief             jsonb,
  han_chot          timestamptz,
  trang_thai        text not null default 'cho_chot',
  ghi_chu_agent     text,
  phan_hoi_cua_toi  text,
  link_san_pham     text,
  file_da_doi       text[],
  cac_buoc          text[],
  so_lan_lam_lai    smallint not null default 0,
  thu_tu            int not null default 0,
  cap_nhat_luc      timestamptz not null default now()
);

-- BẢY nhãn. Phải khớp đúng `agent/nhan.mjs` — lệch một chữ là script và app hiểu khác nhau.
--
--   cho_chot ──sếp──▶ da_chot ──agent──▶ dang_lam ──agent──▶ cho_duyet
--      └───sếp──▶ bo                                  ├──sếp──▶ da_duyet ──/chot──▶ da_ghi
--                                                      └──sếp──▶ da_chot  (trả lại, đếm +1)
--
-- Ba thứ trước đây là nhãn nay là ĐIỀU KIỆN tính từ số liệu, nên agent không thể quên
-- đánh dấu: đang làm lại = so_lan_lam_lai > 0 · cần sếp sửa = chạm trần ·
-- đang vướng = có dòng trong questions mà tra_loi còn trống.
alter table tasks drop constraint if exists tasks_trang_thai_check;
alter table tasks add constraint tasks_trang_thai_check check (trang_thai in (
  'cho_chot','da_chot','bo','dang_lam','cho_duyet','da_duyet','da_ghi'));

-- Trần 3 lần làm lại là luật, không phải lời dặn: quá 3 thì database từ chối.
alter table tasks drop constraint if exists tran_lam_lai;
alter table tasks add constraint tran_lam_lai check (so_lan_lam_lai between 0 and 3);

-- Báo xong thì BẮT BUỘC có link sản phẩm, để sếp tự mở ra xem thay vì đọc lời khai.
alter table tasks drop constraint if exists co_link_khi_cho_duyet;
alter table tasks add constraint co_link_khi_cho_duyet check (
  trang_thai <> 'cho_duyet' or (link_san_pham is not null and length(btrim(link_san_pham)) > 0));

create index if not exists tasks_ngay_mang_idx  on tasks (ngay, mang);
create index if not exists tasks_trang_thai_idx on tasks (trang_thai);
create index if not exists tasks_ton_idx        on tasks (ngay)
  where trang_thai not in ('da_ghi','bo');


-- 5 · CÂU HỎI CHO SẾP -----------------------------------------
-- Ràng buộc `co_phuong_an` biến quy tắc thiết kế thành luật: agent KHÔNG THỂ hỏi một
-- câu trống phương án, kể cả khi prompt sai. Trả lời bằng một cú chạm thì sếp sẽ trả
-- lời; phải gõ một đoạn văn thì sếp để đó, và một tuần sau cả hệ thống đứng vì một
-- câu chưa ai đáp. App luôn thêm ô thứ tư để sếp tự gõ, nên đúng 3 gợi ý là đủ.
create table if not exists questions (
  id             text primary key,
  task_id        text references tasks(id) on delete cascade,
  ngay           date not null,
  cau_hoi        text not null,
  phuong_an      jsonb not null,
  tra_loi        text,
  tra_loi_tu_go  boolean not null default false,
  tra_loi_luc    timestamptz,
  tao_luc        timestamptz not null default now()
);
alter table questions drop constraint if exists co_phuong_an;
alter table questions add constraint co_phuong_an check (
  jsonb_typeof(phuong_an) = 'array' and jsonb_array_length(phuong_an) = 3);
create index if not exists questions_cho_tra_loi_idx
  on questions (ngay) where tra_loi is null;


-- 6 · LOG ĐỒ ĂN -----------------------------------------------
create table if not exists food_log (
  id         uuid primary key default gen_random_uuid(),
  ngay       date not null default hom_nay_vn(),
  bua        text not null check (bua in ('sang','trua','toi','phu')),
  gio        time,
  anh_path   text,
  mon        jsonb not null default '[]'::jsonb,
  kcal       numeric(7,1) not null default 0,
  protein    numeric(6,1) not null default 0,
  do_tin     smallint check (do_tin between 1 and 5),
  cho_xu_ly  boolean not null default false,
  tao_luc    timestamptz not null default now()
);
create index if not exists food_log_ngay_idx on food_log (ngay);
create index if not exists food_log_cho_xu_ly_idx on food_log (cho_xu_ly) where cho_xu_ly;


-- 7 · KINH NGHIỆM AGENT ---------------------------------------
create table if not exists agent_notes (
  id           uuid primary key default gen_random_uuid(),
  ngay         date not null default hom_nay_vn(),
  bai_hoc      text not null,
  ap_dung_cho  text[] not null default '{}',
  tao_luc      timestamptz not null default now()
);


-- 8 · PHIÊN LÀM VIỆC ------------------------------------------
-- MỘT NGÀY MỘT PHIÊN. Index duy nhất dưới đây là thứ giữ luật đó, không phải lời dặn.
-- Gõ /report lúc 8h, /lam lúc 10h, /lam lúc 15h, /chot lúc 23h — tất cả thuộc cùng
-- một phiên của ngày hôm đó.
--
-- KHÔNG có cột `trang_thai` cho phiên. "Đóng được phiên hay chưa" được TÍNH RA từ số
-- việc còn treo (`agent/viec.mjs → xếpRổ()`), nên không ai quên cập nhật được. Thêm
-- một cột trạng thái là dựng lại đúng cái bẫy mà đợt rút nhãn 10 → 7 vừa gỡ.
create table if not exists agent_runs (
  id              uuid primary key default gen_random_uuid(),
  ngay            date not null default hom_nay_vn(),
  bat_dau         timestamptz not null default now(),
  ket_thuc        timestamptz,
  so_viec_da_ghi  int not null default 0,
  tom_tat         text
);
create unique index if not exists agent_runs_mot_phien_moi_ngay on agent_runs (ngay);
create index if not exists agent_runs_dang_chay_idx on agent_runs (ngay) where ket_thuc is null;


-- REALTIME ----------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['ke_hoach','tasks','questions','agent_runs'] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;


-- ============================================================
-- KIỂM SAU KHI CHẠY — chạy riêng đoạn này, phải ra đúng  8 · 7 · 0
--
-- select
--   (select count(*) from pg_tables where schemaname='public')            as so_bang,
--   (select count(*) from unnest(array['cho_chot','da_chot','bo','dang_lam',
--                                      'cho_duyet','da_duyet','da_ghi']) n
--      where pg_get_constraintdef(c.oid) like '%''' || n || '''%')         as du_7_nhan,
--   (select count(*) from information_schema.columns
--      where table_name='tasks'
--        and column_name in ('tin_cay','da_tu_kiem','tieu_chi_xong',
--                            'ngay_chot_viec'))                           as cot_chet_con_lai
-- from pg_constraint c where c.conname = 'tasks_trang_thai_check';
--
-- Đừng đọc pg_get_constraintdef bằng mắt: ô kết quả của Supabase hẹp nên nó cắt mất
-- đuôi, dễ tưởng là thiếu nhãn.
-- ============================================================
