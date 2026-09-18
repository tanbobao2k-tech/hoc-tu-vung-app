// Tổng hợp giọng đọc HOÀN TOÀN ở trình duyệt (thư viện eSpeak/mespeak chạy offline,
// không gọi bất kỳ API bên ngoài nào) — dùng làm phương án dự phòng khi từ điển
// online không có sẵn bản ghi âm người thật. Nhờ chạy offline nên luôn tạo ra được
// file audio thật để nghe/tải, không bao giờ bị lỗi mạng/link hỏng như dịch vụ TTS
// online trước đây. Giọng "en/en-rp" là giọng Anh-Anh kiểu Received Pronunciation
// (RP) — giọng chuẩn mực vẫn được gọi là "giọng Oxford".
const VOICE_ID = "en/en-rp";

let meSpeakPromise: ReturnType<typeof loadMeSpeak> | null = null;

async function loadMeSpeak() {
  const mod = await import("mespeak");
  const meSpeak = mod.default;
  if (!meSpeak.isConfigLoaded()) {
    const config = await import("mespeak/src/mespeak_config.json");
    meSpeak.loadConfig(config.default as unknown as object);
  }
  if (!meSpeak.isVoiceLoaded(VOICE_ID)) {
    const voice = await import("mespeak/voices/en/en-rp.json");
    meSpeak.loadVoice(voice.default as unknown as object);
  }
  return meSpeak;
}

function ensureMeSpeak() {
  if (!meSpeakPromise) meSpeakPromise = loadMeSpeak();
  return meSpeakPromise;
}

// object URL của mỗi từ chỉ cần tạo 1 lần, dùng lại cho các lần nghe/tải sau.
const blobUrlCache = new Map<string, string>();

export async function synthesizeLocalAudioUrl(word: string): Promise<string | null> {
  const key = word.trim().toLowerCase();
  if (!key) return null;
  const cached = blobUrlCache.get(key);
  if (cached) return cached;

  try {
    const meSpeak = await ensureMeSpeak();
    const data = meSpeak.speak(key, { voice: VOICE_ID, rawdata: "array", speed: 150 });
    if (!Array.isArray(data)) return null;
    const blob = new Blob([new Uint8Array(data)], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    blobUrlCache.set(key, url);
    return url;
  } catch {
    return null;
  }
}
