// Express 4 không tự bắt lỗi của handler async: lỗi (VD mất kết nối MySQL) thành
// unhandled rejection và làm tắt cả tiến trình Node. Bọc handler để chuyển lỗi
// sang middleware xử lý lỗi chung trong app.js (trả 500, server vẫn chạy).
export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}
