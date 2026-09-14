-- ============================================================
-- VĂN PHÒNG AGENT · schema.sql
-- Chạy 1 lần: Supabase → SQL Editor → New query → dán → Run
-- ============================================================

create extension if not exists pgcrypto;

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

-- 3 · PHIẾU NGÀY ----------------------------------------------
create table if not exists daily_report (
  ngay                 date primary key,
  lab_tom_tat          text,
  lab_nguon            text,
  lab_noi_bo           boolean not null default false,
  dinh_duong_nhan_xet  text,
  trang_thai           text not null default 'pending'
                       check (trang_thai in ('pending','approved')),
  duyet_luc            timestamptz,
  tao_luc              timestamptz not null default now()
);

-- 4 · TASK ----------------------------------------------------
create table if not exists tasks (
  id                text primary key,
  ngay              date not null references daily_report(ngay) on delete cascade,
  mang              text not null check (mang in ('lab','elearn','biz')),
  tieu_de           text not null,
  chi_tiet          text,
  tieu_chi_xong     text,
  trang_thai        text not null default 'draft'
                    check (trang_thai in ('draft','approved','rejected',
                                          'doing','done','blocked','redo')),
  tin_cay           smallint check (tin_cay between 1 and 5),
  ghi_chu_agent     text,
  phan_hoi_cua_toi  text,
  file_da_doi       text[],
  thu_tu            int not null default 0,
  cap_nhat_luc      timestamptz not null default now()
);
create index if not exists tasks_ngay_mang_idx   on tasks (ngay, mang);
create index if not exists tasks_trang_thai_idx  on tasks (trang_thai);

-- 5 · CÂU HỎI CỦA AGENT ---------------------------------------
-- Ràng buộc co_phuong_an biến quy tắc thiết kế thành luật:
-- agent KHÔNG THỂ hỏi một câu trống phương án, kể cả khi prompt sai.
create table if not exists questions (
  id           text primary key,
  task_id      text references tasks(id) on delete cascade,
  ngay         date not null,
  cau_hoi      text not null,
  phuong_an    jsonb not null,
  tra_loi      text,
  tra_loi_luc  timestamptz,
  tao_luc      timestamptz not null default now(),
  constraint co_phuong_an check (
    jsonb_typeof(phuong_an) = 'array'
    and jsonb_array_length(phuong_an) between 2 and 4
  )
);
create index if not exists questions_cho_tra_loi_idx
  on questions (ngay) where tra_loi is null;

-- 6 · LOG ĐỒ ĂN -----------------------------------------------
create table if not exists food_log (
  id         uuid primary key default gen_random_uuid(),
  ngay       date not null default current_date,
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
create index if not exists food_log_cho_xu_ly_idx
  on food_log (cho_xu_ly) where cho_xu_ly;

-- 7 · KINH NGHIỆM AGENT ---------------------------------------
create table if not exists agent_notes (
  id           uuid primary key default gen_random_uuid(),
  ngay         date not null default current_date,
  bai_hoc      text not null,
  ap_dung_cho  text[] not null default '{}',
  tao_luc      timestamptz not null default now()
);

-- 8 · NHẬT KÝ PHIÊN CHẠY --------------------------------------
-- Nguồn của chấm đỏ "đang chạy" và giờ chạy xong trên HUD.
create table if not exists agent_runs (
  id           uuid primary key default gen_random_uuid(),
  phien        text not null check (phien in ('sang','trua')),
  ngay         date not null default current_date,
  bat_dau      timestamptz not null default now(),
  ket_thuc     timestamptz,
  so_task_lam  int not null default 0,
  tom_tat      text
);
create index if not exists agent_runs_dang_chay_idx
  on agent_runs (ngay) where ket_thuc is null;

-- VIEW 1 · nuôi màn Văn phòng ---------------------------------
-- VALUES list đảm bảo LUÔN trả đủ 3 sàn, kể cả khi mảng đó 0 việc,
-- để văn phòng không bị khuyết sàn.
create or replace view v_van_phong as
select
  m.mang,
  count(t.id) filter (where t.trang_thai in ('approved','doing')) as dang_lam,
  count(t.id) filter (where t.trang_thai = 'draft')               as cho_duyet,
  count(t.id) filter (where t.trang_thai = 'done')                as xong,
  count(t.id) filter (where t.trang_thai = 'blocked')             as vuong,
  round(avg(t.tin_cay), 1)                                        as tin_cay_tb
from (values ('lab'),('elearn'),('biz')) as m(mang)
left join tasks t on t.mang = m.mang and t.ngay = current_date
group by m.mang;

-- VIEW 2 · biểu đồ 7 ngày -------------------------------------
create or replace view v_dinh_duong_ngay as
select ngay,
       sum(kcal)::int    as kcal,
       sum(protein)::int as protein,
       count(*)          as so_bua
from food_log
group by ngay;

-- REALTIME ----------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['daily_report','tasks','questions','agent_runs'] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
