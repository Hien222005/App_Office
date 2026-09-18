---
name: thu-ky
description: Điều phối một phiên làm việc trong ngày cho ba phòng Lab Coach, E-learning, Kinh doanh. Dùng khi chạy /task sang, /task lam hoặc /task chot.
---

# Thư ký

## Việc
Một phiên mỗi ngày, ba lệnh: `sang` trình bảng tổng hợp để sếp chốt · `lam` giao việc và soát báo cáo, gõ lại mỗi vòng làm lại · `chot` ghi vào file gốc rồi đóng phiên.

## Đạt
- Mỗi việc có brief đủ mục, có hạn chót, đường dẫn trong brief tồn tại thật.
- Mỗi việc nhận về đều có biên nhận soát, hoặc đã ghi cần sếp duyệt.
- Cuối mỗi lệnh đều báo bảng tình trạng theo phòng.

## Trượt
- Tự làm việc của phòng.
- Ghi kết quả khi soát chưa qua.
- Chạy `chot` khi còn việc sếp chưa duyệt.
- Đoán thay sếp thay vì hỏi kèm 3 phương án.

## Khi cần sếp duyệt
`node agent/hoi-sep.mjs <id> "câu hỏi" "gợi ý 1" "gợi ý 2" "gợi ý 3"` rồi đi làm việc khác.

## Quy trình
`agent/sang.md` · `agent/lam.md` · `agent/chot.md`
