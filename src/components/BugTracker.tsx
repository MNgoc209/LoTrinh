import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Trash2,
  Play,
  ArrowLeft,
} from 'lucide-react';
import { BugRecord, QuizQuestion } from '../types';

interface BugTrackerProps {
  bugs: BugRecord[];
  onStartSpacedRepetitionQuiz: (questions: QuizQuestion[]) => void;
  onDeleteBug: (bugId: string) => void;
  onToggleResolveBug: (bugId: string) => void;
  onBackToDashboard: () => void;
}

export const BugTracker: React.FC<BugTrackerProps> = ({
  bugs,
  onStartSpacedRepetitionQuiz,
  onDeleteBug,
  onToggleResolveBug,
  onBackToDashboard,
}) => {
  const [filter, setFilter] = useState<
    'all' | 'due' | 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'resolved'
  >('all');

  const now = Date.now();
  const dueBugs = bugs.filter((b) => !b.resolved && b.nextReviewDate <= now);

  const filteredBugs = bugs.filter((bug) => {
    if (filter === 'due') return !bug.resolved && bug.nextReviewDate <= now;
    if (filter === 'resolved') return bug.resolved;
    if (filter === 'grammar') return bug.category === 'grammar';
    if (filter === 'vocabulary') return bug.category === 'vocabulary';
    if (filter === 'reading') return bug.category === 'reading';
    if (filter === 'listening') return bug.category === 'listening';
    return true;
  });

  const handleStartReview = (itemsToReview: BugRecord[]) => {
    if (itemsToReview.length === 0) return;
    const questions: QuizQuestion[] = itemsToReview.map((b) => ({
      id: `review_${b.id}`,
      sourceBugId: b.id,
      category: b.category,
      subCategory: b.subCategory,
      title: `Ôn tập Bug Tracker: ${b.subCategory}`,
      passage: b.passage,
      listeningScript: b.listeningScript,
      questionText: b.questionText,
      options: b.options,
      correctAnswerIndex: b.correctAnswerIndex,
      explanation: b.explanation,
      usedTargets: b.usedTargets,
    }));
    onStartSpacedRepetitionQuiz(questions);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-200/80">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-pink-600 transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Lịch học hôm nay</span>
          </button>
          <h1 className="text-2xl font-bold text-stone-900 tabular-nums">
            Bug Tracker & Spaced Repetition ({bugs.length} câu lỗi)
          </h1>
          <p className="text-xs text-stone-500">
            Hệ thống tự động lưu các câu làm sai và định kỳ nhắc làm lại để khắc sâu vào trí nhớ dài hạn.
          </p>
        </div>

        {dueBugs.length > 0 && (
          <button
            type="button"
            onClick={() => handleStartReview(dueBugs)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 tabular-nums"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ôn {dueBugs.length} câu đến hạn ngay</span>
          </button>
        )}
      </div>

      {/* Interactive Segmented Filter Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-pink-50 border border-pink-200/70 rounded-xl">
        {[
          { key: 'all', label: `Tất cả (${bugs.length})` },
          { key: 'due', label: `Cần ôn hôm nay (${dueBugs.length})` },
          { key: 'grammar', label: 'Ngữ pháp' },
          { key: 'vocabulary', label: 'Từ vựng' },
          { key: 'reading', label: 'Đọc hiểu' },
          { key: 'listening', label: 'Nghe hiểu' },
          { key: 'resolved', label: 'Đã thuộc' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap tabular-nums cursor-pointer ${
              filter === tab.key
                ? 'bg-white text-pink-700 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bug List */}
      <div className="space-y-4">
        {filteredBugs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-pink-200/80 space-y-3">
            <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-800">
              Không có câu lỗi nào trong mục này
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Khi bạn làm bài trắc nghiệm và chọn sai đáp án, câu hỏi sẽ tự động được đưa vào danh sách này.
            </p>
          </div>
        ) : (
          filteredBugs.map((bug) => {
            const isDue = !bug.resolved && bug.nextReviewDate <= now;
            return (
              <div
                key={bug.id}
                className="bg-white rounded-3xl p-6 border border-pink-200/80 space-y-4"
              >
                {/* Unboxed Metadata Line */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 tabular-nums border-b border-pink-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-pink-700">
                      {bug.subCategory || bug.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={isDue ? 'text-rose-600 font-bold' : 'text-stone-500'}>
                      {bug.resolved
                        ? 'Đã thành thạo'
                        : isDue
                        ? 'Cần ôn hôm nay'
                        : 'Chưa đến hạn'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>Ngày lưu: {new Date(bug.timestamp).toLocaleDateString('vi-VN')}</span>
                    <span aria-hidden="true">·</span>
                    <span>Đã ôn {bug.reviewCount} lần</span>
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-base font-bold text-stone-900 font-['Noto_Sans_JP',sans-serif] leading-relaxed">
                  {bug.questionText}
                </h3>

                {/* Answers Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                    <div className="font-semibold text-rose-700 mb-1">
                      Lần trước bạn đã chọn sai:
                    </div>
                    <div className="font-['Noto_Sans_JP',sans-serif]">
                      {bug.options[bug.userAnswerIndex] || 'Không xác định'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <div className="font-semibold text-emerald-700 mb-1">
                      Đáp án đúng:
                    </div>
                    <div className="font-['Noto_Sans_JP',sans-serif] font-bold">
                      {bug.options[bug.correctAnswerIndex]}
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-3.5 bg-[#FFF7F8] rounded-xl border border-pink-200/70 text-xs text-stone-700 leading-relaxed whitespace-pre-line font-['Noto_Sans_JP','Plus_Jakarta_Sans',sans-serif]">
                  <span className="font-bold text-pink-800">Giải thích: </span>
                  {bug.explanation}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-pink-100">
                  <button
                    type="button"
                    onClick={() => onToggleResolveBug(bug.id)}
                    className="text-xs text-stone-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        bug.resolved ? 'text-emerald-600 fill-emerald-100' : 'text-stone-400'
                      }`}
                    />
                    <span>{bug.resolved ? 'Đã thành thạo' : 'Đánh dấu đã thuộc'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDeleteBug(bug.id)}
                      aria-label={`Xóa câu ${bug.questionText} khỏi Bug Tracker`}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartReview([bug])}
                      className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Làm lại câu này</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
