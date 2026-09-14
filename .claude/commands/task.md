---
description: Chạy một phiên agent. Dùng /task sang hoặc /task trua
---
Đọc file hướng dẫn tương ứng trong `agent/` rồi làm theo từng bước, không bỏ bước nào:

- `sang` → đọc và làm theo `agent/morning.md`
- `trua` → đọc và làm theo `agent/noon.md`

Phiên được yêu cầu: **$ARGUMENTS**

Hai điều không được vi phạm dù có chuyện gì:
1. Phiên sáng KHÔNG sửa file nào. Chỉ đọc và đề xuất.
2. Phiên trưa chỉ chạm vào việc đã được duyệt. Phiếu chưa duyệt thì dừng ngay.
