import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Config Firebase client-side KHÔNG phải bí mật — an toàn khi để công khai trong
// code, vì bảo mật thực sự nằm ở Firestore Security Rules + việc bắt buộc đăng
// nhập Google, không phải ở việc giấu các giá trị này.
const firebaseConfig = {
  apiKey: "AIzaSyCaVF7kk-yDnaGBHQHzQzpaJdLzpZpJ1u8",
  authDomain: "denny-91a4d.firebaseapp.com",
  projectId: "denny-91a4d",
  storageBucket: "denny-91a4d.firebasestorage.app",
  messagingSenderId: "737397616031",
  appId: "1:737397616031:web:d102cc71940ca19ec261aa",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Các thẻ từ vựng có nhiều field tuỳ chọn (phonetic, imageUrl, category...) mang
// giá trị `undefined` khi không dùng — Firestore mặc định từ chối ghi undefined,
// nên bật ignoreUndefinedProperties để tự bỏ qua thay vì phải dọn undefined thủ
// công ở mọi nơi trước khi ghi.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
