/**
 * fetch() với timeout bắt buộc. Một số API miễn phí (đặc biệt endpoint dịch không
 * chính thức của Google) thỉnh thoảng "treo" — không trả lỗi, cũng không phản hồi —
 * khi bị gọi dồn dập nhiều request cùng lúc. fetch() thường không tự timeout, nên
 * một request bị treo sẽ kẹt Promise.all mãi mãi và làm UI đứng ở trạng thái "đang
 * tải" vĩnh viễn. Luôn dùng hàm này thay vì fetch() trực tiếp cho các API bên ngoài.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
