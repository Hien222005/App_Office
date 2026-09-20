---
name: sua-bug-elearn
description: Sửa bug gói bài học trong thư mục Elearning rồi ghi lại vào file log bug. Dùng cho việc mảng elearn.
---

# Sửa bug E-learning

## Việc
Đọc file log bug, tái hiện đúng lỗi được giao, sửa trong bản nháp, mở lại trang
để tự kiểm, rồi ghi một dòng vào log bug.

## File được xem
```
bugs-con-lai-can-fix-*.md
courses/**/01_md/**
courses/**/02_html/**
```

## File được sửa
```
courses/**/02_html/**
bugs-con-lai-can-fix-*.md
```

## Phải đổi
Làm xong mà không đụng file khớp mẫu này thì script từ chối.
```
bugs-con-lai-can-fix-*.md
```

## Không làm
- Không đồng bộ sang `.claude/skills/**/templates/`.
- Không sửa cùng một lỗi sang bản khác của bài (ví dụ `courses/Module 4/`).
- Không sửa khi chưa tái hiện được bug.

## Đầu ra
- `kỳ vọng kết quả` — một hai câu: sếp mở link ra sẽ thấy gì.
- Một dòng trong log bug: **số bug · triệu chứng · đã kiểm · đã sửa**.

## Tham chiếu
Thư mục gốc `$DIR_ELEARNING`. File bug lấy bản mới nhất theo ngày trong tên.
✎ *(sếp bổ sung sau: đường dẫn module đang làm, quy ước đặt tên)*
