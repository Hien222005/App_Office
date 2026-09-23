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

Luật và khuôn: **theo `van-phong`**. Đây chỉ là phần riêng của phòng.

## Việc
Đọc repo bài học của buổi, viết bản tóm tắt cho **người sắp đứng lớp, có background BA**
— không phải cho học viên. Repo do Hiển chủ động gửi, mỗi buổi một repo.

Mặc định viết **trước một ngày**. Repo chỉ có sáng cùng ngày thì sáng viết.
Người đọc biết nghiệp vụ nhưng **không rành code** — thuật ngữ kỹ thuật nào cũng giải
thích bằng một câu đời thường. Ngắn gọn, chỉ điểm chính.

## File được xem
`repo/` là bản sao repo bài học, **thay mỗi buổi**. Đọc từ đó, không đọc ở đâu khác.
```
repo/**
san-pham/lab/*.html
```

## File được sửa
```
san-pham/lab/*.html
```

## Không làm
- Được nhắc **tên** chỉ số nội bộ của tài liệu, không ghi **con số**.

## Mục của sản phẩm
Một file `san-pham/lab/<ngày>.html`, **dưới 700 chữ**.

Dùng **khuôn sản phẩm chung** trong Skill `van-phong`
(`van-phong/references/khuon-san-pham.html`).

**Dòng chính** (`<dl class="tom">`): `Mục tiêu` — học viên làm ra cái gì · `Nộp nhóm` ·
`Nộp cá nhân`.

| Mục | Thẻ dùng trong khuôn |
|---|---|
| Flow toàn bộ | `<ol class="flow">` — mỗi bước một `<li>` |
| Kỹ thuật cần áp dụng | `<ul>`, tên kỹ thuật bọc `<b>` |
| Giải thích thuật ngữ | `<dl class="tn">` — `<dt>` thuật ngữ, `<dd>` giải thích |

Rồi hai mục bắt buộc `Chưa chắc` và `Nguồn`.

Tên file, lệnh, đường dẫn bọc `<code>`.

## Gốc phòng

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
