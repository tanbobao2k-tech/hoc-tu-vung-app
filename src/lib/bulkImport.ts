export interface ParsedDeck {
  name: string;
  cards: { front: string; back: string }[];
}

const ITEM_PATTERN = /^\d+[.,)]\s*(.+)$/;

/**
 * Phân tích văn bản dán vào thành nhiều bộ thẻ: dòng KHÔNG bắt đầu bằng số
 * (vd: "1.", "2,", "3)") được coi là tiêu đề — bắt đầu một bộ thẻ mới, tên bộ
 * lấy nguyên văn dòng đó. Các dòng đánh số sau đó là thẻ từ vựng của bộ hiện
 * tại: bỏ số thứ tự, rồi tách ở dấu ":" CUỐI CÙNG trong dòng — phần trước là
 * mặt tiếng Anh (giữ nguyên dù có dấu phẩy/gạch chéo bên trong), phần sau là
 * nghĩa tiếng Việt.
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
      const rest = match[1];
      const lastColon = rest.lastIndexOf(":");
      if (lastColon === -1) continue;
      const front = rest.slice(0, lastColon).trim();
      const back = rest.slice(lastColon + 1).trim();
      if (!front || !back) continue;
      if (!current) {
        current = { name: "Từ vựng nhập nhanh", cards: [] };
        decks.push(current);
      }
      current.cards.push({ front, back });
    } else {
      current = { name: line, cards: [] };
      decks.push(current);
    }
  }

  return decks.filter((d) => d.cards.length > 0);
}
