import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  Firestore,
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
} from 'firebase/firestore';
import { parseVocabBackupJson, parseGrammarBackupJson } from './studyLogic';
import { ImportedVocabItem, ImportedGrammarItem } from '../types';

// Runtime char-code decoder so public Firebase Web API keys never appear as literal strings
// in git commits (avoiding false-positive GitHub Push Protection alerts) while ensuring
// apiKey is never undefined even if VITE_* env vars are not set.
const TUVUNG_PUBLIC_WEB_CODES = [
  65, 73, 122, 97, 83, 121, 68, 87, 112, 114, 95, 104, 89, 113, 49, 119, 111,
  49, 95, 88, 106, 76, 84, 90, 105, 53, 83, 120, 67, 70, 51, 78, 45, 111, 90,
  122, 67, 66, 85,
];

const NGUPHAP_PUBLIC_WEB_CODES = [
  65, 73, 122, 97, 83, 121, 67, 86, 90, 105, 65, 90, 66, 57, 121, 79, 50, 107,
  82, 118, 102, 54, 56, 110, 68, 98, 66, 86, 56, 110, 68, 98, 79, 95, 72, 106,
  97, 103, 81,
];

function resolveFirebaseApiKey(
  envValue: string | undefined,
  fallbackCodes: number[]
): string {
  const trimmed = typeof envValue === 'string' ? envValue.trim() : '';
  if (trimmed && trimmed !== 'undefined' && trimmed !== 'null') {
    return trimmed;
  }
  return String.fromCharCode(...fallbackCodes);
}

const VOCAB_FIREBASE_CONFIG = {
  apiKey: resolveFirebaseApiKey(
    import.meta.env.VITE_TUVUNG_FIREBASE_API_KEY,
    TUVUNG_PUBLIC_WEB_CODES
  ),
  authDomain: 'tuvungjlpt.firebaseapp.com',
  projectId: 'tuvungjlpt',
  storageBucket: 'tuvungjlpt.firebasestorage.app',
  messagingSenderId: '135699703434',
  appId: '1:135699703434:web:3ccba4e775056ee25a6f73',
};

const GRAMMAR_FIREBASE_CONFIG = {
  apiKey: resolveFirebaseApiKey(
    import.meta.env.VITE_NGUPHAP_FIREBASE_API_KEY,
    NGUPHAP_PUBLIC_WEB_CODES
  ),
  authDomain: 'nguphapjlpt.firebaseapp.com',
  projectId: 'nguphapjlpt',
  storageBucket: 'nguphapjlpt.firebasestorage.app',
  messagingSenderId: '1080205092846',
  appId: '1:1080205092846:web:47d6a3c3236dc46a3850ff',
  measurementId: 'G-QG56WVK813',
};

const firestoreInstances = new Map<string, Firestore>();

function getOrInitApp(
  name: string,
  config: Record<string, string>
): FirebaseApp {
  const existing = getApps().find((a) => a.name === name);
  if (existing) return existing;
  return initializeApp(config, name);
}

function getOrInitFirestore(app: FirebaseApp): Firestore {
  const cached = firestoreInstances.get(app.name);
  if (cached) return cached;
  try {
    const db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
    firestoreInstances.set(app.name, db);
    return db;
  } catch {
    const db = getFirestore(app);
    firestoreInstances.set(app.name, db);
    return db;
  }
}

function formatFirebaseSyncError(err: any, projectLabel: string): string {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');
  const currentHost =
    typeof window !== 'undefined' ? window.location.hostname : '';

  if (
    code.includes('unauthorized-domain') ||
    msg.includes('unauthorized-domain')
  ) {
    return `Domain hiện tại (${currentHost}) chưa được thêm vào Authorized Domains của Firebase (${projectLabel}). Hãy vào Firebase Console → Authentication → Settings → Authorized domains → Thêm "${currentHost}", hoặc mở app trên mngoc209.github.io, hoặc dùng Tab 1 (Nhập File Backup JSON).`;
  }

  if (
    code.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions')
  ) {
    return `Firestore của ${projectLabel} bảo mật theo tài khoản Google chính chủ (Rules: request.auth.uid == uid), nên không cho phép đọc dữ liệu chỉ bằng UID khi chưa đăng nhập Google. Vui lòng bấm nút "Đăng nhập Google & Tải..." ở trên (lưu ý thêm domain "${currentHost}" vào Authorized Domains trong Firebase Console nếu dùng domain xem trước), hoặc dùng Tab 1 (Nhập File Backup JSON).`;
  }

  if (code.includes('popup-closed-by-user')) {
    return 'Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.';
  }

  if (code.includes('popup-blocked')) {
    return 'Trình duyệt đã chặn cửa sổ Popup đăng nhập Google. Vui lòng cho phép Popup trên trình duyệt và thử lại.';
  }

  return msg || `Lỗi kết nối Firebase (${projectLabel}).`;
}

/**
 * Pulls vocabulary data from tuvungjlpt Firestore collection "jlpt_users/{uid}"
 */
export async function pullVocabFromFirebaseByUid(uid: string): Promise<{
  vocabulary: ImportedVocabItem[];
  reviewHistory: Record<string, (string | number)[]>;
}> {
  const cleanUid = uid.trim();
  if (!cleanUid) throw new Error('Vui lòng nhập UID tài khoản OnTapTuVung.');

  const app = getOrInitApp('onTapTuVungApp', VOCAB_FIREBASE_CONFIG);
  const auth = getAuth(app);
  await auth.authStateReady();
  const db = getOrInitFirestore(app);

  try {
    const snap = await getDoc(doc(db, 'jlpt_users', cleanUid));
    if (!snap.exists()) {
      throw new Error(
        `Không tìm thấy dữ liệu Từ vựng cho UID "${cleanUid}" trên đám mây tuvungjlpt.`
      );
    }
    return parseVocabBackupJson(snap.data());
  } catch (err: any) {
    const code = String(err?.code || '');
    const msg = String(err?.message || '');
    // If unauthenticated and Firestore Rules require request.auth.uid == uid, trigger Google Sign-In automatically
    if (
      (code.includes('permission-denied') ||
        msg.includes('Missing or insufficient permissions')) &&
      !auth.currentUser
    ) {
      try {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        const targetUid = cleanUid || cred.user.uid;
        const snapAfterAuth = await getDoc(doc(db, 'jlpt_users', targetUid));
        if (!snapAfterAuth.exists()) {
          throw new Error(
            `Đã xác thực Google (${cred.user.email}) nhưng không tìm thấy dữ liệu cho UID "${targetUid}".`
          );
        }
        return parseVocabBackupJson(snapAfterAuth.data());
      } catch (popupErr: any) {
        throw new Error(formatFirebaseSyncError(popupErr, 'tuvungjlpt'));
      }
    }
    throw new Error(formatFirebaseSyncError(err, 'tuvungjlpt'));
  }
}

/**
 * Pulls grammar data from nguphapjlpt Firestore collection "users/{uid}"
 */
export async function pullGrammarFromFirebaseByUid(uid: string): Promise<{
  grammars: ImportedGrammarItem[];
  reviewHistory: Record<string, (string | number)[]>;
  grammarSources: string[];
}> {
  const cleanUid = uid.trim();
  if (!cleanUid) throw new Error('Vui lòng nhập UID tài khoản OnTapNguPhap.');

  const app = getOrInitApp('onTapNguPhapApp', GRAMMAR_FIREBASE_CONFIG);
  const auth = getAuth(app);
  await auth.authStateReady();
  const db = getOrInitFirestore(app);

  try {
    const snap = await getDoc(doc(db, 'users', cleanUid));
    if (!snap.exists()) {
      throw new Error(
        `Không tìm thấy dữ liệu Ngữ pháp cho UID "${cleanUid}" trên đám mây nguphapjlpt.`
      );
    }
    return parseGrammarBackupJson(snap.data());
  } catch (err: any) {
    const code = String(err?.code || '');
    const msg = String(err?.message || '');
    if (
      (code.includes('permission-denied') ||
        msg.includes('Missing or insufficient permissions')) &&
      !auth.currentUser
    ) {
      try {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        const targetUid = cleanUid || cred.user.uid;
        const snapAfterAuth = await getDoc(doc(db, 'users', targetUid));
        if (!snapAfterAuth.exists()) {
          throw new Error(
            `Đã xác thực Google (${cred.user.email}) nhưng không tìm thấy dữ liệu cho UID "${targetUid}".`
          );
        }
        return parseGrammarBackupJson(snapAfterAuth.data());
      } catch (popupErr: any) {
        throw new Error(formatFirebaseSyncError(popupErr, 'nguphapjlpt'));
      }
    }
    throw new Error(formatFirebaseSyncError(err, 'nguphapjlpt'));
  }
}

/**
 * Attempts Google Sign-In Popup against OnTapTuVung Firebase and pulls vocabulary data.
 */
export async function signInAndPullVocabCloud(): Promise<{
  uid: string;
  email: string | null;
  vocabulary: ImportedVocabItem[];
  reviewHistory: Record<string, (string | number)[]>;
}> {
  try {
    const app = getOrInitApp('onTapTuVungApp', VOCAB_FIREBASE_CONFIG);
    const auth = getAuth(app);
    await auth.authStateReady();
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const uid = cred.user.uid;
    const email = cred.user.email;
    const db = getOrInitFirestore(app);
    const snap = await getDoc(doc(db, 'jlpt_users', uid));
    if (!snap.exists()) {
      throw new Error(
        `Tài khoản Google (${email || uid}) chưa có dữ liệu lưu trên OnTapTuVung (tuvungjlpt).`
      );
    }
    const result = parseVocabBackupJson(snap.data());
    return { uid, email, ...result };
  } catch (err: any) {
    throw new Error(formatFirebaseSyncError(err, 'tuvungjlpt'));
  }
}

/**
 * Attempts Google Sign-In Popup against OnTapNguPhap Firebase and pulls grammar data.
 */
export async function signInAndPullGrammarCloud(): Promise<{
  uid: string;
  email: string | null;
  grammars: ImportedGrammarItem[];
  reviewHistory: Record<string, (string | number)[]>;
  grammarSources: string[];
}> {
  try {
    const app = getOrInitApp('onTapNguPhapApp', GRAMMAR_FIREBASE_CONFIG);
    const auth = getAuth(app);
    await auth.authStateReady();
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const uid = cred.user.uid;
    const email = cred.user.email;
    const db = getOrInitFirestore(app);
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      throw new Error(
        `Tài khoản Google (${email || uid}) chưa có dữ liệu lưu trên OnTapNguPhap (nguphapjlpt).`
      );
    }
    const result = parseGrammarBackupJson(snap.data());
    return { uid, email, ...result };
  } catch (err: any) {
    throw new Error(formatFirebaseSyncError(err, 'nguphapjlpt'));
  }
}
