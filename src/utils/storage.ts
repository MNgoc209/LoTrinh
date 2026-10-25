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
import { buildStructuredDailyTasks } from './jlptMondaiTaxonomy';

const STORAGE_KEYS = {
  PROFILE: 'jlpt_n3_profile',
  ROADMAP: 'jlpt_n3_roadmap_v3_mondai',
  BUGS: 'jlpt_n3_bugs',
  KNOWLEDGE_BASE: 'jlpt_n3_knowledge_base_v1',
  STUDY_LOG: 'jlpt_n3_daily_study_log_v1',
  DAILY_REPORTS: 'jlpt_n3_daily_reports_v1',
};

export const DEFAULT_EXAM_DATE = '2026-12-06';

export const DEFAULT_PROFILE: UserProfile = {
  examDate: DEFAULT_EXAM_DATE,
  confidence: {
    kanji: 4,
    vocabulary: 4,
    grammarMondai1_2: 3,
    grammarMondai3_4_5: 2,
    readingShort: 3,
    readingMediumLong: 2,
    listening: 2,
    notes: 'Kanji vững, Yếu Mondai 2 (Dấu sao ★ ngữ pháp), Đọc hiểu Trung/Trường văn và Nghe hội thoại Mondai 1-2',
  },
  streakDays: 4,
  lastActiveDate: new Date().toISOString().split('T')[0],
  todayStudyMinutes: 35,
  studyIntensity: 'intensive',
};

const now = Date.now();
const hourMs = 3600000;
const dayMs = 86400000;

export const INITIAL_SEED_VOCABULARY: ImportedVocabItem[] = [
  {
    id: 'v_101',
    word: '我慢',
    reading: 'がまん',
    meaning: 'Kiên nhẫn, chịu đựng, nhẫn nại',
    level: 1,
    learned: true,
    nextReview: now - 2 * hourMs,
  },
  {
    id: 'v_102',
    word: '確認',
    reading: 'かくにん',
    meaning: 'Xác nhận, kiểm tra kỹ',
    level: 2,
    learned: true,
    nextReview: now - hourMs,
  },
  {
    id: 'v_103',
    word: '変更',
    reading: 'へんこう',
    meaning: 'Thay đổi, điều chỉnh (lịch trình, kế hoạch)',
    level: 2,
    learned: true,
    nextReview: now + 4 * hourMs,
  },
  {
    id: 'v_104',
    word: 'のんびり',
    reading: 'のんびり',
    meaning: 'Thong thả, thư thái, thảnh thơi',
    level: 1,
    learned: true,
    nextReview: now - 3 * hourMs,
  },
  {
    id: 'v_105',
    word: 'めったに',
    reading: 'めったに',
    meaning: 'Hiếm khi (+ thể phủ định 〜ない)',
    level: 2,
    learned: true,
    nextReview: now - hourMs,
  },
  {
    id: 'v_106',
    word: '効率',
    reading: 'こうりつ',
    meaning: 'Hiệu suất, năng suất làm việc',
    level: 3,
    learned: true,
    nextReview: now - 30 * 60000,
  },
  {
    id: 'v_107',
    word: '説得',
    reading: 'せっとく',
    meaning: 'Thuyết phục người khác',
    level: 3,
    learned: true,
    nextReview: now + dayMs,
  },
  {
    id: 'v_108',
    word: '影響',
    reading: 'えいきょう',
    meaning: 'Ảnh hưởng, tác động',
    level: 5,
    learned: true,
    nextReview: now + 3 * dayMs,
  },
  {
    id: 'v_109',
    word: '節約',
    reading: 'せつやく',
    meaning: 'Tiết kiệm (tiền bạc, điện nước, thời gian)',
    level: 6,
    learned: true,
    nextReview: now + 5 * dayMs,
  },
  {
    id: 'v_110',
    word: '提出',
    reading: 'ていしゅつ',
    meaning: 'Nộp (báo cáo, tài liệu, bài tập)',
    level: 7,
    learned: true,
    nextReview: now + 7 * dayMs,
  },
];

export const INITIAL_SEED_GRAMMARS: ImportedGrammarItem[] = [
  {
    id: 'g_201',
    name: '〜にもかかわらず',
    structure: 'V / A / N + にもかかわらず',
    meaning: 'Mặc dù... thế nhưng vẫn... (mang sắc thái bất ngờ, cảm kích)',
    example: '雨が降っているにもかかわらず、多くの人が集まった。',
    similarText: 'Phân biệt với 〜のに (mang tính phàn nàn cá nhân nhiều hơn, văn nói).',
    level: 1,
    nextReviewDate: now - 2 * hourMs,
    groupName: 'Nghịch đảo / Nhượng bộ',
    sourceName: 'Shinkanzen N3',
  },
  {
    id: 'g_202',
    name: '〜うちに',
    structure: 'Vる / Vている / Vない / A-い / Nの + うちに',
    meaning: 'Nhân lúc còn... / Trong khi đang... (trước khi trạng thái thay đổi)',
    example: '温かいうちに食べてください。',
    similarText: 'Phân biệt với 〜あいだに (chỉ mốc thời gian khách quan).',
    level: 2,
    nextReviewDate: now - hourMs,
    groupName: 'Thời gian',
    sourceName: 'Mimikara Oboeru N3',
  },
  {
    id: 'g_203',
    name: '〜だけでなく〜も',
    structure: 'V / A / N + だけでなく、〜も',
    meaning: 'Không những... mà còn...',
    example: '彼女は英語だけでなく、フランス語も話せる。',
    similarText: 'Tương đương với 〜ばかりでなく.',
    level: 2,
    nextReviewDate: now - 30 * 60000,
    groupName: 'Bổ sung',
    sourceName: 'Shinkanzen N3',
  },
  {
    id: 'g_204',
    name: 'まるで〜かのように',
    structure: 'まるで + V / N + かのように / かのようだ',
    meaning: 'Cứ như thể là... (so sánh ví von điều không có thật)',
    example: '彼はまるで何も知らなかったかのように振る舞っている。',
    similarText: 'Đi kèm phó từ まるで ở đầu vế.',
    level: 1,
    nextReviewDate: now - 4 * hourMs,
    groupName: 'Giả định / Ví von',
    sourceName: 'Shinkanzen N3',
  },
  {
    id: 'g_205',
    name: '〜ようにする',
    structure: 'Vる / Vない + ようにする',
    meaning: 'Cố gắng duy trì thói quen làm (hoặc không làm) việc gì đó',
    example: '健康のために、毎日野菜を食べるようにしている。',
    similarText: 'Phân biệt với 〜ようになる (sự thay đổi trạng thái/năng lực).',
    level: 3,
    nextReviewDate: now + dayMs,
    groupName: 'Ý chí / Thói quen',
    sourceName: 'Soumatome N3',
  },
  {
    id: 'g_206',
    name: '〜おかげで',
    structure: 'V / A / Nの + おかげで',
    meaning: 'Nhờ vào... (mà có kết quả tốt đẹp)',
    example: '先生のおかげで、N3に合格できました。',
    similarText: 'Trái nghĩa với 〜せいで (đổ lỗi kết quả xấu).',
    level: 6,
    nextReviewDate: now + 5 * dayMs,
    groupName: 'Nguyên nhân',
    sourceName: 'Soumatome N3',
  },
];

export const INITIAL_KNOWLEDGE_BASE: KnowledgeBaseData = {
  vocabulary: INITIAL_SEED_VOCABULARY,
  grammars: INITIAL_SEED_GRAMMARS,
  vocabReviewHistory: {
    [new Date().toISOString().split('T')[0]]: ['v_101', 'v_102', 'v_104'],
  },
  grammarReviewHistory: {
    [new Date().toISOString().split('T')[0]]: ['g_201', 'g_202', 'g_204'],
  },
  lastSyncedVocabAt: now - 3600000,
  lastSyncedGrammarAt: now - 3600000,
  syncSourceVocab: 'Dữ liệu mẫu OnTapTuVung (10 từ)',
  syncSourceGrammar: 'Dữ liệu mẫu OnTapNguPhap (6 cấu trúc)',
};

export const INITIAL_SEED_BUGS: BugRecord[] = [
  {
    id: 'bug_1',
    questionText: '山田さんは、忙しい＿＿＿、私の引越しを手伝ってくれた。',
    category: 'grammar',
    subCategory: 'Ngữ pháp · Mondai 1 — Chọn cấu trúc ngữ pháp câu đơn',
    options: ['にもかかわらず', 'によって', 'につれて', 'をはじめ'],
    userAnswerIndex: 2,
    correctAnswerIndex: 0,
    explanation:
      'Cấu trúc 「〜にもかかわらず」: Mặc dù... thế nhưng (thể hiện sự ngạc nhiên, cảm kích). 山田さんは、忙しいにもかかわらず... = Anh Yamada bận rộn là thế, vậy mà vẫn giúp tôi chuyển nhà.',
    timestamp: now - dayMs * 2,
    nextReviewDate: now - hourMs,
    reviewIntervalDays: 1,
    reviewCount: 0,
    resolved: false,
  },
  {
    id: 'bug_2',
    questionText: '最近のスマートフォンは機能が多すぎて、＿＿＿使いこなせない。',
    category: 'vocabulary',
    subCategory: 'Từ vựng · Mondai 3 — Điền từ vào chỗ trống theo ngữ cảnh (文脈規定)',
    options: ['とても', 'めったに', 'まるで', 'ぜひ'],
    userAnswerIndex: 1,
    correctAnswerIndex: 0,
    explanation:
      'Đi với thể phủ định 「〜ない」, phó từ 「とても〜ない」 nghĩa là "hoàn toàn không thể / khó lòng mà...".',
    timestamp: now - dayMs,
    nextReviewDate: now - 2 * hourMs,
    reviewIntervalDays: 1,
    reviewCount: 0,
    resolved: false,
  },
  {
    id: 'bug_3',
    questionText: 'あの先生は厳しい ＿＿＿ ★ ＿＿＿ ＿＿＿ 人気が高い。',
    category: 'grammar',
    subCategory: 'Ngữ pháp · Mondai 2 — Sắp xếp câu dấu sao ★ (文の組み立て)',
    options: ['教え方が', 'けれど', '親切なので', 'とても'],
    userAnswerIndex: 3,
    correctAnswerIndex: 0,
    explanation:
      'Câu hoàn chỉnh: 「あの先生は厳しい 【けれど】 ★【教え方が】 【とても】 【親切なので】 人気が高い。」(Thầy giáo đó nghiêm khắc nhưng cách dạy rất tận tình nên rất được mến mộ). Vị trí ngôi sao là 「教え方が」.',
    timestamp: now - dayMs * 3,
    nextReviewDate: now - 1000,
    reviewIntervalDays: 1,
    reviewCount: 1,
    resolved: false,
  },
];

const initialTasks = buildStructuredDailyTasks({
  pendingBugsCount: 3,
  priorityVocab: INITIAL_SEED_VOCABULARY,
  priorityGrammar: INITIAL_SEED_GRAMMARS,
});

export const INITIAL_SEED_ROADMAP: DailyRoadmap = {
  date: new Date().toISOString().split('T')[0],
  daysRemaining: calculateDaysRemaining(DEFAULT_EXAM_DATE),
  focusMessage:
    'Lộ trình được chia rõ theo 4 Mục (Từ vựng 5 Mondai · Ngữ pháp 3 Mondai · Đọc hiểu 4 Mondai · Nghe hiểu 5 Mondai) lồng ghép trực tiếp nhóm Lv1–Lv3 từ OnTapTuVung & OnTapNguPhap.',
  targetScoreGoal: 'Hoàn thành đầy đủ các Mondai trọng tâm của 4 kỹ năng & Tổng kết báo cáo tiến độ lúc 19:00',
  totalEstimatedMinutes: initialTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0),
  tasks: initialTasks,
  tipsForToday: [
    'Mỗi nhiệm vụ và bài ôn thêm đều ghi rõ thuộc Kỹ năng nào và Mondai số mấy trong đề thi thật để bạn biết chính xác mình đang rèn dạng câu hỏi nào.',
    'Vào lúc 19:00 tối nay, hệ thống sẽ tự động tổng hợp Báo cáo Tiến độ (Điểm mạnh, Tiến bộ, Điểm yếu & Bài ôn thêm) để lên lộ trình thích ứng cho ngày mai.',
  ],
};

export function createEmptyStudyLog(dateStr = new Date().toISOString().split('T')[0]): DailyStudyLog {
  return {
    date: dateStr,
    studyMinutes: 35,
    completedTaskCount: 0,
    totalTaskCount: initialTasks.length,
    skillStats: {
      vocabulary: { attempted: 4, correct: 3 },
      grammar: { attempted: 5, correct: 3 },
      reading: { attempted: 3, correct: 2 },
      listening: { attempted: 3, correct: 1 },
      review: { attempted: 2, correct: 2 },
    },
    bonusSessions: [],
    improvedItems: ['確認 (Lv1→Lv2)', '〜うちに (Lv1→Lv2)'],
    weakItems: ['〜にもかかわらず (Lv1)', '我慢 (Lv1)'],
  };
}

export function loadUserProfile(): UserProfile {
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
  try {
    const data = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASE);
    if (data) return JSON.parse(data);
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
