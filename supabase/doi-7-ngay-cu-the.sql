-- ============================================================
-- VĂN PHÒNG AGENT · doi-7-ngay-cu-the.sql
--
-- CHỈ DÀNH CHO DATABASE ĐANG CHẠY, đã qua doi-6.
-- Máy mới thì KHÔNG chạy file này — schema.sql đã có sẵn.
--
-- Thêm cột `ngay` cho bảng ke_hoach: sếp chọn NGÀY CỤ THỂ trên lịch, thay vì
-- chỉ chọn được thứ trong tuần.
--
-- TRƯỚC KHI CHẠY: node agent/sao-luu.mjs
-- ============================================================

begin;

-- Ba cách xếp một việc, xét theo đúng thứ tự này:
--   ngay có           → CHỈ đúng ngày đó, một lần
--   ngay trống, thu có → thứ đó, LẶP MỌI TUẦN
--   cả hai trống       → ngày nào cũng lên bảng
--
-- Giữ cả `thu` và `tuan` để dòng cũ không mất nghĩa: "Soạn tóm tắt buổi Lab" đang là
-- việc lặp, đổi sang ngày cụ thể là biến một việc hằng tuần thành việc một lần.
alter table ke_hoach add column if not exists ngay date;

create index if not exists ke_hoach_theo_ngay_idx on ke_hoach (ngay) where bat and ngay is not null;

commit;

-- ============================================================
-- KIỂM — phải ra  1 · 1
--
-- select
--   (select count(*) from information_schema.columns
--      where table_name='ke_hoach' and column_name='ngay')                as co_cot_ngay,
--   (select count(*) from pg_indexes
--      where tablename='ke_hoach' and indexname='ke_hoach_theo_ngay_idx') as co_index;
--
-- RLS: bảng ke_hoach đã có policy từ doi-6, thêm cột không ảnh hưởng. Không phải chạy lại.
-- ============================================================
