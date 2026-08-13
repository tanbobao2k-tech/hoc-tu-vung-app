import { Deck, VocabCard } from "../types";

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

interface CardGroup {
  label: string | null;
  cards: VocabCard[];
}

/**
 * Xuất bộ từ vựng ra PDF bằng cách mở một cửa sổ in riêng với nội dung đã định
 * dạng, rồi gọi hộp thoại In của trình duyệt (chọn "Lưu dưới dạng PDF"). Cách này
 * không cần thêm thư viện PDF nào — chữ tiếng Việt luôn hiển thị đúng vì do chính
 * trình duyệt render, tránh rủi ro lỗi font/dấu khi nhúng font thủ công vào PDF.
 */
export function exportDeckToPdf(deck: Deck, groups: CardGroup[]) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) {
    alert("Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup rồi thử lại.");
    return;
  }

  const bodyHtml = groups
    .map(
      (group) => `
        <section>
          ${group.label ? `<h2>${escapeHtml(group.label)}</h2>` : ""}
          ${group.cards
            .map(
              (card) => `
                <div class="card">
                  <div class="word-row">
                    <span class="front">${escapeHtml(card.front)}</span>
                    ${card.phonetic ? `<span class="phonetic">${escapeHtml(card.phonetic)}</span>` : ""}
                  </div>
                  <div class="back">${escapeHtml(card.back).replace(/\n/g, "<br/>")}</div>
                  ${
                    card.examples && card.examples.length > 0
                      ? `<div class="examples">
                          ${card.examples
                            .map(
                              (ex) =>
                                `<p class="example"><span>${escapeHtml(ex.en)}</span>${
                                  ex.vi ? ` <span class="vi">— ${escapeHtml(ex.vi)}</span>` : ""
                                }</p>`
                            )
                            .join("")}
                        </div>`
                      : ""
                  }
                </div>
              `
            )
            .join("")}
        </section>
      `
    )
    .join("");

  const totalCards = groups.reduce((sum, g) => sum + g.cards.length, 0);

  printWindow.document.write(`
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(deck.name)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: "Segoe UI", Arial, sans-serif;
            padding: 32px;
            color: #2d3629;
            max-width: 720px;
            margin: 0 auto;
          }
          h1 { font-size: 22px; margin: 0 0 4px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
          h2 {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #647d56;
            margin: 22px 0 8px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
          }
          .card { break-inside: avoid; padding: 10px 0; border-bottom: 1px solid #eee; }
          .word-row { display: flex; align-items: baseline; gap: 8px; }
          .front { font-weight: 700; font-size: 15px; }
          .phonetic { color: #888; font-size: 12px; }
          .back { color: #333; font-size: 13px; margin-top: 2px; white-space: pre-line; }
          .examples { margin-top: 6px; padding-left: 10px; border-left: 2px solid #eee; }
          .example { font-size: 11.5px; margin: 2px 0; color: #444; }
          .example .vi { color: #888; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(deck.name)}</h1>
        <div class="meta">
          ${totalCards} từ vựng${deck.description ? " · " + escapeHtml(deck.description) : ""}
        </div>
        ${bodyHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();

  // Đợi nội dung vẽ xong trước khi mở hộp thoại in, tránh in ra trang trắng.
  setTimeout(() => {
    printWindow.print();
  }, 300);
}
