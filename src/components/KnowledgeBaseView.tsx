import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  BookOpen,
  FileText,
  Headphones,
  Upload,
  Loader2,
  Play,
} from 'lucide-react';
import {
  KnowledgeBaseData,
  ImportedVocabItem,
  ImportedGrammarItem,
  QuizFormatType,
} from '../types';
import { computeKnowledgeStats, computeItemPriorityScore } from '../utils/studyLogic';

interface KnowledgeBaseViewProps {
  knowledgeBase: KnowledgeBaseData;
  onOpenSyncModal: () => void;
  onStartTargetedQuiz: (
    quizFormat: QuizFormatType,
    vocabItems: ImportedVocabItem[],
    grammarItems: ImportedGrammarItem[],
    customTitle: string
  ) => Promise<void>;
  onChangeVocabLevel: (id: string, newLevel: number) => void;
  onChangeGrammarLevel: (id: string, newLevel: number) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  knowledgeBase,
  onOpenSyncModal,
  onStartTargetedQuiz,
  onChangeVocabLevel,
  onChangeGrammarLevel,
}) => {
  const [sourceFilter, setSourceFilter] = useState<'all' | 'vocab' | 'grammar'>('all');
  const [levelFilter, setLevelFilter] = useState<'priority' | 'weak_1_3' | 'due' | 'mastered_4_8' | 'all'>('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingFormat, setGeneratingFormat] = useState<QuizFormatType | null>(null);

  const now = Date.now();
  const stats = useMemo(
    () => computeKnowledgeStats(knowledgeBase.vocabulary, knowledgeBase.grammars, now),
    [knowledgeBase.vocabulary, knowledgeBase.grammars, now]
  );

  const filteredVocab = useMemo(() => {
    if (sourceFilter === 'grammar') return [];
    const q = searchQuery.trim().toLowerCase();

    return knowledgeBase.vocabulary
      .filter((v) => {
        if (v.level === 9) return false;
        const isDue = (v.learned || v.level > 0) && v.nextReview > 0 && v.nextReview <= now;
        const isWeak = v.level >= 1 && v.level <= 3;

        if (levelFilter === 'priority' && !isWeak && !isDue) return false;
        if (levelFilter === 'weak_1_3' && !isWeak) return false;
        if (levelFilter === 'due' && !isDue) return false;
        if (levelFilter === 'mastered_4_8' && !(v.level >= 4 && v.level <= 8)) return false;

        if (q) {
          return (
            v.word.toLowerCase().includes(q) ||
            v.reading.toLowerCase().includes(q) ||
            v.meaning.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort(
        (a, b) =>
          computeItemPriorityScore(b.level, b.nextReview, b.learned, now) -
          computeItemPriorityScore(a.level, a.nextReview, a.learned, now)
      );
  }, [knowledgeBase.vocabulary, sourceFilter, levelFilter, searchQuery, now]);

  const filteredGrammar = useMemo(() => {
    if (sourceFilter === 'vocab') return [];
    const q = searchQuery.trim().toLowerCase();

    return knowledgeBase.grammars
      .filter((g) => {
        if (g.level === 9) return false;
        const isDue = g.level > 0 && g.nextReviewDate > 0 && g.nextReviewDate <= now;
        const isWeak = g.level >= 1 && g.level <= 3;

        if (levelFilter === 'priority' && !isWeak && !isDue) return false;
        if (levelFilter === 'weak_1_3' && !isWeak) return false;
        if (levelFilter === 'due' && !isDue) return false;
        if (levelFilter === 'mastered_4_8' && !(g.level >= 4 && g.level <= 8)) return false;

        if (q) {
          return (
            g.name.toLowerCase().includes(q) ||
            g.structure.toLowerCase().includes(q) ||
            g.meaning.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort(
        (a, b) =>
          computeItemPriorityScore(b.level, b.nextReviewDate, b.level > 0, now) -
          computeItemPriorityScore(a.level, a.nextReviewDate, a.level > 0, now)
      );
  }, [knowledgeBase.grammars, sourceFilter, levelFilter, searchQuery, now]);

  const handleGenerateClick = async (format: QuizFormatType, label: string) => {
    setGeneratingFormat(format);
    try {
      const targetV =
        filteredVocab.length > 0 ? filteredVocab.slice(0, 8) : knowledgeBase.vocabulary.slice(0, 6);
      const targetG =
        filteredGrammar.length > 0 ? filteredGrammar.slice(0, 5) : knowledgeBase.grammars.slice(0, 4);

      await onStartTargetedQuiz(format, targetV, targetG, label);
    } finally {
      setGeneratingFormat(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header & Summary Metrics */}
      <section className="bg-white border border-pink-200/80 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-pink-100">
          <div className="space-y-1">
            <div className="text-xs text-stone-500">
              OnTapTuVung · OnTapNguPhap · Tự động ưu tiên Lv1–Lv3 & Đến hạn
            </div>
            <h1 className="text-2xl font-bold text-stone-900">
              Kho Từ Vựng & Ngữ Pháp Đã Tích Hợp
            </h1>
            <p className="text-sm text-stone-600">
              AI tự động lọc các mục Level thấp (Lv1–Lv3) hoặc đến hạn ôn tập từ 2 web của bạn để chế biến thành 4 dạng đề thực chiến.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSyncModal}
            className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Nạp Backup JSON / Đồng bộ Firebase</span>
          </button>
        </div>

        {/* 4-Column Tabular Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-xs text-stone-500">Từ vựng Yếu (Lv1–Lv3)</div>
            <div className="text-2xl font-bold text-rose-600 tabular-nums">
              {stats.vocabWeakLv1_3}{' '}
              <span className="text-xs font-normal text-stone-500">
                / {stats.vocabTotal} từ
              </span>
            </div>
            <div className="text-xs text-stone-500 tabular-nums">
              Đến hạn hôm nay: {stats.vocabDueToday} từ
            </div>
          </div>

          <div className="space-y-1 lg:border-l lg:border-pink-100 lg:pl-6">
            <div className="text-xs text-stone-500">Ngữ pháp Yếu (Lv1–Lv3)</div>
            <div className="text-2xl font-bold text-rose-600 tabular-nums">
              {stats.grammarWeakLv1_3}{' '}
              <span className="text-xs font-normal text-stone-500">
                / {stats.grammarTotal} mẫu
              </span>
            </div>
            <div className="text-xs text-stone-500 tabular-nums">
              Đến hạn hôm nay: {stats.grammarDueToday} mẫu
            </div>
          </div>

          <div className="space-y-1 lg:border-l lg:border-pink-100 lg:pl-6">
            <div className="text-xs text-stone-500">Đã vững (Lv4–Lv8)</div>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              {stats.vocabMasteredLv4_8 + stats.grammarMasteredLv4_8}{' '}
              <span className="text-xs font-normal text-stone-500">mục</span>
            </div>
            <div className="text-xs text-stone-500 tabular-nums">
              {stats.vocabMasteredLv4_8} từ · {stats.grammarMasteredLv4_8} ngữ pháp
            </div>
          </div>

          <div className="space-y-1 lg:border-l lg:border-pink-100 lg:pl-6">
            <div className="text-xs text-stone-500">Đang chọn vào bộ tạo đề</div>
            <div className="text-2xl font-bold text-stone-900 tabular-nums">
              {filteredVocab.length + filteredGrammar.length}{' '}
              <span className="text-xs font-normal text-stone-500">mục tiêu</span>
            </div>
            <div className="text-xs text-stone-500 tabular-nums">
              {filteredVocab.length} từ · {filteredGrammar.length} ngữ pháp
            </div>
          </div>
        </div>
      </section>

      {/* AI Custom Question Generator Deck (4 Formats) */}
      <section className="bg-white border border-pink-200/80 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Chế biến câu hỏi JLPT N3 từ danh sách đang lọc ({filteredVocab.length} từ · {filteredGrammar.length} ngữ pháp)
            </h2>
            <p className="text-xs text-stone-500">
              Chọn 1 trong 4 dạng bài dưới đây để AI sinh đề lồng ghép trực tiếp các từ và mẫu câu đang hiển thị bên dưới.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            disabled={generatingFormat !== null}
            onClick={() =>
              handleGenerateClick(
                'vocab_synonyms_usage',
                '1. Từ vựng (Mondai 1–5): Đọc/Viết Hán tự, Điền từ, Đồng nghĩa & Cách dùng từ (用法)'
              )
            }
            className="p-4 rounded-2xl border border-pink-200 bg-[#FFF7F8] hover:bg-pink-100/70 text-left space-y-2 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-pink-700">
              <Sparkles className="w-4 h-4" />
              {generatingFormat === 'vocab_synonyms_usage' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </div>
            <div className="text-sm font-bold text-stone-900">
              1. Từ vựng (Mondai 1–5)
            </div>
            <div className="text-xs text-stone-600 leading-relaxed">
              M1: Đọc Kanji · M2: Viết Kanji · M3: Điền từ · M4: Đồng nghĩa · M5: Cách dùng từ (用法).
            </div>
          </button>

          <button
            type="button"
            disabled={generatingFormat !== null}
            onClick={() =>
              handleGenerateClick(
                'grammar_mondai_3_4',
                '2. Ngữ pháp (Mondai 1–3): Câu đơn, Sắp xếp dấu sao ★ & Đục lỗ đoạn văn'
              )
            }
            className="p-4 rounded-2xl border border-pink-200 bg-[#FFF7F8] hover:bg-pink-100/70 text-left space-y-2 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-pink-700">
              <FileText className="w-4 h-4" />
              {generatingFormat === 'grammar_mondai_3_4' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </div>
            <div className="text-sm font-bold text-stone-900">
              2. Ngữ pháp (Mondai 1–3)
            </div>
            <div className="text-xs text-stone-600 leading-relaxed">
              M1: Ngữ pháp câu đơn · M2: Sắp xếp câu dấu sao ★ · M3: Ngữ pháp đục lỗ đoạn văn.
            </div>
          </button>

          <button
            type="button"
            disabled={generatingFormat !== null}
            onClick={() =>
              handleGenerateClick(
                'reading_integrated',
                '3. Đọc hiểu (Mondai 4–7): Đoản văn, Trung văn, Trường văn & Tìm kiếm thông tin'
              )
            }
            className="p-4 rounded-2xl border border-pink-200 bg-[#FFF7F8] hover:bg-pink-100/70 text-left space-y-2 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-pink-700">
              <BookOpen className="w-4 h-4" />
              {generatingFormat === 'reading_integrated' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </div>
            <div className="text-sm font-bold text-stone-900">
              3. Đọc hiểu (Mondai 4–7)
            </div>
            <div className="text-xs text-stone-600 leading-relaxed">
              M4: Đoản văn (150 chữ) · M5: Trung văn (350 chữ) · M6: Trường văn · M7: Tìm thông tin.
            </div>
          </button>

          <button
            type="button"
            disabled={generatingFormat !== null}
            onClick={() =>
              handleGenerateClick(
                'listening_dialogue',
                '4. Nghe hiểu (Mondai 1–5): Nghe nhiệm vụ, Điểm chính, Khái quát, Giao tiếp & Phản xạ'
              )
            }
            className="p-4 rounded-2xl border border-pink-200 bg-[#FFF7F8] hover:bg-pink-100/70 text-left space-y-2 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-pink-700">
              <Headphones className="w-4 h-4" />
              {generatingFormat === 'listening_dialogue' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </div>
            <div className="text-sm font-bold text-stone-900">
              4. Nghe hiểu (Mondai 1–5)
            </div>
            <div className="text-xs text-stone-600 leading-relaxed">
              M1: Nhiệm vụ · M2: Điểm chính · M3: Khái quát · M4: Tình huống · M5: Phản xạ nhanh.
            </div>
          </button>
        </div>
      </section>

      {/* Filter Bar & Table List */}
      <section className="bg-white border border-pink-200/80 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Source Segmented Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-pink-50 border border-pink-200/60 rounded-xl">
              {(
                [
                  { id: 'all', label: 'Tất cả nguồn' },
                  { id: 'vocab', label: 'Từ vựng (OnTapTuVung)' },
                  { id: 'grammar', label: 'Ngữ pháp (OnTapNguPhap)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSourceFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    sourceFilter === tab.id
                      ? 'bg-white text-pink-700 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Level / Priority Segmented Filter */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl overflow-x-auto">
              {(
                [
                  { id: 'priority', label: 'Ưu tiên (Lv1–3 & Đến hạn)' },
                  { id: 'weak_1_3', label: 'Chỉ Lv1–Lv3' },
                  { id: 'due', label: 'Đến hạn hôm nay' },
                  { id: 'mastered_4_8', label: 'Đã vững (Lv4–8)' },
                  { id: 'all', label: 'Tất cả Level' },
                ] as const
              ).map((lf) => (
                <button
                  key={lf.id}
                  type="button"
                  onClick={() => setLevelFilter(lf.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    levelFilter === lf.id
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {lf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ vựng, cấu trúc, ý nghĩa..."
              aria-label="Tìm từ vựng, cấu trúc, ý nghĩa"
              className="w-full pl-9 pr-4 py-2 bg-pink-50/40 border border-pink-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
        </div>

        {/* Grammar List Section */}
        {sourceFilter !== 'vocab' && filteredGrammar.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-800 border-b border-pink-100 pb-2 tabular-nums">
              Cấu trúc Ngữ pháp từ OnTapNguPhap ({filteredGrammar.length})
            </h3>
            <div className="divide-y divide-pink-100">
              {filteredGrammar.map((g) => {
                const isDue = g.level > 0 && g.nextReviewDate > 0 && g.nextReviewDate <= now;
                return (
                  <div
                    key={g.id}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-pink-50/20 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 tabular-nums">
                        <span
                          className={
                            g.level <= 3 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'
                          }
                        >
                          Level {g.level}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{isDue ? 'Đến hạn ôn hôm nay' : 'Chưa đến hạn'}</span>
                        {g.groupName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Nhóm: {g.groupName}</span>
                          </>
                        )}
                        {g.sourceName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Nguồn: {g.sourceName}</span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <span className="text-base font-bold text-stone-900 font-['Noto_Sans_JP',sans-serif]">
                          {g.name}
                        </span>
                        {g.structure && (
                          <span className="text-xs text-pink-700 font-medium font-['Noto_Sans_JP',sans-serif]">
                            [{g.structure}]
                          </span>
                        )}
                        <span className="text-sm text-stone-700">— {g.meaning}</span>
                      </div>

                      {g.similarText && (
                        <p className="text-xs text-stone-500">
                          Phân biệt: {g.similarText}
                        </p>
                      )}
                    </div>

                    {/* Level Selector */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label htmlFor={`gram-lv-${g.id}`} className="text-xs text-stone-500">
                        Đổi Level:
                      </label>
                      <select
                        id={`gram-lv-${g.id}`}
                        value={g.level}
                        onChange={(e) => onChangeGrammarLevel(g.id, Number(e.target.value))}
                        className="px-2.5 py-1 bg-white border border-pink-200 rounded-lg text-xs font-semibold text-stone-800 tabular-nums cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((lv) => (
                          <option key={lv} value={lv}>
                            Lv{lv}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vocabulary List Section */}
        {sourceFilter !== 'grammar' && filteredVocab.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-stone-800 border-b border-pink-100 pb-2 tabular-nums">
              Từ vựng từ OnTapTuVung ({filteredVocab.length})
            </h3>
            <div className="divide-y divide-pink-100">
              {filteredVocab.map((v) => {
                const isDue = (v.learned || v.level > 0) && v.nextReview > 0 && v.nextReview <= now;
                return (
                  <div
                    key={v.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-pink-50/20 transition-colors"
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2 text-xs text-stone-500 tabular-nums">
                        <span
                          className={
                            v.level <= 3 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'
                          }
                        >
                          Level {v.level}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{isDue ? 'Đến hạn ôn hôm nay' : 'Đang tích lũy'}</span>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <span className="text-base font-bold text-stone-900 font-['Noto_Sans_JP',sans-serif]">
                          {v.word}
                        </span>
                        <span className="text-xs text-pink-700 font-medium font-['Noto_Sans_JP',sans-serif]">
                          （{v.reading}）
                        </span>
                        <span className="text-sm text-stone-700">— {v.meaning}</span>
                      </div>
                    </div>

                    {/* Level Selector */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label htmlFor={`vocab-lv-${v.id}`} className="text-xs text-stone-500">
                        Đổi Level:
                      </label>
                      <select
                        id={`vocab-lv-${v.id}`}
                        value={v.level}
                        onChange={(e) => onChangeVocabLevel(v.id, Number(e.target.value))}
                        className="px-2.5 py-1 bg-white border border-pink-200 rounded-lg text-xs font-semibold text-stone-800 tabular-nums cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((lv) => (
                          <option key={lv} value={lv}>
                            Lv{lv}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredVocab.length === 0 && filteredGrammar.length === 0 && (
          <div className="py-12 text-center space-y-3">
            <div className="text-base font-bold text-stone-800">
              Không tìm thấy từ vựng hoặc ngữ pháp nào khớp với bộ lọc hiện tại
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Bạn có thể chuyển bộ lọc sang &ldquo;Tất cả Level&rdquo; hoặc nạp thêm file Backup JSON từ OnTapTuVung và OnTapNguPhap.
            </p>
            <button
              type="button"
              onClick={() => setLevelFilter('all')}
              className="px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Xem tất cả Level
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
