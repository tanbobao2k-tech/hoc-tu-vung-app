import { VocabExample } from "../types";

export interface ParsedCard {
  front: string;
  back: string;
  examples?: VocabExample[];
}

export interface ParsedDeck {
  name: string;
  cards: ParsedCard[];
}

const ITEM_PATTERN = /^\d+[.,)]\s*(.+)$/;
// "real estate (n)" -> từ + từ loại viết tắt trong ngoặc ở cuối.
const POS_PATTERN = /^(.+?)\s*\(([a-zA-Zàáâãèéêìíòóôõùúýăđĩũơư.]+)\)\s*$/i;
// "...bất động sản – VD: She works in real estate." -> nghĩa + ví dụ, chấp
// nhận cả dấu gạch ngang "-", "–", "—" và "VD"/"vd" có hoặc không có dấu ".".
const EXAMPLE_PATTERN = /^(.*?)\s*[–—-]+\s*(?:VD|vd|Vd)\.?:?\s*(.+)$/;

function parseItemLine(rest: string): ParsedCard | null {
  const firstColon = rest.indexOf(":");
  if (firstColon === -1) return null;
  const termPart = rest.slice(0, firstColon).trim();
  const afterTerm = rest.slice(firstColon + 1).trim();

  let meaning = afterTerm;
  let exampleEn: string | undefined;
  const exampleMatch = afterTerm.match(EXAMPLE_PATTERN);
  if (exampleMatch) {
    meaning = exampleMatch[1].trim();
    exampleEn = exampleMatch[2].trim();
  }

  let front = termPart;
  let back = meaning;
  const posMatch = termPart.match(POS_PATTERN);
  if (posMatch) {
    front = posMatch[1].trim();
    back = `(${posMatch[2]}) ${meaning}`;
  }

  if (!front || !back) return null;
  return { front, back, examples: exampleEn ? [{ en: exampleEn, vi: "" }] : undefined };
}

/**
 * Phân tích văn bản dán vào thành nhiều bộ thẻ: dòng KHÔNG bắt đầu bằng số
 * (vd: "1.", "2,", "3)") được coi là tiêu đề — bắt đầu một bộ thẻ mới, tên bộ
 * lấy nguyên văn dòng đó. Các dòng đánh số sau đó là thẻ từ vựng của bộ hiện
 * tại, hỗ trợ 2 kiểu:
 *   - Đơn giản: "1. word: nghĩa"
 *   - Đầy đủ: "1. word (pos): nghĩa – VD: câu ví dụ"
 */
export function parseBulkImport(text: string): ParsedDeck[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const decks: ParsedDeck[] = [];
  let current: ParsedDeck | null = null;

  for (const line of lines) {
    const match = line.match(ITEM_PATTERN);
    if (match) {
      const card = parseItemLine(match[1]);
      if (!card) continue;
      if (!current) {
        current = { name: "Từ vựng nhập nhanh", cards: [] };
        decks.push(current);
      }
      current.cards.push(card);
    } else {
      current = { name: line, cards: [] };
      decks.push(current);
    }
  }

  return decks.filter((d) => d.cards.length > 0);
}
