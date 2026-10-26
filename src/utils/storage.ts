import {
  DailyRoadmap,
  UserProfile,
  BugRecord,
  KnowledgeBaseData,
  ImportedVocabItem,
  ImportedGrammarItem,
  DailyStudyLog,
  DailyProgressReport,
} from '../types';
import { calculateDaysRemaining } from './studyLogic';

const LEGACY_KEYS_TO_PURGE = [
  'jlpt_n3_profile',
  'jlpt_n3_roadmap',
  'jlpt_n3_roadmap_v2',
  'jlpt_n3_roadmap_v3_mondai',
  'jlpt_n3_bugs',
  'jlpt_n3_bugs_v2',
  'jlpt_n3_knowledge_base',
  'jlpt_n3_knowledge_base_v2',
  'jlpt_n3_daily_study_log_v1',
  'jlpt_n3_daily_reports_v1',
];

const STORAGE_KEYS = {
  PROFILE: 'jlpt_n3_profile_v4_clean',
  ROADMAP: 'jlpt_n3_roadmap_v4_clean',
  BUGS: 'jlpt_n3_bugs_v4_clean',
  KNOWLEDGE_BASE: 'jlpt_n3_knowledge_base_v4_clean',
  STUDY_LOG: 'jlpt_n3_daily_study_log_v4_clean',
  DAILY_REPORTS: 'jlpt_n3_daily_reports_v4_clean',
  LEGACY_PURGED_FLAG: 'jlpt_n3_legacy_samples_purged_v4',
};

function purgeLegacySampleStorageOnce(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (!localStorage.getItem(STORAGE_KEYS.LEGACY_PURGED_FLAG)) {
      for (const oldKey of LEGACY_KEYS_TO_PURGE) {
        localStorage.removeItem(oldKey);
      }
      localStorage.setItem(STORAGE_KEYS.LEGACY_PURGED_FLAG, 'true');
    }
  } catch {
    // Ignore storage errors
  }
}

purgeLegacySampleStorageOnce();

export const DEFAULT_EXAM_DATE = '2026-12-06';

export const DEFAULT_PROFILE: UserProfile = {
  examDate: DEFAULT_EXAM_DATE,
  confidence: {
    kanji: 3,
    vocabulary: 3,
    grammarMondai1_2: 3,
    grammarMondai3_4_5: 3,
    readingShort: 3,
    readingMediumLong: 3,
    listening: 3,
    notes: '',
  },
  streakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  todayStudyMinutes: 0,
  studyIntensity: 'intensive',
};

export const INITIAL_SEED_VOCABULARY: ImportedVocabItem[] = [];

export const INITIAL_SEED_GRAMMARS: ImportedGrammarItem[] = [];

export const INITIAL_KNOWLEDGE_BASE: KnowledgeBaseData = {
  vocabulary: [],
  grammars: [],
  vocabReviewHistory: {},
  grammarReviewHistory: {},
  grammarSources: [],
  selectedGrammarSources: [],
};

export const INITIAL_SEED_BUGS: BugRecord[] = [];

export const INITIAL_SEED_ROADMAP: DailyRoadmap = {
  date: new Date().toISOString().split('T')[0],
  daysRemaining: calculateDaysRemaining(DEFAULT_EXAM_DATE),
  focusMessage:
    'Chưa có dữ liệu từ vựng hoặc ngữ pháp. Hãy bấm "Đồng bộ dữ liệu" để nạp file Backup JSON hoặc kết nối Cloud Firebase từ OnTapTuVung & OnTapNguPhap để tạo lộ trình học.',
  targetScoreGoal: 'Đồng bộ dữ liệu cá nhân từ OnTapTuVung & OnTapNguPhap để bắt đầu',
  totalEstimatedMinutes: 0,
  tasks: [],
  tipsForToday: [],
};

export function createEmptyStudyLog(
  dateStr = new Date().toISOString().split('T')[0]
): DailyStudyLog {
  return {
    date: dateStr,
    studyMinutes: 0,
    completedTaskCount: 0,
    totalTaskCount: 0,
    skillStats: {
      vocabulary: { attempted: 0, correct: 0 },
      grammar: { attempted: 0, correct: 0 },
      reading: { attempted: 0, correct: 0 },
      listening: { attempted: 0, correct: 0 },
      review: { attempted: 0, correct: 0 },
    },
    bonusSessions: [],
    improvedItems: [],
    weakItems: [],
  };
}

export function clearAllAppStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    for (const key of Object.values(STORAGE_KEYS)) {
      if (key !== STORAGE_KEYS.LEGACY_PURGED_FLAG) {
        localStorage.removeItem(key);
      }
    }
    for (const oldKey of LEGACY_KEYS_TO_PURGE) {
      localStorage.removeItem(oldKey);
    }
  } catch (err) {
    console.warn('Failed to clear storage', err);
  }
}

export function loadUserProfile(): UserProfile {
  purgeLegacySampleStorageOnce();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.warn('Failed to load user profile from storage', err);
  }
  return DEFAULT_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save profile', err);
  }
}

export function loadRoadmap(): DailyRoadmap {
  purgeLegacySampleStorageOnce();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ROADMAP);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.warn('Failed to load roadmap from storage', err);
  }
  return INITIAL_SEED_ROADMAP;
}

export function saveRoadmap(roadmap: DailyRoadmap): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROADMAP, JSON.stringify(roadmap));
  } catch (err) {
    console.warn('Failed to save roadmap', err);
  }
}

export function loadBugRecords(): BugRecord[] {
  purgeLegacySampleStorageOnce();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BUGS);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.warn('Failed to load bugs from storage', err);
  }
  return INITIAL_SEED_BUGS;
}

export function saveBugRecords(bugs: BugRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUGS, JSON.stringify(bugs));
  } catch (err) {
    console.warn('Failed to save bugs', err);
  }
}

export function loadKnowledgeBase(): KnowledgeBaseData {
  purgeLegacySampleStorageOnce();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASE);
    if (data) {
      const parsed: KnowledgeBaseData = JSON.parse(data);
      // Guard against any old sample data
      if (
        parsed.syncSourceVocab?.includes('Dữ liệu mẫu') ||
        parsed.syncSourceGrammar?.includes('Dữ liệu mẫu')
      ) {
        return INITIAL_KNOWLEDGE_BASE;
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load knowledge base from storage', err);
  }
  return INITIAL_KNOWLEDGE_BASE;
}

export function saveKnowledgeBase(kb: KnowledgeBaseData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(kb));
  } catch (err) {
    console.warn('Failed to save knowledge base', err);
  }
}

export function loadTodayStudyLog(): DailyStudyLog {
  purgeLegacySampleStorageOnce();
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDY_LOG);
    if (raw) {
      const parsed: DailyStudyLog = JSON.parse(raw);
      if (parsed.date === todayStr) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load study log', err);
  }
  return createEmptyStudyLog(todayStr);
}

export function saveTodayStudyLog(log: DailyStudyLog): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDY_LOG, JSON.stringify(log));
  } catch (err) {
    console.warn('Failed to save study log', err);
  }
}

export function loadDailyReports(): DailyProgressReport[] {
  purgeLegacySampleStorageOnce();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_REPORTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load daily reports', err);
  }
  return [];
}

export function saveDailyReports(reports: DailyProgressReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_REPORTS, JSON.stringify(reports));
  } catch (err) {
    console.warn('Failed to save daily reports', err);
  }
}

export function addBugRecord(
  newBug: Omit<
    BugRecord,
    'id' | 'timestamp' | 'nextReviewDate' | 'reviewIntervalDays' | 'reviewCount' | 'resolved'
  >
): BugRecord {
  const currentBugs = loadBugRecords();
  const existing = currentBugs.find((b) => b.questionText === newBug.questionText);
  if (existing) {
    existing.userAnswerIndex = newBug.userAnswerIndex;
    existing.reviewIntervalDays = 1;
    existing.nextReviewDate = Date.now() + 86400000;
    existing.resolved = false;
    saveBugRecords(currentBugs);
    return existing;
  }

  const createdBug: BugRecord = {
    ...newBug,
    id: `bug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    nextReviewDate: Date.now() + 86400000,
    reviewIntervalDays: 1,
    reviewCount: 0,
    resolved: false,
  };

  const updated = [createdBug, ...currentBugs];
  saveBugRecords(updated);
  return createdBug;
}
