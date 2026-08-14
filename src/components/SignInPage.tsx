import { FormEvent, useState } from "react";

interface Props {
  needsEmailConfirm: boolean;
  error?: string | null;
  onSendLink: (email: string) => Promise<boolean>;
  onConfirmEmail: (email: string) => void;
}

export default function SignInPage({ needsEmailConfirm, error, onSendLink, onConfirmEmail }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    const ok = await onSendLink(email.trim());
    setSending(false);
    if (ok) setSent(true);
  }

  function handleConfirm(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    onConfirmEmail(email.trim());
  }

  if (needsEmailConfirm) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Học từ vựng</p>
        <h1 className="mt-2 text-2xl font-extrabold text-brand-900">Xác nhận email</h1>
        <p className="mt-2 text-sm text-brand-700/70">
          Bạn đang mở liên kết đăng nhập trên một thiết bị/trình duyệt khác với lúc gửi. Nhập lại email
          bạn đã dùng để nhận liên kết này.
        </p>
        <form onSubmit={handleConfirm} className="mt-6 w-full space-y-3">
          <input
            type="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@gmail.com"
            className="w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Xác nhận
          </button>
        </form>
        {error && (
          <div className="mt-4 w-full rounded-xl bg-red-50 p-4 text-left ring-1 ring-red-200">
            <p className="text-sm font-medium text-red-700">⚠ {error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Học từ vựng</p>
      <h1 className="mt-2 text-2xl font-extrabold text-brand-900">Đăng nhập để bắt đầu</h1>
      <p className="mt-2 text-sm text-brand-700/70">
        Dữ liệu được lưu chung — đăng nhập bằng email để xem và chỉnh sửa cùng một bộ từ vựng trên mọi
        thiết bị. Không cần mật khẩu, chỉ cần bấm vào liên kết gửi tới email của bạn.
      </p>

      {sent ? (
        <div className="mt-6 w-full rounded-xl bg-brand-50 p-4 text-left ring-1 ring-brand-200">
          <p className="text-sm font-medium text-brand-800">✓ Đã gửi liên kết đến {email}</p>
          <p className="mt-1 text-xs text-brand-700/70">
            Mở hộp thư (kiểm tra cả mục Spam nếu chưa thấy) và bấm vào liên kết để đăng nhập.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-3 text-xs font-medium text-brand-600 hover:underline"
          >
            Dùng email khác / gửi lại
          </button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="mt-6 w-full space-y-3">
          <input
            type="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@gmail.com"
            className="w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Đang gửi..." : "Gửi liên kết đăng nhập"}
          </button>
        </form>
      )}

      {error && (
        <div className="mt-4 w-full rounded-xl bg-red-50 p-4 text-left ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-700">⚠ {error}</p>
        </div>
      )}
    </div>
  );
}
