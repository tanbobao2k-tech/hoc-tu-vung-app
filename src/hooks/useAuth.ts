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

function actionCodeSettings() {
  return {
    // Quay lại đúng URL app hiện tại (bỏ query string cũ nếu có) sau khi bấm
    // link trong email.
    url: window.location.href.split("?")[0],
    handleCodeInApp: true,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authStateReady, setAuthStateReady] = useState(false);
  const [completingSignIn, setCompletingSignIn] = useState(false);
  // true khi link đăng nhập được bấm trên MÁY/TRÌNH DUYỆT khác với lúc gửi —
  // localStorage lưu email không còn, cần người dùng tự xác nhận lại email.
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

  // Vừa quay lại từ việc bấm link đăng nhập trong email — hoàn tất đăng nhập.
  // Đây là cách đăng nhập không cần popup/redirect qua Google, nên tránh
  // được hoàn toàn lỗi trình duyệt di động chặn chia sẻ trạng thái giữa các
  // domain khác nhau.
  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return;
    const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!storedEmail) {
      setNeedsEmailConfirm(true);
      return;
    }
    setCompletingSignIn(true);
    signInWithEmailLink(auth, storedEmail, window.location.href)
      .catch((err) => setError(describeAuthError(err)))
      .finally(() => {
        localStorage.removeItem(EMAIL_STORAGE_KEY);
        setCompletingSignIn(false);
        window.history.replaceState({}, "", window.location.pathname);
      });
  }, []);

  const sendLink = async (email: string) => {
    setError(null);
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings());
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
