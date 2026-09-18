# Văn Phòng Agent — tiến độ

> Đọc file này + `README.md` là nắm đủ để làm tiếp, kể cả sau khi `/clear`.
> Cập nhật: 18/09/2026

## Link

| | |
|---|---|
| App đang chạy | https://courageous-sprite-17c1ff.netlify.app |
| Netlify | project `courageous-sprite-17c1ff`, tài khoản tranchihien0202 |
| Supabase | `dwissbrcqrbknaxniwhz` (project Hien222005, gói Free) |
| Bản dựng + plan | https://claude.ai/artifact/YQYN9XR14d5PygX3hqU2GT |
| Trang sửa Skill | https://claude.ai/artifact/N9PjscXY2JckSXM22D9GaQ |

## Workflow · chốt 18/09

**Một phiên mỗi ngày, ba lệnh:**

```
/task sang  → báo cáo tổng hợp (việc hôm nay + việc tồn hôm qua) → sếp chốt làm gì
/task lam   → mở bản nháp · giao brief cho trưởng phòng · soát báo cáo · ghi kết quả
              (gõ lại mỗi lần sếp trả việc về)
/task chot  → sếp duyệt hết → ghi cả loạt vào file gốc → kiểm lại → đóng phiên ngày
```

**9 cổng.** Hai cổng của sếp (G2 chốt việc, G6 duyệt kết quả), bảy cổng do script chặn:

| Cổng | Giữ điều gì |
|---|---|
| G1 | Một ngày một phiên; mở phiên là quét việc tồn của ngày trước |
| G2 | Sếp chốt hôm nay làm việc nào |
| G3 | Chỉ việc đã chốt, có brief, mọi đường dẫn trong brief tồn tại thật |
| G4 · G5 | Báo cáo đủ mục và đúng kiểu; soát lời khai với bản nháp |
| G6 | Sếp duyệt hoặc trả lại. Trả lại lần 4 → nhãn `can_sep_sua`, sếp tự sửa |
| G7 | Chỉ ghi vào file gốc khi **mọi việc trong ngày đã được duyệt** |
| G8 | So mã băm sau khi ghi; sai thì hoàn tác cả loạt |
| G9 | Chỉ đóng phiên khi mọi việc đã ghi hoặc bị bỏ |

Việc chưa duyệt hết ngày thì phiên để mở, việc thành **tồn**, sáng sau báo cáo đưa lên đầu bảng.

## Đã xong · giai đoạn A (agent trên Mac)

- **5 Skill** (`thu-ky` 194 chữ · `bao-cao` 190 · `phong-lab` 197 · `phong-elearn` 181 · `phong-biz` 166, đang tắt)
  và **3 vai** trưởng phòng. Trước khi rút: 356–426 chữ mỗi file.
- **3 file lệnh**: `agent/sang.md` · `lam.md` · `chot.md`. Đã bỏ `morning.md`, `noon.md` và 3 file khuôn.
- **10 nhãn** trong `agent/nhan.mjs`, bốn nhãn chờ sếp. Agent không có đường nào tự duyệt hay tự ghi file gốc.
- **Bản nháp**: `ban-nhap.mjs` (mở · xem · duyệt · ghi-het · bỏ). Mở bản nháp 15–28ms, tốn 0 MB ổ đĩa.
- **Soát báo cáo**: `soat-bao-cao.mjs` bắt khai man · giấu file · sửa lấn · thiếu đầu ra · sai kiểu dữ liệu · chấm 5/5 mà chưa tự kiểm.
- **Cuối ngày**: `kiem-sau-ghi.mjs` so mã băm, sai thì hoàn tác cả loạt. `tinh-trang.mjs` đếm theo phòng và quét việc tồn.
- **Nhật ký**: `nhat-ky.mjs` + hook `PostToolUse` trong `.claude/settings.json`.
  Ghi hành động, verdict từng cổng, bước agent tự thuật.
- **Máy chủ xem thử bản nháp**: `xem-thu.mjs`, cổng 8890 — nguồn của link sản phẩm.

### Số đo

| Bài thử | Kết quả |
|---|---|
| `node agent/thu-nhanh.mjs` (không gọi Claude, 5 giây) | **46/46 ca đạt** |
| `node agent/thu-truong-phong.mjs --model opus` | **9/9 luật được theo**, 2/2 việc qua soát, 38s và 32s |
| Cùng bài thử với Haiku | 8/9 rồi 7/9; **bỏ quên ghi log bug 2/2 lần** |

Lỗi đã tìm ra khi chạy thật: Opus theo đúng luật nhưng điền sai kiểu dữ liệu (`tin_cay` thành câu văn)
vì khuôn báo cáo bị rút quá tay. Đã thêm lại khuôn JSON 10 dòng vào file vai.

## Còn lại

- **Giai đoạn B · Supabase**: thêm 10 nhãn mới, cột `han_chot`, `brief`, `link_san_pham`, `so_lan_lam_lai`.
  File `supabase/doi-2-workflow.sql`. **Phải sao lưu và có sếp duyệt trước khi chạy.**
- **Giai đoạn C · App**: tab Việc có nhóm *Tồn từ hôm trước*, hiện vòng làm lại lần thứ mấy,
  màn câu hỏi 3 gợi ý + ô tự gõ, nút *Chốt ngày*, nối Supabase thật.
- **Chạy thật lần đầu**: một việc E-learning nhỏ do sếp chọn. Lần đầu script đụng thư mục Elearning.
- **Chi tiết chờ chỉnh**: đường dẫn trong `phong-elearn` còn suy ra, chưa khớp thư mục thật.
  Cổng G3 kiểm đường dẫn tồn tại nên sai sẽ lộ ngay, không âm thầm.
- `lab-repo` chưa clone · mục tiêu kcal/protein còn để tạm 2200/150.

## Quy trình thử và deploy

> **Credit Netlify**: gói Free 300 credit/tháng. Deploy production **tốn 15 credit**, preview và branch deploy **0 credit**.
> Vì vậy: thử ở nhánh `dev`, chỉ merge `main` khi đã ưng.

```bash
node agent/thu-nhanh.mjs                      # 5 giây, không tốn hạn mức
node agent/thu-truong-phong.mjs --model opus  # gọi Claude thật, ~70 giây
node dev-server.mjs                           # app tại chỗ, cổng 8888
node agent/xem-thu.mjs                        # xem bản nháp, cổng 8890
node agent/nhat-ky.mjs xem                    # nhật ký hôm nay
```

## Quyết định đã chốt, đừng làm lại

- Hướng B: Netlify + Supabase. Repo giữ vai kho lưu trữ.
- App **tối duy nhất**, neon, font Nunito. Trang đầu **chỉ có phòng và tên**.
- Vùng an toàn iOS: đo bằng JS ghi vào `--sab`, không dựa `env()` trực tiếp.
- `body{position:fixed}` + `.device{height:100%}`, KHÔNG dùng `100dvh` cho container.
- **Chữ cho người thì ngắn, chỗ chặn thì là code.** Skill dưới 200 chữ, chi tiết để `references/`.
- Luật viết thành **điều kiện Đạt / Trượt**, không viết thành câu răn.
- Không dùng git worktree cho bản nháp: `courses/` trong Elearning nằm trong `.gitignore`.
- Bỏ tầng "thợ": chỉ Thư ký + 3 trưởng phòng. Phòng Kinh doanh đang tắt.
