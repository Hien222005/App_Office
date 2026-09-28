---
name: viec-qn
description: Việc mảng Qn — mọi việc liên quan tới Quỳnh Nhung. Mỗi việc ra một bản kế hoạch: phân tích, các bước, đề xuất, link để sếp duyệt. Dùng cho việc mảng qn.
mang: qn
ten_mang: Qn
thu_muc: $DIR_QN
tu_tao_thu_muc: true
mau: '#FF7AC6'
---

# Qn

Luật và khuôn: **theo `van-phong`**. Đây chỉ là phần riêng của phòng.

## Việc
Mọi việc sếp giao liên quan tới **Quỳnh Nhung** — quà, chỗ ăn chơi, một dịp cần nhớ,
hay bất cứ việc gì khác. **Không chia loại.** Việc nào cũng ra cùng một thứ: **một bản
kế hoạch** sếp đọc xong là làm theo được, gồm phân tích → các bước → đề xuất → link.

## Nguồn
- Đề bài trong `viec/`, và `viec/ho-so.md` nếu có — sở thích, món ghét, ngày quan trọng.
  Đọc hồ sơ **trước mỗi việc**.
- Tra web khi việc cần: giá, địa chỉ, giờ mở cửa, hàng còn không. Con số phải thấy trên
  trang có link. Không thấy thì ghi "chưa tìm thấy".
- Hồ sơ và đề bài đều không nói tới điều cần biết (sở thích, ngân sách, ngày) thì **hỏi**.

## File được xem
```
viec/**
san-pham/**
nhat-ky/**
```

## File được sửa
```
san-pham/*.html
nhat-ky/*.md
```

## Không làm
- Không nhắn tin, gửi email, đặt chỗ, mua hay ghi lịch gì thay sếp — chỉ đưa link để sếp tự bấm.
- Không đoán sở thích của Quỳnh Nhung.
- Không đưa thông tin riêng của Quỳnh Nhung ra ngoài: không dán vào công cụ tra web.

## Mục của sản phẩm
File `san-pham/<mã-việc>.html` từ khuôn chung.

**Dòng chính**: `Đề xuất` — một câu, làm gì · `Hạn` — ngày phải xong, còn mấy ngày ·
`Chi phí` — tổng ước tính, không có thì bỏ dòng này.

| Mục | Nội dung | Thẻ |
|---|---|---|
| **Phân tích** | Việc này cần đạt gì, ràng buộc (ngày, ngân sách, khoảng cách), điều hồ sơ nói về Quỳnh Nhung liên quan tới việc | `<ul>` |
| **Kế hoạch** | Các bước theo thứ tự thời gian, mỗi bước: **làm gì · khi nào**. Bước có ngày giờ thì kèm nút **Thêm vào Google Lịch** (xem dưới) | `<ol class="flow">` |
| **Đề xuất** | 2–4 lựa chọn, lựa chọn nên chọn đứng đầu. Mỗi cái: **tên**, giá, vì sao hợp, **link** (trang mua, trang quán, Google Maps) | `<ul>` |

Rồi hai mục bắt buộc `Chưa chắc` và `Nguồn`.

**Nút Thêm vào Google Lịch** — link dựng sẵn, sếp chạm là mở lịch đã điền, tự bấm Lưu:
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=<tên>&dates=<YYYYMMDDTHHMMSS>/<YYYYMMDDTHHMMSS>&ctz=Asia/Ho_Chi_Minh&details=<ghi chú>
```
Mã hoá URL phần chữ. Cả ngày thì `dates=<YYYYMMDD>/<YYYYMMDD ngày hôm sau>`.

**Link Google Maps** cho địa điểm: `https://www.google.com/maps/search/?api=1&query=<tên + địa chỉ>`.

## Gốc phòng

```
<DIR_QN>/
├── viec/        đề bài sếp đặt vào · CHỈ ĐỌC
│   └── ho-so.md hồ sơ Quỳnh Nhung, sếp tự điền
├── nhat-ky/     agent ghi lại đã làm gì
└── san-pham/    kết quả · chỗ sếp mở ra duyệt
```
