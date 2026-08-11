interface WordSense {
  partOfSpeech: string;
  definitionEn: string;
  exampleEn?: string;
}

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

const MAX_SENSES = 4;

async function fetchEnglishSenses(word: string): Promise<WordSense[]> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    const meanings = entry?.meanings;
    if (!Array.isArray(meanings)) return [];

    const senses: WordSense[] = [];
    for (const meaning of meanings) {
      const def = meaning?.definitions?.[0];
      if (!def?.definition) continue;
      senses.push({
        partOfSpeech: meaning.partOfSpeech ?? "",
        definitionEn: def.definition,
        exampleEn: def.example || undefined,
      });
      if (senses.length >= MAX_SENSES) break;
    }
    return senses;
  } catch {
    return [];
  }
}

type Lang = "en" | "vi";

/**
 * Dịch qua endpoint không chính thức của Google Translate (NMT thật, có CORS mở).
 * Đã thử MyMemory trước đó nhưng dữ liệu dịch cộng đồng của họ không đáng tin cho
 * từ/câu ngắn (vd: "con gà" từng bị dịch nhầm thành "API") nên chuyển sang đây.
 */
async function translateText(text: string, from: Lang, to: Lang): Promise<string | null> {
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const segments = data?.[0];
    if (!Array.isArray(segments)) return null;
    const translated = segments.map((seg: [string]) => seg?.[0] ?? "").join("");
    return translated || null;
  } catch {
    return null;
  }
}

/**
 * Gợi ý nghĩa tiếng Việt cho một từ tiếng Anh, liệt kê đủ các nghĩa khác nhau
 * (theo từ loại) kèm ví dụ + bản dịch ví dụ, để có ngữ cảnh dùng rõ ràng.
 * Nếu không tra được nghĩa chi tiết, fallback về dịch thẳng cả từ.
 */
export async function suggestVietnameseMeaning(word: string): Promise<string> {
  const senses = await fetchEnglishSenses(word);

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
 * thực tế. Quét qua mọi định nghĩa (không chỉ định nghĩa đầu của mỗi từ loại) vì phần
 * lớn định nghĩa không có ví dụ. Trả về mảng rỗng nếu từ không có ví dụ nào.
 */
export async function fetchExampleSentences(word: string): Promise<ExampleSentence[]> {
  const trimmed = word.trim();
  if (!trimmed) return [];

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(trimmed)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    const meanings = entry?.meanings;
    if (!Array.isArray(meanings)) return [];

    const englishExamples: string[] = [];
    for (const meaning of meanings) {
      for (const def of meaning?.definitions ?? []) {
        if (def?.example) englishExamples.push(def.example);
        if (englishExamples.length >= MAX_EXAMPLES) break;
      }
      if (englishExamples.length >= MAX_EXAMPLES) break;
    }
    if (englishExamples.length === 0) return [];

    const translations = await Promise.all(
      englishExamples.map((en) => translateText(en, "en", "vi"))
    );
    return englishExamples.map((en, i) => ({ en, vi: translations[i] ?? "" }));
  } catch {
    return [];
  }
}
