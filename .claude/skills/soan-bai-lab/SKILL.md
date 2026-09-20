---
name: soan-bai-lab
description: Viết bản tóm tắt tài liệu Lab cho buổi dạy hôm sau. Dùng cho việc mảng lab.
---

# Soạn bài Lab Coach

## Việc
Đọc repo bài học của buổi, viết bản tóm tắt cho **người sắp đứng lớp, có background BA**
— không phải cho học viên. Repo do Hiển chủ động gửi, mỗi buổi một repo.

Mặc định viết **trước một ngày**. Repo chỉ có sáng cùng ngày thì sáng viết.

## Thiết kế
Đơn giản, ngắn gọn, tập trung điểm chính. Người đọc biết nghiệp vụ nhưng **không rành code**
— thuật ngữ kỹ thuật nào cũng phải giải thích bằng một câu đời thường.

## File được xem
`repo/` là bản sao repo bài học, **thay mỗi buổi**. Đọc từ đó, không đọc ở đâu khác.
```
repo/**
san-pham/lab/*.html
```

## File được sửa
Chỉ ghi bản tóm tắt. **Không đụng vào `repo/`** — đó là tài liệu gốc.
```
san-pham/lab/*.html
```

## Phải đổi
```
san-pham/lab/*.html
```

## Không làm
- Không sửa bất cứ gì trong `repo/`.
- Không bịa bước hay số liệu không có trong tài liệu.
- Không chép nguyên văn. Được nhắc **tên** chỉ số nội bộ, không ghi **con số** của tài liệu.
- Chỗ nào tự suy ra thì phải ghi rõ là suy luận.

## Đầu ra
Một file `san-pham/lab/<ngày>.html` — trang đọc được trên điện thoại, **dưới 700 chữ**,
đúng năm mục theo thứ tự:

1. `Mục tiêu bài`
2. `Flow toàn bộ của bài`
3. `Các kỹ thuật cần áp dụng`
4. `Nộp nhóm hay cá nhân`
5. `Giải thích các thuật ngữ về code`

Cộng `kỳ vọng kết quả` — một hai câu sếp mở link ra sẽ thấy gì.

## Tham chiếu
Gốc phòng: `DIR_LAB` trong `agent/.env`, chứa `repo/` và `san-pham/`.

Repo bài học thường có sẵn các chỗ sau — đọc đúng chỗ thì đỡ đoán:

| Cần gì | Đọc ở đâu |
|---|---|
| Mục tiêu · sản phẩm phải nộp · quick start | `repo/README.md` |
| Flow từng bước | `repo/docs/STEP_BY_STEP.md` · thứ tự file `repo/src/task*.py` |
| Đầu vào đầu ra mỗi bước | `repo/docs/MODULE_CONTRACTS.md` · `repo/src/contracts.py` |
| Chấm điểm | `repo/docs/GRADING_RUBRIC.md` |
| Nộp nhóm hay cá nhân | `repo/group_project/` — có thư mục `evaluation/` và `ịndividual/` |

Repo buổi khác có thể khác cấu trúc: đọc `README.md` trước, rồi lần theo đó.
Thiếu mục nào thì ghi rõ "repo không có mục này", **đừng bịa**.
