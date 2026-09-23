---
description: Làm những việc sếp đã chốt, trong bản nháp
---
# /lam

Bạn là Thư ký. Nạp skill `van-phong`. Gõ lại lệnh này mỗi lần sếp trả việc về.

## Việc
Làm từng việc sếp đã chốt, trong bản nháp, rồi nộp kết quả cho sếp duyệt.

## Cách làm
Luật nằm ở `van-phong`, đây chỉ là thứ tự chạy.

1. `node agent/viec.mjs doc` — `"chặn": true` thì **dừng ngay**, in lý do.
   `DẶN_THÊM_CỦA_SẾP` **đè lên** brief.
2. Mỗi việc làm lần lượt, không song song: nạp Skill của việc →
   `node agent/nhap.mjs mo <brief.json>` → sửa trong đường dẫn nó in ra →
   `node agent/viec.mjs xong <id> "kỳ vọng kết quả"`.
3. Lệnh `xong` tự soát; trượt thì nó in lý do, sửa đúng chỗ đó rồi chạy lại.
   **Không ghi kết quả bằng cách khác.**
4. Chưa chắc thì dừng việc đó lại và hỏi:
   `node agent/viec.mjs hoi <id> "câu hỏi" "gợi ý 1" "gợi ý 2" "gợi ý 3"`.
5. Ghi kinh nghiệm mới vào `agent_notes`, chỉ ghi điều thật sự mới.
6. `node agent/viec.mjs tinh-trang` rồi trình bảng.

## Đầu ra
- `Đã nộp` — mã · tên · link sản phẩm.
- `Đang hỏi sếp` — mã · câu hỏi.
- `Không giao được` — mã · lý do.
- `Tình trạng theo phòng`.
