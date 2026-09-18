// Bộ nhãn trạng thái DUY NHẤT của Văn Phòng Agent.
// Skill, script, database và app đều đọc từ đây — không nơi nào tự đặt nhãn riêng.
//
// Một ngày một phiên. Việc đi qua hai cổng của sếp, ở giữa là vòng lặp làm lại:
//   cho_sep_chot ──sếp──▶ da_chot ──agent──▶ doing ──agent──▶ cho_duyet_kq
//        └──sếp──▶ bo                                   ├──sếp──▶ da_duyet_kq ──cuối ngày──▶ da_ghi
//                                                        └──sếp──▶ lam_lai ──agent──▶ doing
//   doing ──agent──▶ can_sep_duyet (vướng, hỏi kèm 3 phương án)
//   lam_lai lần thứ 4 ──script──▶ can_sep_sua (sếp tự sửa, agent không chạm)

export const NHÃN = {
  cho_sep_chot:  { nhóm: 'kế hoạch', tên: 'Chờ sếp chốt',        chờ_sếp: true },
  da_chot:       { nhóm: 'kế hoạch', tên: 'Sếp đã chốt',         chờ_sếp: false },
  bo:            { nhóm: 'kế hoạch', tên: 'Bỏ',                  chờ_sếp: false, kết_thúc: true },
  doing:         { nhóm: 'làm',      tên: 'Đang làm',            chờ_sếp: false },
  can_sep_duyet: { nhóm: 'làm',      tên: 'Cần sếp duyệt',       chờ_sếp: true },
  can_sep_sua:   { nhóm: 'làm',      tên: 'Cần sếp sửa',         chờ_sếp: true },
  cho_duyet_kq:  { nhóm: 'kết quả',  tên: 'Chờ duyệt kết quả',   chờ_sếp: true },
  lam_lai:       { nhóm: 'kết quả',  tên: 'Làm lại',             chờ_sếp: false },
  da_duyet_kq:   { nhóm: 'kết quả',  tên: 'Đã duyệt · chờ ghi',  chờ_sếp: false },
  da_ghi:        { nhóm: 'kết quả',  tên: 'Đã ghi vào file gốc', chờ_sếp: false, kết_thúc: true },
};

// Ai được chuyển nhãn nào sang nhãn nào. "Agent không tự duyệt" nằm ở đây, không ở prompt.
export const CHUYỂN = {
  sếp: {
    cho_sep_chot:  ['da_chot', 'bo'],
    cho_duyet_kq:  ['da_duyet_kq', 'lam_lai'],
    can_sep_duyet: ['da_chot', 'bo'],       // trả lời câu hỏi xong thì việc về hàng chờ làm
    can_sep_sua:   ['da_chot', 'bo'],       // sếp sửa brief rồi giao lại
  },
  agent: {
    da_chot:  ['doing'],
    lam_lai:  ['doing'],
    doing:    ['cho_duyet_kq', 'can_sep_duyet'],
  },
  // Chỉ script cuối ngày được chép về và đóng nhãn.
  script: {
    da_duyet_kq: ['da_ghi'],
    lam_lai:     ['can_sep_sua'],           // khi chạm trần số lần làm lại
  },
};

export const TRẦN_LÀM_LẠI = 3;            // lần thứ 4 thì sếp tự sửa
export const PHIÊN_NHẬN = ['da_chot', 'lam_lai'];   // lệnh `lam` chỉ nhận hai nhãn này
export const CHỜ_SẾP = Object.entries(NHÃN).filter(([, n]) => n.chờ_sếp).map(([m]) => m);
export const SỐ_PHƯƠNG_ÁN = 3;             // đúng 3 gợi ý; app thêm ô cho sếp tự gõ

export const làNhãn = (mã) => Object.hasOwn(NHÃN, mã);

export function đượcChuyển(từ, đến, ai) {
  if (!làNhãn(từ) || !làNhãn(đến)) return false;
  return (CHUYỂN[ai]?.[từ] ?? []).includes(đến);
}

// Chạm trần thì không cho làm lại nữa: việc sang "cần sếp sửa".
export const chạmTrần = (sốLầnLàmLại) => Number(sốLầnLàmLại || 0) >= TRẦN_LÀM_LẠI;

// Trễ hạn KHÔNG phải nhãn: tính từ hạn chót, để một việc vừa "đang làm" vừa "trễ" được.
export function trễHạn(việc, lúc = new Date()) {
  if (!việc.han_chot || NHÃN[việc.trang_thai]?.kết_thúc) return false;
  return new Date(việc.han_chot) < lúc;
}

// Việc của ngày trước mà chưa xong thì thành việc tồn, lệnh `sang` phải đưa lên đầu bảng.
export function làViệcTồn(việc, hômNay) {
  return việc.ngay < hômNay && !NHÃN[việc.trang_thai]?.kết_thúc;
}
