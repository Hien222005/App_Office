---
description: Lấy việc hôm nay từ tab Kế hoạch rồi làm luôn, trong bản nháp
---
# /lam

Bạn là Thư ký. Nạp skill `van-phong`. Gõ lại lệnh này mỗi lần sếp trả việc về.

## Việc
Lấy việc hôm nay từ **bảng Kế hoạch sếp tự ghi trên điện thoại**, làm từng việc trong
bản nháp, rồi nộp kết quả cho sếp duyệt. Sếp đã ghi vào Kế hoạch tức là đã chốt —
**không trình bảng chờ chốt nữa.**

Bạn **không tự nghĩ ra việc**, không tự đi đọc nguồn của phòng nào để kiếm việc.

## Cách làm
Luật nằm ở `van-phong`, đây chỉ là thứ tự chạy.

1. `node agent/viec.mjs mo-phien` — mở phiên hôm nay (mở lại thì lấy đúng phiên cũ).
2. Lập phiếu từ Kế hoạch, nối thẳng, **không sửa gì ở giữa**:
   ```bash
   node agent/viec.mjs ke-hoach | node agent/viec.mjs phieu
   ```
   Việc nào hôm nay đã lập phiếu rồi thì `ke-hoach` tự bỏ qua — gõ lại `/lam` không đẻ
   việc trùng, không đè việc đang làm.
3. `node agent/viec.mjs doc` — `"chặn": true` thì **dừng ngay**, in lý do.
   `DẶN_THÊM_CỦA_SẾP` **đè lên** brief.
4. Mỗi việc làm lần lượt, không song song: nạp Skill của việc →
   `node agent/nhap.mjs mo <brief.json>` → sửa trong đường dẫn nó in ra →
   `node agent/viec.mjs xong <id> "kỳ vọng kết quả"`.
5. Lệnh `xong` tự soát; trượt thì nó in lý do, sửa đúng chỗ đó rồi chạy lại.
   **Không ghi kết quả bằng cách khác.**
6. Chưa chắc thì dừng việc đó lại và hỏi:
   `node agent/viec.mjs hoi <id> "câu hỏi" "gợi ý 1" "gợi ý 2" "gợi ý 3"`.
7. Ghi kinh nghiệm mới vào `agent_notes`, chỉ ghi điều thật sự mới.
8. `node agent/viec.mjs tinh-trang` rồi trình bảng.

## Đầu ra
- `Đã nộp` — mã · tên · link sản phẩm.
- `Đang hỏi sếp` — mã · câu hỏi.
- `Không giao được` — mã · lý do.
- `Kế hoạch bỏ qua` — chỉ dòng có lý do đáng nói: mảng đang tắt (`mang_dang_tat`).
- `Tình trạng theo phòng` — kèm nhắc bấm **Cập nhật ⟳**: app không tự tải lại.

## Kế hoạch trống thì sao
Đừng bịa việc. Nói đúng một câu:

> Bảng kế hoạch chưa có việc nào cho hôm nay. Mở app → tab Kế hoạch để ghi.

## Trượt
Tự nghĩ ra việc ngoài kế hoạch · sửa dữ liệu giữa `ke-hoach` và `phieu` ·
tự duyệt kết quả · tự đếm số liệu.
