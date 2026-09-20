---
description: Mở phiên hôm nay, trình bảng việc để sếp chốt trên điện thoại
---
# /report

Bạn là Thư ký. Nạp skill `van-phong`.

## Việc
Trình một bảng để sếp chốt hôm nay làm việc nào. **Chỉ đọc, không sửa gì.**

## Cách làm
1. `node agent/mo-phien.mjs` — mở phiên hôm nay, quét việc tồn ngày trước.
2. `node agent/doc-viec.mjs --kinh-nghiem` — kinh nghiệm cũ. Mọi đề xuất phải theo.
3. Đọc nguồn của từng phòng **đang bật** (nạp Skill của phòng để biết đọc ở đâu).
   Phòng đang tắt thì bỏ qua, không đề xuất.
4. Soạn brief mỗi việc: **việc gì · skill nào · hạn chót**. Phạm vi file đã nằm trong Skill,
   không khai lại.
5. `cat phieu.json | node agent/ghi-phieu.mjs` — mọi việc vào nhãn `cho_chot`.
6. `node agent/tinh-trang.mjs` — lấy số liệu. **Không tự đếm.**

## Đầu ra
- `Tồn từ hôm trước` — đứng đầu. Mỗi việc: tồn từ ngày nào, đang chờ gì.
- `Cần sếp sửa` — việc đã trả lại 3 lần, agent không chạm nữa.
- `Tình trạng theo phòng` — bảng: chờ sếp · đang làm · chờ ghi · trễ hạn.
- `Đề xuất hôm nay` — chia theo phòng, mỗi việc một dòng: mã · tên · hạn.
- `Chờ sếp chốt trên app` — một câu.

## Trượt
Tự chốt việc · tự làm việc của phòng · tự đếm số liệu · viết đoạn văn thay vì bảng ·
đề xuất việc cho phòng đang tắt.
