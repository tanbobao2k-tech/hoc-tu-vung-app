import { fetchDictionaryEntry } from "./dictionary";

export interface PronunciationInfo {
  phonetic?: string;
  audioUrl?: string;
}

/**
 * Audio TTS của Google Translate (endpoint không chính thức, đã dùng ở nơi khác
 * trong app để dịch chữ) trả về file mp3 thật — dùng làm phương án dự phòng khi
 * dictionaryapi.dev không có sẵn bản ghi âm người thật cho từ đó (rất nhiều từ
 * không có), để nút tải luôn có file để tải bất kể từ gì, giọng đọc rõ ràng dù
 * không phải giọng người thật.
 */
function googleTtsUrl(word: string): string {
  return `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    word
  )}&tl=en-GB&client=gtx`;
}

/**
 * Tra cứu phiên âm + audio phát âm chuẩn từ dictionaryapi.dev (miễn phí, không cần key).
 * Ưu tiên bản ghi âm người thật (giọng Anh-Anh) nếu có; nếu không có thì dùng TTS
 * của Google Translate làm phương án dự phòng để luôn có file tải được.
 */
export async function lookupPronunciation(word: string): Promise<PronunciationInfo> {
  const entry = await fetchDictionaryEntry(word);
  return {
    phonetic: entry?.phonetic,
    audioUrl: entry?.audioUrl || googleTtsUrl(word),
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
