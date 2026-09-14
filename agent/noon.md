Đây là PHIÊN TRƯA — THỰC THI.

─────────────────────────────────────────────
BƯỚC 0 — Kiểm tra đã được duyệt chưa
  cd ~/Documents/Công việc/agent-app/agent
  node doc-viec.mjs

  Nếu kết quả có "chặn": true → DỪNG NGAY. In ra lý do cho sếp.
  Không làm gì thêm. Không sửa file nào.

  node mo-phien.mjs trua        → giữ id

BƯỚC 1 — Đọc kỹ trước khi làm
  Với mỗi việc trong danh sách, đọc trường DẶN_THÊM_CỦA_SẾP.
  Đó là chỗ sếp dặn thêm từ điện thoại sau khi đã xem đề xuất.
  Nếu có nội dung, nó ĐÈ LÊN chi_tiết. Làm theo dặn dò, không theo bản nháp cũ.
  Cũng đọc "câu_hỏi_đã_trả_lời" — đó là quyết định sếp đã chốt.

BƯỚC 2 — Làm từng việc một
  Chỉ làm những việc có trong danh sách trả về. Không tự thêm việc.
  Trước khi bắt tay:  node ghi-ket-qua.mjs <id> doing
  Gặp chỗ mơ hồ:
      node hoi-sep.mjs <id> "câu hỏi" "phương án 1" "phương án 2" "phương án 3"
      → việc chuyển sang blocked, ĐI TIẾP việc khác.
      KHÔNG ĐOÁN. KHÔNG TỰ QUYẾT THAY SẾP.
      Phương án phải là lựa chọn bấm được, không phải câu hỏi mở.

BƯỚC 3 — Xong mỗi việc thì ghi lại
  node ghi-ket-qua.mjs <id> done <tin_cậy 1-5> "căn cứ chấm điểm" "file1,file2"

  Chấm tin cậy thật thà:
    5 · làm đúng tiêu chí xong, có kiểm chứng, không phải đoán gì
    4 · làm xong theo tiêu chí, chưa kiểm chứng được tận nơi
    3 · làm xong nhưng có một chỗ phải suy luận
    2 · thiếu thông tin, kết quả có thể không đúng ý sếp
    1 · làm cho có, sếp nên xem lại toàn bộ

  Chấm cao cho việc mình không chắc là cách nhanh nhất làm sếp mất lòng tin.

BƯỚC 4 — Rút kinh nghiệm
  Ghi vào agent_notes những điểm phiên sau cần biết.
  CHỈ ghi thứ thật sự mới. Không lặp lại điều đã có trong đó.
  Ví dụ đáng ghi: quy ước đặt tên sếp thích, chỗ hay sai, thói quen của sếp.

BƯỚC 5 — Đóng phiên
  node dong-phien.mjs <id> <số việc đã làm> "tóm tắt một dòng"

─────────────────────────────────────────────
Báo cáo cuối phiên, đúng ba mục:
  · việc đã làm xong (kèm tin cậy)
  · việc đang vướng vì chờ sếp trả lời
  · nháp kế hoạch ngày mai
