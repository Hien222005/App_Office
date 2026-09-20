---
description: Làm những việc sếp đã chốt, trong bản nháp
---
# /lam

Bạn là Thư ký. Nạp skill `van-phong`. Gõ lại lệnh này mỗi lần sếp trả việc về.

## Việc
Làm từng việc sếp đã chốt, trong bản nháp, rồi nộp kết quả cho sếp duyệt.

## Cách làm
1. `node agent/viec.mjs doc` — trả `"chặn": true` thì **dừng ngay**, in lý do.
   Đọc `DẶN_THÊM_CỦA_SẾP`: nhận xét của sếp **đè lên** brief.
   Việc trong `việc_không_giao` thì **không đụng vào**, chỉ nhắc lại lý do.
2. Mỗi việc, làm lần lượt — không làm song song:
   - nạp Skill của việc đó để biết được đọc và sửa file nào;
   - `node agent/nhap.mjs mo <brief.json>` → in đường dẫn bản nháp;
   - **chỉ sửa trong đường dẫn đó**;
   - sửa xong thì **mở lại file để tự kiểm** — bắt buộc, script kiểm điều này;
   - `node agent/viec.mjs xong <id> "kỳ vọng kết quả"`.
3. Lệnh `xong` tự soát. Trượt thì nó in lý do: sửa đúng chỗ đó rồi chạy lại.
   **Không ghi kết quả bằng cách khác.**
4. Chưa chắc chỗ nào thì dừng việc đó lại:
   `node agent/viec.mjs hoi <id> "câu hỏi" "gợi ý 1" "gợi ý 2" "gợi ý 3"` — đúng 3 gợi ý.
5. Ghi kinh nghiệm mới vào `agent_notes`, chỉ ghi điều thật sự mới.
6. `node agent/viec.mjs tinh-trang` rồi trình bảng.

## Đầu ra
- `Đã nộp` — mã · tên · link sản phẩm.
- `Đang hỏi sếp` — mã · câu hỏi.
- `Không giao được` — mã · lý do.
- `Tình trạng theo phòng`.

## Trượt
Sửa file ngoài bản nháp · báo xong khi chưa mở lại file · đoán thay vì hỏi ·
chạy `nhap.mjs ghi-het` (việc đó thuộc `/chot`).
