---
name: van-phong
description: Luật chung và khung sản phẩm của Văn Phòng Agent, áp cho MỌI phòng. Nạp khi chạy /report, /lam hoặc /chot, hoặc khi làm bất kỳ việc nào của bất kỳ phòng nào.
---

# Văn Phòng Agent

Một phiên mỗi ngày. `/report` trình bảng để sếp chốt · `/lam` làm việc đã chốt ·
`/chot` ghi vào file gốc rồi đóng phiên.

> Phiên phải mở trong thư mục `agent-app`, không phải thư mục cha — nếu không thì
> hook không ghi nhật ký và không lệnh `xong` nào qua được.

## Luật

| Đạt | Trượt |
|---|---|
| Chỉ làm việc `viec.mjs doc` giao; việc trong `việc_không_giao` thì bỏ qua | Tự nhận thêm việc |
| Chỉ sửa file trong bản nháp, trong phạm vi Skill của việc | Sửa file thật ngoài bản nháp |
| Sửa xong **mở lại file để tự kiểm** rồi mới báo xong | Báo xong khi chưa mở lại file |
| Chưa chắc thì **hỏi**, kèm đúng 3 gợi ý | Đoán thay sếp |
| Chốt việc, duyệt kết quả, ghi vào file gốc là việc của sếp | Tự làm ba thứ đó |

Hai câu chống bịa: **không bịa file, dữ liệu hay bằng chứng**; muốn nói "xong" thì phải
có kết quả chạy mới **trong phiên này**.

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
- Đầu trang: khối **dòng chính** `<dl class="tom">`, 2–4 dòng nhãn : giá trị — sếp
  đọc xong khối này là biết kết quả. Nhãn nào: Skill của phòng quy định.
- Sau đó các mục `<section class="muc">`. Tên và số mục: Skill quy định. Màu nền tự
  xoay vòng, **không tự đặt màu**.
- Hai mục cuối **bắt buộc**: `<section class="muc cc">` Chưa chắc, rồi
  `<section class="muc ng">` Nguồn.
- Ý nào tự suy ra thì mở đầu bằng `<span class="suy">Suy luận ·</span>`.
- Ý nào lấy từ ngoài tài liệu của sếp (trang web…) thì **phải có link** trong mục
  `Nguồn`. Không có link = không được viết ý đó.
- **Không chép nguyên văn nguồn quá một câu**, diễn đạt lại bằng lời mình.
- **Không đụng vào thư mục tài liệu gốc của sếp** (`viec/`, `repo/`, `courses/Module N/`…):
  đọc thì được, sửa thì không. "File được sửa" của Skill là danh sách đóng.

**3 · Nhật ký — để sếp biết agent đã làm gì**
Skill có thư mục nhật ký thì ghi `<mã-việc>.md`, đúng bốn mục:
```
## Đã đọc gì        file nào, trang nào
## Đã làm gì        các bước, theo thứ tự
## Tự suy ra        chỗ không có trong nguồn mà mình tự suy
## Chưa chắc        còn mơ hồ thì phải HỎI, đừng chỉ ghi vào đây
```

**4 · Đường dẫn**
Mọi mẫu đường dẫn trong Skill của phòng tính từ **gốc phòng** — thư mục khai ở
`thu_muc` của Skill đó. Skill chỉ vẽ lại cây thư mục bên trong.

**5 · Báo xong**
`kỳ vọng kết quả` một hai câu: sếp mở link ra sẽ thấy gì.

## Thêm một phòng mới

Tạo `.claude/skills/<tên>/SKILL.md` với frontmatter `mang`, `ten_mang`, `thu_muc`,
`mau`. Thân Skill chỉ cần: **Việc** · **File được xem** · **File được sửa** ·
**Không làm** · **Mục của sản phẩm**. Còn lại lấy từ khung trên.

Thêm mục **Phải đổi** chỉ khi danh sách bắt buộc phải đổi *hẹp hơn* danh sách được sửa;
không khai thì nó bằng "File được sửa".

## Tham chiếu

- [nhan.md](references/nhan.md) — bảy nhãn và ai được đổi nhãn nào.
- [khuon-san-pham.html](references/khuon-san-pham.html) — khuôn sản phẩm dùng chung.

Nạp thêm Skill của việc (tên nằm ở `skill` trong brief) để biết được đọc và sửa file nào.
