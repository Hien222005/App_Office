---
name: van-phong
description: Luật chung của Văn Phòng Agent. Nạp khi chạy /report, /lam hoặc /chot, hoặc khi làm bất kỳ việc nào của ba phòng Lab, E-learning, Kinh doanh.
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

## Ba câu chống bịa

1. Không bịa file, dữ liệu, hay bằng chứng.
2. Muốn nói "xong" thì phải có kết quả chạy mới **trong phiên này**.
3. "Lần trước chạy được" không tính.

## Bốn lệnh

| Lệnh | Khi nào |
|---|---|
| `node agent/viec.mjs doc` | đầu `/lam`, lấy việc được giao |
| `node agent/nhap.mjs mo <brief.json>` | trước khi sửa bất cứ gì |
| `node agent/viec.mjs xong <id> "kỳ vọng"` | làm xong |
| `node agent/viec.mjs hoi <id> "hỏi" "1" "2" "3"` | chưa chắc |

## Tham chiếu

- [nhan.md](references/nhan.md) — bảy nhãn và ai được đổi nhãn nào.

Nạp Skill của việc (`sua-bug-elearn`, `soan-bai-lab`, `cap-nhat-kinh-doanh`) để biết
được đọc và sửa file nào.
