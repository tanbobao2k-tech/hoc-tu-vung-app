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

async function translateText(text: string, langpair: "en|vi" | "vi|en"): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    return typeof translated === "string" ? translated : null;
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
    const direct = await translateText(word, "en|vi");
    return direct ?? "";
  }

  const lines = await Promise.all(
    senses.map(async (sense, i) => {
      const [viDef, viExample] = await Promise.all([
        translateText(sense.definitionEn, "en|vi"),
        sense.exampleEn ? translateText(sense.exampleEn, "en|vi") : Promise.resolve(null),
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
  const translated = await translateText(vietnameseText, "vi|en");
  if (!translated) return null;
  return translated.trim().toLowerCase().replace(/[.!?]+$/, "");
}
