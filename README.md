# Văn Phòng Agent

Một agent làm việc dưới máy Mac, bạn duyệt trên điện thoại.

Bạn gõ **ba lệnh** trên Mac và bấm **hai nút** trên điện thoại. Mọi thứ khác là máy làm.
Agent không bao giờ tự ghi vào file thật: nó làm trong bản nháp, nộp kèm link để bạn tự
mở ra xem, bạn bấm duyệt thì cuối ngày script mới chép về.

| | |
|---|---|
| App đang chạy | https://courageous-sprite-17c1ff.netlify.app |
| Tiến độ · còn gì phải làm | [`TIEN-DO.md`](TIEN-DO.md) |
| Database | Supabase — xem [`supabase/README.md`](supabase/README.md) |

**Mục lục** · [Một ngày](#một-ngày-làm-việc) · [Thư mục](#bản-đồ-thư-mục) · [Skill](#skill--một-việc-một-file) · [Nhãn](#bảy-nhãn-trạng-thái) · [Thứ giữ an toàn](#thứ-giữ-cho-hệ-thống-an-toàn) · [Cài đặt](#cài-đặt--làm-một-lần) · [Chạy thử](#chạy-thử) · [Netlify](#lưu-ý-netlify)

---

## Một ngày làm việc

Một ngày **một phiên**, ba lệnh gõ trong Claude Code:

```
/report   Agent đọc việc hôm nay + việc tồn hôm qua → trình bảng
          → BẠN chốt trên điện thoại (bấm nút)

/lam      Agent mở bản nháp, làm, đẩy bản xem thử lên, nộp kèm link
          → BẠN mở link xem rồi duyệt hoặc trả lại (bấm nút)
          ↑ gõ lại lệnh này mỗi lần bạn trả việc về, tối đa 3 lần

/chot     Bạn đã duyệt hết → chép cả loạt vào file gốc → so mã băm → đóng phiên
```

Chưa duyệt hết trong ngày thì **phiên không đóng**. Việc còn lại thành *việc tồn*,
sáng hôm sau `/report` tự đưa lên đầu bảng.

**Không có subagent.** Phiên chính tự làm, gặp việc nào thì nạp Skill của việc đó.

---

## Bản đồ thư mục

| Thư mục | Là gì | Có commit? |
|---|---|---|
| [`.claude/`](.claude) | 4 Skill · 3 lệnh slash · hook nhật ký | ✅ |
| [`agent/`](agent) | Bộ máy chạy trên Mac, 13 script `.mjs` | ✅ |
| [`site/`](site) | App trên điện thoại | ✅ |
| [`netlify/functions/`](netlify/functions) | `chat.mjs` nối Gemini · `xem.mjs` cầu xem bản nháp | ✅ |
| [`supabase/`](supabase) | Các file SQL dựng và đổi database | ✅ |
| `_brief/` `_nhap/` `_thu/` `nhat-ky/` `sao-luu/` | Chỗ chạy, không phải mã nguồn | ❌ |

Năm thư mục cuối `.gitignore` chặn hết. Xoá đi cũng không mất gì ngoài `sao-luu/` —
gói Supabase Free không có sao lưu tự động, đó là bản sao duy nhất của bạn.

### Trong `agent/` có gì

**Agent chỉ phải nhớ hai tên file.** Mọi thứ khác là ruột, không gọi trực tiếp.

| File | Việc |
|---|---|
| **`viec.mjs`** | mọi thao tác với công việc — `mo-phien` · `doc` · `phieu` · `lam` · `xong` · `hoi` · `tinh-trang` · `dong-phien` |
| **`nhap.mjs`** | bản nháp — `mo` · `xem` · `duyet` · `ghi-het` · `kiem` · `bo` |

| Nhóm | File |
|---|---|
| Dùng chung | `lib` nối Supabase · `nhan` bộ nhãn · `phong` đường dẫn · `pham-vi` phạm vi file · `anh-chup` chụp & so thư mục |
| Máy gọi, không phải agent | `soat-bao-cao` soát bản nháp · `dua-len` đẩy bản xem thử lên Storage |
| Bạn tự gõ | `nhat-ky xem` · `sao-luu` |
| Bài thử | `thu-nhanh` (không gọi Claude) · `thu-truong-phong` (gọi Claude thật) |

Không cần `npm install`. Mọi script gọi thẳng REST API bằng `fetch` có sẵn trong Node.

---

## Skill — một việc, một file

Một loại việc được mô tả ở **đúng một chỗ**, và phạm vi file nằm ngay trong đó:

```
.claude/skills/
├── van-phong/            luật chung mọi phiên  + references/nhan.md
├── sua-bug-elearn/       sửa bug khoá học
├── soan-bai-lab/         soạn tóm tắt buổi dạy
└── cap-nhat-kinh-doanh/  ĐANG TẮT, chờ bạn điền luật
```

Mỗi Skill việc có ba mục **máy đọc được**, mỗi mục là một khối ` ``` `:

```
## File được xem     agent đọc ở đâu
## File được sửa     phạm vi — nhap.mjs lấy từ đây, không lấy từ brief
## Phải đổi          đầu ra bắt buộc; không đụng file khớp mẫu này thì soát từ chối
```

Nhờ vậy **brief của từng việc chỉ còn 5 mục**: `mang` · `skill` · `ten` · `nhiem_vu` · `han_chot`.
Brief có thể thêm `chi_sua` để **thu hẹp** phạm vi Skill cho một việc cụ thể — nhưng
không bao giờ nới rộng được, code chặn điều đó.

---

## Bảy nhãn trạng thái

Nguồn duy nhất: [`agent/nhan.mjs`](agent/nhan.mjs).

```
cho_chot ──bạn──▶ da_chot ──agent──▶ dang_lam ──agent──▶ cho_duyet
    └──bạn──▶ bo                                   ├──bạn──▶ da_duyet ──/chot──▶ da_ghi
                                                    └──bạn──▶ da_chot  (trả lại, đếm +1)
```

**Ba thứ KHÔNG phải nhãn** — tính từ số liệu, nên agent không thể quên đánh dấu:

| Tình trạng | Tính bằng |
|---|---|
| đang làm lại | `so_lan_lam_lai > 0` |
| cần bạn sửa | `so_lan_lam_lai >= 3` → agent không nhận việc này nữa |
| đang vướng | có câu hỏi chưa trả lời → agent không nhận việc này nữa |

---

## Thứ giữ cho hệ thống an toàn

Nguyên tắc: **chữ cho người thì ngắn, chỗ chặn thì là code.** Luật quan trọng viết
thành script, không viết thành câu răn — prompt thì agent quên được, script thì không.

**Bản nháp.** `nhap.mjs mo` nhân bản thư mục bằng APFS clone (`cp -c`): chép 3 GB mất
chưa tới nửa giây và **không tốn thêm MB nào**. Đo thật: 15–28 ms.

**Agent chỉ tự khai một câu.** Báo cáo JSON 12 mục đã biến mất. Agent chạy:

```bash
node agent/viec.mjs xong <id> "kỳ vọng kết quả"
```

Script tự soát, tự lấy danh sách file từ bản nháp, tự lấy các bước kèm giờ từ nhật ký
hook, tự đẩy link. Hệ quả: **khai man và giấu file không còn bị *bắt* nữa mà là không
*xảy ra được*** — không có lời khai nào để man.

**"Đã tự kiểm" là hành động, không phải lời nói.** Soát đòi nhật ký phải có một lần
**mở lại file sau lần sửa cuối**. Luật cũ là "chấm 5/5 thì phải viết ô đã-tự-kiểm dài
hơn 10 chữ" — agent viết bừa 11 chữ là qua. Luật mới không mở lại thì không qua được.

**So mã băm sau khi ghi.** `nhap.mjs kiem` so từng file vừa chép; sai một file thì
hoàn tác cả loạt.

**Câu hỏi phải có sẵn phương án.** `viec.mjs hoi` bắt buộc đúng **3 gợi ý** (app thêm
ô thứ tư để bạn tự gõ). Trả lời bằng một cú chạm thì bạn sẽ trả lời; phải gõ một đoạn
văn thì bạn để đó, và một tuần sau cả hệ thống đứng vì một câu chưa ai đáp.

---

## Cài đặt · làm một lần

### 1 · Supabase

supabase.com → tạo project → SQL Editor → chạy **lần lượt** các file trong
[`supabase/`](supabase/README.md): `schema` → `rls` → `seed_food` → `doi-2` → `doi-3`
→ `doi-4` → `doi-5`. File `supabase/README.md` ghi rõ file nào cần sửa gì trước khi chạy.

Rồi Authentication → bật **Email magic link**, thêm email của bạn.

### 2 · Khoá API và đường dẫn

```bash
cp agent/.env.example agent/.env
```

Mở `agent/.env` điền: khoá Supabase · đường dẫn ba phòng (`DIR_ELEARNING`, `DIR_LAB`,
`DIR_BIZ`) · ba mã bí mật cho link xem thử (`XEM_THU_MA_*`, script in sẵn cho bạn nếu thiếu).

> `SUPABASE_SERVICE_KEY` đi vòng qua mọi RLS. Chỉ nằm trên máy này.
> `.gitignore` đã chặn `agent/.env` — **đừng bỏ dòng đó ra.**

### 3 · Chạy app tại chỗ

```bash
node tao-cau-hinh.mjs   # sinh site/cau-hinh.js từ agent/.env
node dev-server.mjs     # http://localhost:8888
```

Mở trên iPhone: `http://<IP-Mac>:8888`, cùng Wi-Fi. Địa chỉ in ra lúc chạy.

---

## Chạy thử

```bash
node agent/thu-nhanh.mjs                      # 5 giây · không gọi Claude · không tốn gì
node agent/thu-truong-phong.mjs --model opus  # gọi Claude thật · ~70 giây
```

`thu-nhanh` dựng một thư mục E-learning giả lập trong `_thu/` rồi diễn lại trọn vòng:
mở bản nháp → làm (kể cả cố tình làm lấn) → soát → duyệt → chép về. **Không đụng thư
mục thật.** Số đo gần nhất, 20/09/2026: **50/50 ca đạt**.

---

## Lưu ý Netlify

Gói Free có **300 credit/tháng**. Deploy production tốn **15**; preview và branch deploy
tốn **0**. `netlify.toml` không có dòng `ignore`, nên push một commit chỉ đổi `README.md`
lên `main` vẫn tốn đủ 15.

**Làm ở nhánh `dev`, chỉ merge sang `main` khi đã ưng.**

Chỉ thư mục `site/` được publish; `agent/` và `supabase/` nằm ngoài.

**Hàm `/xem` là bắt buộc phải deploy** thì link bản nháp mới mở được. Lý do: Supabase
Storage cố tình trả mọi file HTML thành `text/plain` kèm `nosniff`, nên link Storage
trần chỉ hiện mã nguồn. Hàm này lấy file về rồi trả lại với đúng kiểu.

---

## Chạy tự động — để sau

`agent/com.chihien.agent.plist` hẹn giờ 6h30 chạy `claude -p "/report"`. Chỉ hẹn giờ
lệnh đọc; `lam` và `chot` phải gõ tay vì cần bạn chốt việc và duyệt kết quả ở giữa.

```bash
sudo pmset repeat wakeorpoweron MTWRFSU 06:25:00
cp agent/com.chihien.agent.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.chihien.agent.plist
```

Giai đoạn này cứ gõ tay đã, để còn nhìn agent chạy mà chỉnh Skill.
