import { useState } from "react";
import { detectInAppBrowser } from "../lib/inAppBrowser";

interface Props {
  onSignIn: () => void;
  error?: string | null;
}

export default function SignInPage({ onSignIn, error }: Props) {
  const [copied, setCopied] = useState(false);
  const inAppBrowser = detectInAppBrowser();

  function copyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Học từ vựng</p>
      <h1 className="mt-2 text-2xl font-extrabold text-brand-900">Đăng nhập để bắt đầu</h1>
      <p className="mt-2 text-sm text-brand-700/70">
        Dữ liệu được lưu chung — đăng nhập bằng Google để xem và chỉnh sửa cùng một bộ từ vựng trên mọi
        thiết bị.
      </p>

      {inAppBrowser && (
        <div className="mt-5 rounded-xl bg-amber-50 p-4 text-left ring-1 ring-amber-200">
          <p className="text-sm font-medium text-amber-800">
            ⚠ Bạn đang mở trang này trong trình duyệt của {inAppBrowser}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Đăng nhập Google thường bị lỗi trong trình duyệt nhúng của {inAppBrowser}. Hãy sao chép liên
            kết rồi mở bằng Safari/Chrome thật trên điện thoại.
          </p>
          <button
            onClick={copyLink}
            className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
          >
            {copied ? "Đã sao chép ✓" : "Sao chép liên kết"}
          </button>
        </div>
      )}

      <button
        onClick={onSignIn}
        className="mt-6 flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path
            fill="currentColor"
            d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
          />
        </svg>
        Đăng nhập bằng Google
      </button>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
