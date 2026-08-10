import { FormEvent, useState } from "react";
import { VocabCard } from "../types";
import { lookupPronunciation } from "../lib/pronunciation";

interface Props {
  initial?: VocabCard;
  onSubmit: (card: { front: string; back: string; phonetic?: string; audioUrl?: string }) => void;
  onCancel?: () => void;
}

export default function CardForm({ initial, onSubmit, onCancel }: Props) {
  const [front, setFront] = useState(initial?.front ?? "");
  const [back, setBack] = useState(initial?.back ?? "");
  const [phonetic, setPhonetic] = useState(initial?.phonetic ?? "");
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl);
  const [looking, setLooking] = useState(false);

  async function handleFrontBlur() {
    if (!front.trim() || phonetic.trim()) return;
    setLooking(true);
    const info = await lookupPronunciation(front);
    setLooking(false);
    if (info.phonetic) setPhonetic(info.phonetic);
    if (info.audioUrl) setAudioUrl(info.audioUrl);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    onSubmit({ front, back, phonetic, audioUrl });
    if (!initial) {
      setFront("");
      setBack("");
      setPhonetic("");
      setAudioUrl(undefined);
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
            placeholder="vd: apple"
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
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-brand-700/70">
            Nghĩa tiếng Việt
          </label>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="vd: quả táo"
            rows={2}
            className="w-full resize-none rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            required
          />
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
