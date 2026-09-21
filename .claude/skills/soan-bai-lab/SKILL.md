---
name: soan-bai-lab
description: Viết bản tóm tắt tài liệu Lab cho buổi dạy hôm sau. Dùng cho việc mảng lab.
mang: lab
ten_mang: Lab Coach
thu_muc: $DIR_LAB
tu_tao_thu_muc: true
mau: '#22E5C4'
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
Một file `san-pham/lab/<ngày>.html`, **dưới 700 chữ**.

**Chép [references/khuon-tom-tat.html](references/khuon-tom-tat.html) rồi điền vào.**
Đừng tự viết HTML từ đầu — khuôn đã lo phần nhìn: đọc được trên điện thoại, sáng
và tối, năm mục đánh số màu riêng, ô riêng cho các bước và cho thuật ngữ.

Chỉ thay chỗ `{{…}}`. Giữ nguyên phần `<style>`.

| Mục | Thẻ dùng trong khuôn |
|---|---|
| 1 · Mục tiêu bài | `<p>` |
| 2 · Flow toàn bộ | `<ol class="flow">` — mỗi bước một `<li>` |
| 3 · Kỹ thuật cần áp dụng | `<ul>`, tên kỹ thuật bọc `<b>` |
| 4 · Nộp nhóm hay cá nhân | `<ul>`, hai dòng Nhóm / Cá nhân |
| 5 · Giải thích thuật ngữ | `<dl>` — `<dt>` thuật ngữ, `<dd>` giải thích |

Tên file, lệnh, đường dẫn bọc `<code>`. Chỗ tự suy ra thì mở đầu bằng
`<span class="suy">suy luận</span>`.

Cộng `kỳ vọng kết quả` — một hai câu sếp mở link ra sẽ thấy gì.

## Tham chiếu
**Mọi mẫu đường dẫn trên đây tính từ GỐC PHÒNG**, tức `DIR_LAB` trong `agent/.env`.
Gốc đó chứa hai thư mục:

```
<DIR_LAB>/
├── repo/        bản sao repo bài học · chỉ đọc · thay mỗi buổi
└── san-pham/    chỗ DUY NHẤT được ghi
```

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
