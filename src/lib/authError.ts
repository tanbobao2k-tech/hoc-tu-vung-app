/** Dịch mã lỗi Firebase Auth (đăng nhập qua liên kết email) sang tiếng Việt dễ hiểu. */
export function describeAuthError(err: unknown): string {
  const code = (err as { code?: string } | undefined)?.code;
  if (code === "auth/invalid-email") {
    return "Địa chỉ email không hợp lệ.";
  }
  if (code === "auth/invalid-action-code") {
    return "Liên kết đã hết hạn hoặc đã được dùng rồi. Vui lòng gửi lại liên kết mới.";
  }
  if (code === "auth/expired-action-code") {
    return "Liên kết đăng nhập đã hết hạn. Vui lòng gửi lại liên kết mới.";
  }
  if (code === "auth/user-disabled") {
    return "Tài khoản này đã bị vô hiệu hoá.";
  }
  if (code === "auth/too-many-requests") {
    return "Bạn thử lại quá nhiều lần. Vui lòng chờ một lát rồi thử lại.";
  }
  return "Có lỗi xảy ra, vui lòng thử lại.";
}
