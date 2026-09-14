# Văn Phòng Agent — tiến độ

> Đọc file này + `README.md` là nắm đủ để làm tiếp, kể cả sau khi `/clear`.
> Cập nhật: 13/09/2026

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

1. **Khoá Gemini chưa chạy** — Google báo `API key not valid`.
   Nhiều khả năng khoá bị giới hạn theo HTTP referrer nên gọi từ máy chủ bị chặn.
   Cách nhanh: tạo khoá mới ở aistudio.google.com/apikey (mặc định không giới hạn),
   dán vào Netlify → Environment variables → `GEMINI_API_KEY` (ô **Production**),
   rồi **Trigger deploy → Clear cache and deploy**.
   Model đặt qua biến `GEMINI_MODEL`, mặc định `gemini-2.5-flash`.

## Còn thiếu để chạy thật

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

## Quy trình deploy

```bash
cd ~/Documents/Công\ việc/agent-app
D=/tmp/vp && rm -rf $D && mkdir -p $D/site/netlify/functions
cp app.html $D/site/index.html && cp netlify.toml $D/site/
cp netlify/functions/chat.mjs $D/site/netlify/functions/
cd $D && zip -qr vanphong.zip site
# rồi kéo thả vanphong.zip vào Netlify → Deploys
```
Sau mỗi lần deploy, trên iPhone phải **xoá icon cũ + xoá dữ liệu trang web trong
Cài đặt → Safari → Nâng cao**, rồi Thêm vào MH chính lại. iOS cache web app rất dai.
