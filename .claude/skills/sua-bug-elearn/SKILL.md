---
name: sua-bug-elearn
description: Sửa bug gói bài học trong thư mục Elearning rồi ghi lại vào file log bug. Dùng cho việc mảng elearn.
---

# Sửa bug E-learning

## Việc
Đọc mục bug được giao trong file log, tái hiện lỗi, sửa trong bản nháp, mở lại trang
để tự kiểm, rồi ghi một mục vào file log.

Thư mục Elearning có **hai loại thư mục khoá học**:

| Loại | Ví dụ | Vai trò |
|---|---|---|
| **Nguồn** | `courses/Module 4/` | nội dung gốc (`.md`, ảnh, video). **Chỉ đọc.** |
| **Build** | `courses/Test_Module 4_Coding/` | `00_raw → 01_md → 02_html → 03_scorm`. **Chỗ sửa bug.** |

## File được xem
Đọc không bị script chặn; danh sách này là chỉ đường.
```
bugs-con-lai-can-fix-*.md
xac-minh-bug-sheet-*.md
courses/**
```

## File được sửa
Chỉ thư mục build. Thư mục nguồn và `.claude/` của Elearning nằm ngoài.
```
courses/Test_*_Coding/**
bugs-con-lai-can-fix-*.md
```

## Phải đổi
Sửa xong mà không ghi log thì script từ chối — đây là quy trình team đã chốt:
*"mọi yêu cầu sửa đều được log vào file này — tên bug + đã sửa gì"*.
```
bugs-con-lai-can-fix-*.md
```

## Không làm
- **Không đồng bộ sang `.claude/skills/*/templates/`** của Elearning. Ba skill build
  (`elearning-raw-to-md`, `elearning-md-to-html`, `elearning-html-to-scorm`) giữ khuôn
  chung; sửa vào đó là đổi mọi khoá học cùng lúc.
- **Không sửa sang module khác.** Mỗi file log tự khai `**Phạm vi sửa**` ở đầu — theo
  đúng dòng đó. Brief dùng `chi_sua` để chặn bằng code.
- **Không đụng thư mục nguồn** `courses/Module N/` — đó là bản gốc.
- Không sửa khi chưa tái hiện được bug.

## Đầu ra
- `kỳ vọng kết quả` — một hai câu: sếp mở link ra sẽ thấy gì.
- Một mục mới trong file log, theo đúng khuôn đang dùng:

```markdown
## <số>. <tên bug ngắn>

**Báo cáo của user**: ...
**Điều tra**: file nào, rule nào, tái hiện ra sao
**Kết luận**: đã sửa gì, ở file nào
```

## Tham chiếu
Gốc phòng: `DIR_ELEARNING` trong `agent/.env`.

- File log lấy bản **mới nhất theo ngày trong tên**.
- CSS và JS của từng tính năng nằm trong `02_html/` chia theo thư mục:
  `questions/` (`sequential-quiz.css`, `radio-quiz.css`, `review-quiz.css`, `noi-tu.css`),
  `shared/` (`core.css`, `core.js`, `gating.js`, `scorm-api.js`), `effects/`, `interactive/`,
  `readings/`, `summary/`.
- Trang bài học: `02_html/unit-N.html`, `unit-8-quiz.html`, `unit-9-summary.html`.
