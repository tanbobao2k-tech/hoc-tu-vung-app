import { SrsBox } from "../types";

// Hệ thống Leitner đơn giản: 5 hộp, mỗi hộp có khoảng cách ôn tập (ngày) tăng dần.
const BOX_INTERVAL_DAYS: Record<SrsBox, number> = {
  1: 0, // hôm nay (chưa nhớ -> ôn lại ngay trong ngày)
  2: 1,
  3: 3,
  4: 7,
  5: 16,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function nextBox(currentBox: SrsBox, remembered: boolean): SrsBox {
  if (remembered) {
    return Math.min(currentBox + 1, 5) as SrsBox;
  }
  return 1;
}

export function nextReviewAt(box: SrsBox, from = Date.now()): number {
  return from + BOX_INTERVAL_DAYS[box] * DAY_MS;
}

export function isDue(nextReviewAtMs: number, at = Date.now()): boolean {
  return nextReviewAtMs <= at;
}

export function boxLabel(box: SrsBox): string {
  const labels: Record<SrsBox, string> = {
    1: "Mới học",
    2: "Đang nhớ",
    3: "Khá thuộc",
    4: "Thuộc",
    5: "Thuộc lòng",
  };
  return labels[box];
}
