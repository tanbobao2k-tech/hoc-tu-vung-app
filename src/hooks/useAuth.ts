import { useEffect, useState } from "react";
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { describeAuthError } from "../lib/authError";

const EMAIL_STORAGE_KEY = "emailForSignIn";
const EMAIL_QUERY_PARAM = "loginEmail";

function actionCodeSettings(email: string) {
  const base = window.location.href.split("?")[0];
  return {
    // Nhúng thẳng email vào URL quay lại (không phải thông tin nhạy cảm hơn
    // chính cái link đăng nhập) — nhờ vậy bấm link ở BẤT KỲ máy/trình duyệt
    // nào cũng tự biết email luôn, không cần hỏi lại người dùng nữa.
    url: `${base}?${EMAIL_QUERY_PARAM}=${encodeURIComponent(email)}`,
    handleCodeInApp: true,
  };
}

function emailFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get(EMAIL_QUERY_PARAM);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authStateReady, setAuthStateReady] = useState(false);
  const [completingSignIn, setCompletingSignIn] = useState(false);
  // Chỉ còn cần hỏi lại nếu link không có email trong URL (vd link cũ từ
  // trước khi có cơ chế này) VÀ localStorage cũng không có (máy khác).
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthStateReady(true);
      }),
    []
  );

  useEffect(() => {
    // Vừa quay lại từ việc bấm link đăng nhập trong email — hoàn tất đăng
    // nhập. Đây là cách đăng nhập không cần popup/redirect qua Google, nên
    // tránh được lỗi trình duyệt di động chặn chia sẻ trạng thái giữa các
    // domain khác nhau.
    function tryCompleteSignIn() {
      const href = window.location.href;
      if (!isSignInWithEmailLink(auth, href)) return;

      const email = emailFromUrl() ?? localStorage.getItem(EMAIL_STORAGE_KEY);
      if (!email) {
        setNeedsEmailConfirm(true);
        return;
      }
      setCompletingSignIn(true);
      signInWithEmailLink(auth, email, href)
        .catch((err) => setError(describeAuthError(err)))
        .finally(() => {
          localStorage.removeItem(EMAIL_STORAGE_KEY);
          setCompletingSignIn(false);
          window.history.replaceState({}, "", window.location.pathname);
        });
    }

    tryCompleteSignIn();
    // Safari (đặc biệt iOS) hay khôi phục lại tab đã mở từ bộ nhớ đệm
    // (bfcache) thay vì tải trang mới khi bấm link — lúc đó React không
    // remount nên effect ở trên không tự chạy lại. Sự kiện "pageshow" với
    // persisted=true báo đúng trường hợp này, cần kiểm tra lại URL thủ công.
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) tryCompleteSignIn();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const sendLink = async (email: string) => {
    setError(null);
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings(email));
      localStorage.setItem(EMAIL_STORAGE_KEY, email);
      return true;
    } catch (err) {
      setError(describeAuthError(err));
      return false;
    }
  };

  const confirmEmailAndSignIn = async (email: string) => {
    setCompletingSignIn(true);
    setError(null);
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      setNeedsEmailConfirm(false);
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setCompletingSignIn(false);
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  const logOut = () => signOut(auth);

  return {
    user,
    loading: !authStateReady || completingSignIn,
    needsEmailConfirm,
    error,
    sendLink,
    confirmEmailAndSignIn,
    logOut,
  };
}
