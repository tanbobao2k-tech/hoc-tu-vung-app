/**
 * Nhận diện trình duyệt nhúng bên trong các app (Zalo, Facebook, Messenger,
 * Instagram, TikTok, Line, WeChat...). Google chủ động CHẶN đăng nhập OAuth từ
 * các trình duyệt này (đôi khi báo lỗi khó hiểu như "Unable to save initial
 * state" ngay trên trang xác thực của Google/Firebase — xảy ra TRƯỚC khi quay
 * lại app, nên code của app không thể bắt hay hiển thị lỗi đẹp hơn được).
 * Cách xử lý thực tế duy nhất là báo trước và hướng dẫn mở bằng trình duyệt
 * thật (Safari/Chrome) trước khi họ bấm đăng nhập.
 */
export function detectInAppBrowser(): string | null {
  const ua = navigator.userAgent || "";

  if (/Zalo/i.test(ua)) return "Zalo";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook";
  if (/MessengerForiOS/i.test(ua)) return "Messenger";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/Line\//i.test(ua)) return "Line";
  if (/MicroMessenger/i.test(ua)) return "WeChat";
  if (/musical_ly|TikTok/i.test(ua)) return "TikTok";
  // Android WebView chung chung (app không xác định được tên) — dấu hiệu "; wv)"
  if (/; ?wv\)/i.test(ua)) return "một ứng dụng khác";

  return null;
}
