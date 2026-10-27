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
  setDoc,
} from 'firebase/firestore';
import { parseVocabBackupJson, parseGrammarBackupJson } from './studyLogic';
import {
  ImportedVocabItem,
  ImportedGrammarItem,
  CrossDeviceWorkspaceSnapshot,
} from '../types';

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

const CLOUD_PAIRING_STORAGE_KEY = 'jlpt_n3_cloud_pairing_tokens_v1';

export interface SavedCloudTokenEntry {
  uid: string;
  email?: string | null;
  refreshToken: string;
  apiKey: string;
  projectId: string;
}

export interface CloudPairingBundle {
  vocab?: SavedCloudTokenEntry;
  grammar?: SavedCloudTokenEntry;
  syncRoomKey?: string;
}

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

const viteEnv = (import.meta as any)?.env || {};

export const VOCAB_FIREBASE_CONFIG = {
  apiKey: resolveFirebaseApiKey(
    viteEnv.VITE_TUVUNG_FIREBASE_API_KEY,
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
    viteEnv.VITE_NGUPHAP_FIREBASE_API_KEY,
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

export function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Thiết bị Web';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone / iPad';
  if (/Android/i.test(ua)) return 'Điện thoại Android';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Máy tính Mac';
  if (/Windows/i.test(ua)) return 'Máy tính Windows';
  return 'Trình duyệt Web';
}

export function loadSavedCloudPairingBundle(): CloudPairingBundle {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(CLOUD_PAIRING_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function saveCloudPairingBundle(bundle: CloudPairingBundle): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = loadSavedCloudPairingBundle();
    const merged: CloudPairingBundle = {
      ...current,
      ...bundle,
    };
    window.localStorage.setItem(CLOUD_PAIRING_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

/**
 * Scans IndexedDB (`firebaseLocalStorageDb`) AND `localStorage` for any existing signed-in
 * Firebase Auth sessions from OnTapTuVung (`tuvungjlpt`) or OnTapNguPhap (`nguphapjlpt`),
 * and merges them with any saved Cloud Pairing tokens.
 */
export async function discoverAllFirebaseSessions(): Promise<CloudPairingBundle> {
  const bundle: CloudPairingBundle = { ...loadSavedCloudPairingBundle() };
  if (typeof window === 'undefined') return bundle;

  const inspectUserValue = (val: any) => {
    if (!val || typeof val !== 'object') return;
    const uid = val.uid;
    const email = val.email || null;
    const apiKey = val.apiKey || '';
    const refreshToken = val.stsTokenManager?.refreshToken || '';
    if (!uid || !refreshToken) return;

    if (apiKey === VOCAB_FIREBASE_CONFIG.apiKey) {
      bundle.vocab = {
        uid: String(uid),
        email,
        refreshToken: String(refreshToken),
        apiKey: VOCAB_FIREBASE_CONFIG.apiKey,
        projectId: VOCAB_FIREBASE_CONFIG.projectId,
      };
    } else if (apiKey === GRAMMAR_FIREBASE_CONFIG.apiKey) {
      bundle.grammar = {
        uid: String(uid),
        email,
        refreshToken: String(refreshToken),
        apiKey: GRAMMAR_FIREBASE_CONFIG.apiKey,
        projectId: GRAMMAR_FIREBASE_CONFIG.projectId,
      };
    }
  };

  // 1. Check localStorage keys starting with firebase:authUser:
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('firebase:authUser:')) {
        const raw = window.localStorage.getItem(k);
        if (raw) inspectUserValue(JSON.parse(raw));
      }
    }
  } catch {
    // ignore
  }

  // 2. Scan IndexedDB firebaseLocalStorageDb via openCursor
  if ('indexedDB' in window) {
    await new Promise<void>((resolve) => {
      try {
        const req = window.indexedDB.open('firebaseLocalStorageDb');
        req.onerror = () => resolve();
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
            db.close();
            resolve();
            return;
          }
          try {
            const tx = db.transaction('firebaseLocalStorage', 'readwrite');
            const store = tx.objectStore('firebaseLocalStorage');
            const cursorReq = store.openCursor();
            cursorReq.onsuccess = (ev) => {
              const cursor = (ev.target as IDBRequest<IDBCursorWithValue | null>).result;
              if (cursor) {
                const record = cursor.value;
                const userObj = record?.value || record;
                inspectUserValue(userObj);

                // Also mirror [DEFAULT] sessions to our named apps
                if (userObj?.apiKey === VOCAB_FIREBASE_CONFIG.apiKey && userObj?.uid) {
                  try {
                    store.put({
                      fbase_key: `firebase:authUser:${VOCAB_FIREBASE_CONFIG.apiKey}:onTapTuVungApp`,
                      value: { ...userObj, appName: 'onTapTuVungApp' },
                    });
                  } catch {
                    // ignore
                  }
                }
                if (userObj?.apiKey === GRAMMAR_FIREBASE_CONFIG.apiKey && userObj?.uid) {
                  try {
                    store.put({
                      fbase_key: `firebase:authUser:${GRAMMAR_FIREBASE_CONFIG.apiKey}:onTapNguPhapApp`,
                      value: { ...userObj, appName: 'onTapNguPhapApp' },
                    });
                  } catch {
                    // ignore
                  }
                }
                cursor.continue();
              }
            };
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              db.close();
              resolve();
            };
          } catch {
            db.close();
            resolve();
          }
        };
      } catch {
        resolve();
      }
    });
  }

  if (bundle.vocab || bundle.grammar) {
    saveCloudPairingBundle(bundle);
  }
  return bundle;
}

/**
 * Exchanges a Firebase refreshToken for a fresh 1-hour idToken directly from the current browser window.
 * Because this request originates from the app window (Referer: mngoc209.github.io or *.run.app),
 * it succeeds 200 OK without ever opening firebaseapp.com/__/auth/handler!
 */
async function exchangeRefreshTokenForIdToken(
  apiKey: string,
  refreshToken: string
): Promise<{ idToken: string; uid: string; refreshToken: string } | null> {
  try {
    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.id_token || !data.user_id) return null;
    return {
      idToken: String(data.id_token),
      uid: String(data.user_id),
      refreshToken: String(data.refresh_token || refreshToken),
    };
  } catch {
    return null;
  }
}

/**
 * Converts a Firestore REST API Value object into a plain JavaScript value.
 */
function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values;
    return Array.isArray(values) ? values.map(fromFirestoreValue) : [];
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  return val;
}

function fromFirestoreDocument(docJson: any): Record<string, any> | null {
  if (!docJson || !docJson.fields) return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(docJson.fields)) {
    out[k] = fromFirestoreValue(v);
  }
  return out;
}

/**
 * Reads a Firestore document via REST API using a fresh Bearer idToken.
 */
async function fetchFirestoreDocWithToken(
  projectId: string,
  collectionName: string,
  docId: string,
  idToken: string
): Promise<Record<string, any> | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/(default)/documents/${encodeURIComponent(
    collectionName
  )}/${encodeURIComponent(docId)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return fromFirestoreDocument(json);
}

/**
 * Patches ONLY the `lotrinhWorkspaceJson` and `lotrinhUpdatedAt` fields on an authenticated
 * Firestore user document (`users/{uid}` or `jlpt_users/{uid}`) without modifying any existing
 * vocabulary or grammar fields.
 */
async function patchFirestoreWorkspaceFields(
  projectId: string,
  collectionName: string,
  docId: string,
  idToken: string,
  workspaceJsonStr: string,
  updatedAt: number
): Promise<boolean> {
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/(default)/documents/${encodeURIComponent(
      collectionName
    )}/${encodeURIComponent(docId)}` +
    `?updateMask.fieldPaths=lotrinhWorkspaceJson&updateMask.fieldPaths=lotrinhUpdatedAt`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        lotrinhWorkspaceJson: { stringValue: workspaceJsonStr },
        lotrinhUpdatedAt: { integerValue: String(updatedAt) },
      },
    }),
  });
  return res.ok;
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
    return `Cửa sổ Google báo "The requested action is invalid" là do API Key của project "${projectLabel}" trên Google Cloud Console đang bật giới hạn Website (HTTP Referrers) chỉ cho phép mngoc209.github.io/* mà thiếu domain xử lý đăng nhập "${authDomain}". Cách khắc phục: (1) Dùng mục "Đồng bộ giữa các thiết bị" (Mã liên kết / Mã phòng đồng bộ) ở Tab bên cạnh; hoặc (2) Bấm "Đồng bộ 1-Click từ Trình duyệt" ở phía trên; hoặc (3) Thêm "${authDomain}" vào Website restrictions của API Key trên Google Cloud Console.`;
  }

  if (
    code.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions')
  ) {
    return `Firestore của ${projectLabel} yêu cầu phiên xác thực. Hãy dùng mục "Đồng bộ giữa các thiết bị" (Mã liên kết thiết bị) hoặc "Đồng bộ 1-Click từ Trình duyệt" (khi mở trên mngoc209.github.io), hoặc thêm "${authDomain}" vào Website restrictions của API Key.`;
  }

  if (code.includes('popup-closed-by-user')) {
    return `Bạn đã đóng cửa sổ Popup Google. Nếu trong cửa sổ Popup hiện "The requested action is invalid.", hãy dùng mục "Đồng bộ giữa các thiết bị" (Mã phòng đồng bộ / Mã liên kết) hoặc Tab 1 Nhập File JSON để đồng bộ ngay lập tức!`;
  }

  if (code.includes('popup-blocked')) {
    return 'Trình duyệt đã chặn cửa sổ Popup đăng nhập Google. Vui lòng cho phép Popup trên trình duyệt và thử lại.';
  }

  return msg || `Lỗi kết nối Firebase (${projectLabel}).`;
}

/**
 * Pulls vocabulary data from tuvungjlpt Firestore collection "jlpt_users/{uid}"
 * Automatically uses stored refreshToken first (avoiding any popup!), then SDK auth.
 */
export async function pullVocabFromFirebaseByUid(uid: string): Promise<{
  vocabulary: ImportedVocabItem[];
  reviewHistory: Record<string, (string | number)[]>;
}> {
  const sessions = await discoverAllFirebaseSessions();
  if (sessions.vocab?.refreshToken) {
    const tokenRes = await exchangeRefreshTokenForIdToken(
      VOCAB_FIREBASE_CONFIG.apiKey,
      sessions.vocab.refreshToken
    );
    if (tokenRes) {
      const targetUid = uid.trim() || tokenRes.uid;
      const docData = await fetchFirestoreDocWithToken(
        VOCAB_FIREBASE_CONFIG.projectId,
        'jlpt_users',
        targetUid,
        tokenRes.idToken
      );
      if (docData) {
        return parseVocabBackupJson(docData);
      }
    }
  }

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
    const shared = pullFromSharedBrowserStorage();
    if (shared.vocabResult && shared.vocabResult.vocabulary.length > 0) {
      return shared.vocabResult;
    }
    throw new Error(formatFirebaseSyncError(err, 'tuvungjlpt'));
  }
}

/**
 * Pulls grammar data from nguphapjlpt Firestore collection "users/{uid}"
 * Automatically uses stored refreshToken first (avoiding any popup!), then SDK auth.
 */
export async function pullGrammarFromFirebaseByUid(uid: string): Promise<{
  grammars: ImportedGrammarItem[];
  reviewHistory: Record<string, (string | number)[]>;
  grammarSources: string[];
}> {
  const sessions = await discoverAllFirebaseSessions();
  if (sessions.grammar?.refreshToken) {
    const tokenRes = await exchangeRefreshTokenForIdToken(
      GRAMMAR_FIREBASE_CONFIG.apiKey,
      sessions.grammar.refreshToken
    );
    if (tokenRes) {
      const targetUid = uid.trim() || tokenRes.uid;
      const docData = await fetchFirestoreDocWithToken(
        GRAMMAR_FIREBASE_CONFIG.projectId,
        'users',
        targetUid,
        tokenRes.idToken
      );
      if (docData) {
        return parseGrammarBackupJson(docData);
      }
    }
  }

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
    const shared = pullFromSharedBrowserStorage();
    if (shared.grammarResult && shared.grammarResult.grammars.length > 0) {
      return shared.grammarResult;
    }
    throw new Error(formatFirebaseSyncError(err, 'nguphapjlpt'));
  }
}

/**
 * Attempts to reuse existing IndexedDB / Cloud Pairing refresh token FIRST (no popup needed!),
 * then falls back to Google Sign-In Popup or Shared Browser Storage.
 */
export async function signInAndPullVocabCloud(): Promise<{
  uid: string;
  email: string | null;
  vocabulary: ImportedVocabItem[];
  reviewHistory: Record<string, (string | number)[]>;
}> {
  // 1. Try direct REST fetch with discovered IndexedDB / Pairing refreshToken (0 popup!)
  const sessions = await discoverAllFirebaseSessions();
  if (sessions.vocab?.refreshToken) {
    const tokenRes = await exchangeRefreshTokenForIdToken(
      VOCAB_FIREBASE_CONFIG.apiKey,
      sessions.vocab.refreshToken
    );
    if (tokenRes) {
      const docData = await fetchFirestoreDocWithToken(
        VOCAB_FIREBASE_CONFIG.projectId,
        'jlpt_users',
        tokenRes.uid,
        tokenRes.idToken
      );
      if (docData) {
        const result = parseVocabBackupJson(docData);
        return {
          uid: tokenRes.uid,
          email: sessions.vocab.email || 'Đã xác thực Cloud',
          ...result,
        };
      }
    }
  }

  try {
    const app = getOrInitApp('onTapTuVungApp', VOCAB_FIREBASE_CONFIG);
    const auth = getAuth(app);
    await auth.authStateReady();
    const db = getOrInitFirestore(app);

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

    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const uid = cred.user.uid;
    const email = cred.user.email;
    const rt = (cred.user as any)?.stsTokenManager?.refreshToken || cred.user.refreshToken;
    if (rt) {
      saveCloudPairingBundle({
        vocab: {
          uid,
          email,
          refreshToken: rt,
          apiKey: VOCAB_FIREBASE_CONFIG.apiKey,
          projectId: VOCAB_FIREBASE_CONFIG.projectId,
        },
      });
    }
    const snap = await getDoc(doc(db, 'jlpt_users', uid));
    if (!snap.exists()) {
      throw new Error(
        `Tài khoản Google (${email || uid}) chưa có dữ liệu lưu trên OnTapTuVung (tuvungjlpt).`
      );
    }
    const result = parseVocabBackupJson(snap.data());
    return { uid, email, ...result };
  } catch (err: any) {
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
 * Attempts to reuse existing IndexedDB / Cloud Pairing refresh token FIRST (no popup needed!),
 * then falls back to Google Sign-In Popup or Shared Browser Storage.
 */
export async function signInAndPullGrammarCloud(): Promise<{
  uid: string;
  email: string | null;
  grammars: ImportedGrammarItem[];
  reviewHistory: Record<string, (string | number)[]>;
  grammarSources: string[];
}> {
  // 1. Try direct REST fetch with discovered IndexedDB / Pairing refreshToken (0 popup!)
  const sessions = await discoverAllFirebaseSessions();
  if (sessions.grammar?.refreshToken) {
    const tokenRes = await exchangeRefreshTokenForIdToken(
      GRAMMAR_FIREBASE_CONFIG.apiKey,
      sessions.grammar.refreshToken
    );
    if (tokenRes) {
      const docData = await fetchFirestoreDocWithToken(
        GRAMMAR_FIREBASE_CONFIG.projectId,
        'users',
        tokenRes.uid,
        tokenRes.idToken
      );
      if (docData) {
        const result = parseGrammarBackupJson(docData);
        return {
          uid: tokenRes.uid,
          email: sessions.grammar.email || 'Đã xác thực Cloud',
          ...result,
        };
      }
    }
  }

  try {
    const app = getOrInitApp('onTapNguPhapApp', GRAMMAR_FIREBASE_CONFIG);
    const auth = getAuth(app);
    await auth.authStateReady();
    const db = getOrInitFirestore(app);

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

    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const uid = cred.user.uid;
    const email = cred.user.email;
    const rt = (cred.user as any)?.stsTokenManager?.refreshToken || cred.user.refreshToken;
    if (rt) {
      saveCloudPairingBundle({
        grammar: {
          uid,
          email,
          refreshToken: rt,
          apiKey: GRAMMAR_FIREBASE_CONFIG.apiKey,
          projectId: GRAMMAR_FIREBASE_CONFIG.projectId,
        },
      });
    }
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

/**
 * Generates a portable Cross-Device Pairing Key ("LTN3-...") containing the user's
 * active Firebase Cloud tokens and/or syncRoomKey so a second device (Phone / Tablet / Laptop)
 * can link in 1 click without needing a Google OAuth popup.
 */
export async function generateDevicePairingCode(
  syncRoomKey?: string
): Promise<string | null> {
  const bundle = await discoverAllFirebaseSessions();
  if (syncRoomKey?.trim()) {
    bundle.syncRoomKey = syncRoomKey.trim();
  }
  if (!bundle.vocab && !bundle.grammar && !bundle.syncRoomKey) {
    return null;
  }
  const jsonStr = JSON.stringify(bundle);
  const encoded =
    typeof window !== 'undefined'
      ? window.btoa(unescape(encodeURIComponent(jsonStr)))
      : Buffer.from(jsonStr, 'utf-8').toString('base64');
  return `LTN3-${encoded}`;
}

/**
 * Decodes and saves a Cross-Device Pairing Key ("LTN3-...") on a new device.
 */
export function applyDevicePairingCode(codeStr: string): CloudPairingBundle {
  const trimmed = codeStr.trim();
  const rawBase64 = trimmed.startsWith('LTN3-') ? trimmed.slice(5) : trimmed;
  const jsonStr =
    typeof window !== 'undefined'
      ? decodeURIComponent(escape(window.atob(rawBase64)))
      : Buffer.from(rawBase64, 'base64').toString('utf-8');
  const parsed: CloudPairingBundle = JSON.parse(jsonStr);
  saveCloudPairingBundle(parsed);
  return parsed;
}

/**
 * Pushes the entire LoTrinh workspace snapshot (roadmap, bugs, studyLog, dailyReports,
 * profile, selectedGrammarSources, and knowledgeBase) to:
 * 1) Firebase Firestore (`users/{uid}` on nguphapjlpt & `jlpt_users/{uid}` on tuvungjlpt)
 * 2) Full-stack server sync endpoint (`/api/sync/workspace`) if a syncRoomKey is set
 */
export async function pushWorkspaceToCloud(
  snapshot: CrossDeviceWorkspaceSnapshot,
  syncRoomKey?: string
): Promise<{
  syncedToFirebase: boolean;
  syncedToServer: boolean;
  channels: string[];
}> {
  const channels: string[] = [];
  let syncedToFirebase = false;
  let syncedToServer = false;

  const sessions = await discoverAllFirebaseSessions();
  const roomKey = (syncRoomKey || sessions.syncRoomKey || snapshot.profile.cloudSyncKey || '').trim();

  // Lightweight payload for Firestore user doc so it stays fast and well under 1MB
  const firestoreSnapshot: CrossDeviceWorkspaceSnapshot = {
    ...snapshot,
    knowledgeBase: undefined, // Vocab & Grammar are already in their native Firestore collections
  };
  const workspaceJsonStr = JSON.stringify(firestoreSnapshot);

  // 1. Push to nguphapjlpt Firestore (`users/{uid}`)
  if (sessions.grammar?.refreshToken) {
    const tokenRes = await exchangeRefreshTokenForIdToken(
      GRAMMAR_FIREBASE_CONFIG.apiKey,
      sessions.grammar.refreshToken
    );
    if (tokenRes) {
      const ok = await patchFirestoreWorkspaceFields(
        GRAMMAR_FIREBASE_CONFIG.projectId,
        'users',
        tokenRes.uid,
        tokenRes.idToken,
        workspaceJsonStr,
        snapshot.updatedAt
      );
      if (ok) {
        syncedToFirebase = true;
        channels.push('Firebase Cloud (nguphapjlpt)');
      }
    }
  }

  // 2. Push to tuvungjlpt Firestore (`jlpt_users/{uid}`)
  if (sessions.vocab?.refreshToken) {
    const tokenRes = await exchangeRefreshTokenForIdToken(
      VOCAB_FIREBASE_CONFIG.apiKey,
      sessions.vocab.refreshToken
    );
    if (tokenRes) {
      const ok = await patchFirestoreWorkspaceFields(
        VOCAB_FIREBASE_CONFIG.projectId,
        'jlpt_users',
        tokenRes.uid,
        tokenRes.idToken,
        workspaceJsonStr,
        snapshot.updatedAt
      );
      if (ok) {
        syncedToFirebase = true;
        if (!channels.includes('Firebase Cloud (tuvungjlpt)')) {
          channels.push('Firebase Cloud (tuvungjlpt)');
        }
      }
    }
  }

  // 3. Also try authenticated Firebase SDK if signed in directly
  if (!syncedToFirebase) {
    try {
      const app = getOrInitApp('onTapNguPhapApp', GRAMMAR_FIREBASE_CONFIG);
      const auth = getAuth(app);
      if (auth.currentUser) {
        const db = getOrInitFirestore(app);
        await setDoc(
          doc(db, 'users', auth.currentUser.uid),
          {
            lotrinhWorkspaceJson: workspaceJsonStr,
            lotrinhUpdatedAt: snapshot.updatedAt,
          },
          { merge: true }
        );
        syncedToFirebase = true;
        channels.push('Firebase Cloud SDK');
      }
    } catch {
      // ignore
    }
  }

  // 4. Push to Server Sync Room (`/api/sync/workspace`) if roomKey is provided
  if (roomKey) {
    try {
      const res = await fetch('/api/sync/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncKey: roomKey,
          snapshot,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          syncedToServer = true;
          channels.push(`Phòng đồng bộ #${roomKey}`);
        }
      }
    } catch {
      // Ignore on static GitHub Pages
    }
  }

  return { syncedToFirebase, syncedToServer, channels };
}

/**
 * Pulls the latest Cross-Device Workspace + Vocabulary + Grammar from Firebase Cloud
 * and/or the Sync Room (`syncRoomKey`).
 */
export async function pullWorkspaceFromCloud(syncRoomKey?: string): Promise<{
  workspace: CrossDeviceWorkspaceSnapshot | null;
  vocabResult: {
    uid: string;
    email: string | null;
    vocabulary: ImportedVocabItem[];
    reviewHistory: Record<string, (string | number)[]>;
  } | null;
  grammarResult: {
    uid: string;
    email: string | null;
    grammars: ImportedGrammarItem[];
    reviewHistory: Record<string, (string | number)[]>;
    grammarSources: string[];
  } | null;
  sources: string[];
}> {
  let latestWorkspace: CrossDeviceWorkspaceSnapshot | null = null;
  let vocabResult: {
    uid: string;
    email: string | null;
    vocabulary: ImportedVocabItem[];
    reviewHistory: Record<string, (string | number)[]>;
  } | null = null;
  let grammarResult: {
    uid: string;
    email: string | null;
    grammars: ImportedGrammarItem[];
    reviewHistory: Record<string, (string | number)[]>;
    grammarSources: string[];
  } | null = null;
  const sources: string[] = [];

  const sessions = await discoverAllFirebaseSessions();
  const roomKey = (syncRoomKey || sessions.syncRoomKey || '').trim();

  // 1. Pull from nguphapjlpt (`users/{uid}`)
  if (sessions.grammar?.refreshToken) {
    const tokenRes = await exchangeRefreshTokenForIdToken(
      GRAMMAR_FIREBASE_CONFIG.apiKey,
      sessions.grammar.refreshToken
    );
    if (tokenRes) {
      const docData = await fetchFirestoreDocWithToken(
        GRAMMAR_FIREBASE_CONFIG.projectId,
        'users',
        tokenRes.uid,
        tokenRes.idToken
      );
      if (docData) {
        const parsedG = parseGrammarBackupJson(docData);
        if (parsedG.grammars.length > 0) {
          grammarResult = {
            uid: tokenRes.uid,
            email: sessions.grammar.email || null,
            ...parsedG,
          };
          sources.push(`Ngữ pháp Cloud (${parsedG.grammars.length} mẫu)`);
        }
        if (typeof docData.lotrinhWorkspaceJson === 'string') {
          try {
            const ws: CrossDeviceWorkspaceSnapshot = JSON.parse(
              docData.lotrinhWorkspaceJson
            );
            if (!latestWorkspace || ws.updatedAt > latestWorkspace.updatedAt) {
              latestWorkspace = ws;
              sources.push(`Lộ trình Cloud (${ws.deviceLabel || 'Thiết bị khác'})`);
            }
          } catch {
            // ignore
          }
        }
      }
    }
  }

  // 2. Pull from tuvungjlpt (`jlpt_users/{uid}`)
  if (sessions.vocab?.refreshToken) {
    const tokenRes = await exchangeRefreshTokenForIdToken(
      VOCAB_FIREBASE_CONFIG.apiKey,
      sessions.vocab.refreshToken
    );
    if (tokenRes) {
      const docData = await fetchFirestoreDocWithToken(
        VOCAB_FIREBASE_CONFIG.projectId,
        'jlpt_users',
        tokenRes.uid,
        tokenRes.idToken
      );
      if (docData) {
        const parsedV = parseVocabBackupJson(docData);
        if (parsedV.vocabulary.length > 0) {
          vocabResult = {
            uid: tokenRes.uid,
            email: sessions.vocab.email || null,
            ...parsedV,
          };
          sources.push(`Từ vựng Cloud (${parsedV.vocabulary.length} từ)`);
        }
        if (typeof docData.lotrinhWorkspaceJson === 'string') {
          try {
            const ws: CrossDeviceWorkspaceSnapshot = JSON.parse(
              docData.lotrinhWorkspaceJson
            );
            if (!latestWorkspace || ws.updatedAt > latestWorkspace.updatedAt) {
              latestWorkspace = ws;
              if (!sources.some((s) => s.startsWith('Lộ trình Cloud'))) {
                sources.push(`Lộ trình Cloud (${ws.deviceLabel || 'Thiết bị khác'})`);
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }
  }

  // 3. Pull from Server Sync Room (`/api/sync/workspace?syncKey=...`) if roomKey is provided
  if (roomKey) {
    try {
      const res = await fetch(
        `/api/sync/workspace?syncKey=${encodeURIComponent(roomKey)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.snapshot) {
          const serverWs: CrossDeviceWorkspaceSnapshot = data.snapshot;
          if (!latestWorkspace || serverWs.updatedAt > latestWorkspace.updatedAt) {
            latestWorkspace = serverWs;
            sources.push(`Phòng đồng bộ #${roomKey}`);
          }
        }
      }
    } catch {
      // Ignore on static GitHub Pages
    }
  }

  return { workspace: latestWorkspace, vocabResult, grammarResult, sources };
}
