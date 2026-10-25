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

const STORAGE_KEYS = {
  PROFILE: 'jlpt_n3_profile',
  ROADMAP: 'jlpt_n3_roadmap_v2',
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
    notes: 'Kanji vững, Yếu Mondai 3-4-5 (sao ngữ pháp), Đọc hiểu trung văn và Nghe hội thoại',
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
    subCategory: 'Mondai 1 - Ngữ pháp',
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
    subCategory: 'Mondai 2 - Từ vựng',
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
    subCategory: 'Mondai 3 - Sắp xếp câu (Dấu sao ★)',
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

export const INITIAL_SEED_ROADMAP: DailyRoadmap = {
  date: new Date().toISOString().split('T')[0],
  daysRemaining: calculateDaysRemaining(DEFAULT_EXAM_DATE),
  focusMessage:
    'Lộ trình 7 chặng chuyên sâu hôm nay: Xử lý lỗi sai Bug Tracker, chuyển hóa 7 từ vựng & 5 ngữ pháp Lv1–Lv3 từ OnTapTuVung / OnTapNguPhap thành Đọc hiểu, Mondai 3 ★, Mondai 4 và Hội thoại Nghe hiểu phân vai.',
  targetScoreGoal: 'Hoàn thành 7 nhiệm vụ trọng tâm (145 phút) & Tổng kết báo cáo tiến độ lúc 19:00',
  totalEstimatedMinutes: 145,
  tasks: [
    {
      id: 'task_1_bug_review',
      title: 'Chặng 1: Khởi động Spaced Repetition — Xử lý 3 câu sai đến hạn trong Bug Tracker',
      category: 'review',
      categoryLabel: 'Khắc phục lỗi sai',
      quizFormat: 'bug_review',
      estimatedMinutes: 15,
      questionCount: 3,
      targetMondai: 'Bug Tracker · Spaced Repetition',
      reason: 'Khóa chặt các lỗi sai từ hôm trước trước khi nạp kiến thức mới hôm nay',
      targetWords: ['めったに (Lv2)'],
      targetGrammars: ['〜にもかかわらず (Lv1)'],
      completed: false,
      priority: 'high',
    },
    {
      id: 'task_2_vocab_synonyms',
      title: 'Chặng 2: Từ vựng thực chiến — Tìm từ đồng nghĩa (Mondai 3) & Cách dùng từ (Mondai 4)',
      category: 'vocabulary',
      categoryLabel: 'Từ vựng Mondai 3-4',
      quizFormat: 'vocab_synonyms_usage',
      estimatedMinutes: 20,
      questionCount: 5,
      targetMondai: 'Goi Mondai 3 & 4 (用法)',
      reason: 'Kiểm tra sắc thái sử dụng trong câu của nhóm từ Lv1–Lv2 từ OnTapTuVung',
      targetWords: ['我慢 (Lv1)', 'のんびり (Lv1)', '確認 (Lv2)', '変更 (Lv2)', 'めったに (Lv2)'],
      targetGrammars: [],
      completed: false,
      priority: 'high',
    },
    {
      id: 'task_3_grammar_star',
      title: 'Chặng 3: Ngữ pháp thực chiến — Luyện 5 câu Sắp xếp dấu sao ★ (Mondai 3)',
      category: 'grammar',
      categoryLabel: 'Ngữ pháp Mondai 3 ★',
      quizFormat: 'grammar_mondai_3_4',
      estimatedMinutes: 25,
      questionCount: 5,
      targetMondai: 'Bunpou Mondai 3 ★',
      reason: 'Rèn kỹ năng bắt khung kết nối cho các mẫu ngữ pháp Lv1–Lv2 đến hạn ôn hôm nay',
      targetWords: ['我慢 (Lv1)', '説得 (Lv3)'],
      targetGrammars: ['〜にもかかわらず (Lv1)', 'まるで〜かのように (Lv1)', '〜うちに (Lv2)'],
      completed: false,
      priority: 'high',
    },
    {
      id: 'task_4_grammar_cloze',
      title: 'Chặng 4: Ngữ pháp đoạn văn — Đục lỗ mạch văn & Liên từ (Mondai 4)',
      category: 'grammar',
      categoryLabel: 'Ngữ pháp Mondai 4',
      quizFormat: 'grammar_mondai_3_4',
      estimatedMinutes: 20,
      questionCount: 4,
      targetMondai: 'Bunpou Mondai 4',
      reason: 'Vận dụng các mẫu câu bổ sung và thói quen vào đoạn văn hoàn chỉnh',
      targetWords: ['効率 (Lv3)', '確認 (Lv2)'],
      targetGrammars: ['〜だけでなく〜も (Lv2)', '〜ようにする (Lv3)'],
      completed: false,
      priority: 'medium',
    },
    {
      id: 'task_5_reading_short',
      title: 'Chặng 5: Đọc hiểu Đoản văn phản xạ nhanh (Dokkai Mondai 4) lồng ghép từ đã học',
      category: 'reading',
      categoryLabel: 'Đọc hiểu Đoản văn',
      quizFormat: 'reading_integrated',
      estimatedMinutes: 20,
      questionCount: 4,
      targetMondai: 'Dokkai Đoản văn (150–200 chữ)',
      reason: 'Luyện tìm câu chủ đề trong vòng 2 phút với các từ vựng Lv1–Lv3 quen thuộc',
      targetWords: ['のんびり (Lv1)', '確認 (Lv2)', '変更 (Lv2)'],
      targetGrammars: ['〜うちに (Lv2)', '〜ようにする (Lv3)'],
      completed: false,
      priority: 'high',
    },
    {
      id: 'task_6_reading_medium',
      title: 'Chặng 6: Đọc hiểu Trung văn phân tích luận điểm tác giả (Dokkai Mondai 5)',
      category: 'reading',
      categoryLabel: 'Đọc hiểu Trung văn',
      quizFormat: 'reading_integrated',
      estimatedMinutes: 25,
      questionCount: 4,
      targetMondai: 'Dokkai Trung văn (280–350 chữ)',
      reason: 'Xử lý điểm yếu đọc hiểu dài bằng cách cài cắm các cấu trúc nghịch đảo vừa ôn',
      targetWords: ['効率 (Lv3)', '我慢 (Lv1)', '説得 (Lv3)'],
      targetGrammars: ['〜にもかかわらず (Lv1)', '〜だけでなく〜も (Lv2)'],
      completed: false,
      priority: 'high',
    },
    {
      id: 'task_7_listening_dialogue',
      title: 'Chặng 7: Nghe hiểu Choukai phân vai Nam/Nữ — Nghe từng câu & Bắt từ khóa',
      category: 'listening',
      categoryLabel: 'Nghe hiểu Choukai',
      quizFormat: 'listening_dialogue',
      estimatedMinutes: 20,
      questionCount: 4,
      targetMondai: 'Choukai Mondai 1 & 2 (Có tách câu & tốc độ 0.7x–1.0x)',
      reason: 'Luyện nghe phân biệt giọng Nam/Nữ kèm chế độ nghe lại từng lượt thoại rõ ràng',
      targetWords: ['確認 (Lv2)', '変更 (Lv2)', '提出 (Lv7)'],
      targetGrammars: ['〜うちに (Lv2)', '〜ようにする (Lv3)'],
      completed: false,
      priority: 'high',
    },
  ],
  tipsForToday: [
    'Ở bài Nghe Choukai (Chặng 7): Nếu thấy tốc độ 1.0x nhanh, hãy bật chế độ 0.7x hoặc bấm nghe từng lượt thoại Nam/Nữ để quen âm trước.',
    'Vào lúc 19:00 tối nay, hệ thống sẽ tự động tổng hợp Báo cáo Tiến độ (Điểm mạnh, Tiến bộ, Điểm yếu & Bài ôn thêm) để lên lộ trình thích ứng cho ngày mai.',
  ],
};

export function createEmptyStudyLog(dateStr = new Date().toISOString().split('T')[0]): DailyStudyLog {
  return {
    date: dateStr,
    studyMinutes: 35,
    completedTaskCount: 0,
    totalTaskCount: 7,
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
