window.Utils = (function () {
  function formatVND(n) {
    n = Math.round(Number(n) || 0);
    return n.toLocaleString('vi-VN') + 'đ';
  }

  function formatDate(d) {
    if (!d) return '';
    d = new Date(d);
    var dd = ('0' + d.getDate()).slice(-2);
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    return dd + '/' + mm + '/' + d.getFullYear();
  }

  function tinhHanTT(ngayHD, n) {
    n = n || 3;
    var han = new Date(ngayHD);
    han.setDate(han.getDate() + n);
    if (han.getDay() === 0) han.setDate(han.getDate() + 1);
    return han;
  }

  function fixSapNumber(n) {
    n = Number(n);
    if (!isFinite(n)) return 0;
    if (n > 0 && n < 1000) return Math.round(n * 1000);
    return n;
  }

  function stripTime(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function tinhTrangThai(hd, today) {
    today = today || new Date();
    var conNo = fixSapNumber(hd['Giá HĐ (VND)']) - fixSapNumber(hd['Đã TT (VND)'] || 0);
    var han = new Date(hd['Hạn TT (N+3)']);
    var st = { conNo: conNo };
    if (conNo <= 0) {
      st.trangThai = 'Đủ';
      st.badge = 'ok';
    } else if (stripTime(today) > stripTime(han)) {
      var soNgay = Math.floor((stripTime(today) - stripTime(han)) / 86400000);
      st.trangThai = 'Quá hạn ' + soNgay + ' ngày';
      st.badge = 'overdue';
      st.soNgay = soNgay;
    } else {
      var conLai = Math.floor((stripTime(han) - stripTime(today)) / 86400000);
      st.trangThai = 'Còn ' + conLai + ' ngày';
      st.badge = conLai <= 1 ? 'warn' : 'ok';
      st.soNgay = conLai;
    }
    return st;
  }

  function badgeIcon(badge) {
    if (badge === 'ok') return '✅';
    if (badge === 'warn') return '🟡';
    return '🔴';
  }

  return { formatVND: formatVND, formatDate: formatDate, tinhHanTT: tinhHanTT, fixSapNumber: fixSapNumber, tinhTrangThai: tinhTrangThai, badgeIcon: badgeIcon };
})();
