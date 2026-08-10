import { FormEvent, useState } from "react";
import { CardInput, VocabCard } from "../types";
import { lookupPronunciation } from "../lib/pronunciation";
import { ImageResult, searchImages } from "../lib/images";
import { suggestEnglishWord, suggestVietnameseMeaning } from "../lib/meaning";

interface Props {
  initial?: VocabCard;
  onSubmit: (card: CardInput) => void;
  onCancel?: () => void;
}

export default function CardForm({ initial, onSubmit, onCancel }: Props) {
  const [front, setFront] = useState(initial?.front ?? "");
  const [back, setBack] = useState(initial?.back ?? "");
  const [phonetic, setPhonetic] = useState(initial?.phonetic ?? "");
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl);
  const [looking, setLooking] = useState(false);
  const [imageOptions, setImageOptions] = useState<ImageResult[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageQueryFor, setImageQueryFor] = useState<string | null>(null);
  const [translatingMeaning, setTranslatingMeaning] = useState(false);
  const [meaningQueryFor, setMeaningQueryFor] = useState<string | null>(null);
  const [translatingWord, setTranslatingWord] = useState(false);
  const [wordQueryFor, setWordQueryFor] = useState<string | null>(null);

  async function fetchPhoneticAndImages(word: string) {
    if (!phonetic.trim()) {
      setLooking(true);
      const info = await lookupPronunciation(word);
      setLooking(false);
      setPhonetic((prev) => (prev.trim() ? prev : info.phonetic ?? prev));
      setAudioUrl((prev) => prev ?? info.audioUrl);
    }

    if (imageQueryFor !== word) {
      setLoadingImages(true);
      const images = await searchImages(word);
      setLoadingImages(false);
      setImageOptions(images);
      setImageQueryFor(word);
    }
  }

  async function handleFrontBlur() {
    const word = front.trim();
    if (!word) return;

    await fetchPhoneticAndImages(word);

    if (!back.trim() && meaningQueryFor !== word) {
      setTranslatingMeaning(true);
      const meaning = await suggestVietnameseMeaning(word);
      setTranslatingMeaning(false);
      setMeaningQueryFor(word);
      setBack((prev) => (prev.trim() ? prev : meaning));
    }
  }

  async function handleBackBlur() {
    const text = back.trim();
    if (!text || front.trim() || wordQueryFor === text) return;

    setTranslatingWord(true);
    const suggested = await suggestEnglishWord(text);
    setTranslatingWord(false);
    setWordQueryFor(text);
    if (!suggested) return;

    setFront((prev) => (prev.trim() ? prev : suggested));
    if (!front.trim()) {
      await fetchPhoneticAndImages(suggested);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    onSubmit({ front, back, phonetic, audioUrl, imageUrl });
    if (!initial) {
      setFront("");
      setBack("");
      setPhonetic("");
      setAudioUrl(undefined);
      setImageUrl(undefined);
      setImageOptions([]);
      setImageQueryFor(null);
      setMeaningQueryFor(null);
      setWordQueryFor(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-brand-700/70">
            Từ tiếng Anh
          </label>
          <input
            value={front}
            onChange={(e) => setFront(e.target.value)}
            onBlur={handleFrontBlur}
            placeholder={translatingWord ? "Đang gợi ý từ..." : "vd: apple"}
            className="w-full rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            required
          />
          <div className="mt-1 flex items-center gap-2 text-xs text-brand-700/60">
            <span>Phiên âm:</span>
            <input
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value)}
              placeholder={looking ? "Đang tra cứu..." : "/ˈæp.əl/ (tự động hoặc tự nhập)"}
              className="flex-1 rounded-md border border-brand-100 px-2 py-1 text-xs outline-none focus:border-brand-400"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-brand-700/70">
            <span>Nghĩa tiếng Việt</span>
            {translatingMeaning && <span className="normal-case text-brand-700/50">Đang tra nghĩa...</span>}
          </label>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            onBlur={handleBackBlur}
            placeholder={
              translatingMeaning
                ? "Đang tra nghĩa..."
                : "vd: quả táo (gõ từ tiếng Anh rồi rời ô để tự gợi ý, hoặc tự gõ tiếng Việt để tự gợi ý từ tiếng Anh)"
            }
            rows={4}
            className="w-full resize-none whitespace-pre-line rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-1 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-brand-700/70">
          <span>Ảnh minh hoạ</span>
          {loadingImages && <span className="normal-case text-brand-700/50">Đang tìm ảnh...</span>}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl(undefined)}
              title="Bỏ chọn ảnh"
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-brand-600"
            >
              <img src={imageUrl} alt={front} className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 hover:opacity-100">
                Bỏ chọn
              </span>
            </button>
          )}
          {imageOptions
            .filter((img) => img.fullUrl !== imageUrl)
            .map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setImageUrl(img.fullUrl)}
                className="h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-brand-200 transition hover:ring-2 hover:ring-brand-400"
              >
                <img src={img.thumbUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          {!loadingImages && imageOptions.length === 0 && !imageUrl && (
            <p className="text-xs text-brand-700/50">Gõ từ tiếng Anh rồi rời khỏi ô để xem gợi ý ảnh.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-brand-700/70 hover:bg-brand-50"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 active:scale-95"
        >
          {initial ? "Lưu thay đổi" : "Thêm thẻ"}
        </button>
      </div>
    </form>
  );
}
