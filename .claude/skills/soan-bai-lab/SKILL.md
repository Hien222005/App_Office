---
name: soan-bai-lab
description: Viết bản tóm tắt tài liệu Lab cho buổi dạy hôm sau. Dùng cho việc mảng lab.
---

# Soạn bài Lab Coach

## Việc
Đọc tài liệu Lab của buổi, viết bản tóm tắt cho người sắp đứng lớp.
Mặc định viết **trước một ngày**. Tài liệu chỉ có sáng cùng ngày thì sáng viết.

## File được xem
Mẫu tính từ gốc phòng Lab (`DIR_LAB` trong `agent/.env`), không viết lại đường dẫn tuyệt đối.
```
**
```

## File được sửa
```
san-pham/lab/*.md
```

## Phải đổi
```
san-pham/lab/*.md
```

## Không làm
- Không sửa tài liệu gốc.
- Không bịa bước hay số liệu không có trong tài liệu.
- Không chép nguyên văn. Được nhắc **tên** chỉ số nội bộ, không ghi **con số** của tài liệu.
- Chỗ nào tự suy ra thì phải ghi rõ là suy luận.

## Đầu ra
Bản tóm tắt **dưới 700 chữ**, đúng bốn mục theo thứ tự:

1. `Mục tiêu bài`
2. `Các bước thao tác`
3. `Ba chỗ hay vướng`
4. `Hai câu học viên sẽ hỏi`

Cộng `kỳ vọng kết quả` — một hai câu sếp mở link ra sẽ thấy gì.

## Tham chiếu
✎ *(sếp bổ sung sau: tài liệu Lab lấy ở đâu, buổi nào học bài nào)*
