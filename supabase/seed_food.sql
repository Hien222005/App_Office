-- ============================================================
-- VĂN PHÒNG AGENT · seed_food.sql
-- Bảng tra món ăn khởi điểm — 36 món.
--
-- ⚠ SỐ LIỆU LÀ BẢN NHÁP, BẠN PHẢI RÀ LẠI.
-- Món chế biến (phở, bún chả, cơm tấm) tính trên 100g CẢ BÁT/ĐĨA
-- đã hoàn chỉnh, nên số thấp hơn nguyên liệu khô rất nhiều.
-- Sửa dòng nào thấy lệch với khẩu phần thật của bạn.
-- ============================================================

insert into food_db (slug, ten, kcal_100g, protein_100g, carb_100g, fat_100g, khau_phan_mac_dinh_g, nguon) values
-- ─── Món nước / món chính Việt ───
('pho-bo-tai',      'Phở bò tái',              115,  6.5, 15.0,  3.0, 450, 'nhap'),
('pho-ga',          'Phở gà',                  105,  6.0, 15.0,  2.2, 450, 'nhap'),
('bun-bo-hue',      'Bún bò Huế',              120,  7.0, 13.0,  4.2, 450, 'nhap'),
('bun-cha',         'Bún chả',                 140,  8.0, 14.0,  5.5, 400, 'nhap'),
('com-tam-suon',    'Cơm tấm sườn',            180,  9.0, 24.0,  5.5, 400, 'nhap'),
('banh-cuon',       'Bánh cuốn',               128,  3.8, 22.0,  2.6, 250, 'nhap'),
('xoi',             'Xôi',                     190,  3.5, 38.0,  2.8, 200, 'nhap'),
('banh-mi-thit',    'Bánh mì thịt',            250, 10.0, 32.0,  8.5, 180, 'nhap'),
-- ─── Tinh bột ───
('com-trang',       'Cơm trắng',               130,  2.7, 28.0,  0.3, 200, 'nhap'),
('com-gao-lut',     'Cơm gạo lứt',             111,  2.6, 23.0,  0.9, 180, 'nhap'),
('bun-tuoi',        'Bún tươi',                110,  1.7, 25.0,  0.1, 200, 'nhap'),
('banh-pho-tuoi',   'Bánh phở tươi',           141,  2.4, 32.0,  0.2, 200, 'nhap'),
('khoai-lang',      'Khoai lang luộc',          86,  1.6, 20.0,  0.1, 150, 'nhap'),
('yen-mach',        'Yến mạch (khô)',          389, 16.9, 66.0,  6.9,  50, 'nhap'),
('mi-tom',          'Mì tôm',                  448,  9.4, 63.0, 17.0,  75, 'nhap'),
('banh-mi-khong',   'Bánh mì không',           265,  9.0, 49.0,  3.2,  80, 'nhap'),
-- ─── Đạm ───
('uc-ga',           'Ức gà (không da)',        165, 31.0,  0.0,  3.6, 150, 'nhap'),
('dui-ga',          'Đùi gà',                  209, 26.0,  0.0, 11.0, 150, 'nhap'),
('ga-ran',          'Gà rán',                  260, 19.0, 13.0, 15.0, 150, 'nhap'),
('thit-bo-than',    'Thịt bò thăn',            217, 26.0,  0.0, 12.0, 150, 'nhap'),
('thit-lon-nac',    'Thịt lợn nạc',            143, 21.0,  0.0,  6.0, 150, 'nhap'),
('ca-hoi',          'Cá hồi',                  208, 20.0,  0.0, 13.0, 150, 'nhap'),
('ca-basa',         'Cá basa',                 124, 15.0,  0.0,  7.0, 150, 'nhap'),
('tom',             'Tôm',                      99, 24.0,  0.2,  0.3, 120, 'nhap'),
('trung-ga',        'Trứng gà',                155, 13.0,  1.1, 11.0,  55, 'nhap'),
('dau-phu',         'Đậu phụ',                  76,  8.0,  1.9,  4.8, 100, 'nhap'),
('whey-protein',    'Whey protein (bột)',      400, 80.0,  8.0,  5.0,  30, 'nhap'),
-- ─── Sữa ───
('sua-tuoi-kd',     'Sữa tươi không đường',     42,  3.4,  5.0,  1.0, 250, 'nhap'),
('sua-chua-kd',     'Sữa chua không đường',     61,  3.5,  4.7,  3.3, 100, 'nhap'),
('sua-chua-hy-lap', 'Sữa chua Hy Lạp',          59, 10.0,  3.6,  0.4, 150, 'nhap'),
-- ─── Rau / quả / khác ───
('rau-muong-luoc',  'Rau muống luộc',           23,  2.6,  3.1,  0.2, 150, 'nhap'),
('rau-cai-luoc',    'Rau cải luộc',             20,  1.8,  3.0,  0.2, 150, 'nhap'),
('salad-tron',      'Salad trộn',               45,  1.5,  5.0,  2.2, 150, 'nhap'),
('chuoi',           'Chuối',                    89,  1.1, 23.0,  0.3, 120, 'nhap'),
('bo-qua',          'Bơ (quả)',                160,  2.0,  9.0, 15.0, 100, 'nhap'),
('hat-dieu',        'Hạt điều',                553, 18.0, 30.0, 44.0,  30, 'nhap')
on conflict (slug) do nothing;

-- ⚠ Mục tiêu dinh dưỡng — THAY HAI SỐ NÀY rồi mới chạy.
-- insert into muc_tieu (id, kcal_ngay, protein_ngay)
-- values (1, 2200, 150)
-- on conflict (id) do update
--   set kcal_ngay = excluded.kcal_ngay,
--       protein_ngay = excluded.protein_ngay,
--       cap_nhat_luc = now();
