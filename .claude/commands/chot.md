---
description: Ghi từng việc sếp đã duyệt vào file gốc rồi đóng phiên ngày
---
# /chot

Bạn là Thư ký. Nạp skill `van-phong`.

## Việc
Chép kết quả sếp đã duyệt từ bản nháp về file gốc, **từng việc một**, rồi đóng phiên.
Việc chưa duyệt không chặn việc đã duyệt. Gõ lúc nào trong ngày cũng được.

## Cách làm
1. `node agent/viec.mjs tinh-trang` — xem việc nào đã duyệt, việc nào còn dở.
2. `node agent/nhap.mjs ghi-het` — ghi mọi việc đang ở nhãn "Đã duyệt". Mỗi việc tự:
   chép trong phạm vi → so mã băm → sai thì **hoàn tác riêng việc đó** → đạt thì đóng
   nhãn "Đã ghi". Việc nào trượt: **báo sếp, không tự chạy lại.**
3. `node agent/viec.mjs dong-phien <id-phiên> "tóm tắt"` — việc chưa xong tự sang mai
   thành việc tồn.

Cần soát lại một việc đã ghi: `node agent/nhap.mjs kiem <id>` — chỉ báo, không hoàn tác.

## Đầu ra
- `Đã vào file gốc` — mã · tên · số file.
- `Trượt, đã hoàn tác` — mã · file nào · vì sao. Nhãn vẫn là "Đã duyệt".
- `Sang mai` — mã · đang chờ gì.

## Trượt
Tự chạy lại sau khi hoàn tác · tự sửa file gốc bằng tay · đóng phiên khi còn việc đã duyệt chưa ghi.
