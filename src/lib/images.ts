export interface ImageResult {
  id: string;
  thumbUrl: string;
  fullUrl: string;
}

interface RawResult {
  id: string;
  thumbnail?: string;
  url?: string;
  source?: string;
}

async function queryOpenverse(word: string, source?: string): Promise<ImageResult[]> {
  try {
    const sourceParam = source ? `&source=${source}` : "";
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
        word
      )}&page_size=6&mature=false${sourceParam}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results: RawResult[] = Array.isArray(data.results) ? data.results : [];
    return results
      .filter((r) => r.url)
      .map((r) => ({
        id: r.id,
        // Openverse's thumbnail proxy for Wikimedia-hosted images currently
        // 424s consistently, so load the original straight from Wikimedia instead.
        thumbUrl: r.source === "wikimedia" || !r.thumbnail ? r.url! : r.thumbnail,
        fullUrl: r.url!,
      }));
  } catch {
    return [];
  }
}

/**
 * Tìm ảnh minh hoạ cho một từ qua Openverse (ảnh Creative Commons, miễn phí,
 * không cần API key). Ưu tiên ảnh từ Wikimedia Commons vì được gắn mô tả/chủ đề
 * chuẩn xác hơn (ảnh Flickr trôi nổi hay bị gắn nhãn lỏng lẻo, dễ lạc chủ đề).
 * Nếu Wikimedia không có đủ kết quả thì bổ sung thêm từ toàn bộ Openverse.
 * Lỗi mạng trả về mảng rỗng thay vì throw — đây chỉ là gợi ý, người dùng vẫn
 * thêm được thẻ mà không cần ảnh.
 */
export async function searchImages(word: string): Promise<ImageResult[]> {
  const trimmed = word.trim();
  if (!trimmed) return [];

  const wikimediaResults = await queryOpenverse(trimmed, "wikimedia");
  if (wikimediaResults.length >= 4) return wikimediaResults;

  const broadResults = await queryOpenverse(trimmed);
  const seen = new Set(wikimediaResults.map((r) => r.id));
  const merged = [...wikimediaResults, ...broadResults.filter((r) => !seen.has(r.id))];
  return merged.slice(0, 6);
}
