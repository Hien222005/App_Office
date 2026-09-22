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

> **Phiên Claude Code phải mở ĐÚNG trong thư mục `agent-app`:**
> ```bash
> cd ~/Documents/Công\ việc/agent-app && claude
> ```
> Mở ở thư mục cha thì hook `PostToolUse` không nạp, nhật ký không ghi hành động nào,
> và mọi lệnh `viec.mjs xong` đều bị từ chối vì không có bằng chứng tự kiểm.

Một ngày **một phiên**, ba lệnh gõ trong Claude Code:

> **Việc hôm nay lấy từ bảng kế hoạch tuần bạn tự ghi trên điện thoại** — app → tab Việc
> → **Kế hoạch tuần**. Agent không tự nghĩ ra việc. Dòng nào để trống ô tuần thì **lặp
> mọi tuần**: ghi một lần, tuần nào cũng tự lên bảng.

```
/report   Agent đọc kế hoạch tuần + việc tồn hôm qua → lập phiếu → trình bảng
          → BẠN bấm Cập nhật ⟳ rồi chốt trên điện thoại (bấm nút)

/lam      Agent mở bản nháp, làm, đẩy bản xem thử lên, nộp kèm link
          → BẠN bấm Cập nhật ⟳, mở link xem rồi duyệt hoặc trả lại (bấm nút)
          ↑ gõ lại lệnh này mỗi lần bạn trả việc về, tối đa 3 lần

/chot     Bạn đã duyệt hết → chép cả loạt vào file gốc → so mã băm → đóng phiên
```

> **App không tự cập nhật.** Nó tải dữ liệu một lần lúc đăng nhập rồi nằm im. Nút
> **Cập nhật ⟳** ở góc trên bên phải tab Việc. Chạy xong lệnh trên Mac mà điện thoại
> chưa thấy gì thì bấm nó, chưa hỏng đâu.

Chưa duyệt hết trong ngày thì **phiên không đóng**. Việc còn lại thành *việc tồn*,
sáng hôm sau `/report` tự đưa lên đầu bảng.

**Không có subagent.** Phiên chính tự làm, gặp việc nào thì nạp Skill của việc đó.

---

## Bản đồ thư mục

| Thư mục | Là gì | Có commit? |
|---|---|---|
| [`.claude/`](.claude) | 4 Skill · 3 lệnh slash · hook nhật ký | ✅ |
| [`agent/`](agent) | Bộ máy chạy trên Mac, 12 script `.mjs` | ✅ |
| [`site/`](site) | App trên điện thoại | ✅ |
| [`netlify/functions/`](netlify/functions) | `chat.mjs` nối Gemini · **`chi-dan.mjs` lời dặn cho trợ lý chat** · `xem.mjs` cầu xem bản nháp | ✅ |
| [`supabase/`](supabase) | 3 file SQL dựng database · `lich-su/` là các bản vá cũ | ✅ |
| `_brief/` `_nhap/` `_thu/` `nhat-ky/` `sao-luu/` | Chỗ chạy, không phải mã nguồn | ❌ |

Năm thư mục cuối `.gitignore` chặn hết. Xoá đi cũng không mất gì ngoài `sao-luu/` —
gói Supabase Free không có sao lưu tự động, đó là bản sao duy nhất của bạn.

### Trong `agent/` có gì

**Agent chỉ phải nhớ hai tên file.** Mọi thứ khác là ruột, không gọi trực tiếp.

| File | Việc |
|---|---|
| **`viec.mjs`** | mọi thao tác với công việc — `mo-phien` · `ke-hoach` · `doc` · `phieu` · `lam` · `xong` · `hoi` · `tinh-trang` · `dong-phien` |
| **`nhap.mjs`** | bản nháp — `mo` · `xem` · `duyet` · `ghi-het` · `kiem` · `bo` |

| Nhóm | File |
|---|---|
| Dùng chung | `lib` nối Supabase · `nhan` bộ nhãn · `phong` đường dẫn · `pham-vi` phạm vi file · `anh-chup` chụp & so thư mục |
| Máy gọi, không phải agent | `soat-bao-cao` soát bản nháp · `dua-len` đẩy bản xem thử lên Storage |
| Bạn tự gõ | `nhat-ky xem` · `sao-luu` |
| Bài thử | `thu-nhanh` — dựng văn phòng giả lập, diễn lại trọn vòng |

Không cần `npm install`. Mọi script gọi thẳng REST API bằng `fetch` có sẵn trong Node.

---

## Skill — một việc, một file

Một loại việc được mô tả ở **đúng một chỗ**. Mảng việc, thư mục, màu trên app và phạm vi
file — tất cả nằm trong Skill:

```
.claude/skills/
├── van-phong/            luật chung mọi phiên  + references/nhan.md
├── sua-bug-elearn/       sửa bug khoá học
├── soan-bai-lab/         soạn tóm tắt buổi dạy
└── cap-nhat-kinh-doanh/  ĐANG TẮT, chờ bạn điền luật
```

Frontmatter khai **mảng việc**. Có dòng `mang:` thì Skill này mở ra một mảng —
`agent/phong.mjs` quét ra, `tao-cau-hinh.mjs` gửi sang app. **Thêm một mảng = tạo một
thư mục Skill**, không sửa `.env`, không sửa `phong.mjs`, không sửa app, không đụng database:

```yaml
mang: thacsi                     # mã mảng
ten_mang: Thạc sĩ                 # tên hiện trên app
thu_muc: ~/Documents/Thac si      # thư mục gốc — hoặc $DIR_THACSI để lấy từ .env
mau: '#7B61FF'                    # màu trên app
tat: true                         # tạm dừng mảng này
```

Rồi ba mục **máy đọc được**, mỗi mục là một khối ` ``` `:

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

supabase.com → tạo project → SQL Editor → chạy **ba** file trong
[`supabase/`](supabase/README.md): `schema.sql` → `rls.sql` → `seed_food.sql`.

Trước 21/09 phải chạy bảy file theo đúng thứ tự, trong đó hai file dựng view mà file
sau xoá ngay. Nay gộp hết vào `schema.sql`; các file `doi-*` cũ nằm trong
`supabase/lich-su/`, chỉ để đọc lại chuyện đã qua.

Rồi **Authentication → Sign In / Providers** → bật **Email**, bật **Magic Link**.

Và — **bước hay bị quên, thiếu là không đăng nhập được** — vào
**Authentication → URL Configuration**:

| Ô | Điền gì |
|---|---|
| **Site URL** | địa chỉ app đang dùng, ví dụ `https://dev--<tên>.netlify.app` |
| **Redirect URLs** | thêm từng dòng, có `/**` ở cuối: bản dev · bản production · `http://localhost:8888/**` |

App có gửi `redirect_to` khi xin magic link, nhưng **Supabase bỏ qua tham số đó nếu
địa chỉ không nằm trong Redirect URLs** — rồi rơi về Site URL. Để mặc định
`http://localhost:3000` thì bấm link trong email sẽ ra *"Safari can't open the page"*,
kèm `otp_expired`.

### 2 · Khoá API và đường dẫn

```bash
cp agent/.env.example agent/.env
```

Mở `agent/.env` điền: khoá Supabase · mã bí mật cho link xem thử (`XEM_THU_MA_*`,
phòng nào chưa có thì script tự tạo và ghi thêm vào cuối file — đừng đổi dòng đó) · và đường dẫn của mảng nào đang trỏ bằng `$DIR_…`.

> **Đường dẫn thư mục thuộc về Skill, không thuộc `.env`.** Skill khai `thu_muc:` trong
> frontmatter — ghi thẳng đường dẫn (`~/Documents/Thac si`) hoặc trỏ sang `.env` bằng
> `$DIR_LAB`. Ba mảng cũ đang dùng cách thứ hai.

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
node agent/thu-nhanh.mjs   # 5 giây · không gọi Claude · không tốn gì
```

`thu-nhanh` dựng một thư mục E-learning giả lập trong `_thu/` rồi diễn lại trọn vòng:
mở bản nháp → làm (kể cả cố tình làm lấn) → soát → duyệt → chép về. **Không đụng thư
mục thật.** Số đo gần nhất, 21/09/2026: **62/62 ca đạt**.

Mảng `elearn` đang tạm dừng, nên bài thử bật riêng nó lên bằng `VP_BAT_PHONG=elearn` —
khai đích danh một mảng, không phải công tắc bỏ qua mọi kiểm tra.

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
