export type SrsBox = 1 | 2 | 3 | 4 | 5;

export interface VocabExample {
  en: string;
  vi: string;
}

export interface VocabCard {
  id: string;
  front: string; // Tiếng Anh
  back: string; // Tiếng Việt
  phonetic?: string; // Phiên âm IPA, vd: /kæt/
  audioUrl?: string; // Link phát âm chuẩn (nếu tìm được)
  imageUrl?: string; // Ảnh minh hoạ do người dùng chọn
  category?: string; // Nhóm chủ đề, vd: "hoa quả"
  examples?: VocabExample[]; // Câu ví dụ + dịch nghĩa
  box: SrsBox; // Cấp độ ghi nhớ (Leitner box)
  nextReviewAt: number; // Thời điểm cần ôn lại tiếp theo (epoch ms)
  reviewCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface CardInput {
  front: string;
  back: string;
  phonetic?: string;
  audioUrl?: string;
  imageUrl?: string;
  category?: string;
  examples?: VocabExample[];
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  cards: VocabCard[];
  createdAt: number;
  updatedAt: number;
}

export interface AppData {
  decks: Deck[];
}
