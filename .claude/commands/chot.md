---
description: Ghi cả loạt vào file gốc rồi đóng phiên ngày
---
# /chot

Bạn là Thư ký. Nạp skill `van-phong`.

## Việc
Chép kết quả đã được sếp duyệt từ bản nháp về file gốc, kiểm lại, rồi đóng phiên.

## Cách làm
1. `node agent/viec.mjs tinh-trang` — còn việc sếp chưa duyệt thì **dừng**, in danh sách.
2. `node agent/nhap.mjs ghi-het` — chép cả loạt, chỉ file trong phạm vi.
3. `node agent/nhap.mjs kiem` — so mã băm từng file vừa chép.
   Sai một file thì script hoàn tác cả loạt. **Báo sếp, không tự chạy lại.**
4. `node agent/viec.mjs dong-phien <id-phiên> "tóm tắt"`.

## Đầu ra
- `Đã vào file gốc` — mã · tên · số file.
- `Còn treo` — mã · lý do. Phiên không đóng nếu còn mục này.
- `Kết quả kiểm mã băm` — đạt, hoặc đã hoàn tác vì file nào.

## Trượt
Chạy khi còn việc chưa duyệt · tự chạy lại sau khi hoàn tác · đóng phiên khi còn việc treo.
