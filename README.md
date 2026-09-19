# Văn Phòng Agent

Một agent làm việc dưới máy Mac, bạn duyệt trên điện thoại.

Bốn mảng việc: **Lab Coach · E-learning · Kinh doanh · Dinh dưỡng**.
Agent không bao giờ tự ghi vào file thật của bạn. Nó làm trong bản nháp, nộp kết quả
kèm link để bạn tự mở ra xem; bạn bấm duyệt thì cuối ngày script mới chép về.

| | |
|---|---|
| App đang chạy | https://courageous-sprite-17c1ff.netlify.app |
| Tiến độ · còn gì phải làm | [`TIEN-DO.md`](TIEN-DO.md) |
| Database | Supabase — xem [`supabase/README.md`](supabase/README.md) |

**Mục lục** · [Một ngày](#một-ngày-làm-việc) · [Thư mục](#bản-đồ-thư-mục) · [9 cổng](#9-cổng--thứ-giữ-cho-hệ-thống-an-toàn) · [10 nhãn](#10-nhãn-trạng-thái) · [Cài đặt](#cài-đặt--làm-một-lần) · [Lệnh](#bảng-lệnh) · [Chạy thử](#chạy-thử) · [Netlify](#lưu-ý-netlify)

---

## Một ngày làm việc

Một ngày **một phiên**, ba lệnh gõ trong Claude Code:

```
/task sang   Agent đọc việc hôm nay + việc tồn hôm qua → trình bảng → BẠN chốt làm gì
/task lam    Agent mở bản nháp, giao việc cho trưởng phòng, soát báo cáo, nộp kết quả
             ↑ gõ lại lệnh này mỗi lần bạn trả việc về
/task chot   Bạn đã duyệt hết → script chép cả loạt vào file gốc → kiểm lại → đóng phiên
```

Chưa duyệt hết trong ngày thì **phiên không đóng**. Việc còn lại thành *việc tồn*,
sáng hôm sau `/task sang` tự đưa lên đầu bảng.

Ba file kịch bản của ba lệnh nằm ở [`agent/sang.md`](agent/sang.md) ·
[`agent/lam.md`](agent/lam.md) · [`agent/chot.md`](agent/chot.md).

### Ai làm gì

- **Thư ký** — phiên Claude Code chính bạn đang gõ. Điều phối, không tự làm việc chuyên môn.
- **3 trưởng phòng** — subagent `lab` · `elearn` · `biz`, mỗi phòng một Skill riêng.
  Phòng Kinh doanh **đang tắt** cho tới khi bạn điền luật.
- Không có tầng thợ. Báo cáo do **script** soát, không để agent soát agent.

---

## Bản đồ thư mục

| Thư mục | Là gì | Có commit? |
|---|---|---|
| [`.claude/`](.claude) | Skill · vai trưởng phòng · lệnh `/task` · hook nhật ký | ✅ |
| [`agent/`](agent) | Bộ máy chạy trên Mac: 19 script `.mjs` + 3 file kịch bản `.md` | ✅ |
| [`site/`](site) | App trên điện thoại (1 file `index.html` + `nguon.js`) | ✅ |
| [`netlify/functions/`](netlify/functions) | `chat.mjs` — cầu nối tới Gemini, giữ khoá API ở phía máy chủ | ✅ |
| [`supabase/`](supabase) | Các file SQL dựng database | ✅ |
| `_brief/` | Brief của từng việc, dạng JSON | chỉ brief thử |
| `_nhap/` | Bản nháp — chỗ trưởng phòng được phép sửa | ❌ |
| `_thu/` | Văn phòng giả lập cho bài chạy thử | ❌ |
| `nhat-ky/` | Nhật ký `.jsonl`, một file mỗi ngày | ❌ |
| `sao-luu/` | Dump 8 bảng Supabase, chạy mỗi tối | ❌ |

Bốn thư mục cuối là **chỗ chạy**, `.gitignore` chặn hết. Xoá đi cũng không mất gì ngoài
`sao-luu/` — gói Supabase Free không có sao lưu tự động, đó là bản sao duy nhất của bạn.

### Trong `agent/` có gì

| Nhóm | File |
|---|---|
| **Kịch bản phiên** | `sang.md` · `lam.md` · `chot.md` |
| **Dùng chung** (không gọi trực tiếp) | `lib.mjs` nối Supabase · `nhan.mjs` bộ nhãn · `phong.mjs` đường dẫn ba phòng · `pham-vi.mjs` được sửa file nào · `anh-chup.mjs` chụp & so thư mục |
| **Lệnh trong phiên** | `mo-phien` · `doc-viec` · `ghi-phieu` · `ghi-ket-qua` · `hoi-sep` · `dong-phien` · `tinh-trang` |
| **Cổng chặn** | `ban-nhap` · `soat-bao-cao` · `kiem-sau-ghi` |
| **Xem & ghi** | `xem-thu` máy chủ xem bản nháp · `nhat-ky` · `sao-luu` |
| **Bài thử** | `thu-nhanh` (không gọi Claude) · `thu-truong-phong` (gọi Claude thật) |

Không cần `npm install`. Mọi script gọi thẳng REST API của Supabase bằng `fetch` có sẵn trong Node.

---

## 9 cổng — thứ giữ cho hệ thống an toàn

Nguyên tắc: **chữ cho người thì ngắn, chỗ chặn thì là code.** Luật nào quan trọng thì
viết thành script chặn, không viết thành câu răn trong prompt — vì prompt thì agent có
thể quên, còn script thì không.

| Cổng | Giữ điều gì | Ai giữ |
|---|---|---|
| **G1** | Một ngày một phiên; mở phiên là quét việc tồn ngày trước | `mo-phien.mjs` |
| **G2** | Bạn chốt hôm nay làm việc nào | **bạn**, trên app |
| **G3** | Chỉ việc đã chốt, có brief, mọi đường dẫn trong brief tồn tại thật | `doc-viec.mjs` |
| **G4·G5** | Báo cáo đủ mục, đúng kiểu; soát lời khai với bản nháp | `soat-bao-cao.mjs` |
| **G6** | Bạn duyệt hoặc trả lại. Trả lại lần 4 → nhãn *cần sếp sửa* | **bạn**, trên app |
| **G7** | Chỉ ghi vào file gốc khi **mọi việc trong ngày** đã được duyệt | `ban-nhap.mjs ghi-het` |
| **G8** | So mã băm sau khi ghi; sai một file thì hoàn tác cả loạt | `kiem-sau-ghi.mjs` |
| **G9** | Chỉ đóng phiên khi mọi việc đã ghi hoặc bị bỏ | `dong-phien.mjs` |

Ba cổng đáng chú ý:

**Bản nháp không tốn ổ đĩa.** `ban-nhap.mjs` nhân bản thư mục bằng APFS clone (`cp -c`) —
chép 3 GB mất chưa tới nửa giây và **không tốn thêm MB nào**, vì hai bản dùng chung khối
dữ liệu cho tới khi một bên bị sửa. Đo thật: mở bản nháp 15–28 ms.

**Soát báo cáo là "trưởng phòng bằng code".** Một agent đọc báo cáo của agent khác vẫn có
thể tin lời bịa. `soat-bao-cao.mjs` so lời khai với file thật trong bản nháp, nên bắt được:
khai man · giấu file đã sửa · sửa lấn ra ngoài phạm vi · thiếu đầu ra · sai kiểu dữ liệu ·
chấm 5/5 mà chưa tự kiểm.

**Câu hỏi phải có sẵn phương án.** `hoi-sep.mjs` bắt buộc đúng **3 gợi ý** (app thêm ô thứ
tư để bạn tự gõ). Lý do: trả lời bằng một cú chạm thì bạn sẽ trả lời; phải gõ một đoạn văn
thì bạn để đó, và một tuần sau cả hệ thống đứng vì một câu chưa ai đáp.

---

## 10 nhãn trạng thái

Nguồn duy nhất: [`agent/nhan.mjs`](agent/nhan.mjs). Skill, script, database và app đều đọc
từ đây — không nơi nào tự đặt nhãn riêng.

```
cho_sep_chot ──bạn──▶ da_chot ──agent──▶ doing ──agent──▶ cho_duyet_kq
     └───bạn──▶ bo                                 ├──bạn──▶ da_duyet_kq ──cuối ngày──▶ da_ghi
                                                    └──bạn──▶ lam_lai ──agent──▶ doing

doing ──agent──▶ can_sep_duyet          (vướng — hỏi kèm 3 phương án)
lam_lai lần thứ 4 ──script──▶ can_sep_sua  (bạn tự sửa, agent không chạm nữa)
```

Bảng `CHUYỂN` trong `nhan.mjs` ghi rõ **ai** được đổi nhãn nào sang nhãn nào. "Agent không
tự duyệt" nằm ở đó, không nằm trong prompt — nên agent không có đường nào tự duyệt hay tự
ghi vào file gốc, kể cả khi nó muốn.

---

## Cài đặt · làm một lần

### 1 · Supabase

Vào supabase.com → tạo project → SQL Editor → chạy lần lượt ba file:

| # | File | Sửa gì trước khi chạy |
|---|---|---|
| 1 | `supabase/schema.sql` | Không. Dán và Run. |
| 2 | `supabase/rls.sql` | Thay `YOUR_EMAIL_HERE` bằng email đăng nhập của bạn |
| 3 | `supabase/seed_food.sql` | Bỏ comment 5 dòng cuối, điền kcal/protein mục tiêu |

Rồi Authentication → bật **Email magic link**, thêm email của bạn vào danh sách cho phép.

Kiểm tra ngay sau khi chạy:

```sql
select tablename, rowsecurity from pg_tables where schemaname='public';
```

Phải ra **8 dòng, `rowsecurity` đều `true`**. Sót một bảng là lộ dữ liệu.

### 2 · Khoá API

```bash
cp agent/.env.example agent/.env
# rồi mở agent/.env, dán khoá lấy ở Supabase → Settings → API
```

`agent/.env` còn khai **đường dẫn ba phòng** (`DIR_ELEARNING`, `DIR_LAB`, `DIR_BIZ`) —
đường dẫn thật không viết cứng trong code, chỉ nằm ở file này.

> `SUPABASE_SERVICE_KEY` đi vòng qua mọi RLS. Nó chỉ được nằm trên máy này.
> `.gitignore` đã chặn `agent/.env` — **đừng bỏ dòng đó ra.**

### 3 · Tài liệu Lab

```bash
git clone <link repo Lab của bạn> lab-repo
```

### 4 · Chạy app tại chỗ

```bash
node tao-cau-hinh.mjs   # sinh site/cau-hinh.js từ agent/.env (file này không commit)
node dev-server.mjs     # mở http://localhost:8888
```

`dev-server.mjs` chạy đúng như Netlify: tĩnh từ `site/`, còn `/api/chat` gọi thẳng
`netlify/functions/chat.mjs`. Không cần cài `netlify-cli`, **không tốn credit**.

Mở trên iPhone thì dùng `http://<IP-Mac>:8888` (cùng Wi-Fi, địa chỉ in ra lúc chạy).
Lưu ý: qua `http://` thì phần **nói** (`webkitSpeechRecognition`) không chạy —
Safari chặn ngoài ngữ cảnh bảo mật.

---

## Bảng lệnh

Lệnh trong phiên — phần lớn do Thư ký gõ theo kịch bản, không phải bạn:

| Lệnh | Việc |
|---|---|
| `node agent/mo-phien.mjs` | Mở phiên hôm nay + quét việc tồn *(G1)* |
| `node agent/doc-viec.mjs` | Lấy việc đã chốt + nhận xét của bạn. Chưa chốt thì trả `{chặn: true}` *(G3)* |
| `node agent/doc-viec.mjs --kinh-nghiem` | Chỉ lấy kinh nghiệm cũ — phiên sáng dùng, không chặn |
| `cat phieu.json \| node agent/ghi-phieu.mjs` | Ghi phiếu việc, luôn vào nhãn *chờ sếp chốt* |
| `node agent/ban-nhap.mjs mo <brief.json>` | Mở bản nháp, in đường dẫn |
| `node agent/ban-nhap.mjs xem <id>` | File nào đổi, cái nào sẽ được chép về |
| `node agent/soat-bao-cao.mjs <id> <bao-cao.json>` | Soát lời khai với bản nháp *(G4·G5)* |
| `node agent/ghi-ket-qua.mjs <id> doing` | Đánh dấu đang làm |
| `node agent/ghi-ket-qua.mjs <id> cho_duyet_kq <1-5> "căn cứ" "<link sản phẩm>" "file1,file2"` | Nộp kết quả — bắt buộc có chấm tin cậy **và** link để bạn tự kiểm |
| `node agent/hoi-sep.mjs <id> "câu hỏi" "gợi ý 1" "gợi ý 2" "gợi ý 3"` | Hỏi khi mơ hồ — đúng 3 gợi ý |
| `node agent/tinh-trang.mjs` | Bảng theo phòng + việc tồn. **Nguồn số liệu duy nhất** cho skill `bao-cao` |
| `node agent/ban-nhap.mjs ghi-het` | Cuối ngày: chép cả loạt về file gốc *(G7)* |
| `node agent/kiem-sau-ghi.mjs` | So mã băm sau khi ghi, sai thì hoàn tác cả loạt *(G8)* |
| `node agent/dong-phien.mjs <id> "tóm tắt"` | Đóng phiên *(G9)* |

Lệnh bạn tự gõ:

| Lệnh | Việc |
|---|---|
| `node agent/xem-thu.mjs` | Máy chủ xem bản nháp, cổng **8890** — đây là nguồn của "link sản phẩm" |
| `node agent/nhat-ky.mjs xem` | Đọc nhật ký hôm nay: agent nghĩ gì, làm gì, cổng nào trượt |
| `node agent/sao-luu.mjs` | Dump 8 bảng ra `sao-luu/<ngày>/`. **Chạy mỗi tối** |

---

## Chạy thử

```bash
node agent/thu-nhanh.mjs                      # 5 giây · không gọi Claude · không tốn gì
node agent/thu-truong-phong.mjs --model opus  # gọi Claude thật · ~70 giây
```

`thu-nhanh.mjs` dựng một thư mục E-learning giả lập trong `_thu/` rồi diễn lại trọn vòng:
mở bản nháp → trưởng phòng làm (kể cả cố tình làm lấn) → soát cả báo cáo thật lẫn báo cáo
khai man → sếp duyệt → chép về. **Không đụng thư mục thật.**

`thu-truong-phong.mjs` cài sẵn ba cái bẫy mà luật Skill cấm, rồi xem trưởng phòng có sập
bẫy không.

Số đo gần nhất:

| Bài thử | Kết quả |
|---|---|
| `thu-nhanh.mjs` — đo lại 19/09/2026 | **47/47 ca đạt** |
| `thu-truong-phong.mjs --model opus` | **9/9 luật được theo**, 2/2 việc qua soát, 38s và 32s |
| Cùng bài, model Haiku | 8/9 rồi 7/9 — **bỏ quên ghi log bug 2/2 lần** |

---

## Lưu ý Netlify

Gói Free có **300 credit/tháng**. Một lần deploy production tốn **15 credit**;
preview và branch deploy tốn **0**.

`netlify.toml` không có dòng `ignore`, nên Netlify **không phân biệt bạn sửa gì** —
push một commit chỉ đổi mỗi `README.md` lên `main` vẫn tốn đủ 15 credit.

Vì vậy: **làm ở nhánh `dev`, chỉ merge sang `main` khi đã ưng.**

Chỉ thư mục `site/` được publish. `agent/` và `supabase/` nằm ngoài nên không ai tải
được qua đường web.

---

## Chạy tự động — chưa dùng được

`agent/com.chihien.agent.plist` còn trỏ vào `agent/morning.md`, file đã bị xoá khi đổi
sang workflow ba lệnh. **Phải sửa file plist trước** rồi mới cài được:

```bash
sudo pmset repeat wakeorpoweron MTWRFSU 06:25:00     # Mac tự thức
cp agent/com.chihien.agent.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.chihien.agent.plist
```

Đằng nào giai đoạn này cũng nên gõ tay, để còn nhìn agent chạy mà chỉnh Skill.
