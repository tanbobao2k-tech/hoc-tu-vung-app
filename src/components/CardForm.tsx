import { FormEvent, useRef, useState } from "react";
import { CardInput, VocabCard, VocabExample } from "../types";
import { lookupPronunciation } from "../lib/pronunciation";
import { ImageResult, searchImages } from "../lib/images";
import { ExampleSentence, fetchExampleSentences, suggestEnglishWord, suggestVietnameseMeaning } from "../lib/meaning";
import { checkSpelling } from "../lib/spellcheck";

interface Props {
  initial?: VocabCard;
  existingCategories?: string[];
  onSubmit: (card: CardInput) => void;
  onCancel?: () => void;
}

export default function CardForm({ initial, existingCategories = [], onSubmit, onCancel }: Props) {
  const [front, setFront] = useState(initial?.front ?? "");
  const [back, setBack] = useState(initial?.back ?? "");
  const [phonetic, setPhonetic] = useState(initial?.phonetic ?? "");
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [looking, setLooking] = useState(false);
  const [imageOptions, setImageOptions] = useState<ImageResult[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageQueryFor, setImageQueryFor] = useState<string | null>(null);
  const [translatingMeaning, setTranslatingMeaning] = useState(false);
  const [meaningQueryFor, setMeaningQueryFor] = useState<string | null>(null);
  const [translatingWord, setTranslatingWord] = useState(false);
  const [wordQueryFor, setWordQueryFor] = useState<string | null>(null);
  const [spellSuggestions, setSpellSuggestions] = useState<string[]>([]);
  const [spellCheckedFor, setSpellCheckedFor] = useState<string | null>(null);
  const [examples, setExamples] = useState<VocabExample[]>(initial?.examples ?? []);
  const [loadingExamples, setLoadingExamples] = useState(false);
  const [exampleQueryFor, setExampleQueryFor] = useState<string | null>(null);

  // Mọi tra cứu bất đồng bộ (phiên âm, ảnh, nghĩa, chính tả...) mang theo số thế hệ
  // tại thời điểm gọi. Nếu người dùng đã đổi sang từ khác trước khi kết quả trả về,
  // số thế hệ hiện tại sẽ khác đi và kết quả cũ bị bỏ qua — tránh việc phiên âm/ảnh
  // của từ trước bị gán nhầm vào thẻ đang gõ dở.
  const genRef = useRef(0);
  function bump() {
    genRef.current += 1;
    return genRef.current;
  }

  async function fetchWordExtras(word: string, gen: number) {
    const tasks: Promise<void>[] = [];

    if (!phonetic.trim()) {
      setLooking(true);
      tasks.push(
        lookupPronunciation(word).then((info) => {
          setLooking(false);
          if (genRef.current === gen) {
            setPhonetic((prev) => (prev.trim() ? prev : info.phonetic ?? prev));
            setAudioUrl((prev) => prev ?? info.audioUrl);
          }
        })
      );
    }

    if (imageQueryFor !== word) {
      setLoadingImages(true);
      tasks.push(
        searchImages(word).then((images) => {
          setLoadingImages(false);
          if (genRef.current === gen) {
            setImageOptions(images);
            setImageQueryFor(word);
          }
        })
      );
    }

    if (exampleQueryFor !== word) {
      setLoadingExamples(true);
      tasks.push(
        fetchExampleSentences(word).then((fetched: ExampleSentence[]) => {
          setLoadingExamples(false);
          if (genRef.current === gen) {
            setExamples(fetched);
            setExampleQueryFor(word);
          }
        })
      );
    }

    await Promise.all(tasks);
  }

  async function handleFrontBlur() {
    const word = front.trim();
    if (!word) return;
    const gen = genRef.current;

    if (spellCheckedFor !== word) {
      checkSpelling(word).then((suggestions) => {
        setSpellCheckedFor(word);
        if (genRef.current === gen) setSpellSuggestions(suggestions);
      });
    }

    await fetchWordExtras(word, gen);

    if (!back.trim() && meaningQueryFor !== word) {
      setTranslatingMeaning(true);
      const meaning = await suggestVietnameseMeaning(word);
      setTranslatingMeaning(false);
      setMeaningQueryFor(word);
      if (genRef.current === gen) setBack((prev) => (prev.trim() ? prev : meaning));
    }
  }

  async function applySpellingFix(suggestion: string) {
    const gen = bump();
    setFront(suggestion);
    setSpellSuggestions([]);
    setSpellCheckedFor(suggestion);
    setPhonetic("");
    setImageQueryFor(null);
    setExamples([]);
    setExampleQueryFor(null);
    await fetchWordExtras(suggestion, gen);
  }

  async function handleBackBlur() {
    const text = back.trim();
    if (!text || front.trim() || wordQueryFor === text) return;
    const gen = genRef.current;

    setTranslatingWord(true);
    const suggested = await suggestEnglishWord(text);
    setTranslatingWord(false);
    setWordQueryFor(text);
    if (!suggested || genRef.current !== gen || front.trim()) return;

    setFront(suggested);
    genRef.current = gen + 1; // từ mới được điền tự động — coi như một "thế hệ" mới
    await fetchWordExtras(suggested, genRef.current);
  }

  function updateExample(index: number, field: "en" | "vi", value: string) {
    setExamples((prev) => prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)));
  }

  function removeExample(index: number) {
    setExamples((prev) => prev.filter((_, i) => i !== index));
  }

  function addBlankExample() {
    setExamples((prev) => (prev.length < 3 ? [...prev, { en: "", vi: "" }] : prev));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    const cleanExamples = examples.filter((ex) => ex.en.trim() || ex.vi.trim());
    onSubmit({ front, back, phonetic, audioUrl, imageUrl, category, examples: cleanExamples });
    if (!initial) {
      // Giữ nguyên nhóm chủ đề để thêm liên tiếp nhiều từ cùng nhóm cho nhanh.
      bump();
      setFront("");
      setBack("");
      setPhonetic("");
      setAudioUrl(undefined);
      setImageUrl(undefined);
      setImageOptions([]);
      setImageQueryFor(null);
      setMeaningQueryFor(null);
      setWordQueryFor(null);
      setSpellSuggestions([]);
      setSpellCheckedFor(null);
      setExamples([]);
      setExampleQueryFor(null);
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
            onChange={(e) => {
              bump();
              setFront(e.target.value);
              if (spellSuggestions.length > 0) setSpellSuggestions([]);
            }}
            onBlur={handleFrontBlur}
            placeholder={translatingWord ? "Đang gợi ý từ..." : "vd: apple"}
            className="w-full rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            required
          />
          {spellSuggestions.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-amber-600">Có phải bạn muốn viết:</span>
              {spellSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => applySpellingFix(s)}
                  className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
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
            onChange={(e) => {
              bump();
              setBack(e.target.value);
            }}
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
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-brand-700/70">
          Nhóm chủ đề (tuỳ chọn)
        </label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="vd: hoa quả, động vật..."
          list="category-suggestions"
          className="w-full max-w-xs rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
        {existingCategories.length > 0 && (
          <datalist id="category-suggestions">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        )}
      </div>

      <div>
        <label className="mb-1 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-brand-700/70">
          <span>Câu ví dụ (tuỳ chọn)</span>
          {loadingExamples && <span className="normal-case text-brand-700/50">Đang tìm ví dụ...</span>}
        </label>
        <div className="space-y-2">
          {examples.map((ex, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50/30 p-2">
              <div className="min-w-0 flex-1 space-y-1">
                <input
                  value={ex.en}
                  onChange={(e) => updateExample(i, "en", e.target.value)}
                  placeholder="Câu tiếng Anh"
                  className="w-full rounded-md border border-brand-100 bg-white px-2 py-1 text-xs outline-none focus:border-brand-400"
                />
                <input
                  value={ex.vi}
                  onChange={(e) => updateExample(i, "vi", e.target.value)}
                  placeholder="Dịch nghĩa tiếng Việt"
                  className="w-full rounded-md border border-brand-100 bg-white px-2 py-1 text-xs outline-none focus:border-brand-400"
                />
              </div>
              <button
                type="button"
                onClick={() => removeExample(i)}
                title="Xoá ví dụ"
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-500/60 hover:bg-red-50"
              >
                Xóa
              </button>
            </div>
          ))}
          {examples.length < 3 && (
            <button
              type="button"
              onClick={addBlankExample}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              + Thêm ví dụ thủ công
            </button>
          )}
          {!loadingExamples && examples.length === 0 && (
            <p className="text-xs text-brand-700/50">Gõ từ tiếng Anh rồi rời khỏi ô để tự tìm câu ví dụ.</p>
          )}
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
                <img
                  src={img.thumbUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    if (e.currentTarget.src !== img.fullUrl) e.currentTarget.src = img.fullUrl;
                  }}
                />
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
