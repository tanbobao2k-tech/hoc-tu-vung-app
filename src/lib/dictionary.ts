import { fetchWithTimeout } from "./fetchWithTimeout";

export interface DictionarySense {
  partOfSpeech: string;
  definitionEn: string;
  exampleEn?: string;
}

export interface DictionaryEntry {
  phonetic?: string;
  audioUrl?: string;
  senses: DictionarySense[]; // định nghĩa đầu tiên của mỗi từ loại, tối đa 4
  allExamples: string[]; // mọi câu ví dụ tìm được trong toàn bộ định nghĩa
}

const MAX_SENSES = 4;

// pronunciation.ts, meaning.ts (nghĩa) và meaning.ts (ví dụ) trước đây mỗi module tự
// gọi dictionaryapi.dev riêng cho CÙNG một từ — 3 request giống hệt nhau chạy song
// song. Ngoài lãng phí, thực tế cho thấy khi 3 request trùng nhau chạy đồng thời,
// đôi khi chỉ 1-2 cái thành công còn lại rớt (vd: có nghĩa nhưng phiên âm/ví dụ trống
// dù từ điển thật sự có dữ liệu). Gộp lại thành 1 lần gọi + cache theo từ để dùng
// chung cho cả 3 nơi, vừa nhanh hơn vừa nhất quán hơn.
const cache = new Map<string, Promise<DictionaryEntry | null>>();

export function fetchDictionaryEntry(word: string): Promise<DictionaryEntry | null> {
  const key = word.trim().toLowerCase();
  if (!key) return Promise.resolve(null);
  let entry = cache.get(key);
  if (!entry) {
    entry = fetchDictionaryEntryUncached(key);
    cache.set(key, entry);
  }
  return entry;
}

async function fetchDictionaryEntryUncached(word: string): Promise<DictionaryEntry | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res?.ok) return null;
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry) return null;

    const phoneticEntry =
      (entry.phonetics as Array<{ text?: string; audio?: string }>)?.find((p) => p.audio) ??
      entry.phonetics?.[0];

    const senses: DictionarySense[] = [];
    const allExamples: string[] = [];
    for (const meaning of entry.meanings ?? []) {
      const definitions = meaning?.definitions ?? [];
      const firstDef = definitions[0];
      if (firstDef?.definition && senses.length < MAX_SENSES) {
        senses.push({
          partOfSpeech: meaning.partOfSpeech ?? "",
          definitionEn: firstDef.definition,
          exampleEn: firstDef.example || undefined,
        });
      }
      for (const def of definitions) {
        if (def?.example) allExamples.push(def.example);
      }
    }

    return {
      phonetic: entry.phonetic ?? phoneticEntry?.text ?? undefined,
      audioUrl: phoneticEntry?.audio || undefined,
      senses,
      allExamples,
    };
  } catch {
    return null;
  }
}
