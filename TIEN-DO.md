# Văn Phòng Agent — tiến độ

> Đọc file này + `README.md` là nắm đủ để làm tiếp, kể cả sau khi `/clear`.
> Cập nhật: **21/09/2026**

## Link

| | |
|---|---|
| App đang chạy | https://courageous-sprite-17c1ff.netlify.app |
| Netlify | project `courageous-sprite-17c1ff`, tài khoản tranchihien0202 |
| Supabase | `dwissbrcqrbknaxniwhz` (project Hien222005, gói Free) |
| Báo cáo đơn giản hoá | https://claude.ai/artifact/A6TcYJr9uvzp4hfMdwBLv3 |
| Workflow mới (sơ đồ) | https://claude.ai/artifact/4h5BkpmiwRG2AFt49ssg3i |
| Giao diện mới (mockup) | https://claude.ai/artifact/ASaGrSfuJtXR7EaagnmHRZ |

---

## Đợt đơn giản hoá 20/09 — đã xong

Mục tiêu sếp đặt: *đơn giản, dễ dùng, dễ sửa, dễ cập nhật, dễ theo dõi.*
Tham khảo repo `github.com/ngtiendong/Academic-Research-Agent-Skill` — 89 file, **0 subagent**, **1 script**.

| | Trước | Sau |
|---|---|---|
| File chữ agent đọc | 13 · 2.539 chữ | **8 · ~2.000 chữ** |
| Chữ đọc trong một phiên | 1.095 | **805** |
| Tên lệnh agent phải nhớ | 10 | **2** (`viec.mjs` · `nhap.mjs`) |
| Script `.mjs` trong `agent/` | 20 | **12** |
| Nhãn trạng thái | 10 | **7** |
| Mục trong brief | 13 | **5** |
| Mục agent tự khai | 12 | **1** |
| Subagent | 3 | **0** |

### Năm nước đi

1. **Skill = việc.** Xoá `.claude/agents/`. 5 Skill + 3 vai + `task.md` + 3 file `agent/*.md`
   → 4 Skill + 3 lệnh slash. `/task sang|lam|chot` → `/report` `/lam` `/chot`.
2. **Máy điền báo cáo.** Báo cáo JSON 12 mục biến mất; agent chạy một lệnh kèm một câu.
   `soat-bao-cao.mjs` không nhận file báo cáo nữa — tự đọc bản nháp và nhật ký.
3. **Nhãn 10 → 7.** `lam_lai` · `can_sep_sua` · `can_sep_duyet` thành **điều kiện tính từ
   số liệu**, không còn là nhãn. Agent không thể quên đánh dấu.
4. **Gộp script 20 → 12.** `viec.mjs` gộp 7 file; `nhap.mjs` gộp 2; xoá `xem-thu.mjs`
   và `thu-truong-phong.mjs` (bài thử gọi subagent đã không còn).
5. **Link xem thử qua Storage.** `dua-len.mjs` + `netlify/functions/xem.mjs`.

### Ba luật đổi từ chữ sang code

| Luật cũ (chữ) | Luật mới (code giữ) |
|---|---|
| "Chấm 5/5 phải có ô đã-tự-kiểm >10 chữ" — viết bừa 11 chữ là qua | Nhật ký **phải có lần đọc lại file sau lần sửa cuối** |
| Khai `file_da_doi` rồi script so để bắt khai man | Máy tự lấy từ bản nháp — **không có lời khai nào để man** |
| Phạm vi file khai lại trong từng brief | Phạm vi nằm trong Skill; brief chỉ **thu hẹp** được, không nới rộng |

### Những chỗ hỏng phát hiện khi làm

- `references/nhan.md` đang mô tả bộ nhãn **tiếng Anh đầu tiên** (`draft`/`approved`/`done`) — sai từ trước cả đợt 10 nhãn.
- View `v_van_phong` vẫn lọc theo `draft`/`done`, hỏng từ ba đời nhãn trước mà không ai biết **vì không ai gọi**. Đã bỏ cả hai view.
- `com.chihien.agent.plist` gọi `agent/morning.md` đã xoá → cài vào là lỗi.
- `supabase/README.md` hướng dẫn đặt khoá vào `.env.local` với tên `NEXT_PUBLIC_*` — sót từ thời định dùng Next.js.
- Dữ liệu mẫu trong app ghi `lan:2` nhưng nhật ký của chính nó nói "trả lại lần 3".
- Skill khai phạm vi **rộng hơn** điều nó tự cấm ở mục "Không làm".
- `viec.mjs` ghi vào cột `ket_qua` — bảng `tasks` không có cột đó. Đổi sang `ghi_chu_agent`.

---

## Số đo

| Bài thử | Kết quả |
|---|---|
| `node agent/thu-nhanh.mjs` · 5 giây, không gọi Claude | **62/62 ca đạt** · đo 21/09 |
| Đẩy Storage + qua cầu `/xem`, đo bằng JS trong Chrome | trang vẽ ra, CSS tương đối tải được, 32px, kẻ 1px |
| Database sau `doi-5`, thử thật từng nhãn | 6/6 nhãn mới nhận · 7/7 nhãn cũ từ chối |
| App: 6 màn hình render | 0 lỗi JavaScript |

---

## Đợt đơn giản hoá cấu trúc 21/09 — đã xong

Sếp đặt vấn đề: *thêm một việc mới thì hệ thống rắc rối.* Đúng — thêm một mảng việc phải
sửa **năm chỗ**: `.env` · `phong.mjs` · ràng buộc SQL · `site/index.html` · Skill.
Bốn chỗ đầu chỉ để khai một cái tên, trong đó có một lần đụng database thật.

| | Trước | Sau |
|---|---|---|
| Chỗ phải sửa khi thêm một mảng | 5 | **1** — tạo một thư mục Skill |
| File SQL để cài máy mới | 7 | **3** |
| Bảng trong database | 8 | **8** (bỏ `daily_report`, thêm `ke_hoach`) |
| Ca thử | 53 | **62/62** |

- **22/09 · Hai chỗ còn sót khiến Thạc sĩ kẹt việc đầu tiên.** (1) `dua-len.mjs` dừng khi
  thiếu `XEM_THU_MA_<MẢNG>` và bắt sếp tự dán vào `.env` — nay tự tạo và in thông báo.
  (2) Luật chung `van-phong` vẫn ghi cứng ba phòng cũ, và khuôn sản phẩm chỉ Lab có.
  Nay `van-phong` là **khung chung cho mọi phòng**: nguồn · sản phẩm HTML từ
  `van-phong/references/khuon-san-pham.html` (bắt buộc mục Chưa chắc + Nguồn có link) ·
  nhật ký bốn mục · báo xong. Skill của phòng chỉ ghi phạm vi và tên các mục.
- **Mảng khai trong frontmatter của Skill.** `mang` · `ten_mang` · `thu_muc` · `mau` · `tat`.
  `phong.mjs` quét ra, `tao-cau-hinh.mjs` gửi sang app. Đo: thêm mảng giả `thacsi` vào
  cấu hình, app dựng đủ tên và màu **không sửa dòng nào**.
- **Bỏ `check (mang in (…))` trong SQL** — thứ duy nhất bắt phải migration mỗi lần thêm mảng,
  mà lại yếu hơn `gốcCủaPhòng()`: nó không biết mảng nào đang tắt.
- **`viec.mjs phieu` nay kiểm `mang`.** Trước đây luật "mảng tắt thì bỏ qua" chỉ nằm trong
  `report.md` dưới dạng câu chữ; phiếu cho mảng đã tắt vẫn ghi được, tới `nhap.mjs mo` mới vỡ.
- **Bỏ bảng `daily_report`** — không ai đọc, mà đang là CHA của `tasks` (`on delete cascade`).
  Cổng đầu `/lam` nay hỏi "đã mở phiên hôm nay chưa", đúng hơn "đã có phiếu chưa".
- **`rls.sql` quét cả schema** thay vì liệt kê cứng 8 tên bảng — thêm bảng mà quên sửa danh
  sách thì bảng đó chạy không có RLS, tức ai cầm khoá anon đều đọc được.
- **Thêm bảng `ke_hoach`** — kế hoạch tuần, nguồn việc của `/report`. Cột `tuan` để trống
  nghĩa là **lặp mọi tuần**.
- **Tạm dừng mảng `elearn`.** Việc đang dở trong database nằm nguyên.

### Lỗi bắt được khi làm

- Bài thử không dọn `_thu/nhat-ky/`. `soat-bao-cao.mjs` đọc nhật ký của **cả hôm qua**, nên
  bản ghi còn sót từ lần chạy hôm trước làm **4 ca đáng lẽ trượt lại qua** — nghĩa là chạy
  bài thử vào ngày hôm sau lần chạy trước thì bốn chốt an toàn bị vô hiệu mà không ai biết.
- `site/index.html` còn ba chỗ ghi "ca trưa" theo workflow sáng/trưa đã bỏ.

### Kế hoạch tuần — xong 21/09 (đợt hai)

`doi-6-don-nen.sql` **đã chạy** trên database thật. Đo lại: `agent_runs` hết cột `phien`,
`tasks` hết ba cột chết, `daily_report` đã bỏ, `ke_hoach` đã có.

- **Màn Kế hoạch trong app** — bố cục C, vào từ tab Việc. Ô gõ nằm sẵn trên đầu: gõ tên
  việc → chạm mảng → chạm thứ → `+` hoặc Enter. Chạm một dòng để tạm ngưng, chạm `×`
  **hai lần** để xoá (không dùng `confirm()` — hộp thoại trình duyệt chặn mọi thứ sau nó).
- **`/report` thôi tự nghĩ ra việc.** Lệnh mới `viec.mjs ke-hoach` in đúng khuôn mà `phieu`
  nhận, nối thẳng: `node agent/viec.mjs ke-hoach | node agent/viec.mjs phieu`.
- Bản vẽ workflow sáu bước: https://claude.ai/artifact/LaYP69gL5ohxuQHU9vC4rP
- Ba bố cục đã chọn: https://claude.ai/artifact/4LEzfuF7d7eZH497EWzJmT

### Lỗi tự tạo ra rồi tự bắt được

Mã việc suy ra từ `mã kế hoạch + ngày` cho `/report` chạy lại không đẻ việc trùng —
nhưng `db.nhét` là **upsert**, nên gõ `/report` lần hai trong ngày sẽ **đè ngược việc sếp
đã chốt về lại `cho_chot`**, xoá cả link sản phẩm của việc đang chờ duyệt. Đã chặn trong
`ke-hoach`: dòng nào hôm nay đã lập phiếu thì bỏ qua, kèm lý do đọc được. Thử thật: chốt
việc → gõ lại → nhãn `da_chot` giữ nguyên.

## Còn lại
- **Skill mảng Thạc sĩ** — sếp và Claude viết cùng. Chưa có thư mục, chưa có loại việc.
- **Mục `## Cách làm`** cho cả ba Skill đang bật — flow từng bước, cố định một kiểu.
- **Skill E-learning và Lab đã trỏ vào thư mục thật**, đo 13/13 và 8/8 ca.
  Phòng Kinh doanh vẫn **tắt**.
- **Deploy hàm `/xem` lên Netlify** — chưa deploy thì link bản nháp không mở được.
  Tốn 15 credit cho một lần merge `main`.
- Phòng Kinh doanh chưa khai `## File được sửa` — chưa mở bản nháp được.
- Mục tiêu kcal/protein còn để tạm 2200/150.

---

## Quy trình thử và deploy

> Gói Netlify Free 300 credit/tháng. Deploy production **15 credit**, preview và branch
> deploy **0**. Thử ở nhánh `dev`, chỉ merge `main` khi đã ưng.

```bash
node agent/thu-nhanh.mjs   # 5 giây, không tốn hạn mức
node dev-server.mjs                           # app tại chỗ, cổng 8888
node agent/nhat-ky.mjs xem                    # nhật ký hôm nay
```

---

## Quyết định đã chốt, đừng làm lại

- Hướng B: Netlify + Supabase. Repo giữ vai kho lưu trữ.
- App **tối duy nhất**, neon, font Nunito. Trang đầu **chỉ có phòng và tên**.
- Vùng an toàn iOS: đo bằng JS ghi vào `--sab`, không dựa `env()` trực tiếp.
- `body{position:fixed}` + `.device{height:100%}`, KHÔNG dùng `100dvh` cho container.
- **Chữ cho người thì ngắn, chỗ chặn thì là code.**
- Luật viết thành **điều kiện Đạt / Trượt**, không viết thành câu răn.
- Không dùng git worktree cho bản nháp: `courses/` trong Elearning nằm trong `.gitignore`.
- **Không subagent.** Phiên chính tự làm, nạp Skill theo việc.
- **Không điểm tự tin.** Agent chưa chắc thì hỏi kèm 3 gợi ý, không chấm điểm mình.
- Link xem thử **không** chạy trên Mac: `pmset` đặt máy ngủ sau 1 phút, link chết khi
  sếp rời máy — mà sếp duyệt lúc đang ở ngoài.
- Đường dẫn link xem thử **bám theo file**, không bám theo mã việc: sửa lại cùng một
  file thì ra đúng link cũ, bookmark được.
