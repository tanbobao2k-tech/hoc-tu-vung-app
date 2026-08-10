export interface ImageResult {
  id: string;
  thumbUrl: string;
  fullUrl: string;
}

/**
 * Tìm ảnh minh hoạ cho một từ qua Openverse (ảnh Creative Commons, miễn phí,
 * không cần API key). Lỗi mạng trả về mảng rỗng thay vì throw — đây chỉ là
 * gợi ý, người dùng vẫn thêm được thẻ mà không cần ảnh.
 */
export async function searchImages(word: string): Promise<ImageResult[]> {
  const trimmed = word.trim();
  if (!trimmed) return [];

  try {
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
        trimmed
      )}&page_size=6&mature=false`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    return results
      .filter((r: { thumbnail?: string; url?: string }) => r.thumbnail && r.url)
      .map((r: { id: string; thumbnail: string; url: string }) => ({
        id: r.id,
        thumbUrl: r.thumbnail,
        fullUrl: r.url,
      }));
  } catch {
    return [];
  }
}
