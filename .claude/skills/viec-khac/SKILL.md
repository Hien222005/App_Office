---
name: viec-khac
description: Việc mảng Khác — việc lặt vặt không thuộc phòng nào: tìm hiểu, tóm tắt, soạn tài liệu. Dùng cho việc mảng khac.
mang: khac
ten_mang: Khác
thu_muc: $DIR_KHAC
tu_tao_thu_muc: true
mau: '#FFB020'
---

# Khác

Luật và khuôn: **theo `van-phong`**. Đây chỉ là phần riêng của phòng.

## Việc
Việc lặt vặt sếp giao mà không thuộc phòng nào. Nhìn đề bài là biết loại nào:

| Loại | Ví dụ | Nguồn |
|---|---|---|
| **Tìm hiểu** | so sánh sản phẩm, tra thủ tục, tìm thông tin | đề bài trong `viec/` + **tra web** |
| **Làm tài liệu** | tóm tắt file, soạn dàn ý, viết nháp | đề bài và tài liệu trong `viec/` |

Việc rõ ràng thuộc một phòng khác (Lab, Thạc sĩ, Qn…) thì **hỏi** sếp có muốn chuyển
sang phòng đó không, đừng tự làm theo luật phòng khác.

## Tra web
- Chỉ việc tìm hiểu mới tra web, **ưu tiên trang chính thức**. Con số phải thấy trên trang
  có link. Không thấy thì ghi "chưa tìm thấy trên trang chính thức".

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
- Không mua, đặt, gửi, điền form hay đăng ký gì thay sếp.

## Mục của sản phẩm
File `san-pham/<mã-việc>.html` từ khuôn chung.

**Dòng chính**: `Kết luận` — một câu · `Việc tiếp theo` — một câu.

| Mục | Thẻ |
|---|---|
| Nội dung chính | `<ul>` hoặc `<ol class="flow">` tuỳ việc |
| Thuật ngữ (nếu có) | `<dl class="tn">` |

Rồi hai mục bắt buộc `Chưa chắc` và `Nguồn`.

## Gốc phòng

```
<DIR_KHAC>/
├── viec/        đề bài sếp đặt vào · CHỈ ĐỌC
├── nhat-ky/     agent ghi lại đã làm gì
└── san-pham/    kết quả · chỗ sếp mở ra duyệt
```
