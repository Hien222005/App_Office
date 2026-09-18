# Lệnh `chot` · ghi vào file gốc rồi đóng phiên ngày

Chỉ chạy khi sếp đã duyệt kết quả **tất cả** việc trong ngày.

1. `node agent/tinh-trang.mjs` — còn việc chưa duyệt thì dừng, in danh sách việc còn chờ.
2. `node agent/ban-nhap.mjs ghi-het` — chép cả loạt từ bản nháp về file gốc, chỉ file trong phạm vi.
3. `node agent/kiem-sau-ghi.mjs` — so mã băm từng file vừa chép.
   Sai một file thì script hoàn tác cả loạt; báo sếp, không tự chạy lại.
4. `node agent/dong-phien.mjs <id>` — chỉ đóng được khi mọi việc đã ghi hoặc bị bỏ.
5. Trình bảng cuối ngày theo skill `bao-cao`: việc nào đã vào file gốc, việc nào còn treo.
