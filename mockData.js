// Dữ liệu mẫu để xem demo khi CHƯA nối Apps Script (APPS_SCRIPT_URL trống).
// Số liệu lấy từ PROMPT_ClaudeCode_CongNo_Agent.md, tính đến 15/07/2026.
// Sau khi import Google Sheet thật, dữ liệu thật sẽ thay thế toàn bộ phần này.

window.MOCK_DATA = (function () {
  function d(s) { return new Date(s); }

  var hoaDons = [
    { 'Số HĐ': '30135', 'Ngày HĐ': d('2026-07-09'), 'Hạn TT (N+3)': d('2026-07-12'), 'Giá HĐ (VND)': 57168648, 'Loại': 'Đại lý', 'Người Bán': 'Linh', 'Khách Hàng': 'Tiến Phát', 'Đã TT (VND)': 0, 'Còn Nợ': 57168648, 'Trạng Thái': '', 'Ghi Chú': '' },
    { 'Số HĐ': '30272', 'Ngày HĐ': d('2026-07-10'), 'Hạn TT (N+3)': d('2026-07-13'), 'Giá HĐ (VND)': 14749776, 'Loại': 'Đại lý', 'Người Bán': 'Linh', 'Khách Hàng': 'Tiến Phát', 'Đã TT (VND)': 0, 'Còn Nợ': 14749776, 'Trạng Thái': '', 'Ghi Chú': '' },
    { 'Số HĐ': '30279', 'Ngày HĐ': d('2026-07-10'), 'Hạn TT (N+3)': d('2026-07-13'), 'Giá HĐ (VND)': 12221, 'Loại': 'Đại lý', 'Người Bán': 'Linh', 'Khách Hàng': 'Tiến Phát', 'Đã TT (VND)': 0, 'Còn Nợ': 12221, 'Trạng Thái': '', 'Ghi Chú': '' }
  ];

  var khachHang = [
    { 'Mã KH': 'SGSC', 'Tên KH': 'Saigon Success', 'SĐT Zalo': '', 'Hạn mức tín dụng': 0, 'Tổng nợ hiện tại': 0, 'Số đơn quá hạn': 0, 'Trạng Thái': '✅' },
    { 'Mã KH': 'NAMLONG', 'Tên KH': 'Nam Long', 'SĐT Zalo': '', 'Hạn mức tín dụng': 0, 'Tổng nợ hiện tại': 0, 'Số đơn quá hạn': 0, 'Trạng Thái': '✅' }
  ];

  var congNoLinhTP = [
    { 'Số HĐ': '30135', 'Ngày': d('2026-07-09'), 'Giá HĐ (100%)': 57168648, 'Phải TT (96%)': 54881902, 'Linh đã chuyển': 54881902, 'Chênh lệch': 0, 'Nhóm TT': '', 'Trạng Thái': '✅ Đủ' },
    { 'Số HĐ': '30272', 'Ngày': d('2026-07-10'), 'Giá HĐ (100%)': 14749776, 'Phải TT (96%)': 14159785, 'Linh đã chuyển': 14159785, 'Chênh lệch': 0, 'Nhóm TT': '', 'Trạng Thái': '✅ Đủ' }
  ];

  var linhTPSummary = {
    soDon: 26,
    tong100: 244939780,
    phaiTT: 235142188,
    daChuyen: 243626089,
    tpHoanLinh: 8483900,
    chiHo: 5740688,
    cocHienTai: 30000000
  };

  var thanhToanLog = [];

  var config = {
    CKHK_Q1: '4%', CKHK_Q2: '4%',
    CKHK_MOC_100TR: '2%', CKHK_MOC_200TR: '3%', CKHK_MOC_300TR: '4%',
    COC_HIEN_TAI: 30000000
  };

  return { hoaDons: hoaDons, khachHang: khachHang, congNoLinhTP: congNoLinhTP, linhTPSummary: linhTPSummary, thanhToanLog: thanhToanLog, config: config };
})();
