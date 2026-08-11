import { fetchWithTimeout } from "./fetchWithTimeout";
import { fetchDictionaryEntry } from "./dictionary";

const POS_LABEL_VI: Record<string, string> = {
  noun: "danh từ",
  verb: "động từ",
  adjective: "tính từ",
  adverb: "trạng từ",
  pronoun: "đại từ",
  preposition: "giới từ",
  conjunction: "liên từ",
  interjection: "thán từ",
  determiner: "hạn định từ",
  exclamation: "thán từ",
};

type Lang = "en" | "vi";

// Endpoint dịch không chính thức của Google thỉnh thoảng "treo" (không lỗi, không
// phản hồi) khi bị gọi dồn dập nhiều request cùng lúc — một từ có thể cần dịch
// 5-10 câu/định nghĩa cùng lúc. Giới hạn số request dịch chạy đồng thời trên toàn
// app để giảm khả năng bị treo, cộng với timeout ở fetchWithTimeout làm lưới an toàn.
const MAX_CONCURRENT_TRANSLATIONS = 3;
let activeTranslations = 0;
const translationQueue: Array<() => void> = [];

function acquireTranslationSlot(): Promise<void> {
  if (activeTranslations < MAX_CONCURRENT_TRANSLATIONS) {
    activeTranslations++;
    return Promise.resolve();
  }
  return new Promise((resolve) => translationQueue.push(resolve));
}

function releaseTranslationSlot() {
  const next = translationQueue.shift();
  if (next) next();
  else activeTranslations--;
}

/**
 * Dịch qua endpoint không chính thức của Google Translate (NMT thật, có CORS mở).
 * Đã thử MyMemory trước đó nhưng dữ liệu dịch cộng đồng của họ không đáng tin cho
 * từ/câu ngắn (vd: "con gà" từng bị dịch nhầm thành "API") nên chuyển sang đây.
 */
async function translateText(text: string, from: Lang, to: Lang): Promise<string | null> {
  await acquireTranslationSlot();
  try {
    const res = await fetchWithTimeout(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    if (!res?.ok) return null;
    const data = await res.json();
    const segments = data?.[0];
    if (!Array.isArray(segments)) return null;
    const translated = segments.map((seg: [string]) => seg?.[0] ?? "").join("");
    return translated || null;
  } catch {
    return null;
  } finally {
    releaseTranslationSlot();
  }
}

/**
 * Gợi ý nghĩa tiếng Việt cho một từ tiếng Anh, liệt kê đủ các nghĩa khác nhau
 * (theo từ loại) kèm ví dụ + bản dịch ví dụ, để có ngữ cảnh dùng rõ ràng.
 * Nếu không tra được nghĩa chi tiết, fallback về dịch thẳng cả từ.
 */
export async function suggestVietnameseMeaning(word: string): Promise<string> {
  const entry = await fetchDictionaryEntry(word);
  const senses = entry?.senses ?? [];

  if (senses.length === 0) {
    const direct = await translateText(word, "en", "vi");
    return direct ?? "";
  }

  const lines = await Promise.all(
    senses.map(async (sense, i) => {
      const [viDef, viExample] = await Promise.all([
        translateText(sense.definitionEn, "en", "vi"),
        sense.exampleEn ? translateText(sense.exampleEn, "en", "vi") : Promise.resolve(null),
      ]);
      const posLabel = POS_LABEL_VI[sense.partOfSpeech] ?? sense.partOfSpeech;
      const prefix = senses.length > 1 ? `${i + 1}. ` : "";
      let line = `${prefix}${posLabel ? `(${posLabel}) ` : ""}${viDef ?? sense.definitionEn}`;
      if (sense.exampleEn) {
        line += `\n   VD: ${sense.exampleEn}${viExample ? ` — ${viExample}` : ""}`;
      }
      return line;
    })
  );

  return lines.join("\n");
}

/** Gợi ý từ tiếng Anh tương ứng với một cụm nghĩa tiếng Việt (dịch một chiều đơn giản). */
export async function suggestEnglishWord(vietnameseText: string): Promise<string | null> {
  const translated = await translateText(vietnameseText, "vi", "en");
  if (!translated) return null;
  return translated.trim().toLowerCase().replace(/[.!?]+$/, "");
}

export interface ExampleSentence {
  en: string;
  vi: string;
}

const MAX_EXAMPLES = 3;

/**
 * Lấy 2-3 câu ví dụ có sẵn trong từ điển (Wiktionary qua dictionaryapi.dev) cho một
 * từ tiếng Anh, kèm bản dịch tiếng Việt của từng câu, để người học thấy ngữ cảnh dùng
 * thực tế. Trả về mảng rỗng nếu từ không có ví dụ nào trong từ điển.
 */
export async function fetchExampleSentences(word: string): Promise<ExampleSentence[]> {
  const entry = await fetchDictionaryEntry(word);
  const englishExamples = (entry?.allExamples ?? []).slice(0, MAX_EXAMPLES);
  if (englishExamples.length === 0) return [];

  const translations = await Promise.all(englishExamples.map((en) => translateText(en, "en", "vi")));
  return englishExamples.map((en, i) => ({ en, vi: translations[i] ?? "" }));
}
