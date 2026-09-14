# Văn Phòng Agent

Trợ lý tự chạy cho bốn mảng việc: **Lab Coach · E-learning · Kinh doanh · Dinh dưỡng**.
Agent làm việc dưới máy, bạn duyệt trên điện thoại.

```
Sáng   Mac: /task sang   → agent đọc, đề xuất → ghi Supabase (KHÔNG deploy gì)
9–10h  Phone: mở app     → sửa · gõ dặn dò · Duyệt
Trưa   Mac: /task trua   → chỉ chạy việc đã duyệt → ghi kết quả + tin cậy
Tối    node agent/sao-luu.mjs → dump JSON, commit vào repo
```

---

## Cài đặt · làm một lần

### 1 · Supabase
```
Tạo project tại supabase.com → SQL Editor → chạy lần lượt:
  supabase/schema.sql       dán và Run
  supabase/rls.sql          THAY YOUR_EMAIL_HERE trước khi chạy
  supabase/seed_food.sql    bỏ comment 5 dòng cuối, điền kcal/protein mục tiêu
Authentication → bật Email magic link, thêm email của bạn vào danh sách cho phép.
```
Kiểm tra: `select tablename, rowsecurity from pg_tables where schemaname='public';`
→ phải ra **8 dòng, rowsecurity đều true**. Sót một bảng là lộ dữ liệu.

### 2 · Khoá API
```bash
cp agent/.env.example agent/.env
# rồi mở agent/.env, dán khoá từ Supabase → Settings → API
```
`SUPABASE_SERVICE_KEY` đi vòng qua mọi RLS. Chỉ nằm ở máy này.
`.gitignore` đã chặn `agent/.env` — đừng bỏ dòng đó ra.

### 3 · Tài liệu Lab
```bash
git clone <link repo Lab của bạn> lab-repo
```

### 4 · Hai lệnh gõ tắt — thêm vào cuối `~/.zshrc`
```bash
alias sang='cd ~/Documents/Công\ việc/agent-app && caffeinate -i claude -p "$(cat agent/morning.md)"'
alias trua='cd ~/Documents/Công\ việc/agent-app && caffeinate -i claude -p "$(cat agent/noon.md)" --permission-mode acceptEdits'
```
Phiên sáng cố tình **không** có `acceptEdits` — nó chỉ được đọc.
Trong Claude Code thì dùng `/task sang` và `/task trua`.

### 5 · App trên điện thoại
Mở `app.html` — đây là bản thử chạy offline, dữ liệu nằm trong bộ nhớ.
Bản nối Supabase thật sẽ dựng ở giai đoạn 2–4 rồi deploy lên Vercel.

---

## Các script

| Lệnh | Việc |
|---|---|
| `node agent/mo-phien.mjs sang\|trua` | Mở phiên → bật chấm đỏ "đang chạy" trên app |
| `node agent/doc-viec.mjs` | Lấy việc đã duyệt + dặn dò của sếp + kinh nghiệm cũ |
| `cat phieu.json \| node agent/ghi-phieu.mjs` | Phiên sáng ghi phiếu (luôn `pending` / `draft`) |
| `node agent/ghi-ket-qua.mjs <id> done <1-5> "căn cứ" "file1,file2"` | Ghi kết quả một việc |
| `node agent/hoi-sep.mjs <id> "hỏi" "pa1" "pa2"` | Hỏi khi mơ hồ — bắt buộc 2–4 phương án |
| `node agent/dong-phien.mjs <id> <số việc> "tóm tắt"` | Đóng phiên |
| `node agent/sao-luu.mjs` | Dump 8 bảng ra `sao-luu/<ngày>/` |

Không cần `npm install` — các script gọi thẳng REST API của Supabase bằng `fetch`.

---

## Hai điều giữ cho hệ thống an toàn

**1 · Tách hẳn hai phiên.** Phiên sáng chỉ đọc, phiên trưa chỉ chạy việc có
`trang_thai = 'approved'`. `doc-viec.mjs` tự chặn nếu phiếu chưa duyệt —
không phụ thuộc vào việc agent có nhớ đọc prompt hay không.

**2 · Không được hỏi câu trống phương án.** Ràng buộc `co_phuong_an` nằm
trong `schema.sql`: database từ chối câu hỏi không có 2–4 lựa chọn. Trả lời
bằng một cú chạm thì bạn sẽ trả lời; phải gõ một đoạn văn thì bạn để đó,
và một tuần sau cả hệ thống đứng vì một câu chưa ai đáp.

---

## Chạy tự động · để sau, tuần 3 trở đi
```bash
sudo pmset repeat wakeorpoweron MTWRFSU 06:25:00     # Mac tự thức
cp agent/com.chihien.agent.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.chihien.agent.plist
```
Mac đóng nắp, cắm điện, đang ngủ — vẫn tự thức chạy rồi ngủ lại.

Tuần 1–2 cứ gõ tay đã, để còn nhìn agent chạy mà chỉnh prompt.
