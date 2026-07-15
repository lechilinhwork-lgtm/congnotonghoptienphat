var { useState, useEffect } = React;
var U = window.Utils;
var Api = window.Api;

var ROLES = {
  LINH: { key: 'LINH', name: 'Linh (KV23)', pin: '1234', color: '#1F4E79' },
  TIEN_PHAT: { key: 'TIEN_PHAT', name: 'Tiến Phát', pin: '5678', color: '#1A5276' }
};

function getKhachDisplay(role, tenKH) {
  return role === 'TIEN_PHAT' ? '—' : (tenKH || '');
}

// ---------------- Role gate ----------------
function RoleSelectScreen(props) {
  var s = useState(null); var picked = s[0], setPicked = s[1];
  var p = useState(''); var pin = p[0], setPin = p[1];
  var e = useState(''); var err = e[0], setErr = e[1];

  function submit() {
    var role = ROLES[picked];
    if (pin !== role.pin) { setErr('Sai PIN'); return; }
    localStorage.setItem('congno_role', picked);
    props.onSelect(picked);
  }

  if (!picked) {
    return React.createElement('div', { className: 'role-screen' },
      React.createElement('div', { className: 'role-title' }, '🏗️ CÔNG NỢ ĐỒNG TÂM KV23'),
      React.createElement('div', { className: 'role-sub' }, 'Bạn là ai?'),
      React.createElement('div', { className: 'role-cards' },
        React.createElement('button', { className: 'role-card', onClick: function () { setPicked('LINH'); } }, '👤', React.createElement('div', null, 'LINH KV23')),
        React.createElement('button', { className: 'role-card', onClick: function () { setPicked('TIEN_PHAT'); } }, '🏪', React.createElement('div', null, 'TIẾN PHÁT'))
      )
    );
  }

  return React.createElement('div', { className: 'role-screen' },
    React.createElement('div', { className: 'role-title' }, ROLES[picked].name),
    React.createElement('div', { className: 'role-sub' }, 'Nhập mã PIN'),
    React.createElement('input', {
      type: 'password', inputMode: 'numeric', className: 'role-pin', value: pin, autoFocus: true,
      onChange: function (ev) { setPin(ev.target.value); setErr(''); },
      onKeyDown: function (ev) { if (ev.key === 'Enter') submit(); }
    }),
    err && React.createElement('div', { className: 'role-err' }, err),
    React.createElement('div', { className: 'row gap', style: { marginTop: '12px' } },
      React.createElement('button', { className: 'btn ghost', onClick: function () { setPicked(null); setPin(''); setErr(''); } }, 'Quay lại'),
      React.createElement('button', { className: 'btn primary', onClick: submit }, 'Vào app')
    )
  );
}

// ---------------- Shared bits ----------------
function Badge(props) {
  var st = props.trangThai || '';
  var cls = 'badge ';
  if (st.indexOf('✅') > -1) cls += 'ok';
  else if (st.indexOf('⚠️') > -1) cls += 'warn';
  else if (st.indexOf('🟡') > -1 || st.indexOf('Còn') > -1) cls += 'warn';
  else if (st.indexOf('🔴') > -1 || st.indexOf('Quá hạn') > -1) cls += 'overdue';
  return React.createElement('span', { className: cls }, st);
}

function ZaloModal(props) {
  var msg = props.message;
  var copied = useState(false);
  var setCopied = copied[1];
  function copy() { navigator.clipboard.writeText(msg.text).then(function () { setCopied(true); }); }
  return React.createElement('div', { className: 'overlay', onClick: props.onClose },
    React.createElement('div', { className: 'sheet', onClick: function (ev) { ev.stopPropagation(); } },
      React.createElement('h3', null, '📱 Nội dung nhắc Zalo'),
      React.createElement('textarea', { readOnly: true, value: msg.text, rows: 10 }),
      React.createElement('div', { className: 'row gap' },
        React.createElement('button', { className: 'btn', onClick: copy }, copied[0] ? '✅ Đã copy' : '📋 Copy nội dung'),
        msg.zaloLink
          ? React.createElement('a', { className: 'btn primary', href: msg.zaloLink, target: '_blank', rel: 'noreferrer' }, '💬 Mở Zalo')
          : React.createElement('span', { className: 'hint' }, '(chưa có SĐT khách để mở chat)')
      ),
      React.createElement('button', { className: 'btn ghost full', onClick: props.onClose }, 'Đóng')
    )
  );
}

// ---------------- Modal ghi nhận thanh toán (3 chiều, tick nhiều HĐ) ----------------
function ThanhToanModal(props) {
  // props: role, chieuTT ('DT_TP' | 'Linh_TP' | 'KH_TP'), presetSoHD (optional), onClose, onDone
  var role = props.role;
  var chieuTT = props.chieuTT;
  var l = useState(true); var loading = l[0], setLoading = l[1];
  var d = useState([]); var donLinh = d[0], setDonLinh = d[1];
  var dd = useState([]); var donTP = dd[0], setDonTP = dd[1];
  var allList = useState([]); var allHDs = allList[0], setAllHDs = allList[1];
  var sel = useState(props.presetSoHD ? [props.presetSoHD] : []); var selected = sel[0], setSelected = sel[1];
  var f = useState({
    ngay: new Date().toISOString().slice(0, 10),
    nguoiCK: chieuTT === 'DT_TP' ? 'Tiến Phát' : (chieuTT === 'Linh_TP' ? 'Linh' : ''),
    denTK: '', soTien: '', ghiChu: ''
  });
  var form = f[0], setForm = f[1];
  var busy = useState(false);

  useEffect(function () {
    if (chieuTT === 'Linh_TP') {
      Promise.all([Api.getHoaDons('linh'), Api.getHoaDons('daiLy')]).then(function (res) {
        setDonLinh(res[0].filter(function (h) { return U.fixSapNumber(h['Còn Nợ']) > 0; }));
        setDonTP(res[1].filter(function (h) { return U.fixSapNumber(h['Còn Nợ']) > 0; }));
        setLoading(false);
      });
    } else {
      Api.getHoaDons('chuaDu').then(function (rows) { setAllHDs(rows); setLoading(false); });
    }
  }, []);

  function toggle(soHD) {
    setSelected(function (cur) {
      return cur.indexOf(soHD) > -1 ? cur.filter(function (x) { return x !== soHD; }) : cur.concat([soHD]);
    });
  }

  function invoiceRow(hd) {
    return React.createElement('label', { className: 'invoice-pick-row', key: hd['Số HĐ'] },
      React.createElement('input', {
        type: 'checkbox', checked: selected.indexOf(hd['Số HĐ']) > -1,
        onChange: function () { toggle(hd['Số HĐ']); }
      }),
      React.createElement('span', null, hd['Số HĐ'] + ' — ' + U.formatVND(hd['Còn Nợ'])),
      React.createElement(Badge, { trangThai: hd['Trạng Thái'] })
    );
  }

  var tongTick = selected.reduce(function (sum, soHD) {
    var list = chieuTT === 'Linh_TP' ? donLinh.concat(donTP) : allHDs;
    var hd = list.find(function (h) { return h['Số HĐ'] === soHD; });
    return sum + (hd ? U.fixSapNumber(hd['Còn Nợ']) : 0);
  }, 0);

  function submit() {
    if (!selected.length) { alert('Chưa chọn hoá đơn nào'); return; }
    busy[1](true);
    Api.addThanhToan({
      soHDs: selected,
      soTien: selected.length === 1 ? Number(form.soTien || tongTick) : undefined,
      ngay: form.ngay, nguoiCK: form.nguoiCK, denTK: form.denTK, ghiChu: form.ghiChu, chieuTT: chieuTT
    }).then(function () { props.onDone(); }).catch(function (e) { alert('Lỗi: ' + e.message); busy[1](false); });
  }

  var title = chieuTT === 'DT_TP' ? '💰 GHI NHẬN TIỀN VÀO (Tiến Phát → Đồng Tâm)'
    : chieuTT === 'Linh_TP' ? '💰 GHI TT LINH → TIẾN PHÁT'
      : '💰 GHI NHẬN TIỀN KHÁCH → TIẾN PHÁT';

  return React.createElement('div', { className: 'overlay', onClick: props.onClose },
    React.createElement('div', { className: 'sheet', onClick: function (ev) { ev.stopPropagation(); } },
      React.createElement('h3', null, title),
      loading ? React.createElement('div', { className: 'hint center' }, 'Đang tải...') :
        React.createElement(React.Fragment, null,
          chieuTT === 'Linh_TP' ?
            React.createElement('div', { className: 'pick-groups' },
              React.createElement('div', { className: 'hint', style: { marginTop: '4px' } }, '📦 ĐƠN CỦA LINH'),
              donLinh.length ? donLinh.map(invoiceRow) : React.createElement('div', { className: 'hint' }, '(không có)'),
              React.createElement('div', { className: 'hint', style: { marginTop: '10px' } }, '🏪 ĐƠN CỦA TIẾN PHÁT (chi hộ)'),
              donTP.length ? donTP.map(invoiceRow) : React.createElement('div', { className: 'hint' }, '(không có)')
            ) :
            React.createElement('div', { className: 'pick-groups' },
              allHDs.length ? allHDs.map(invoiceRow) : React.createElement('div', { className: 'hint' }, 'Không còn HĐ nào chưa đủ')
            ),
          React.createElement('div', { className: 'hint', style: { marginTop: '6px' } }, 'Đã chọn: ' + selected.length + ' HĐ | Tổng: ' + U.formatVND(tongTick)),
          selected.length === 1 && React.createElement(React.Fragment, null,
            React.createElement('label', null, 'Số tiền (để trống = trả đủ)'),
            React.createElement('input', { type: 'number', placeholder: String(tongTick), value: form.soTien, onChange: function (ev) { setForm(Object.assign({}, form, { soTien: ev.target.value })); } })
          ),
          React.createElement('label', null, 'Ngày'),
          React.createElement('input', { type: 'date', value: form.ngay, onChange: function (ev) { setForm(Object.assign({}, form, { ngay: ev.target.value })); } }),
          React.createElement('label', null, 'Người chuyển khoản'),
          React.createElement('input', { type: 'text', value: form.nguoiCK, onChange: function (ev) { setForm(Object.assign({}, form, { nguoiCK: ev.target.value })); } }),
          chieuTT !== 'Linh_TP' && React.createElement(React.Fragment, null,
            React.createElement('label', null, 'Tiền vào TK nào?'),
            React.createElement('div', { className: 'row gap' },
              React.createElement('label', null, React.createElement('input', { type: 'radio', name: 'tk', checked: form.denTK !== 'TCB', onChange: function () { setForm(Object.assign({}, form, { denTK: 'VCB' })); } }), ' TK TP VCB (1061683968)'),
              React.createElement('label', null, React.createElement('input', { type: 'radio', name: 'tk', checked: form.denTK === 'TCB', onChange: function () { setForm(Object.assign({}, form, { denTK: 'TCB' })); } }), ' TK cá nhân (Thúy Quyên TCB)')
            )
          ),
          React.createElement('label', null, 'Ghi chú'),
          React.createElement('input', { type: 'text', value: form.ghiChu, onChange: function (ev) { setForm(Object.assign({}, form, { ghiChu: ev.target.value })); } }),
          React.createElement('div', { className: 'row gap', style: { marginTop: '10px' } },
            React.createElement('button', { className: 'btn ghost', onClick: props.onClose }, 'Hủy'),
            React.createElement('button', { className: 'btn primary', disabled: busy[0], onClick: submit }, busy[0] ? 'Đang lưu...' : '✅ Xác nhận')
          )
        )
    )
  );
}

// ---------------- Tab: Dashboard ----------------
function TabDashboard(props) {
  var role = props.role;
  var s = useState(null); var dash = s[0], setDash = s[1];
  function load() { Api.getDashboard().then(setDash); }
  useEffect(load, []);
  if (!dash) return React.createElement('div', { className: 'hint center' }, 'Đang tải...');

  return React.createElement('div', { className: 'tab-content' },
    React.createElement('div', { className: 'summary-card' },
      React.createElement('div', { className: 'summary-title' }, '📊 TỔNG QUAN CÔNG NỢ — ' + U.formatDate(new Date())),
      React.createElement('div', { className: 'dash-grid' },
        React.createElement('div', { className: 'dash-cell' },
          React.createElement('div', { className: 'hint' }, 'ĐT → TP'),
          React.createElement('div', { className: 'amount' }, U.formatVND(dash.congNoDT.tongNo)),
          React.createElement('div', { className: 'hint' }, '🔴 ' + dash.congNoDT.soHDQuaHan + ' quá hạn | 🟡 ' + dash.congNoDT.soHDConHan + ' còn hạn')
        ),
        role === 'LINH' && React.createElement('div', { className: 'dash-cell' },
          React.createElement('div', { className: 'hint' }, 'Linh ↔ TP'),
          React.createElement('div', { className: 'amount' }, U.formatVND(dash.linhTP.tpHoanLinh)),
          React.createElement('div', { className: 'hint' }, 'Cọc: ' + U.formatVND(dash.linhTP.cocHienTai))
        ),
        React.createElement('div', { className: 'dash-cell' },
          React.createElement('div', { className: 'hint' }, 'Khách → TP'),
          dash.khachHang.slice(0, 3).map(function (k) {
            return React.createElement('div', { key: k.maKH }, getKhachDisplay(role, k.tenKH) + ': ' + k.trangThai);
          })
        )
      )
    )
  );
}

// ---------------- Tab: Công Nợ ĐT ----------------
function TabCongNoDT(props) {
  var role = props.role;
  var s = useState([]); var hoaDons = s[0], setHoaDons = s[1];
  var loading = useState(true);
  var payFor = useState(null);
  var zaloModal = useState(null);

  function load() { loading[1](true); Api.getHoaDons().then(function (rows) { setHoaDons(rows); loading[1](false); }); }
  useEffect(load, []);

  var tongConNo = hoaDons.reduce(function (s, hd) { return s + U.fixSapNumber(hd['Còn Nợ']); }, 0);

  function openZalo(hd) {
    var isQuaHan = String(hd['Trạng Thái']).indexOf('Quá hạn') > -1;
    var st = String(hd['Trạng Thái'] || '');
    var soNgay = (st.match(/\d+/) || [''])[0];
    Api.getZaloMessage(isQuaHan ? 'quaHan' : 'nhacTT', {
      soHD: hd['Số HĐ'], tenKH: getKhachDisplay(role, hd['Khách Hàng']) || 'Tiến Phát', conNo: hd['Còn Nợ'],
      hanTT: hd['Hạn TT (N+3)'], sdtKH: role === 'TIEN_PHAT' ? '' : (hd['SĐT Zalo'] || ''), soNgayQuaHan: soNgay
    }).then(function (msg) { zaloModal[1](msg); });
  }

  return React.createElement('div', { className: 'tab-content' },
    React.createElement('div', { className: 'summary-card' },
      React.createElement('div', { className: 'summary-title' }, '📊 CÔNG NỢ TIẾN PHÁT → ĐỒNG TÂM'),
      React.createElement('div', { className: 'summary-value' }, U.formatVND(tongConNo)),
      React.createElement('div', { className: 'hint' }, hoaDons.length + ' hoá đơn')
    ),
    loading[0] ? React.createElement('div', { className: 'hint center' }, 'Đang tải...') :
      React.createElement('div', { className: 'card-list' },
        hoaDons.map(function (hd) {
          return React.createElement('div', { className: 'invoice-card', key: hd['Số HĐ'] },
            React.createElement('div', { className: 'row between' },
              React.createElement('strong', null, 'HĐ ' + hd['Số HĐ']),
              React.createElement(Badge, { trangThai: hd['Trạng Thái'] })
            ),
            React.createElement('div', { className: 'hint' }, 'Ngày HĐ: ' + U.formatDate(hd['Ngày HĐ']) + ' | Hạn TT: ' + U.formatDate(hd['Hạn TT (N+3)'])),
            React.createElement('div', { className: 'amount' }, U.formatVND(hd['Còn Nợ'])),
            React.createElement('div', { className: 'row gap' },
              hd['Còn Nợ'] > 0 && React.createElement('button', { className: 'btn small', onClick: function () { payFor[1](hd['Số HĐ']); } }, '+ Ghi TT'),
              React.createElement('button', { className: 'btn small ghost', onClick: function () { openZalo(hd); } }, '📱 Nhắc Zalo')
            )
          );
        })
      ),
    payFor[0] && React.createElement(ThanhToanModal, {
      role: role, chieuTT: 'DT_TP', presetSoHD: payFor[0],
      onClose: function () { payFor[1](null); },
      onDone: function () { payFor[1](null); load(); }
    }),
    zaloModal[0] && React.createElement(ZaloModal, { message: zaloModal[0], onClose: function () { zaloModal[1](null); } })
  );
}

// ---------------- Tab: Linh ↔ TP (chỉ Linh) ----------------
function TabLinhTP() {
  var s = useState(null); var data = s[0], setData = s[1];
  var showModal = useState(false);
  function load() { Api.getCongNoLinhTP().then(setData); }
  useEffect(load, []);

  if (!data) return React.createElement('div', { className: 'hint center' }, 'Đang tải...');
  var sum = data.summary;

  return React.createElement('div', { className: 'tab-content' },
    React.createElement('div', { className: 'summary-card' },
      React.createElement('div', { className: 'summary-title' }, '💰 LINH ↔ TIẾN PHÁT'),
      React.createElement('div', { className: 'summary-value' }, U.formatVND(sum.tpHoanLinh)),
      React.createElement('div', { className: 'hint' }, 'TP còn phải trả Linh'),
      React.createElement('div', { className: 'hint' }, 'Cọc đang giữ: ' + U.formatVND(sum.cocHienTai)),
      React.createElement('button', { className: 'btn small primary', style: { marginTop: '8px' }, onClick: function () { showModal[1](true); } }, '+ Ghi TT mới')
    ),
    React.createElement('div', { className: 'card-list' },
      React.createElement('div', { className: 'invoice-card' },
        React.createElement('div', { className: 'hint' }, 'Đơn Linh (' + sum.soDon + ' HĐ)'),
        React.createElement('div', null, 'Tổng 100%: ' + U.formatVND(sum.tong100)),
        React.createElement('div', null, 'Phải TT 96%: ' + U.formatVND(sum.phaiTT)),
        React.createElement('div', null, 'Đã chuyển: ' + U.formatVND(sum.daChuyen)),
        React.createElement('div', { className: 'amount' }, '→ TP hoàn Linh: ' + U.formatVND(sum.tpHoanLinh))
      ),
      data.rows.map(function (r) {
        return React.createElement('div', { className: 'invoice-card', key: r['Số HĐ'] },
          React.createElement('div', { className: 'row between' },
            React.createElement('strong', null, 'HĐ ' + r['Số HĐ']),
            React.createElement(Badge, { trangThai: r['Trạng Thái'] })
          ),
          React.createElement('div', { className: 'hint' }, '100%: ' + U.formatVND(r['Giá HĐ (100%)']) + ' | 96%: ' + U.formatVND(r['Phải TT (96%)'])),
          React.createElement('div', null, 'Đã chuyển: ' + U.formatVND(r['Linh đã chuyển']))
        );
      })
    ),
    showModal[0] && React.createElement(ThanhToanModal, {
      role: 'LINH', chieuTT: 'Linh_TP',
      onClose: function () { showModal[1](false); },
      onDone: function () { showModal[1](false); load(); }
    })
  );
}

// ---------------- Tab: Khách Hàng ----------------
function TabKhachHang(props) {
  var role = props.role;
  var s = useState([]); var khs = s[0], setKhs = s[1];
  var showModal = useState(false);
  function load() { Api.getKhachHang().then(setKhs); }
  useEffect(load, []);

  return React.createElement('div', { className: 'tab-content' },
    React.createElement('div', { className: 'summary-card' },
      React.createElement('div', { className: 'summary-title' }, '👥 KHÁCH HÀNG THANH TOÁN VÀO TP'),
      role === 'TIEN_PHAT' && React.createElement('button', { className: 'btn small primary', style: { marginTop: '8px' }, onClick: function () { showModal[1](true); } }, '💰 Ghi nhận tiền vào')
    ),
    React.createElement('div', { className: 'card-list' },
      khs.map(function (kh) {
        return React.createElement('div', { className: 'invoice-card', key: kh['Mã KH'] },
          React.createElement('div', { className: 'row between' },
            React.createElement('strong', null, getKhachDisplay(role, kh['Tên KH'])),
            React.createElement('span', null, kh['Trạng Thái'])
          ),
          React.createElement('div', { className: 'hint' }, 'Tổng nợ: ' + U.formatVND(kh['Tổng nợ hiện tại']))
        );
      })
    ),
    showModal[0] && React.createElement(ThanhToanModal, {
      role: role, chieuTT: 'KH_TP',
      onClose: function () { showModal[1](false); },
      onDone: function () { showModal[1](false); load(); }
    })
  );
}

// ---------------- Tab: Cài đặt (chỉ Linh) ----------------
function TabCaiDat(props) {
  var s = useState(Api.getUrl()); var url = s[0], setUrl = s[1];
  var savedMsg = useState('');

  function save() { Api.setUrl(url.trim()); savedMsg[1]('Đã lưu. Tải lại trang để dùng dữ liệu thật.'); }
  function clear() { Api.setUrl(''); setUrl(''); savedMsg[1]('Đã xoá — quay về dữ liệu mẫu.'); }
  function doiVaiTro() { localStorage.removeItem('congno_role'); location.reload(); }

  return React.createElement('div', { className: 'tab-content' },
    React.createElement('div', { className: 'summary-card' },
      React.createElement('div', { className: 'summary-title' }, '⚙️ Cài đặt')
    ),
    React.createElement('div', { className: 'invoice-card' },
      React.createElement('label', null, 'Apps Script URL (dán sau khi Deploy Web App)'),
      React.createElement('input', { type: 'text', value: url, placeholder: 'https://script.google.com/macros/s/.../exec', onChange: function (e) { setUrl(e.target.value); } }),
      React.createElement('div', { className: 'row gap', style: { marginTop: '8px' } },
        React.createElement('button', { className: 'btn primary', onClick: save }, 'Lưu'),
        React.createElement('button', { className: 'btn ghost', onClick: clear }, 'Dùng dữ liệu mẫu')
      ),
      savedMsg[0] && React.createElement('p', { className: 'hint' }, savedMsg[0]),
      React.createElement('p', { className: 'hint' }, Api.isLive() ? '🟢 Đang dùng: Google Sheet thật' : '🟡 Đang dùng: dữ liệu mẫu (demo)')
    ),
    React.createElement('button', { className: 'btn ghost full', onClick: doiVaiTro }, '🔄 Đổi vai trò')
  );
}

// ---------------- App ----------------
function AppMain(props) {
  var role = props.role;
  var tabsAll = [
    { id: 'dashboard', label: 'Tổng Quan', icon: '📊', view: TabDashboard, roles: ['LINH', 'TIEN_PHAT'] },
    { id: 'congno', label: 'Công Nợ ĐT', icon: '💵', view: TabCongNoDT, roles: ['LINH', 'TIEN_PHAT'] },
    { id: 'linhtp', label: 'Linh↔TP', icon: '💰', view: TabLinhTP, roles: ['LINH'] },
    { id: 'khach', label: 'Khách Hàng', icon: '👥', view: TabKhachHang, roles: ['LINH', 'TIEN_PHAT'] },
    { id: 'caidat', label: 'Cài đặt', icon: '⚙️', view: TabCaiDat, roles: ['LINH'] }
  ];
  var tabs = tabsAll.filter(function (t) { return t.roles.indexOf(role) > -1; });
  var s = useState(tabs[0].id); var tab = s[0], setTab = s[1];
  var Current = tabs.find(function (t) { return t.id === tab; }).view;

  return React.createElement('div', { className: 'app' },
    React.createElement('header', { className: 'header' },
      React.createElement('span', null, '🧾 Công Nợ Đồng Tâm KV23'),
      React.createElement('span', { className: 'header-role' }, ROLES[role].name)
    ),
    React.createElement('main', null, React.createElement(Current, { role: role })),
    React.createElement('nav', { className: 'tabbar' },
      tabs.map(function (t) {
        return React.createElement('button', {
          key: t.id, className: 'tabbtn ' + (tab === t.id ? 'active' : ''), onClick: function () { setTab(t.id); }
        }, React.createElement('div', null, t.icon), React.createElement('div', { className: 'tab-label' }, t.label));
      })
    )
  );
}

function Root() {
  var s = useState(localStorage.getItem('congno_role')); var role = s[0], setRole = s[1];
  if (!role) return React.createElement(RoleSelectScreen, { onSelect: setRole });
  return React.createElement(AppMain, { role: role });
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Root));
