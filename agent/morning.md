Hôm nay là ngày hiện tại. Đây là PHIÊN SÁNG — CHỈ ĐỌC.

TUYỆT ĐỐI KHÔNG sửa, xoá hay tạo file nào trong ~/Documents/Công việc.
Nếu thấy mình sắp sửa một file, DỪNG LẠI. Phiên này chỉ để đọc và đề xuất.

─────────────────────────────────────────────
BƯỚC 0 — Mở phiên
  cd ~/Documents/Công việc/agent-app/agent
  node mo-phien.mjs sang        → giữ lấy id in ra, dùng ở bước cuối

BƯỚC 1 — Đọc lại kinh nghiệm
  node doc-viec.mjs             → xem mục "kinh_nghiệm"
  Mọi đề xuất bên dưới phải tuân theo. Đây là những thứ đã rút ra
  từ các phiên trước, không được lặp lại lỗi cũ.

BƯỚC 2 — Lab Coach
  Đọc tài liệu Lab hôm nay trong $DIR_LAB.
  Viết tóm tắt gồm bốn mục:
    · mục tiêu bài
    · các bước thao tác
    · ba chỗ học viên hay vướng
    · hai câu hỏi học viên nhiều khả năng sẽ hỏi
  Độ dài: đọc hết trong 5 phút.
  Nếu tài liệu thuộc diện nội bộ, đặt lab_noi_bo = true và tóm tắt
  chỉ ghi phần khái niệm, KHÔNG chép nguyên văn nội dung gốc.

BƯỚC 3 — E-learning
  Đọc $DIR_ELEARNING. Quy ước đã chốt, phải tuân thủ:
    · chỉ sửa trong courses/Test_Module 4_Coding/module-04/
    · KHÔNG đồng bộ sang templates hay module khác
    · mọi fix phải log vào bugs-con-lai-can-fix-<ngày>.md
  Đối chiếu file bug mới nhất với tasks còn dang dở.
  Đề xuất 3–5 việc cho hôm nay. Mỗi việc ghi rõ:
    · đụng vào file nào
    · sửa cái gì
    · tieu_chi_xong: làm sao biết là đã xong

BƯỚC 4 — Dinh dưỡng
  Đọc bảng v_dinh_duong_ngay 7 ngày gần nhất và bảng muc_tieu.
  Tính trung bình calo và protein, so với mục tiêu.
  Nêu ĐÚNG MỘT điều chỉnh cụ thể cho hôm nay. Không liệt kê nhiều thứ.

BƯỚC 5 — Ghi phiếu
  Soạn JSON rồi:  cat phieu.json | node ghi-phieu.mjs
  Script tự đặt daily_report = "pending" và mọi việc = "draft".
  KHÔNG việc nào được "approved". Việc duyệt là của sếp, không phải của bạn.

BƯỚC 6 — Đóng phiên
  node dong-phien.mjs <id> 0 "phiên sáng: đã đề xuất N việc"

─────────────────────────────────────────────
Xong thì báo ngắn gọn: đã đề xuất mấy việc, mảng nào, có gì bất thường không.
