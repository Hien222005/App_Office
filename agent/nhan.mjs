// Bộ nhãn trạng thái DUY NHẤT của Văn Phòng Agent.
// Skill, script, database và app đều đọc từ đây — không nơi nào tự đặt nhãn riêng.
//
// Một ngày một phiên. Việc đi qua hai cổng của sếp:
//
//   cho_chot ──sếp──▶ da_chot ──agent──▶ dang_lam ──agent──▶ cho_duyet
//      └───sếp──▶ bo                                  ├──sếp──▶ da_duyet ──cuối ngày──▶ da_ghi
//                                                      └──sếp──▶ da_chot   (trả lại, đếm +1)
//
// BẢY nhãn, không phải mười. Ba thứ trước đây là nhãn nay là ĐIỀU KIỆN tính từ dữ liệu,
// vì chúng vốn không phải chỗ đứng của việc mà là chuyện đang xảy ra với việc:
//
//   cũ "lam_lai"       → da_chot + so_lan_lam_lai > 0
//   cũ "can_sep_sua"   → so_lan_lam_lai >= TRẦN_LÀM_LẠI   (hàm cầnSếpSửa)
//   cũ "can_sep_duyet" → có câu hỏi chưa trả lời trong bảng questions (hàm đangVướng)
//
// Đổi như vậy thì agent không thể "quên" đặt nhãn: điều kiện tính ra từ số liệu,
// không phụ thuộc agent có nhớ gọi đúng lệnh hay không.

export const NHÃN = {
  cho_chot:  { nhóm: 'kế hoạch', tên: 'Chờ sếp chốt',        chờ_sếp: true },
  da_chot:   { nhóm: 'kế hoạch', tên: 'Sếp đã chốt',         chờ_sếp: false },
  bo:        { nhóm: 'kế hoạch', tên: 'Bỏ',                  chờ_sếp: false, kết_thúc: true },
  dang_lam:  { nhóm: 'làm',      tên: 'Đang làm',            chờ_sếp: false },
  cho_duyet: { nhóm: 'kết quả',  tên: 'Chờ sếp duyệt',       chờ_sếp: true },
  da_duyet:  { nhóm: 'kết quả',  tên: 'Đã duyệt · chờ ghi',  chờ_sếp: false },
  da_ghi:    { nhóm: 'kết quả',  tên: 'Đã ghi vào file gốc', chờ_sếp: false, kết_thúc: true },
};

// Ai được chuyển nhãn nào sang nhãn nào. "Agent không tự duyệt" nằm ở đây, không ở prompt.
export const CHUYỂN = {
  sếp: {
    cho_chot:  ['da_chot', 'bo'],
    cho_duyet: ['da_duyet', 'da_chot', 'bo'],   // 'da_chot' = trả lại làm lại
    dang_lam:  ['bo'],
  },
  agent: {
    da_chot:  ['dang_lam'],
    dang_lam: ['cho_duyet'],
  },
  // Chỉ script cuối ngày được chép về file gốc và đóng nhãn.
  script: {
    da_duyet: ['da_ghi'],
  },
};

export const TRẦN_LÀM_LẠI = 3;          // lần thứ 4 thì sếp tự sửa, agent không chạm
// Lệnh `lam` nhận cả hai nhãn. Phải có `dang_lam`, kẻo việc làm dở bị KẸT VĨNH VIỄN:
// phiên chết giữa chừng, cổng chặn, hay sếp trả việc về — việc nằm ở `dang_lam` mà
// không ai nhặt lại được. `lam` vốn là lệnh gõ lại nhiều lần, nên phải nhặt được việc dở.
export const PHIÊN_NHẬN = ['da_chot', 'dang_lam'];
export const CHỜ_SẾP = Object.entries(NHÃN).filter(([, n]) => n.chờ_sếp).map(([m]) => m);
export const SỐ_PHƯƠNG_ÁN = 3;          // đúng 3 gợi ý; app thêm ô cho sếp tự gõ

export const làNhãn = (mã) => Object.hasOwn(NHÃN, mã);

export function đượcChuyển(từ, đến, ai) {
  if (!làNhãn(từ) || !làNhãn(đến)) return false;
  return (CHUYỂN[ai]?.[từ] ?? []).includes(đến);
}

// ── Ba điều kiện thay cho ba nhãn cũ ───────────────────────────────────────

// Chạm trần thì việc thuộc về sếp: agent không được nhận, không được chạm.
export const chạmTrần = (sốLầnLàmLại) => Number(sốLầnLàmLại || 0) >= TRẦN_LÀM_LẠI;
export const cầnSếpSửa = (việc) => chạmTrần(việc?.so_lan_lam_lai) && !NHÃN[việc?.trang_thai]?.kết_thúc;

// Đang vướng = có câu hỏi chưa ai trả lời. Truyền vào danh sách câu hỏi của việc đó.
export const đangVướng = (câuHỏi = []) => câuHỏi.some(c => !c.tra_loi);

// Việc agent được phép nhận trong lệnh `lam`: đã chốt, chưa chạm trần, không vướng.
export function agentNhậnĐược(việc, câuHỏiCủaViệc = []) {
  return PHIÊN_NHẬN.includes(việc.trang_thai)
      && !cầnSếpSửa(việc)
      && !đangVướng(câuHỏiCủaViệc);
}

// Lý do vì sao một việc không được giao — để script in ra cho người đọc hiểu.
export function vìSaoKhôngNhận(việc, câuHỏiCủaViệc = []) {
  if (!PHIÊN_NHẬN.includes(việc.trang_thai)) {
    return `nhãn "${việc.trang_thai}", lệnh lam chỉ nhận ${PHIÊN_NHẬN.join(' hoặc ')}`;
  }
  if (cầnSếpSửa(việc)) return `đã trả lại ${việc.so_lan_lam_lai} lần — sếp tự sửa, agent không chạm`;
  if (đangVướng(câuHỏiCủaViệc)) return 'đang có câu hỏi chưa được trả lời';
  return null;
}

// ── Hai thứ KHÔNG phải nhãn ────────────────────────────────────────────────

// Trễ hạn tính từ hạn chót, để một việc vừa "đang làm" vừa "trễ" được.
export function trễHạn(việc, lúc = new Date()) {
  if (!việc.han_chot || NHÃN[việc.trang_thai]?.kết_thúc) return false;
  return new Date(việc.han_chot) < lúc;
}

// Việc của ngày trước mà chưa xong thì thành việc tồn, lệnh `sang` phải đưa lên đầu bảng.
export function làViệcTồn(việc, hômNay) {
  return việc.ngay < hômNay && !NHÃN[việc.trang_thai]?.kết_thúc;
}
