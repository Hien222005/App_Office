---
name: van-phong
description: Luật chung và khung sản phẩm của Văn Phòng Agent, áp cho MỌI phòng. Nạp khi chạy /report, /lam hoặc /chot, hoặc khi làm bất kỳ việc nào của bất kỳ phòng nào.
---

# Văn Phòng Agent

Một phiên mỗi ngày. `/report` trình bảng để sếp chốt · `/lam` làm việc đã chốt ·
`/chot` ghi vào file gốc rồi đóng phiên.

> Phiên phải mở trong thư mục `agent-app`, không phải thư mục cha — nếu không thì
> hook không ghi nhật ký và không lệnh `xong` nào qua được.

## Đạt

- Chỉ làm việc mà `viec.mjs doc` giao. Việc nằm trong `việc_không_giao` thì bỏ qua.
- Chỉ sửa file trong bản nháp, trong phạm vi Skill của việc đó.
- Sau lần sửa cuối, **mở lại file để tự kiểm** rồi mới báo xong.
- Báo xong bằng một lệnh, một câu: `viec.mjs xong <id> "kỳ vọng kết quả"`.
- Chưa chắc thì **hỏi**, đừng đoán: `viec.mjs hoi <id> "câu hỏi" "1" "2" "3"`.

## Trượt

- Sửa file thật ngoài bản nháp.
- Báo xong khi chưa mở lại file.
- Tự chốt việc, tự duyệt kết quả, tự ghi vào file gốc — đó là việc của sếp.
- Đoán thay sếp thay vì hỏi kèm đúng 3 gợi ý.

## Hai câu chống bịa

1. Không bịa file, dữ liệu, hay bằng chứng.
2. Muốn nói "xong" thì phải có kết quả chạy mới **trong phiên này**.

## Bốn lệnh

| Lệnh | Khi nào |
|---|---|
| `node agent/viec.mjs doc` | đầu `/lam`, lấy việc được giao |
| `node agent/nhap.mjs mo <brief.json>` | trước khi sửa bất cứ gì |
| `node agent/viec.mjs xong <id> "kỳ vọng"` | làm xong |
| `node agent/viec.mjs hoi <id> "hỏi" "1" "2" "3"` | chưa chắc |

## Khung chung cho mọi việc

Mọi phòng làm theo cùng một khung. Skill của phòng **chỉ thêm** phần riêng, không
đặt lại luật, và không được nới luật nào ở đây.

**1 · Nguồn — đọc trước khi viết chữ nào**
- Brief (`nhiem_vu` là dòng sếp ghi trong Kế hoạch).
- **Toàn bộ** thư mục đề bài của phòng (Skill ghi tên thư mục). Brief không trỏ tới
  file nào thì vẫn đọc hết thư mục đó, kể cả `DOC-TRUOC.md`: sếp hay ghi đề bài vào đó.
- Brief chỉ có vài chữ và thư mục đề bài không nói gì thêm thì **hỏi**, đừng tự đặt đề.

**2 · Sản phẩm — chỗ sếp mở link ra duyệt**
- Chép [khuon-san-pham.html](references/khuon-san-pham.html) rồi điền. Đừng tự viết
  HTML từ đầu. Khuôn đọc được trên điện thoại, sáng và tối.
- File `.md` mở trên điện thoại chỉ ra chữ trơn, nên sản phẩm luôn là `.html`.
- Tên mục và số mục: Skill của phòng quy định.
- Hai mục cuối **bắt buộc**: `Chưa chắc` và `Nguồn`.
- Ý nào tự suy ra thì mở đầu bằng `<span class="suy">suy luận</span>`.
- Ý nào lấy từ ngoài tài liệu của sếp (trang web…) thì **phải có link** trong mục
  `Nguồn`. Không có link = không được viết ý đó.

**3 · Nhật ký — để sếp biết agent đã làm gì**
Skill có thư mục nhật ký thì ghi `<mã-việc>.md`, đúng bốn mục:
```
## Đã đọc gì        file nào, trang nào
## Đã làm gì        các bước, theo thứ tự
## Tự suy ra        chỗ không có trong nguồn mà mình tự suy
## Chưa chắc        còn mơ hồ thì phải HỎI, đừng chỉ ghi vào đây
```

**4 · Báo xong**
`kỳ vọng kết quả` một hai câu: sếp mở link ra sẽ thấy gì.

## Thêm một phòng mới

Tạo `.claude/skills/<tên>/SKILL.md` với frontmatter `mang`, `ten_mang`, `thu_muc`,
`mau`. Thân Skill chỉ cần: **Việc** · **File được xem** · **File được sửa** ·
**Phải đổi** · **Không làm** · **Mục của sản phẩm**. Còn lại lấy từ khung trên.

## Tham chiếu

- [nhan.md](references/nhan.md) — bảy nhãn và ai được đổi nhãn nào.
- [khuon-san-pham.html](references/khuon-san-pham.html) — khuôn sản phẩm dùng chung.

Nạp thêm Skill của việc (tên nằm ở `skill` trong brief) để biết được đọc và sửa file nào.
