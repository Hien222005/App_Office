# Bộ nhãn trạng thái

Nguồn duy nhất: `agent/nhan.mjs`. File này chỉ giải thích; lệch nhau thì `nhan.mjs` đúng.

## Bảy nhãn

| Mã | Nhóm | Nghĩa | Chờ sếp? |
|---|---|---|---|
| `cho_chot` | kế hoạch | Việc cũ chờ sếp chốt · **không còn sinh ra từ 28/09** | **có** |
| `da_chot` | kế hoạch | Lập từ Kế hoạch sếp ghi, agent được làm | không |
| `bo` | kế hoạch | Sếp bỏ việc | không · kết thúc |
| `dang_lam` | làm | Agent đang làm trong bản nháp | không |
| `cho_duyet` | kết quả | Xong, qua soát, chờ sếp xem link sản phẩm | **có** |
| `da_duyet` | kết quả | Sếp duyệt rồi, chờ lệnh `chot` ghi cả loạt | không |
| `da_ghi` | kết quả | Đã chép vào file gốc | không · kết thúc |

## Ba thứ KHÔNG phải nhãn

Chúng là chuyện đang xảy ra với việc, không phải chỗ đứng của việc. Tính từ số liệu,
nên agent không thể quên đánh dấu:

| Tình trạng | Tính bằng | Hàm |
|---|---|---|
| Đang làm lại | `so_lan_lam_lai > 0` (nhãn vẫn `da_chot`) | — |
| Cần sếp sửa | `so_lan_lam_lai >= 3` | `cầnSếpSửa(việc)` |
| Đang vướng | có câu hỏi trong `questions` mà `tra_loi` còn trống | `đangVướng(câuHỏi)` |
| Trễ hạn | `han_chot` đã qua, chưa ở nhãn kết thúc | `trễHạn(việc)` |
| Việc tồn | `ngay` trước hôm nay, chưa ở nhãn kết thúc | `làViệcTồn(việc, ngày)` |

## Ai được chuyển nhãn

| Người | Từ | Sang |
|---|---|---|
| Sếp | `cho_chot` (việc cũ) | `da_chot` · `bo` |
| Lệnh `phieu` | Kế hoạch | `da_chot` |
| Sếp | `cho_duyet` | `da_duyet` · `da_chot` (trả lại) · `bo` |
| Sếp | `dang_lam` | `bo` |
| Agent | `da_chot` | `dang_lam` |
| Agent | `dang_lam` | `cho_duyet` |
| Script cuối ngày | `da_duyet` | `da_ghi` |

Agent **không có đường nào** sang `da_chot`, `da_duyet`, `da_ghi`, `bo`.

## Việc agent được nhận

`agentNhậnĐược(việc, câuHỏiCủaViệc)` — đúng cả ba mới được giao:

- nhãn là `da_chot`;
- chưa chạm trần làm lại;
- không đang treo câu hỏi.

Không được giao thì `vìSaoKhôngNhận()` in ra lý do. Đừng tự ý làm việc đó.
