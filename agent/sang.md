# Lệnh `sang` · trình bảng tổng hợp để sếp chốt

1. `node agent/mo-phien.mjs ngay` — mở phiên của hôm nay, hoặc lấy lại phiên đang mở.
   Script quét luôn việc chưa duyệt của các ngày trước và đưa vào danh sách hôm nay.
2. `node agent/doc-viec.mjs --kinh-nghiem` — đọc kinh nghiệm cũ. Mọi đề xuất phải tuân theo.
3. Gọi song song trưởng phòng của các phòng **đang bật**, chế độ LẬP KẾ HOẠCH, chỉ đọc.
   Đợi đủ tất cả trả lời mới đi tiếp.
4. Soát brief từng việc: đủ mục · có hạn chót · đường dẫn tồn tại thật · phạm vi hợp Skill phòng.
   Thiếu thì trả lại một lần; vẫn thiếu thì bỏ việc đó và ghi rõ lý do.
5. Dinh dưỡng: đọc `v_dinh_duong_ngay` 7 ngày và `muc_tieu`, nêu **đúng một** điều chỉnh.
6. `cat phieu.json | node agent/ghi-phieu.mjs` — mọi việc vào nhãn chờ sếp chốt.
7. Nạp skill `bao-cao`, trình bảng tổng hợp: **việc tồn hôm trước lên đầu**, rồi việc hôm nay.

Không mở bản nháp trong lệnh này. Không làm trước việc của lệnh `lam`.
