// Service worker tối giản — chỉ để trình duyệt cho phép "Thêm vào màn hình chính".
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { self.clients.claim(); });
self.addEventListener('fetch', function () {});
