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
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    // Popup đăng nhập trên di động (đặc biệt Safari/Chrome iOS khi trình
    // duyệt phân vùng lưu trữ nghiêm ngặt) hay báo lỗi "missing initial
    // state" vì cửa sổ popup không chia sẻ được sessionStorage với cửa sổ
    // chính. Trên di động dùng signInWithRedirect (chuyển hẳn trang) để
    // tránh vấn đề chia sẻ trạng thái giữa 2 cửa sổ này — quay lại đây thì
    // xử lý kết quả redirect.
    getRedirectResult(auth).catch((err) => {
      const message = describeAuthError(err);
      if (message) setRedirectError(message);
    });
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }),
    []
  );

  const signIn = () => {
    setRedirectError(null);
    if (isMobile()) {
      return signInWithRedirect(auth, googleProvider);
    }
    return signInWithPopup(auth, googleProvider);
  };

  const logOut = () => signOut(auth);

  return { user, loading, signIn, logOut, redirectError };
}
