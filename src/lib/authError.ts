/** Dịch mã lỗi Firebase Auth sang thông báo tiếng Việt dễ hiểu. Trả về "" nếu
 * người dùng tự huỷ (không cần báo lỗi). */
export function describeAuthError(err: unknown): string {
  const code = (err as { code?: string } | undefined)?.code;
  if (code === "auth/popup-blocked") {
    return "Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép popup rồi thử lại.";
  }
  if (code === "auth/cancelled-popup-request" || code === "auth/popup-closed-by-user") {
    return "";
  }
  if (code === "auth/unauthorized-domain") {
    return "Domain này chưa được cấp phép đăng nhập. Báo cho người quản trị app.";
  }
  return "Đăng nhập thất bại. Nếu đang mở trong Zalo/Messenger/Facebook, hãy mở bằng Safari/Chrome thật rồi thử lại.";
}
