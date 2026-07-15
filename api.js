// Lớp gọi dữ liệu: nếu đã cấu hình APPS_SCRIPT_URL (Cài đặt) thì gọi Google Apps Script thật,
// ngược lại dùng dữ liệu mẫu (mockData.js) để xem demo ngay không cần deploy backend.

window.Api = (function () {
  var U = window.Utils;
  var DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbwv0UEJEZhc1ZxmNa_esGAnmcpgg8P0BbhfQc2HUchpmyvwPfV9-KrchSW4DD3EcQd3UQ/exec';

  function getUrl() {
    var saved = localStorage.getItem('congno_apps_script_url');
    if (saved === null) return DEFAULT_URL;
    return saved;
  }
  function setUrl(url) {
    localStorage.setItem('congno_apps_script_url', url || '');
  }
  function isLive() {
    return !!getUrl();
  }

  function callGet(action, params) {
    var url = getUrl() + '?action=' + encodeURIComponent(action);
    Object.keys(params || {}).forEach(function (k) {
      url += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    });
    return fetch(url).then(function (r) { return r.json(); }).then(function (res) {
      if (!res.ok) throw new Error(res.error || 'Lỗi không rõ');
      return res.data;
    });
  }

  function callPost(action, payload) {
    payload = Object.assign({ action: action }, payload || {});
    return fetch(getUrl(), { method: 'POST', body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); }).then(function (res) {
        if (!res.ok) throw new Error(res.error || 'Lỗi không rõ');
        return res.data;
      });
  }

  // ---- MOCK helpers (tính toán ngay trên trình duyệt, dữ liệu KHÔNG lưu lại sau khi tải lại trang) ----
  function mockRecomputeHoaDons() {
    var M = window.MOCK_DATA;
    M.hoaDons.forEach(function (hd) {
      hd['Hạn TT (N+3)'] = U.tinhHanTT(hd['Ngày HĐ'], 3);
      var st = U.tinhTrangThai(hd);
      hd['Còn Nợ'] = st.conNo;
      hd['Trạng Thái'] = (U.badgeIcon(st.badge)) + ' ' + st.trangThai;
    });
    return M.hoaDons;
  }

  function delay(v) { return new Promise(function (res) { setTimeout(function () { res(v); }, 150); }); }

  return {
    isLive: isLive,
    getUrl: getUrl,
    setUrl: setUrl,

    getHoaDons: function (filter) {
      if (isLive()) return callGet('getHoaDons', filter ? { filter: filter } : {});
      var rows = mockRecomputeHoaDons();
      if (!filter) return delay(rows);
      if (filter === 'quaHan') rows = rows.filter(function (h) { return String(h['Trạng Thái']).indexOf('Quá hạn') > -1; });
      if (filter === 'chuaDu') rows = rows.filter(function (h) { return U.fixSapNumber(h['Còn Nợ']) > 0; });
      if (filter === 'linh') rows = rows.filter(function (h) { return String(h['Người Bán']).trim() === 'Linh'; });
      if (filter === 'daiLy') rows = rows.filter(function (h) { return String(h['Người Bán']).trim() !== 'Linh'; });
      return delay(rows);
    },

    getKhachHang: function () {
      if (isLive()) return callGet('getKhachHang');
      return delay(window.MOCK_DATA.khachHang);
    },

    getCongNoLinhTP: function () {
      if (isLive()) return callGet('getCongNoLinhTP');
      return delay({ rows: window.MOCK_DATA.congNoLinhTP, summary: window.MOCK_DATA.linhTPSummary });
    },

    getDashboard: function () {
      if (isLive()) return callGet('getDashboard');
      var M = window.MOCK_DATA;
      var rows = mockRecomputeHoaDons();
      var tongNo = 0, quaHan = 0, conHan = 0;
      rows.forEach(function (h) {
        var cn = U.fixSapNumber(h['Còn Nợ']);
        tongNo += cn;
        if (String(h['Trạng Thái']).indexOf('Quá hạn') > -1) quaHan++;
        else if (cn > 0) conHan++;
      });
      return delay({
        congNoDT: { tongNo: tongNo, soHDQuaHan: quaHan, soHDConHan: conHan },
        linhTP: M.linhTPSummary,
        khachHang: M.khachHang.map(function (k) {
          return { maKH: k['Mã KH'], tenKH: k['Tên KH'], tongNo: k['Tổng nợ hiện tại'], trangThai: k['Trạng Thái'] };
        })
      });
    },

    markPaid: function (payload) {
      if (isLive()) return callPost('markPaid', payload);
      var M = window.MOCK_DATA;
      var hd = M.hoaDons.find(function (h) { return h['Số HĐ'] === payload.soHD; });
      if (hd) {
        hd['Đã TT (VND)'] = U.fixSapNumber(hd['Đã TT (VND)'] || 0) + Number(payload.soTien);
      }
      M.thanhToanLog.push({
        'Ngày': payload.ngayTT || new Date(), 'Số Tiền (VND)': payload.soTien,
        'Người Chuyển': payload.nguoiCK || '', 'Số HĐ liên quan': payload.soHD,
        'Loại': 'TT hóa đơn', 'Ghi Chú': payload.ghiChu || ''
      });
      mockRecomputeHoaDons();
      return delay(hd);
    },

    // data: { soHDs: [...], soTien, ngay, nguoiCK, denTK, ghiChu, chieuTT }
    addThanhToan: function (data) {
      if (isLive()) return callPost('addThanhToan', { data: data });
      var M = window.MOCK_DATA;
      var soHDs = data.soHDs || (data.soHD ? [data.soHD] : []);
      soHDs.forEach(function (soHD) {
        var hd = M.hoaDons.find(function (h) { return h['Số HĐ'] === soHD; });
        var soTien = soHDs.length === 1 ? Number(data.soTien) : (hd ? U.fixSapNumber(hd['Còn Nợ']) : 0);
        if (hd) hd['Đã TT (VND)'] = U.fixSapNumber(hd['Đã TT (VND)'] || 0) + soTien;
        M.thanhToanLog.push({
          'Ngày': data.ngay || new Date(), 'Số Tiền (VND)': soTien,
          'Người Chuyển': data.nguoiCK || '', 'Số HĐ liên quan': soHD,
          'Loại': 'TT hóa đơn', 'Ghi Chú': data.ghiChu || '', 'Chiều TT': data.chieuTT || ''
        });
      });
      var rows = mockRecomputeHoaDons();
      return delay({ soHDs: soHDs, hoaDons: rows });
    },

    updateNguoiBan: function (soHD, nguoiBan) {
      if (isLive()) return callPost('updateNguoiBan', { data: { soHD: soHD, nguoiBan: nguoiBan } });
      var M = window.MOCK_DATA;
      var hd = M.hoaDons.find(function (h) { return h['Số HĐ'] === soHD; });
      if (hd) hd['Người Bán'] = nguoiBan;
      return delay(hd);
    },

    updateKhachHang: function (soHD, khachHang) {
      if (isLive()) return callPost('updateKhachHang', { data: { soHD: soHD, khachHang: khachHang } });
      var M = window.MOCK_DATA;
      var hd = M.hoaDons.find(function (h) { return h['Số HĐ'] === soHD; });
      if (hd) hd['Khách Hàng'] = khachHang;
      return delay(hd);
    },

    addCoc: function (data) {
      if (isLive()) return callPost('addCoc', { data: data });
      var M = window.MOCK_DATA;
      var delta = data.loai === 'Hoàn cọc' ? -Number(data.soTien) : Number(data.soTien);
      M.linhTPSummary.cocHienTai = (M.linhTPSummary.cocHienTai || 0) + delta;
      return delay({ cocHienTai: M.linhTPSummary.cocHienTai });
    },

    getZaloMessage: function (type, payload) {
      if (isLive()) return callGet('getZaloMessage', Object.assign({ type: type }, payload));
      var text = '';
      if (type === 'nhacTT') {
        text = 'Xin chào anh/chị ' + payload.tenKH + ',\n\n📌 Nhắc nhở thanh toán hóa đơn:\n- Số HĐ: ' + payload.soHD +
          '\n- Số tiền: ' + U.formatVND(payload.conNo) + '\n- Hạn thanh toán: ' + U.formatDate(payload.hanTT) +
          ' ⏰\n\nVui lòng chuyển khoản vào:\n🏦 Tiến Phát - VCB: 1061683968\n\nCảm ơn anh/chị!\nLinh - Đồng Tâm KV23';
      } else if (type === 'quaHan') {
        text = 'Kính gửi anh/chị ' + payload.tenKH + ',\n\n⚠️ Hóa đơn ĐÃ QUÁ HẠN ' + (payload.soNgayQuaHan || '') + ' ngày:\n- Số HĐ: ' + payload.soHD +
          '\n- Số tiền còn nợ: ' + U.formatVND(payload.conNo) + '\n- Hạn đã qua: ' + U.formatDate(payload.hanTT) +
          '\n\n🏦 Tiến Phát - VCB: 1061683968\n\nKính mong anh/chị sắp xếp thanh toán sớm.\nLinh - Đồng Tâm KV23';
      }
      var phone = (payload.sdtKH || '').replace(/\D/g, '');
      return delay({ text: text, phone: phone, zaloLink: phone ? ('https://zalo.me/' + phone) : '' });
    }
  };
})();
