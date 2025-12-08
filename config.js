// Cấu hình chi nhánh & email dùng chung cho 3 tab

// Email chi nhánh theo loại thuê bao
const BRANCH_EMAILS = {
  'Sài Gòn': {
    KHCN: '"Nguyen Thi Nha Trang" <trang.nha@mobifone.vn>',
    KHDN: 'Trang.thithu@mobifone.vn'
  },
  'Gia Định': {
    KHCN: '"Nguyen Thi Thu Hong (A)" <hong.nthithu@mobifone.vn>',
    KHDN: '"Tran Tuan Anh" <anh.ttuan@mobifone.vn>'
  },
  'Bến Thành': {
    KHCN: '"Pham Thi Hong Huyen" <huyen.phamthihong@mobifone.vn>',
    KHDN: '"Pham Thi Hong Huyen" <huyen.phamthihong@mobifone.vn>'
  },
  'Gò Vấp': {
    KHCN: '"Nguyen Thi Thuy Ha" <ha.ntt@mobifone.vn>; CC: "Phan Thi Cam Tu" <tu.ptc@mobifone.vn>',
    KHDN: '"Huynh Anh Lan" <lan.huynhanh@mobifone.vn>'
  },
  'Thủ Đức': {
    KHCN: '"Nguyen Nhu Thuy" <thuy.nhu@mobifone.vn>',
    KHDN: 'lien.ntb@mobifone.vn'
  },
  'Bình Dương': {
    KHCN: 'Thuý Duy: duy.nguyenthi@mobifone.vn',
    KHDN: 'Thuý Duy: duy.nguyenthi@mobifone.vn'
  },
  'Vũng Tàu': {
    KHCN: 'Thu.doan@mobifone.vn',
    KHDN: 'Thu.doan@mobifone.vn'
  }
};

// Email DV GTGT (chỉ tab GTGT dùng)
const GTGT_CONTACTS = {
  MobiAI: 'MobiAI: (chưa thấy email cụ thể trong phụ lục, vui lòng kiểm tra lại tài liệu nội bộ).',
  MobiPA: 'MobiPA – huy.tran@mobifone.vn (FB chuyển CNTT, khiếu nại cước gửi mail Huy).',
  Saymee: 'Saymee – bss_support@telsoft.com.vn; CC: yen.duhai@mobifone.vn.',
  iCall: 'iCall (1522) – cskh@cnz.vn; nhung.nguyen@cnz.vn; hoangthuhien.tp@gmail.com.',
  MobiGames: 'MobiGames – Nguyen Tien Anh: anh.nguyentien@mobifone.vn.',
  MobiOn: 'MobiOn – vu.phantuan@mobifone.vn.',
  MobiEdu: 'MobiEdu – Nguyen Quỳnh Anh: anh.nguyenquynh@mobifone.vn.',
  MobiAgri: 'MobiAgri – long.caohai@mobifone.vn (Cao Hai Long).',
  'Trở thành triệu phú': 'Trở thành triệu phú – cskh@vano.vn.',
  'Cổng Thông tin Giải trí Việt _My Foto (9050)':
    'Cổng TT Giải trí Việt – My Foto (9050): thuphuong.nguyen@vmgmedia.vn; khieunai@vmgmedia.vn.',
  'Mobi Radio': 'Mobi Radio – giaiquyetkhieunai@i-com.vn.',
  'Quà tặng âm nhạc': 'Quà tặng âm nhạc – thuphuong.nguyen@vmgmedia.vn; khieunai@vmgmedia.vn.',
  iBolero: 'iBolero – vu@ditech.vn.'
};
