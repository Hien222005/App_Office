---
name: hoc-thac-si
description: Việc mảng Thạc sĩ — tìm chương trình, học bổng, hồ sơ; làm bài và tóm tắt tài liệu. Dùng cho việc mảng thacsi.
mang: thacsi
ten_mang: Thạc sĩ
thu_muc: $DIR_THACSI
tu_tao_thu_muc: true
mau: '#4D9BFF'
---

# Thạc sĩ

Luật, khuôn sản phẩm, nhật ký, cách báo xong: **theo Skill `van-phong`** — nguồn duy nhất.
File này chỉ ghi phần riêng của phòng: việc gì, được đụng file nào, sản phẩm có những mục nào.

## Việc
Hai loại việc, nhìn đề bài là biết loại nào:

| Loại | Ví dụ | Nguồn |
|---|---|---|
| **Tìm hiểu** | tìm trường, học bổng, hạn nộp hồ sơ | đề bài trong `viec/` + **tra web** |
| **Làm bài** | tóm tắt chương, dàn ý tiểu luận | đề bài và tài liệu trong `viec/` |

Sếp là **người học và người nộp hồ sơ**. Sản phẩm để sếp đọc xong là **quyết được hoặc
dùng được**, không phải để nộp thay sếp.

## Nguồn
- Đọc **hết** `viec/`, kể cả `DOC-TRUOC.md`. Đề bài, background và yêu cầu của sếp
  thường ghi ở đó.
- Việc tìm hiểu: tra web, **ưu tiên trang chính thức** của trường hoặc quỹ học bổng.
  Trang tổng hợp, diễn đàn chỉ dùng để tìm ra tên, rồi mở trang chính thức kiểm lại.
- Con số (học phí, % học bổng, hạn nộp, điểm IELTS) phải thấy tận mắt trên trang có
  link. Không thấy thì ghi "chưa tìm thấy trên trang chính thức".

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

## Phải đổi
```
san-pham/*.html
nhat-ky/*.md
```

## Không làm
- **Không sửa bất cứ gì trong `viec/`** — đó là tài liệu gốc của sếp.
- Không nộp hồ sơ, không điền form, không gửi email thay sếp.
- Không chép nguyên văn tài liệu quá một câu.
- Không viết như thể sếp là tác giả.

## Mục của sản phẩm
File `san-pham/<mã-việc>.html` từ khuôn chung.

**Việc tìm hiểu** — ví dụ tìm trường:

| Mục | Thẻ |
|---|---|
| 1 · Kết luận | `<p>` — 2–3 lựa chọn đáng nộp nhất và vì sao, trong một đoạn |
| 2 · Bảng so sánh | `<ul>`, mỗi lựa chọn một `<li>`: **tên**, nước, học bổng %, hạn nộp, yêu cầu đầu vào |
| 3 · Hợp với sếp ở chỗ nào | `<ul>` — đối chiếu với background sếp ghi trong `viec/` |
| 4 · Việc sếp cần làm tiếp | `<ol class="flow">` — theo thứ tự hạn nộp |

**Việc làm bài** — ví dụ tóm tắt chương:

| Mục | Thẻ |
|---|---|
| 1 · Ý chính | `<p>` |
| 2 · Các bước / lập luận | `<ol class="flow">` |
| 3 · Thuật ngữ | `<dl>` |
| 4 · Câu hỏi để tự kiểm | `<ol>` |

Rồi hai mục bắt buộc `Chưa chắc` và `Nguồn`.

## Tham chiếu
**Mọi mẫu đường dẫn trên đây tính từ GỐC PHÒNG**, tức `DIR_THACSI` trong `agent/.env`:

```
<DIR_THACSI>/
├── viec/        đề bài sếp đặt vào · CHỈ ĐỌC
├── nhat-ky/     agent ghi lại đã làm gì
└── san-pham/    kết quả · chỗ sếp mở ra duyệt
```
