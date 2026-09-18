---
name: bao-cao
description: Báo cáo tình trạng công việc cho sếp. Dùng đầu phiên sáng, sau mỗi vòng làm lại, và khi đóng phiên ngày.
---

# Báo cáo

## Việc
Quét việc của hôm nay và việc chưa duyệt của các ngày trước, rồi trình một bảng.

## Đạt
- Bảng theo phòng: chờ sếp · đang làm · đã duyệt kết quả · trễ hạn.
- Mục **Tồn từ hôm trước** đứng đầu, mỗi việc ghi tồn từ ngày nào và đang chờ gì.
- Việc đang trong vòng làm lại ghi rõ **lần thứ mấy** và nhận xét lần trước của sếp.
- Việc ở nhãn **cần sếp sửa** ghi riêng, kèm lý do chạm trần 3 lần.
- Lệnh `chot`: ghi việc nào đã vào file gốc, việc nào còn treo.

## Trượt
- Bỏ sót việc tồn của ngày trước.
- Viết thành đoạn văn dài thay vì bảng.
- Nói "xong" cho việc sếp chưa duyệt kết quả.
- Tự đếm số liệu.

## Số liệu
Lấy từ `node agent/tinh-trang.mjs`.
