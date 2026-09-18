# Lệnh `lam` · giao việc, soát báo cáo, ghi kết quả

Gõ lại lệnh này mỗi khi sếp trả việc về.

1. `node agent/doc-viec.mjs` — trả `"chặn": true` thì dừng ngay, in lý do.
   Danh sách trả về gồm việc sếp đã chốt và việc sếp trả lại, kèm nhận xét. Nhận xét **đè lên** brief.
2. Mỗi việc: `node agent/ban-nhap.mjs mo <brief.json>` rồi `node agent/ghi-ket-qua.mjs <id> doing`.
   Không mở được thì ghi cần sếp duyệt, sang việc khác.
3. Gọi song song trưởng phòng của các phòng có việc, chế độ LÀM, kèm brief và đường dẫn bản nháp.
   Đợi đủ tất cả trả lời.
4. Mỗi báo cáo: `node agent/soat-bao-cao.mjs <id> bao-cao.json`.
   - qua → `node agent/ghi-ket-qua.mjs <id> cho_duyet_kq --bao-cao bao-cao.json`
   - thiếu mục → trả trưởng phòng bổ sung **một lần**, soát lại
   - khai man · giấu file · sửa lấn → ghi cần sếp duyệt kèm lỗi soát nguyên văn, không cho làm lại
5. Việc chạm trần 3 lần làm lại: script chuyển sang **cần sếp sửa**. Không chạm vào việc đó nữa.
6. Ghi kinh nghiệm mới vào `agent_notes`, chỉ ghi điều thật sự mới.
7. Trình bảng tổng hợp theo skill `bao-cao`.

Không chạy `ban-nhap.mjs ghi-het`. Việc đó thuộc lệnh `chot`.
