import { useEffect, useState } from "react";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { describeAuthError } from "../lib/authError";

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  // onAuthStateChanged có thể bắn lần đầu với user=null TRƯỚC KHI
  // getRedirectResult() xử lý xong lượt đăng nhập redirect vừa quay về —
  // nếu chỉ dựa vào onAuthStateChanged để tắt "loading", app sẽ chớp qua
  // màn hình đăng nhập (hoặc kẹt luôn ở đó) trước khi kịp nhận user thật.
  // Phải đợi CẢ HAI việc xong mới coi là hết loading.
  const [authStateReady, setAuthStateReady] = useState(false);
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    // Trên di động dùng signInWithRedirect (chuyển hẳn trang) thay vì popup
    // vì popup hay lỗi "missing initial state" trên trình duyệt di động
    // chặn lưu trữ chia sẻ giữa 2 cửa sổ. Quay lại từ redirect thì xử lý
    // kết quả ở đây.
    const wasRedirecting = localStorage.getItem("pendingGoogleRedirect") === "1";
    getRedirectResult(auth)
      .then((result) => {
        // Vừa quay lại từ redirect (đã tự đặt cờ trước khi điều hướng đi) mà
        // không có lỗi NHƯNG cũng không có kết quả — nghĩa là Firebase không
        // nhận ra vừa có một lượt đăng nhập redirect nào cả (rất có thể do
        // trình duyệt chặn lưu trữ khiến trạng thái redirect bị mất giữa
        // chừng), khác với lỗi có thể bắt được qua catch bên dưới.
        if (wasRedirecting && !result) {
          setRedirectError(
            "Đăng nhập không hoàn tất khi quay lại từ Google. Trình duyệt có thể đang chặn lưu trữ — thử tắt chế độ duyệt web riêng tư/chặn theo dõi cho trang này rồi thử lại."
          );
        }
      })
      .catch((err) => {
        const message = describeAuthError(err);
        if (message) setRedirectError(message);
      })
      .finally(() => {
        localStorage.removeItem("pendingGoogleRedirect");
        setRedirectChecked(true);
      });
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthStateReady(true);
      }),
    []
  );

  const signIn = () => {
    setRedirectError(null);
    if (isMobile()) {
      localStorage.setItem("pendingGoogleRedirect", "1");
      return signInWithRedirect(auth, googleProvider);
    }
    return signInWithPopup(auth, googleProvider);
  };

  const logOut = () => signOut(auth);

  return {
    user,
    loading: !authStateReady || !redirectChecked,
    signIn,
    logOut,
    redirectError,
  };
}
