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
} from '../types';
import {
  calculateProgress,
  computeKnowledgeStats,
  selectPriorityTargets,
} from '../utils/studyLogic';

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
  onAddExtraTaskToRoadmap: (format: QuizFormatType, title: string, categoryLabel: string) => void;
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. Hero Section & Key Metrics */}
      <section className="bg-white border border-pink-200/80 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-pink-100">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-medium text-pink-700">
              Lộ trình cá nhân hóa · Tích hợp OnTapTuVung & OnTapNguPhap
              {roadmap.basedOnReportDate ? ` · Đã điều chỉnh từ Báo cáo 19:00 (${roadmap.basedOnReportDate})` : ''}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900 text-balance">
              Kế hoạch ôn luyện <span className="text-pink-600">JLPT N3</span> hôm nay
            </h1>
            <p className="text-stone-600 text-sm leading-relaxed">
              {roadmap.focusMessage}
            </p>
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
                  Các từ và cấu trúc Level thấp (Lv1–Lv3) hoặc đến hạn ôn được cài cắm vào 7 chặng hôm nay:
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

          {/* Quick AI Generator Bar for 4 Formats */}
          <div className="pt-4 border-t border-pink-100 space-y-2">
            <div className="text-xs font-semibold text-stone-600">
              Tạo nhanh đề thực chiến từ nhóm từ & ngữ pháp ưu tiên trên:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { key: 'quick_reading', format: 'reading_integrated', label: 'Đọc hiểu lồng ghép' },
                  { key: 'quick_grammar', format: 'grammar_mondai_3_4', label: 'Mondai 3 ★ & 4' },
                  { key: 'quick_vocab', format: 'vocab_synonyms_usage', label: 'Từ đồng nghĩa' },
                  { key: 'quick_listen', format: 'listening_dialogue', label: 'Nghe phân vai' },
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
                <div className="text-xs font-bold text-stone-800">
                  Mẹo chiến thuật hôm nay:
                </div>
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

      {/* 3. Daily Actionable Task List (7 Chặng) */}
      <section className="bg-white rounded-3xl p-6 border border-pink-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pink-100">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-900 tabular-nums">
              Nhiệm vụ luyện đề hôm nay ({completedTasksCount}/{roadmap.tasks.length} hoàn thành)
            </h3>
            <p className="text-xs text-stone-500">
              Lộ trình chi tiết {roadmap.tasks.length} chặng bao phủ toàn diện Từ vựng, Ngữ pháp Mondai 3-4, Đọc hiểu Đoản/Trung văn và Nghe Choukai phân vai.
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

        {/* Task Rows */}
        <div className="divide-y divide-pink-100">
          {roadmap.tasks.map((task) => {
            const isGenerating = loadingTaskId === task.id;
            return (
              <div
                key={task.id}
                className={`py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-opacity ${
                  task.completed ? 'opacity-65' : ''
                }`}
              >
                {/* Left: Checkbox & Task Content */}
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
                    {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 tabular-nums">
                      <span className="inline-flex items-center gap-1 font-semibold text-pink-700">
                        {getCategoryIcon(task.category)}
                        <span>{task.categoryLabel || task.category}</span>
                      </span>
                      {task.targetMondai && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{task.targetMondai}</span>
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
                          <span className="text-emerald-700 font-semibold">Chặng mở rộng</span>
                        </>
                      )}
                      {task.priority === 'high' && !task.completed && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-600 font-semibold">Ưu tiên cao</span>
                        </>
                      )}
                    </div>

                    <h4
                      className={`text-sm md:text-base font-bold text-stone-900 ${
                        task.completed ? 'line-through text-stone-400' : ''
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.reason && (
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Lý do đề xuất: {task.reason}
                      </p>
                    )}

                    {/* Target Words & Grammars woven into this task */}
                    {((task.targetWords && task.targetWords.length > 0) ||
                      (task.targetGrammars && task.targetGrammars.length > 0)) && (
                      <div className="text-xs text-stone-600 pt-0.5 font-['Noto_Sans_JP','Plus_Jakarta_Sans',sans-serif]">
                        <span className="font-semibold text-stone-700">Mục tiêu tích hợp: </span>
                        {[...(task.targetGrammars || []), ...(task.targetWords || [])].join(' · ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action Button */}
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
      </section>

      {/* 4. Bonus & Extended Practice Section ("Sau khi làm xong nhiệm vụ hôm nay / Ôn thêm dạng khác") */}
      <section className="bg-white rounded-3xl p-6 border border-pink-200/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-100 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-pink-700">
              Mở rộng sau khi hoàn thành nhiệm vụ chính · Ghi nhận vào Báo cáo 19:00
            </div>
            <h3 className="text-base md:text-lg font-bold text-stone-900">
              Ôn thêm dạng khác ngoài lộ trình (Bonus Practice)
            </h3>
            <p className="text-xs text-stone-500">
              Nếu bạn đã hoàn thành xong các chặng chính hoặc muốn luyện thêm dạng bài khác, hãy chọn bên dưới. AI sẽ ghi nhận toàn bộ kết quả làm thêm vào Báo cáo 19:00 để cân đối lộ trình ngày mai.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              {
                key: 'bonus_reading_info',
                format: 'reading_integrated' as QuizFormatType,
                title: 'Ôn thêm: Đọc hiểu Tìm kiếm thông tin & Trung văn',
                categoryLabel: 'Đọc hiểu mở rộng',
                desc: 'Luyện thêm đoạn văn 250 chữ cài cắm từ vựng Lv1–Lv3.',
              },
              {
                key: 'bonus_grammar_star',
                format: 'grammar_mondai_3_4' as QuizFormatType,
                title: 'Ôn thêm: 5 câu Mondai 3 Dấu sao ★ & Đục lỗ',
                categoryLabel: 'Ngữ pháp mở rộng',
                desc: 'Xoay quanh các mẫu ngữ pháp dễ nhầm trong OnTapNguPhap.',
              },
              {
                key: 'bonus_vocab_usage',
                format: 'vocab_synonyms_usage' as QuizFormatType,
                title: 'Ôn thêm: Từ đồng nghĩa & Cách dùng từ (用法)',
                categoryLabel: 'Từ vựng mở rộng',
                desc: 'Kiểm tra cách đặt câu chuẩn xác cho từ vựng OnTapTuVung.',
              },
              {
                key: 'bonus_listening_role',
                format: 'listening_dialogue' as QuizFormatType,
                title: 'Ôn thêm: Nghe Choukai Phân vai Nam/Nữ (Tốc độ 0.7x–1.0x)',
                categoryLabel: 'Nghe hiểu mở rộng',
                desc: 'Luyện nghe từng câu thoại rõ ràng có gợi ý từ khóa.',
              },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="p-4 rounded-2xl border border-pink-200/80 bg-[#FFF7F8]/60 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-stone-900">{item.title}</div>
                <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={loadingQuickFormat !== null}
                  onClick={() =>
                    handleQuickFormatStart(item.key, item.format, item.title, true)
                  }
                  className="flex-1 py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {loadingQuickFormat === item.key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  <span>Làm ngay</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddExtraTaskToRoadmap(item.format, item.title, item.categoryLabel)
                  }
                  title="Thêm chặng này vào danh sách nhiệm vụ hôm nay"
                  className="p-2 bg-white hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Completed Bonus Sessions Today */}
        {studyLog.bonusSessions.length > 0 && (
          <div className="pt-3 border-t border-pink-100 space-y-2">
            <div className="text-xs font-bold text-stone-700">
              Các bài bạn đã ôn thêm hôm nay (Sẽ được cộng vào Báo cáo 19:00):
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
