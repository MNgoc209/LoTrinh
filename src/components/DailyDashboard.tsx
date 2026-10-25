import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Flame,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  SlidersHorizontal,
  BookOpen,
  Headphones,
  FileText,
  Upload,
  Loader2,
  TrendingUp,
  PlusCircle,
  Clock,
} from 'lucide-react';
import {
  DailyRoadmap,
  TaskItem,
  UserProfile,
  KnowledgeBaseData,
  QuizFormatType,
  DailyStudyLog,
  JLPTCategory,
} from '../types';
import {
  calculateProgress,
  computeKnowledgeStats,
  selectPriorityTargets,
} from '../utils/studyLogic';
import {
  JLPT_N3_SECTIONS,
  JLPT_N3_MONDAI_CATALOG,
  MondaiSpec,
} from '../utils/jlptMondaiTaxonomy';

interface DailyDashboardProps {
  roadmap: DailyRoadmap;
  profile: UserProfile;
  knowledgeBase: KnowledgeBaseData;
  studyLog: DailyStudyLog;
  pendingBugsCount: number;
  onToggleTask: (taskId: string) => void;
  onStartTaskQuiz: (task: TaskItem) => Promise<void>;
  onOpenRoadmapConfig: () => void;
  onOpenSyncModal: () => void;
  onOpenKnowledgeHub: () => void;
  onOpenBugTracker: () => void;
  onOpenEveningReport: () => void;
  onStartAllDueBugs: () => void;
  onQuickStartFormat: (format: QuizFormatType, title: string, isBonus?: boolean) => Promise<void>;
  onAddExtraTaskToRoadmap: (
    format: QuizFormatType,
    title: string,
    categoryLabel: string,
    targetMondai?: string,
    category?: JLPTCategory
  ) => void;
}

export const DailyDashboard: React.FC<DailyDashboardProps> = ({
  roadmap,
  profile,
  knowledgeBase,
  studyLog,
  pendingBugsCount,
  onToggleTask,
  onStartTaskQuiz,
  onOpenRoadmapConfig,
  onOpenSyncModal,
  onOpenKnowledgeHub,
  onOpenBugTracker,
  onOpenEveningReport,
  onStartAllDueBugs,
  onQuickStartFormat,
  onAddExtraTaskToRoadmap,
}) => {
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [loadingQuickFormat, setLoadingQuickFormat] = useState<string | null>(null);
  const [selectedMondaiSection, setSelectedMondaiSection] = useState<JLPTCategory | 'all'>('all');

  const progressPercent = calculateProgress(roadmap.tasks);
  const completedTasksCount = roadmap.tasks.filter((t) => t.completed).length;

  const stats = computeKnowledgeStats(knowledgeBase.vocabulary, knowledgeBase.grammars);
  const { priorityVocab, priorityGrammar } = selectPriorityTargets(
    knowledgeBase.vocabulary,
    knowledgeBase.grammars,
    Date.now(),
    8,
    5
  );

  const handleTaskStart = async (task: TaskItem) => {
    setLoadingTaskId(task.id);
    try {
      await onStartTaskQuiz(task);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleQuickFormatStart = async (
    key: string,
    format: QuizFormatType,
    title: string,
    isBonus = false
  ) => {
    setLoadingQuickFormat(key);
    try {
      await onQuickStartFormat(format, title, isBonus);
    } finally {
      setLoadingQuickFormat(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grammar':
        return <FileText className="w-3.5 h-3.5 text-pink-600" />;
      case 'reading':
        return <BookOpen className="w-3.5 h-3.5 text-rose-600" />;
      case 'listening':
        return <Headphones className="w-3.5 h-3.5 text-purple-600" />;
      case 'review':
        return <RotateCcw className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-pink-500" />;
    }
  };

  // Group today's tasks clearly by section so the learner sees every section & Mondai separated
  const taskGroups: {
    category: JLPTCategory;
    headerTitle: string;
    headerDesc: string;
    tasks: TaskItem[];
  }[] = [
    {
      category: 'review',
      headerTitle: 'Mục 0: Khắc phục lỗi sai (Bug Tracker · Spaced Repetition)',
      headerDesc: 'Ôn lại các câu từng chọn sai đến hạn hôm nay trước khi sang kiến thức mới',
      tasks: roadmap.tasks.filter((t) => t.category === 'review'),
    },
    {
      category: 'vocabulary',
      headerTitle: 'Mục 1: Từ vựng – Hán tự (文字・語彙 · 5 Mondai)',
      headerDesc:
        'Mondai 1: Đọc Hán tự · Mondai 2: Viết Hán tự · Mondai 3: Điền từ ngữ cảnh · Mondai 4: Từ đồng nghĩa · Mondai 5: Cách dùng từ (用法)',
      tasks: roadmap.tasks.filter((t) => t.category === 'vocabulary'),
    },
    {
      category: 'grammar',
      headerTitle: 'Mục 2: Ngữ pháp (文法 · 3 Mondai)',
      headerDesc:
        'Mondai 1: Chọn cấu trúc câu đơn · Mondai 2: Sắp xếp câu dấu sao ★ (文の組み立て) · Mondai 3: Ngữ pháp đục lỗ đoạn văn (文章の文法)',
      tasks: roadmap.tasks.filter((t) => t.category === 'grammar'),
    },
    {
      category: 'reading',
      headerTitle: 'Mục 3: Đọc hiểu (読解 · 4 Mondai)',
      headerDesc:
        'Mondai 4: Đoản văn ngắn (150 chữ) · Mondai 5: Trung văn (350 chữ) · Mondai 6: Trường văn (550 chữ) · Mondai 7: Tìm kiếm thông tin (情報検索)',
      tasks: roadmap.tasks.filter((t) => t.category === 'reading'),
    },
    {
      category: 'listening',
      headerTitle: 'Mục 4: Nghe hiểu (聴解 · 5 Mondai)',
      headerDesc:
        'Mondai 1: Nghe nhiệm vụ · Mondai 2: Nghe điểm chính · Mondai 3: Nghe khái quát · Mondai 4: Giao tiếp tình huống · Mondai 5: Phản xạ nhanh tức thì',
      tasks: roadmap.tasks.filter((t) => t.category === 'listening'),
    },
  ].filter((g) => g.tasks.length > 0);

  const visibleMondaiSpecs: MondaiSpec[] =
    selectedMondaiSection === 'all'
      ? JLPT_N3_MONDAI_CATALOG
      : JLPT_N3_MONDAI_CATALOG.filter((m) => m.category === selectedMondaiSection);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. Hero Section & Key Metrics */}
      <section className="bg-white border border-pink-200/80 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-pink-100">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-medium text-pink-700">
              Lộ trình cá nhân hóa · Tích hợp OnTapTuVung & OnTapNguPhap
              {roadmap.basedOnReportDate
                ? ` · Đã điều chỉnh từ Báo cáo 19:00 (${roadmap.basedOnReportDate})`
                : ''}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900 text-balance">
              Kế hoạch ôn luyện <span className="text-pink-600">JLPT N3</span> hôm nay
            </h1>
            <p className="text-stone-600 text-sm leading-relaxed">{roadmap.focusMessage}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenEveningReport}
              className="px-4 py-2.5 bg-[#FFF7F8] hover:bg-pink-100/70 text-pink-700 border border-pink-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-pink-600" />
              <span>Báo cáo 19:00 & Lộ trình mai</span>
            </button>

            <button
              type="button"
              onClick={onOpenSyncModal}
              className="px-4 py-2.5 bg-white hover:bg-pink-50 text-stone-700 border border-pink-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-pink-600" />
              <span>Nạp Backup / Cloud</span>
            </button>

            <button
              type="button"
              onClick={onOpenRoadmapConfig}
              className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Tạo lại lộ trình AI</span>
            </button>
          </div>
        </div>

        {/* Full-Width 4-Column KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Calendar className="w-3.5 h-3.5 text-pink-600" />
              <span>Đếm ngược kỳ thi</span>
            </div>
            <div className="text-2xl font-bold text-stone-900 tabular-nums">
              Còn <span className="text-pink-600">{roadmap.daysRemaining}</span> ngày
            </div>
            <div className="text-xs text-stone-500 tabular-nums">
              Ngày thi: {profile.examDate}
            </div>
          </div>

          <div className="space-y-1 lg:border-l lg:border-pink-100 lg:pl-6">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>Mục tiêu Lv1–Lv3 cần ưu tiên</span>
            </div>
            <div className="text-2xl font-bold text-rose-600 tabular-nums">
              {stats.vocabWeakLv1_3 + stats.grammarWeakLv1_3} mục
            </div>
            <div className="text-xs text-stone-500 tabular-nums">
              {stats.vocabWeakLv1_3} từ vựng · {stats.grammarWeakLv1_3} ngữ pháp
            </div>
          </div>

          <div className="space-y-1 lg:border-l lg:border-pink-100 lg:pl-6">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Đến hạn ôn hôm nay</span>
            </div>
            <div className="text-2xl font-bold text-stone-900 tabular-nums">
              {stats.vocabDueToday + stats.grammarDueToday + pendingBugsCount} mục
            </div>
            <div className="text-xs text-stone-500 tabular-nums">
              {stats.vocabDueToday + stats.grammarDueToday} từ 2 web · {pendingBugsCount} câu lỗi Bug
            </div>
          </div>

          <div className="space-y-1 lg:border-l lg:border-pink-100 lg:pl-6">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Tiến độ & Ôn thêm hôm nay</span>
            </div>
            <div className="text-2xl font-bold text-stone-900 tabular-nums">
              {completedTasksCount}/{roadmap.tasks.length} chặng
            </div>
            <div className="text-xs text-stone-500 tabular-nums">
              Dự kiến {roadmap.totalEstimatedMinutes}p · Ôn thêm: {studyLog.bonusSessions.length} bài
            </div>
          </div>
        </div>
      </section>

      {/* 2. Split Row: Priority Targets from OnTapTuVung/OnTapNguPhap + Spaced Repetition & 19h Checkpoint */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left 2 Columns: Priority Knowledge Targets for Today */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-pink-200/80 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Trọng tâm trích xuất từ OnTapTuVung & OnTapNguPhap hôm nay
                </h2>
                <p className="text-xs text-stone-500">
                  Các từ và cấu trúc Level thấp (Lv1–Lv3) hoặc đến hạn ôn được phân bổ vào 4 Mục (Từ vựng, Ngữ pháp, Đọc hiểu, Nghe hiểu):
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenKnowledgeHub}
                className="text-xs font-semibold text-pink-600 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Xem toàn bộ kho ({stats.vocabTotal + stats.grammarTotal})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority Vocab List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-700">
                  Từ vựng ưu tiên (Lv1–Lv3 & Đến hạn)
                </div>
                <div className="divide-y divide-pink-100 text-xs">
                  {priorityVocab.slice(0, 5).map((v) => (
                    <div key={v.id} className="py-2 flex items-baseline justify-between gap-2">
                      <div>
                        <span className="font-bold text-stone-900 font-['Noto_Sans_JP',sans-serif]">
                          {v.word}
                        </span>{' '}
                        <span className="text-stone-500 font-['Noto_Sans_JP',sans-serif]">
                          ({v.reading})
                        </span>{' '}
                        <span className="text-stone-600">— {v.meaning}</span>
                      </div>
                      <span className="text-rose-600 font-semibold tabular-nums shrink-0">
                        Lv{v.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Grammar List */}
              <div className="space-y-2 md:border-l md:border-pink-100 md:pl-5">
                <div className="text-xs font-bold text-stone-700">
                  Ngữ pháp ưu tiên (Lv1–Lv3 & Đến hạn)
                </div>
                <div className="divide-y divide-pink-100 text-xs">
                  {priorityGrammar.slice(0, 5).map((g) => (
                    <div key={g.id} className="py-2 flex items-baseline justify-between gap-2">
                      <div>
                        <span className="font-bold text-stone-900 font-['Noto_Sans_JP',sans-serif]">
                          {g.name}
                        </span>{' '}
                        <span className="text-stone-600">— {g.meaning}</span>
                      </div>
                      <span className="text-rose-600 font-semibold tabular-nums shrink-0">
                        Lv{g.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick AI Generator Bar for 4 Sections */}
          <div className="pt-4 border-t border-pink-100 space-y-2">
            <div className="text-xs font-semibold text-stone-600">
              Luyện nhanh theo từng kỹ năng từ nhóm từ & ngữ pháp ưu tiên trên:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  {
                    key: 'quick_vocab',
                    format: 'vocab_synonyms_usage',
                    label: '1. Từ vựng (Mondai 1–5)',
                  },
                  {
                    key: 'quick_grammar',
                    format: 'grammar_mondai_3_4',
                    label: '2. Ngữ pháp (Mondai 1–3)',
                  },
                  {
                    key: 'quick_reading',
                    format: 'reading_integrated',
                    label: '3. Đọc hiểu (Mondai 4–7)',
                  },
                  {
                    key: 'quick_listen',
                    format: 'listening_dialogue',
                    label: '4. Nghe hiểu (Mondai 1–5)',
                  },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  disabled={loadingQuickFormat !== null}
                  onClick={() => handleQuickFormatStart(btn.key, btn.format, btn.label, false)}
                  className="py-2 px-3 bg-[#FFF7F8] hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {loadingQuickFormat === btn.key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Bug Tracker & 19:00 Daily Checkpoint */}
        <div className="bg-white rounded-3xl p-6 border border-pink-200/80 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="text-xs font-medium text-rose-700">
              Bug Tracker & Tổng kết 19:00 hàng ngày
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-stone-900 tabular-nums">
                {pendingBugsCount}
              </span>
              <span className="text-stone-500 text-sm">câu làm sai đến hạn ôn</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Vào <strong>19:00 mỗi ngày</strong>, hệ thống tự động đánh giá điểm mạnh, điểm đã tiến bộ, phần còn yếu và các bài ôn thêm để lập lộ trình ngày kế tiếp.
            </p>

            {roadmap.tipsForToday && roadmap.tipsForToday.length > 0 && (
              <div className="pt-3 border-t border-pink-100 space-y-1.5">
                <div className="text-xs font-bold text-stone-800">Mẹo chiến thuật hôm nay:</div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
                  {roadmap.tipsForToday.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            {pendingBugsCount > 0 && (
              <button
                type="button"
                onClick={onStartAllDueBugs}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ôn ngay {pendingBugsCount} câu sai này</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenEveningReport}
              className="w-full py-2.5 px-3 bg-[#FFF7F8] hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Xem Báo cáo 19:00 & Tạo lộ trình mai</span>
            </button>
            <button
              type="button"
              onClick={onOpenBugTracker}
              className="w-full py-2 px-3 bg-white hover:bg-pink-50 text-stone-700 border border-pink-200 rounded-xl text-xs font-semibold transition-colors text-center cursor-pointer"
            >
              Xem nhật ký lỗi chi tiết
            </button>
          </div>
        </div>
      </section>

      {/* 3. Daily Actionable Task List — CHIA MỤC RÕ RÀNG THEO 4 KỸ NĂNG & GHI RÕ TỪNG MONDAI */}
      <section className="bg-white rounded-3xl p-6 border border-pink-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pink-100">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-900 tabular-nums">
              Nhiệm vụ luyện đề hôm nay ({completedTasksCount}/{roadmap.tasks.length} hoàn thành)
            </h3>
            <p className="text-xs text-stone-500">
              Được chia thành 4 mục rõ ràng (Từ vựng · Ngữ pháp · Đọc hiểu · Nghe hiểu), ghi rõ từng dạng Mondai trong đề thi JLPT N3.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex-1 bg-pink-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-pink-600 h-full rounded-full transition-transform duration-300 origin-left"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>
            <span className="text-sm font-bold text-pink-700 tabular-nums min-w-[40px] text-right">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Grouped Task Sections */}
        <div className="space-y-6">
          {taskGroups.map((group) => (
            <div
              key={group.category}
              className="rounded-2xl border border-pink-200/70 bg-[#FFF7F8]/40 p-4 md:p-5 space-y-4"
            >
              {/* Section Header */}
              <div className="border-b border-pink-200/60 pb-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm md:text-base font-bold text-pink-800 flex items-center gap-2">
                    {getCategoryIcon(group.category)}
                    <span>{group.headerTitle}</span>
                  </h4>
                  <span className="text-xs font-semibold text-stone-500 tabular-nums">
                    {group.tasks.filter((t) => t.completed).length}/{group.tasks.length} chặng
                  </span>
                </div>
                <p className="text-xs text-stone-600">{group.headerDesc}</p>
              </div>

              {/* Tasks inside this section */}
              <div className="divide-y divide-pink-100">
                {group.tasks.map((task) => {
                  const isGenerating = loadingTaskId === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-opacity ${
                        task.completed ? 'opacity-65' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          aria-label={
                            task.completed
                              ? `Bỏ đánh dấu ${task.title}`
                              : `Đánh dấu hoàn thành ${task.title}`
                          }
                          className="mt-0.5 text-stone-400 hover:text-pink-600 transition-colors cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-pink-600 fill-pink-100" />
                          ) : (
                            <Circle className="w-5 h-5 hover:stroke-pink-600" />
                          )}
                        </button>

                        <div className="space-y-1.5 flex-1">
                          {/* Unboxed Metadata Line */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 tabular-nums">
                            <span className="font-bold text-pink-700">
                              {task.categoryLabel || task.category}
                            </span>
                            {task.targetMondai && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-stone-700">
                                  {task.targetMondai}
                                </span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span>{task.estimatedMinutes} phút</span>
                            {task.questionCount && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{task.questionCount} câu</span>
                              </>
                            )}
                            {task.isBonusTask && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-700 font-semibold">
                                  Chặng mở rộng
                                </span>
                              </>
                            )}
                            {task.priority === 'high' && !task.completed && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-rose-600 font-semibold">Ưu tiên cao</span>
                              </>
                            )}
                          </div>

                          <div
                            className={`text-sm md:text-base font-bold text-stone-900 ${
                              task.completed ? 'line-through text-stone-400' : ''
                            }`}
                          >
                            {task.title}
                          </div>

                          {task.reason && (
                            <p className="text-xs text-stone-600 leading-relaxed">
                              Mục đích rèn luyện: {task.reason}
                            </p>
                          )}

                          {((task.targetWords && task.targetWords.length > 0) ||
                            (task.targetGrammars && task.targetGrammars.length > 0)) && (
                            <div className="text-xs text-stone-600 pt-0.5 font-['Noto_Sans_JP','Plus_Jakarta_Sans',sans-serif]">
                              <span className="font-semibold text-stone-700">
                                Mục tiêu tích hợp:{' '}
                              </span>
                              {[...(task.targetGrammars || []), ...(task.targetWords || [])].join(
                                ' · '
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end pl-8 md:pl-0 shrink-0">
                        <button
                          type="button"
                          disabled={isGenerating}
                          onClick={() => handleTaskStart(task)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                            task.completed
                              ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              : 'bg-pink-600 hover:bg-pink-700 text-white shadow-xs'
                          }`}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang tạo đề...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{task.completed ? 'Luyện lại' : 'Luyện tập'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FULL 18-MONDAI CATALOG BY SECTION ("Chia mục rõ ràng từng Mondai Từ vựng, Ngữ pháp, Đọc hiểu, Nghe hiểu & Ôn thêm") */}
      <section className="bg-white rounded-3xl p-6 border border-pink-200/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-100 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-pink-700">
              Danh mục chi tiết 17 Mondai chuẩn đề thi JLPT N3 · Ôn thêm ngoài lộ trình
            </div>
            <h3 className="text-base md:text-lg font-bold text-stone-900">
              Chọn ôn riêng từng dạng Mondai (Từ vựng · Ngữ pháp · Đọc hiểu · Nghe hiểu)
            </h3>
            <p className="text-xs text-stone-500">
              Mỗi phần dưới đây giải thích rõ từng Mondai kiểm tra kỹ năng gì, có bao nhiêu câu trong đề thi thật. Bấm &ldquo;Làm ngay&rdquo; hoặc bấm &ldquo;+&rdquo; để ghim vào lộ trình hôm nay.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenEveningReport}
            className="px-3.5 py-2 bg-[#FFF7F8] hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Đã ôn thêm: {studyLog.bonusSessions.length} bài</span>
          </button>
        </div>

        {/* Section Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedMondaiSection('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedMondaiSection === 'all'
                ? 'bg-pink-600 text-white'
                : 'bg-[#FFF7F8] text-stone-700 border border-pink-200 hover:bg-pink-50'
            }`}
          >
            Tất cả 4 Kỹ năng (17 Mondai)
          </button>
          {JLPT_N3_SECTIONS.map((sec) => (
            <button
              key={sec.category}
              type="button"
              onClick={() => setSelectedMondaiSection(sec.category)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedMondaiSection === sec.category
                  ? 'bg-pink-600 text-white'
                  : 'bg-[#FFF7F8] text-stone-700 border border-pink-200 hover:bg-pink-50'
              }`}
            >
              {sec.title} ({sec.badgeText})
            </button>
          ))}
        </div>

        {/* Grouped Mondai Cards */}
        <div className="space-y-6">
          {JLPT_N3_SECTIONS.filter(
            (sec) => selectedMondaiSection === 'all' || sec.category === selectedMondaiSection
          ).map((sec) => {
            const mondaisInSec = visibleMondaiSpecs.filter((m) => m.category === sec.category);
            return (
              <div key={sec.category} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-pink-100 pb-2">
                  <h4 className="text-sm font-bold text-stone-900">{sec.title}</h4>
                  <span className="text-xs text-stone-500">{sec.subtitle}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mondaisInSec.map((mondai) => (
                    <div
                      key={mondai.id}
                      className="p-4 rounded-2xl border border-pink-200/80 bg-[#FFF7F8]/50 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-pink-700">{mondai.mondaiCode}</span>
                          <span className="text-stone-500 font-['Noto_Sans_JP',sans-serif]">
                            {mondai.nameJp}
                          </span>
                        </div>
                        <div className="text-xs md:text-sm font-bold text-stone-900">
                          {mondai.nameVi}
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {mondai.description}
                        </p>
                        <div className="text-[11px] text-stone-500 pt-0.5 tabular-nums">
                          Cấu trúc đề thật: {mondai.examQuestionCount} · Luyện {mondai.defaultPracticeCount} câu ({mondai.defaultMinutes}p)
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={loadingQuickFormat !== null}
                          onClick={() =>
                            handleQuickFormatStart(
                              mondai.id,
                              mondai.quizFormat,
                              `${mondai.mondaiCode}: ${mondai.nameVi} (${mondai.nameJp})`,
                              true
                            )
                          }
                          className="flex-1 py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {loadingQuickFormat === mondai.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                          <span>Làm ngay</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onAddExtraTaskToRoadmap(
                              mondai.quizFormat,
                              `${mondai.mondaiCode}: ${mondai.nameVi}`,
                              mondai.mondaiCode,
                              `${mondai.nameJp} (${mondai.examQuestionCount})`,
                              mondai.category
                            )
                          }
                          title="Thêm Mondai này vào danh sách nhiệm vụ hôm nay"
                          className="p-2 bg-white hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completed Bonus Sessions Today */}
        {studyLog.bonusSessions.length > 0 && (
          <div className="pt-3 border-t border-pink-100 space-y-2">
            <div className="text-xs font-bold text-stone-700">
              Các Mondai bạn đã ôn thêm hôm nay (Được ghi nhận vào Báo cáo 19:00):
            </div>
            <div className="divide-y divide-pink-100 text-xs">
              {studyLog.bonusSessions.map((session) => (
                <div
                  key={session.id}
                  className="py-2 flex items-center justify-between gap-2 tabular-nums"
                >
                  <span className="font-medium text-stone-800">{session.title}</span>
                  <span className="text-emerald-700 font-semibold">
                    Đúng {session.correctQuestions}/{session.totalQuestions} câu
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default DailyDashboard;
