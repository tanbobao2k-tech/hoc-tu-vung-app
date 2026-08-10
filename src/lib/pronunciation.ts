export interface PronunciationInfo {
  phonetic?: string;
  audioUrl?: string;
}

/**
 * Tra cứu phiên âm + audio phát âm chuẩn từ dictionaryapi.dev (miễn phí, không cần key).
 * Lỗi mạng hoặc không tìm thấy từ đều trả về rỗng thay vì throw, vì đây chỉ là gợi ý
 * hỗ trợ thêm — người dùng vẫn có thể tự nhập phiên âm hoặc dùng nút đọc bằng giọng máy.
 */
export async function lookupPronunciation(
  word: string
): Promise<PronunciationInfo> {
  const trimmed = word.trim();
  if (!trimmed) return {};

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        trimmed
      )}`
    );
    if (!res.ok) return {};
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry) return {};

    const phoneticEntry = (entry.phonetics as Array<{
      text?: string;
      audio?: string;
    }>)?.find((p) => p.audio) ?? entry.phonetics?.[0];

    return {
      phonetic: entry.phonetic ?? phoneticEntry?.text ?? undefined,
      audioUrl: phoneticEntry?.audio || undefined,
    };
  } catch {
    return {};
  }
}

/** Đọc từ bằng giọng tổng hợp của trình duyệt (dùng khi không có audio thật). */
export function speakWord(word: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function playPronunciation(word: string, audioUrl?: string) {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => speakWord(word));
    return;
  }
  speakWord(word);
}
