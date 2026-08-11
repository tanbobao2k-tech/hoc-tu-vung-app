import { fetchWithTimeout } from "./fetchWithTimeout";

/**
 * Kiểm tra chính tả một từ tiếng Anh qua LanguageTool (miễn phí, không cần key).
 * Trả về vài từ gợi ý sửa nếu phát hiện lỗi chính tả, mảng rỗng nếu từ đúng
 * hoặc không kiểm tra được (lỗi mạng không nên chặn người dùng thêm thẻ).
 */
export async function checkSpelling(word: string): Promise<string[]> {
  const trimmed = word.trim();
  if (!trimmed || /\s/.test(trimmed)) return [];

  try {
    const res = await fetchWithTimeout("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `text=${encodeURIComponent(trimmed)}&language=en-US`,
    });
    if (!res?.ok) return [];
    const data = await res.json();
    const matches: Array<{
      rule?: { issueType?: string; category?: { id?: string } };
      replacements?: Array<{ value?: string }>;
      offset: number;
      length: number;
    }> = Array.isArray(data?.matches) ? data.matches : [];

    const spellingMatch = matches.find(
      (m) =>
        m.offset === 0 &&
        m.length === trimmed.length &&
        (m.rule?.issueType === "misspelling" || m.rule?.category?.id === "TYPOS")
    );
    if (!spellingMatch) return [];

    return (spellingMatch.replacements ?? [])
      .map((r) => r.value)
      .filter((v): v is string => !!v && /^[a-zA-Z-]+$/.test(v))
      .slice(0, 5);
  } catch {
    return [];
  }
}

/** Khoảng cách Levenshtein — dùng để nhận biết lỗi gõ nhầm nhỏ so với đáp án đúng. */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/** Trả về true nếu 2 từ chỉ khác nhau bởi lỗi gõ nhầm nhỏ (không phải từ khác hẳn). */
export function isCloseTypo(input: string, correct: string): boolean {
  const a = input.trim().toLowerCase();
  const b = correct.trim().toLowerCase();
  if (!a || a === b) return false;
  const maxAllowed = b.length <= 4 ? 1 : 2;
  return editDistance(a, b) <= maxAllowed;
}
