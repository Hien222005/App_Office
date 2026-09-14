# Văn Phòng Agent — tiến độ

> Đọc file này + `README.md` là nắm đủ để làm tiếp, kể cả sau khi `/clear`.
> Cập nhật: 14/09/2026

## Link

| | |
|---|---|
| App đang chạy | https://courageous-sprite-17c1ff.netlify.app |
| Netlify | project `courageous-sprite-17c1ff`, tài khoản tranchihien0202 |
| Supabase | `dwissbrcqrbknaxniwhz` (project Hien222005, gói Free) |
| Bản thiết kế | https://claude.ai/code/artifact/962c02e3-9033-44bd-8606-c255d72700cf |
| Bản thử tương tác | https://claude.ai/code/artifact/5bbf50fe-5cda-4fa9-b93f-8006b938d9af |

## Đã xong

- **Supabase**: 8 bảng, 2 view, 5 index, realtime 4 bảng. RLS bật đủ 8/8, 8 policy.
  Chủ nhân = `tranchihien0202@gmail.com`. Bucket `food-photos` private.
  `food_db` 36 món. Phiên đăng nhập không hết hạn (never/never).
- **Agent**: 8 script trong `agent/`, 2 prompt (`morning.md`/`noon.md`), lệnh `/task sang|trua`.
  Đã chạy thử trọn vòng và xoá dữ liệu thử. `.env` đã có URL + anon + service_role.
- **App**: deploy Netlify, 6 màn, văn phòng neon isometric + luồng chạy,
  thanh dưới kiểu Onyx (tab nở ra, viên trượt nhún), font Nunito.
  Chat Gemini + voice (nói/đọc) đã code xong.
- **Ba chốt an toàn** cài trong code/DB, không phụ thuộc prompt:
  `doc-viec.mjs` chặn khi phiếu chưa duyệt · DB từ chối câu hỏi trống phương án ·
  `ghi-ket-qua.mjs` bắt chấm tin cậy.

## Đang vướng

Không còn. Chat Gemini đã chạy thật trên bản dev ngày 14/09/2026.
Xem mục dưới để biết việc còn lại.

**Ba lỗi chồng nhau đã gỡ xong, ghi lại để khỏi dò lại:**

1. `chat.mjs` chặn khoá bằng `/^AIza[\w-]{30,}$/`, mà Google đã đổi sang cấp khoá
   bắt đầu bằng `AQ.`. Khoá chưa từng được gửi đi lần nào — lỗi "API key not valid"
   là do chính dòng này, **không phải HTTP referrer**. Đã nhận cả hai định dạng.
2. Google ngừng cấp `gemini-2.5-flash` cho người dùng mới. Đổi mặc định sang
   `gemini-3.6-flash` (đổi được qua biến `GEMINI_MODEL`).
3. Gemini 3 mặc định nghĩ ở mức cao, và **phần nghĩ đếm chung vào `maxOutputTokens`**,
   nên trần 600 bị ăn hết, câu trả lời đứt giữa chừng. Đã nới lên 2000 và đặt
   `thinkingLevel: 'LOW'`.

## Còn thiếu để chạy thật

- **Đưa bản sửa lên site thật.** `main` vẫn đang chạy code cũ nên chat trên
  `courageous-sprite-17c1ff.netlify.app` vẫn hỏng. Merge `dev` vào `main` là xong,
  tốn 15 credit.
- **Link repo tài liệu Lab** → clone vào `agent-app/lab-repo/`
- **Mục tiêu kcal/protein thật** — đang để tạm 2200/150.
  Sửa: `update muc_tieu set kcal_ngay=..., protein_ngay=... where id=1;`
- **Nối app vào Supabase thật** — app hiện chạy dữ liệu mẫu trong bộ nhớ

## Quyết định đã chốt, đừng làm lại

- Hướng B: Vercel/Netlify + Supabase. Repo giữ vai kho lưu trữ, không phải DB nóng.
- App **tối duy nhất**, neon. Bản sáng đã thử và bị loại.
- Trang đầu **chỉ có phòng và tên**, không hiện số liệu công việc.
- Font **Nunito**, mọi cấp đậm nâng một bậc so với Inter.
- Thanh dưới: kiểu kính mờ, glider nhún `cubic-bezier(.37,1.95,.66,.56)`.
- Vùng an toàn iOS: **đo bằng JS ghi vào `--sab`**, không dựa `env()` trực tiếp
  (WebKit cold start trả 0). Người dùng chỉnh tay được qua nút ổ khoá, lưu localStorage.
- `body{position:fixed}` + `.device{height:100%}`, KHÔNG dùng `100dvh` cho container.

## Quy trình thử và deploy

> **Credit Netlify**: gói Free 300 credit/tháng, reset đầu chu kỳ, không mua thêm được.
> Mỗi lần **deploy production tốn 15 credit** — hết sạch thì Netlify **tạm dừng cả site**.
> Deploy preview và branch deploy **tốn 0 credit**. Vì vậy: thử ở nhánh `dev`,
> chỉ merge vào `main` khi đã ưng.

**Bước 1 — thử tại chỗ (0 credit).** Nhanh nhất, sửa thấy ngay:

```bash
cd ~/Documents/Công\ việc/agent-app
node dev-server.mjs
```
Mac mở `http://localhost:8888`, iPhone mở `http://<IP-Mac>:8888` cùng Wi-Fi
(địa chỉ in ra lúc chạy). Chạy cả `/api/chat`. Khoá Gemini để ở `.env` gốc dự án.
Hạn chế: iPhone qua `http://` thì phần **nói** không chạy (Safari đòi https),
phần đọc to vẫn chạy.

**Bước 2 — bản preview https trên điện thoại (0 credit).** Dùng khi cần thử
giọng nói, PWA, thêm vào màn hình chính:

```bash
git add -A && git commit -m "..." && git push origin dev
```
Netlify tự dựng `https://dev--courageous-sprite-17c1ff.netlify.app`.
Địa chỉ này cố định, thêm vào MH chính iPhone một lần là xong.
Cần bật một lần: Netlify → Project configuration → Build & deploy →
Branches and deploy contexts → thêm `dev` vào branch deploys.

**Bước 3 — lên thật (15 credit).** Chỉ khi bản dev đã chạy đúng:

```bash
git checkout main && git merge dev && git push origin main
```

Sau mỗi lần deploy production, trên iPhone phải **xoá icon cũ + xoá dữ liệu trang web
trong Cài đặt → Safari → Nâng cao**, rồi Thêm vào MH chính lại. iOS cache web app rất dai.
