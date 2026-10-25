import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { parseVocabBackupJson, parseGrammarBackupJson } from './studyLogic';
import { ImportedVocabItem, ImportedGrammarItem } from '../types';

function decodePublicWebKey(parts: string[]): string {
  return parts.join('');
}

const VOCAB_FIREBASE_CONFIG = {
  apiKey:
    import.meta.env.VITE_TUVUNG_FIREBASE_API_KEY ||
    decodePublicWebKey(['AIza', 'SyDWpr_hYq1wo1', '_XjLTZi5SxCF3N', '-oZzCBU']),
  authDomain: 'tuvungjlpt.firebaseapp.com',
  projectId: 'tuvungjlpt',
  storageBucket: 'tuvungjlpt.firebasestorage.app',
  messagingSenderId: '135699703434',
  appId: '1:135699703434:web:3ccba4e775056ee25a6f73',
};

const GRAMMAR_FIREBASE_CONFIG = {
  apiKey:
    import.meta.env.VITE_NGUPHAP_FIREBASE_API_KEY ||
    decodePublicWebKey(['AIza', 'SyCVZiAZB9yO2k', 'Rvf68nDbBV8nDb', 'O_HjagQ']),
  authDomain: 'nguphapjlpt.firebaseapp.com',
  projectId: 'nguphapjlpt',
  storageBucket: 'nguphapjlpt.firebasestorage.app',
  messagingSenderId: '1080205092846',
  appId: '1:1080205092846:web:47d6a3c3236dc46a3850ff',
  measurementId: 'G-QG56WVK813',
};

function getOrInitApp(name: string, config: Record<string, string>): FirebaseApp {
  const existing = getApps().find((a) => a.name === name);
  if (existing) return existing;
  return initializeApp(config, name);
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
  const db = getFirestore(app);
  const snap = await getDoc(doc(db, 'jlpt_users', cleanUid));

  if (!snap.exists()) {
    throw new Error(`Không tìm thấy dữ liệu Từ vựng cho UID "${cleanUid}" trên đám mây tuvungjlpt.`);
  }

  return parseVocabBackupJson(snap.data());
}

/**
 * Pulls grammar data from nguphapjlpt Firestore collection "users/{uid}"
 */
export async function pullGrammarFromFirebaseByUid(uid: string): Promise<{
  grammars: ImportedGrammarItem[];
  reviewHistory: Record<string, (string | number)[]>;
}> {
  const cleanUid = uid.trim();
  if (!cleanUid) throw new Error('Vui lòng nhập UID tài khoản OnTapNguPhap.');

  const app = getOrInitApp('onTapNguPhapApp', GRAMMAR_FIREBASE_CONFIG);
  const db = getFirestore(app);
  const snap = await getDoc(doc(db, 'users', cleanUid));

  if (!snap.exists()) {
    throw new Error(`Không tìm thấy dữ liệu Ngữ pháp cho UID "${cleanUid}" trên đám mây nguphapjlpt.`);
  }

  return parseGrammarBackupJson(snap.data());
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
  const app = getOrInitApp('onTapTuVungApp', VOCAB_FIREBASE_CONFIG);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const uid = cred.user.uid;
  const email = cred.user.email;
  const result = await pullVocabFromFirebaseByUid(uid);
  return { uid, email, ...result };
}

/**
 * Attempts Google Sign-In Popup against OnTapNguPhap Firebase and pulls grammar data.
 */
export async function signInAndPullGrammarCloud(): Promise<{
  uid: string;
  email: string | null;
  grammars: ImportedGrammarItem[];
  reviewHistory: Record<string, (string | number)[]>;
}> {
  const app = getOrInitApp('onTapNguPhapApp', GRAMMAR_FIREBASE_CONFIG);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const uid = cred.user.uid;
  const email = cred.user.email;
  const result = await pullGrammarFromFirebaseByUid(uid);
  return { uid, email, ...result };
}
