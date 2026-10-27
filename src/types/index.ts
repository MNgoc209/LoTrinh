export type JLPTCategory = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'review';

export type QuizFormatType =
  | 'reading_integrated'
  | 'grammar_mondai_3_4'
  | 'vocab_synonyms_usage'
  | 'listening_dialogue'
  | 'bug_review';

export type StudyIntensity = 'standard' | 'intensive' | 'overdrive';

export interface DialogueTurn {
  speaker: string;
  role: 'male' | 'female' | 'narrator';
  spokenText: string;
  rawLine: string;
}

export interface ImportedVocabItem {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  level: number; // 0 = Mới, 1..3 = Yếu/Đang học, 4..8 = Khá/Vững, 9 = Bỏ qua
  learned: boolean;
  nextReview: number; // Timestamp ms
}

export interface ImportedGrammarItem {
  id: string;
  name: string;
  structure: string; // Plain text cleaned from HTML
  meaning: string;
  example: string;
  similarText?: string;
  level: number; // 0 = Mới, 1..3 = Yếu, 4..8 = Vững, 9 = Bỏ qua
  nextReviewDate: number; // Timestamp ms
  groupName?: string;
  contextName?: string;
  sourceName?: string;
  sourceIds?: string[];
  sourceNames?: string[];
}

export interface KnowledgeBaseData {
  vocabulary: ImportedVocabItem[];
  grammars: ImportedGrammarItem[];
  vocabReviewHistory: Record<string, (string | number)[]>;
  grammarReviewHistory: Record<string, (string | number)[]>;
  grammarSources?: string[];
  selectedGrammarSources?: string[];
  lastSyncedVocabAt?: number;
  lastSyncedGrammarAt?: number;
  syncSourceVocab?: string;
  syncSourceGrammar?: string;
}

export interface TargetedReference {
  type: 'vocab' | 'grammar';
  id: string;
  title: string; // Word or Grammar name
  readingOrStructure: string;
  meaning: string;
  level: number;
  note?: string; // e.g. similarText or example
}

export interface TaskItem {
  id: string;
  mondaiId?: string;
  title: string;
  category: JLPTCategory;
  categoryLabel: string;
  quizFormat?: QuizFormatType;
  estimatedMinutes: number;
  questionCount?: number;
  targetMondai?: string;
  reason?: string;
  targetWords?: string[];
  targetGrammars?: string[];
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  isBonusTask?: boolean;
}

export interface DailyRoadmap {
  date: string;
  daysRemaining: number;
  focusMessage: string;
  targetScoreGoal: string;
  totalEstimatedMinutes: number;
  tasks: TaskItem[];
  tipsForToday: string[];
  basedOnReportDate?: string;
}

export interface ConfidenceAssessment {
  kanji: number; // 1 to 5
  vocabulary: number;
  grammarMondai1_2: number;
  grammarMondai3_4_5: number;
  readingShort: number;
  readingMediumLong: number;
  listening: number;
  notes: string;
}

export interface BugRecord {
  id: string;
  questionText: string;
  category: JLPTCategory;
  subCategory: string;
  passage?: string;
  listeningScript?: string;
  options: string[];
  userAnswerIndex: number;
  correctAnswerIndex: number;
  explanation: string;
  usedTargets?: TargetedReference[];
  timestamp: number;
  nextReviewDate: number;
  reviewIntervalDays: number;
  reviewCount: number;
  resolved: boolean;
}

export interface QuizQuestion {
  id: string;
  category: JLPTCategory;
  subCategory: string;
  title: string;
  passage?: string;
  listeningScript?: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  sourceBugId?: string;
  usedTargets?: TargetedReference[];
}

export interface SkillPerformanceStat {
  attempted: number;
  correct: number;
}

export interface BonusSessionRecord {
  id: string;
  title: string;
  quizFormat: QuizFormatType;
  category: JLPTCategory;
  totalQuestions: number;
  correctQuestions: number;
  timestamp: number;
}

export interface DailyStudyLog {
  date: string; // YYYY-MM-DD
  studyMinutes: number;
  completedTaskCount: number;
  totalTaskCount: number;
  skillStats: Record<JLPTCategory, SkillPerformanceStat>;
  bonusSessions: BonusSessionRecord[];
  improvedItems: string[]; // e.g., ["確認 (Lv2→Lv3)", "〜うちに (Lv2→Lv3)"]
  weakItems: string[]; // e.g., ["〜にもかかわらず (Lv1)", "我慢 (Lv1)"]
}

export interface DailyProgressReport {
  id: string;
  date: string; // YYYY-MM-DD
  generatedAt: number; // Timestamp ms
  overallAccuracy: number; // 0..100
  completedTasksSummary: string;
  bonusPracticeSummary: string;
  strengths: string[];
  improvements: string[];
  weaknesses: string[];
  nextDayAdjustments: string[];
  recommendedFocusFormats: QuizFormatType[];
  skillAccuracyMap: Record<string, number>;
}

export interface UserProfile {
  examDate: string; // YYYY-MM-DD
  confidence: ConfidenceAssessment;
  streakDays: number;
  lastActiveDate: string;
  todayStudyMinutes: number;
  studyIntensity?: StudyIntensity;
  vocabFirebaseUid?: string;
  grammarFirebaseUid?: string;
  themeColor?: 'sky' | 'sakura';
  cloudSyncKey?: string;
  lastCloudSyncedAt?: number;
  lastSyncedDevice?: string;
}

export interface CrossDeviceWorkspaceSnapshot {
  version: number;
  updatedAt: number;
  deviceLabel: string;
  profile: UserProfile;
  roadmap: DailyRoadmap;
  bugs: BugRecord[];
  studyLog: DailyStudyLog;
  dailyReports: DailyProgressReport[];
  selectedGrammarSources?: string[];
  knowledgeBase?: KnowledgeBaseData;
}
