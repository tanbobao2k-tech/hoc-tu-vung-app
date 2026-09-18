import { fetchDictionaryEntry } from "./dictionary";
import { synthesizeLocalAudioUrl } from "./localTts";

export interface PronunciationInfo {
  phonetic?: string;
  audioUrl?: string;
}

/**
 * Tra cứu phiên âm + audio phát âm chuẩn từ dictionaryapi.dev (miễn phí, không cần key).
 * Ưu tiên bản ghi âm người thật (giọng Anh-Anh) nếu có; nếu không có thì tổng hợp
 * giọng đọc NGAY TRONG trình duyệt (offline, không gọi API ngoài) để luôn có file
 * tải được và không bao giờ bị lỗi mạng/link hỏng.
 */
export async function lookupPronunciation(word: string): Promise<PronunciationInfo> {
  const entry = await fetchDictionaryEntry(word);
  const audioUrl = entry?.audioUrl || (await synthesizeLocalAudioUrl(word)) || undefined;
  return {
    phonetic: entry?.phonetic,
    audioUrl,
  };
}

/** Đọc từ bằng giọng tổng hợp của trình duyệt (dùng khi không có audio thật) — ưu
 * tiên giọng Anh-Anh (Oxford/RP) thay vì Anh-Mỹ. */
export function speakWord(word: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-GB";
  const ukVoice = window.speechSynthesis.getVoices().find((v) => v.lang === "en-GB");
  if (ukVoice) utterance.voice = ukVoice;
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
