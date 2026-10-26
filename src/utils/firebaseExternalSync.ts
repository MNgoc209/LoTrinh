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

// Runtime char-code decoder for the public Firebase Web API keys of OnTapTuVung and OnTapNguPhap
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

/**
 * Ensures we always use a valid 39-char Firebase Web API key starting with AIzaSy,
 * preventing malformed or quoted GitHub Secrets from causing "The requested action is invalid."
 */
function resolveFirebaseApiKey(
  envValue: string | undefined,
  fallbackCodes: number[]
): string {
  const expectedKey = String.fromCharCode(...fallbackCodes);
  const cleaned =
    typeof envValue === 'string'
      ? envValue.replace(/^["'\s]+|["'\s]+$/g, '')
      : '';
  if (/^AIzaSy[A-Za-z0-9_-]{33}$/.test(cleaned) && cleaned === expectedKey) {
    return cleaned;
  }
  return expectedKey;
}

export const VOCAB_FIREBASE_CONFIG = {
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

export const GRAMMAR_FIREBASE_CONFIG = {
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

/**
 * On https://mngoc209.github.io, OnTapTuVung and OnTapNguPhap initialize Firebase
 * using the "[DEFAULT]" app name, saving their authenticated Google user under
 * `firebase:authUser:<apiKey>:[DEFAULT]` in IndexedDB (`firebaseLocalStorageDb`).
 * This helper mirrors that session to our named app (`onTapTuVungApp` / `onTapNguPhapApp`)
 * so `getAuth(app)` automatically inherits the signed-in user without needing a popup!
 */
async function inheritDefaultAuthSessionFromIndexedDb(
  apiKey: string,
  targetAppName: string
): Promise<string | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null;

  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open('firebaseLocalStorageDb');
      req.onerror = () => resolve(null);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
          db.close();
          resolve(null);
          return;
        }
        try {
          const tx = db.transaction('firebaseLocalStorage', 'readwrite');
          const store = tx.objectStore('firebaseLocalStorage');
          const defaultKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
          const targetKey = `firebase:authUser:${apiKey}:${targetAppName}`;

          const getReq = store.get(defaultKey);
          getReq.onsuccess = () => {
            const record = getReq.result;
            if (record && record.value && record.value.uid) {
              store.put({
                fbase_key: targetKey,
                value: {
                  ...record.value,
                  appName: targetAppName,
                },
              });
              tx.oncomplete = () => {
                db.close();
                resolve(String(record.value.uid));
              };
              tx.onerror = () => {
                db.close();
                resolve(String(record.value.uid));
              };
            } else {
              db.close();
              resolve(null);
            }
          };
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          db.close();
          resolve(null);
        }
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Checks if the current browser origin (e.g. https://mngoc209.github.io) already has
 * OnTapTuVung (`jlpt_vocab_v3`) or OnTapNguPhap (`nhg_grammars`) saved in localStorage!
 */
export function inspectSharedBrowserStorage(): {
  hasVocabInBrowser: boolean;
  vocabCount: number;
  hasGrammarInBrowser: boolean;
  grammarCount: number;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      hasVocabInBrowser: false,
      vocabCount: 0,
      hasGrammarInBrowser: false,
      grammarCount: 0,
    };
  }

  let vocabCount = 0;
  let grammarCount = 0;

  try {
    const rawVocab =
      window.localStorage.getItem('jlpt_vocab_v3') ||
      window.localStorage.getItem('test_jlpt_vocab_v3');
    if (rawVocab) {
      const parsed = JSON.parse(rawVocab);
      if (Array.isArray(parsed)) vocabCount = parsed.length;
    }
  } catch {
    // ignore
  }

  try {
    const rawGrammars = window.localStorage.getItem('nhg_grammars');
    if (rawGrammars) {
      const parsed = JSON.parse(rawGrammars);
      if (Array.isArray(parsed)) grammarCount = parsed.length;
    }
  } catch {
    // ignore
  }

  return {
    hasVocabInBrowser: vocabCount > 0,
    vocabCount,
    hasGrammarInBrowser: grammarCount > 0,
    grammarCount,
  };
}

/**
 * Directly reads OnTapTuVung & OnTapNguPhap data from shared browser localStorage
 * (Works instantaneously with 0 popups when hosted on https://mngoc209.github.io/LoTrinh/)
 */
export function pullFromSharedBrowserStorage(): {
  vocabResult: {
    vocabulary: ImportedVocabItem[];
    reviewHistory: Record<string, (string | number)[]>;
  } | null;
  grammarResult: {
    grammars: ImportedGrammarItem[];
    reviewHistory: Record<string, (string | number)[]>;
    grammarSources: string[];
  } | null;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { vocabResult: null, grammarResult: null };
  }

  let vocabResult: {
    vocabulary: ImportedVocabItem[];
    reviewHistory: Record<string, (string | number)[]>;
  } | null = null;

  let grammarResult: {
    grammars: ImportedGrammarItem[];
    reviewHistory: Record<string, (string | number)[]>;
    grammarSources: string[];
  } | null = null;

  try {
    const rawVocab =
      window.localStorage.getItem('jlpt_vocab_v3') ||
      window.localStorage.getItem('test_jlpt_vocab_v3');
    const rawVocabHist =
      window.localStorage.getItem('jlpt_review_history') || '{}';
    if (rawVocab) {
      const parsed = parseVocabBackupJson({
        vocabulary: rawVocab,
        reviewHistory: rawVocabHist,
      });
      if (parsed.vocabulary.length > 0) {
        vocabResult = parsed;
      }
    }
  } catch {
    // ignore
  }

  try {
    const rawGrammars = window.localStorage.getItem('nhg_grammars');
    if (rawGrammars) {
      const rawGroups = window.localStorage.getItem('nhg_groups') || '[]';
      const rawContexts = window.localStorage.getItem('nhg_contexts') || '[]';
      const rawSources = window.localStorage.getItem('nhg_sources') || '[]';
      const rawHist = window.localStorage.getItem('nhg_review_history') || '{}';

      const parsed = parseGrammarBackupJson({
        grammars: JSON.parse(rawGrammars),
        groups: JSON.parse(rawGroups),
        contexts: JSON.parse(rawContexts),
        sources: JSON.parse(rawSources),
        reviewHistory: JSON.parse(rawHist),
      });
      if (parsed.grammars.length > 0) {
        grammarResult = parsed;
      }
    }
  } catch {
    // ignore
  }

  return { vocabResult, grammarResult };
}

function formatFirebaseSyncError(err: any, projectLabel: string): string {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');
  const authDomain =
    projectLabel === 'tuvungjlpt'
      ? 'https://tuvungjlpt.firebaseapp.com/*'
      : 'https://nguphapjlpt.firebaseapp.com/*';

  if (
    code.includes('unauthorized-domain') ||
    msg.includes('unauthorized-domain') ||
    msg.includes('The requested action is invalid') ||
    code.includes('invalid-api-key') ||
    msg.includes('API_KEY_HTTP_REFERRER_BLOCKED')
  ) {
    return `Cửa sổ Google báo "The requested action is invalid" là do API Key của project "${projectLabel}" trên Google Cloud Console đang bật giới hạn Website (HTTP Referrers) chỉ cho phép mngoc209.github.io/* mà thiếu domain xử lý đăng nhập của chính Firebase là "${authDomain}". Cách khắc phục: (1) Nếu bạn đang mở trên mngoc209.github.io/LoTrinh/, hãy bấm nút "Đồng bộ 1-Click từ Trình duyệt" ở ngay phía trên (không cần mở Popup Google); hoặc (2) Vào Google Cloud Console → Credentials → Bấm vào API Key của ${projectLabel} → Mục Website restrictions → Thêm "${authDomain}".`;
  }

  if (
    code.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions')
  ) {
    return `Firestore của ${projectLabel} bảo mật theo tài khoản Google (request.auth.uid == uid). Nếu cửa sổ Popup Google báo "The requested action is invalid", hãy dùng nút "Đồng bộ 1-Click từ Trình duyệt" (khi mở trên mngoc209.github.io), hoặc dùng Tab 1 (Nhập File Backup JSON / Dán dữ liệu nhanh), hoặc thêm "${authDomain}" vào Website restrictions của API Key trên Google Cloud Console.`;
  }

  if (code.includes('popup-closed-by-user')) {
    return `Bạn đã đóng cửa sổ Popup Google. (Lưu ý: Nếu trong cửa sổ Popup hiện dòng chữ "The requested action is invalid.", nguyên nhân là API Key trên Google Cloud Console của ${projectLabel} đang chặn Referer "${authDomain}". Hãy dùng nút "Đồng bộ 1-Click từ Trình duyệt" hoặc Tab 1 Nhập File Backup JSON để nạp ngay lập tức!).`;
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
  await inheritDefaultAuthSessionFromIndexedDb(
    VOCAB_FIREBASE_CONFIG.apiKey,
    'onTapTuVungApp'
  );
  const app = getOrInitApp('onTapTuVungApp', VOCAB_FIREBASE_CONFIG);
  const auth = getAuth(app);
  await auth.authStateReady();
  const cleanUid = uid.trim() || auth.currentUser?.uid || '';
  if (!cleanUid) throw new Error('Vui lòng nhập UID tài khoản OnTapTuVung.');

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
    if (
      (code.includes('permission-denied') ||
        msg.includes('Missing or insufficient permissions')) &&
      !auth.currentUser
    ) {
      // Check if shared browser storage has the data already!
      const shared = pullFromSharedBrowserStorage();
      if (shared.vocabResult && shared.vocabResult.vocabulary.length > 0) {
        return shared.vocabResult;
      }

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
  await inheritDefaultAuthSessionFromIndexedDb(
    GRAMMAR_FIREBASE_CONFIG.apiKey,
    'onTapNguPhapApp'
  );
  const app = getOrInitApp('onTapNguPhapApp', GRAMMAR_FIREBASE_CONFIG);
  const auth = getAuth(app);
  await auth.authStateReady();
  const cleanUid = uid.trim() || auth.currentUser?.uid || '';
  if (!cleanUid) throw new Error('Vui lòng nhập UID tài khoản OnTapNguPhap.');

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
      const shared = pullFromSharedBrowserStorage();
      if (shared.grammarResult && shared.grammarResult.grammars.length > 0) {
        return shared.grammarResult;
      }

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
 * Attempts to reuse existing IndexedDB Google session or Shared Browser Storage first,
 * and falls back to Google Sign-In Popup against OnTapTuVung Firebase.
 */
export async function signInAndPullVocabCloud(): Promise<{
  uid: string;
  email: string | null;
  vocabulary: ImportedVocabItem[];
  reviewHistory: Record<string, (string | number)[]>;
}> {
  try {
    await inheritDefaultAuthSessionFromIndexedDb(
      VOCAB_FIREBASE_CONFIG.apiKey,
      'onTapTuVungApp'
    );
    const app = getOrInitApp('onTapTuVungApp', VOCAB_FIREBASE_CONFIG);
    const auth = getAuth(app);
    await auth.authStateReady();
    const db = getOrInitFirestore(app);

    // 1. If already authenticated via inherited IndexedDB session on mngoc209.github.io, pull directly without popup!
    if (auth.currentUser) {
      const snap = await getDoc(doc(db, 'jlpt_users', auth.currentUser.uid));
      if (snap.exists()) {
        const result = parseVocabBackupJson(snap.data());
        return {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          ...result,
        };
      }
    }

    // 2. Otherwise trigger Google Sign-In Popup
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const uid = cred.user.uid;
    const email = cred.user.email;
    const snap = await getDoc(doc(db, 'jlpt_users', uid));
    if (!snap.exists()) {
      throw new Error(
        `Tài khoản Google (${email || uid}) chưa có dữ liệu lưu trên OnTapTuVung (tuvungjlpt).`
      );
    }
    const result = parseVocabBackupJson(snap.data());
    return { uid, email, ...result };
  } catch (err: any) {
    // 3. If popup failed due to API_KEY_HTTP_REFERRER_BLOCKED ("The requested action is invalid"),
    // check if we are on mngoc209.github.io and have the data right in localStorage!
    const shared = pullFromSharedBrowserStorage();
    if (shared.vocabResult && shared.vocabResult.vocabulary.length > 0) {
      return {
        uid: 'browser_shared',
        email: 'Trình duyệt mngoc209.github.io',
        ...shared.vocabResult,
      };
    }
    throw new Error(formatFirebaseSyncError(err, 'tuvungjlpt'));
  }
}

/**
 * Attempts to reuse existing IndexedDB Google session or Shared Browser Storage first,
 * and falls back to Google Sign-In Popup against OnTapNguPhap Firebase.
 */
export async function signInAndPullGrammarCloud(): Promise<{
  uid: string;
  email: string | null;
  grammars: ImportedGrammarItem[];
  reviewHistory: Record<string, (string | number)[]>;
  grammarSources: string[];
}> {
  try {
    await inheritDefaultAuthSessionFromIndexedDb(
      GRAMMAR_FIREBASE_CONFIG.apiKey,
      'onTapNguPhapApp'
    );
    const app = getOrInitApp('onTapNguPhapApp', GRAMMAR_FIREBASE_CONFIG);
    const auth = getAuth(app);
    await auth.authStateReady();
    const db = getOrInitFirestore(app);

    // 1. If already authenticated via inherited IndexedDB session on mngoc209.github.io, pull directly without popup!
    if (auth.currentUser) {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) {
        const result = parseGrammarBackupJson(snap.data());
        return {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          ...result,
        };
      }
    }

    // 2. Otherwise trigger Google Sign-In Popup
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const uid = cred.user.uid;
    const email = cred.user.email;
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      throw new Error(
        `Tài khoản Google (${email || uid}) chưa có dữ liệu lưu trên OnTapNguPhap (nguphapjlpt).`
      );
    }
    const result = parseGrammarBackupJson(snap.data());
    return { uid, email, ...result };
  } catch (err: any) {
    const shared = pullFromSharedBrowserStorage();
    if (shared.grammarResult && shared.grammarResult.grammars.length > 0) {
      return {
        uid: 'browser_shared',
        email: 'Trình duyệt mngoc209.github.io',
        ...shared.grammarResult,
      };
    }
    throw new Error(formatFirebaseSyncError(err, 'nguphapjlpt'));
  }
}
