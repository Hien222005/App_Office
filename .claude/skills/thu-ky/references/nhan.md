# Bộ nhãn trạng thái

Nguồn duy nhất: `agent/nhan.mjs`. File này chỉ giải thích; nếu hai bên lệch nhau, `nhan.mjs` đúng.

| Mã | Nhóm | Nghĩa | Chờ sếp? |
|---|---|---|---|
| `draft` | kế hoạch | Kế hoạch phiên sáng vừa đề xuất | có |
| `approved` | kế hoạch | Sếp đã duyệt kế hoạch, phiên trưa được làm | không |
| `rejected` | kế hoạch | Sếp từ chối, bỏ việc | không · kết thúc |
| `doing` | làm | Trưởng phòng đang làm trong bản nháp | không |
| `blocked` | làm | Vướng, đã hỏi sếp kèm phương án | có |
| `cho_duyet_kq` | kết quả | Làm xong trong bản nháp, qua soát, chờ sếp xem link sản phẩm | có |
| `redo` | kết quả | Sếp yêu cầu làm lại, kèm nhận xét | không |
| `done` | kết quả | Sếp duyệt kết quả, bản nháp đã chép về file thật | không · kết thúc |

**Trễ hạn không phải nhãn.** Một việc trễ khi có `han_chot` đã qua và chưa ở nhãn kết thúc.

## Ai được chuyển nhãn

| Người | Từ | Sang |
|---|---|---|
| Sếp | `draft` | `approved`, `rejected` |
| Sếp | `cho_duyet_kq` | `done`, `redo` |
| Sếp | `blocked` | `approved` (sau khi trả lời câu hỏi) |
| Agent | `approved`, `redo` | `doing` |
| Agent | `doing` | `cho_duyet_kq`, `blocked` |

Agent **không bao giờ** chuyển sang `approved`, `rejected`, `done`, `redo`.
