# Văn Phòng Agent — tiến độ

> Đọc file này + `README.md` là nắm đủ để làm tiếp, kể cả sau khi `/clear`.
> Cập nhật: **20/09/2026**

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
| Script `.mjs` trong `agent/` | 20 | **13** |
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
4. **Gộp script 20 → 13.** `viec.mjs` gộp 7 file; `nhap.mjs` gộp 2; xoá `xem-thu.mjs`.
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
| `node agent/thu-nhanh.mjs` · 5 giây, không gọi Claude | **50/50 ca đạt** |
| Đẩy Storage + qua cầu `/xem`, đo bằng JS trong Chrome | trang vẽ ra, CSS tương đối tải được, 32px, kẻ 1px |
| Database sau `doi-5`, thử thật từng nhãn | 6/6 nhãn mới nhận · 7/7 nhãn cũ từ chối |
| App: 6 màn hình render | 0 lỗi JavaScript |
| `thu-truong-phong.mjs --model opus` (đo 18/09, **chưa chạy lại**) | 9/9 luật được theo, 38s và 32s |

---

## Còn lại

- **Chạy thật lần đầu** — một việc E-learning nhỏ do sếp chọn. Lần đầu script đụng
  thư mục Elearning thật. **Phải xin phép trước.**
- **Ba Skill còn chỗ ✎ chờ sếp điền** — đường dẫn thật, quy ước đặt tên.
  Phòng Kinh doanh đang **tắt**, chưa khai `## File được sửa` nên không mở bản nháp được.
- **Chạy lại `thu-truong-phong.mjs`** với bộ Skill mới — số 9/9 là của bộ Skill cũ,
  chưa đo lại sau đợt gộp.
- **Deploy hàm `/xem` lên Netlify** — chưa deploy thì link bản nháp không mở được.
  Tốn 15 credit cho một lần merge `main`.
- `lab-repo` chưa clone · mục tiêu kcal/protein còn để tạm 2200/150.

---

## Quy trình thử và deploy

> Gói Netlify Free 300 credit/tháng. Deploy production **15 credit**, preview và branch
> deploy **0**. Thử ở nhánh `dev`, chỉ merge `main` khi đã ưng.

```bash
node agent/thu-nhanh.mjs                      # 5 giây, không tốn hạn mức
node agent/thu-truong-phong.mjs --model opus  # gọi Claude thật, ~70 giây
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
