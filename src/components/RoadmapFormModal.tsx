import React, { useState } from 'react';
import { X, Sparkles, Calendar, Star, AlertCircle, Loader2 } from 'lucide-react';
import { ConfidenceAssessment } from '../types';

interface RoadmapFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  examDate: string;
  confidence: ConfidenceAssessment;
  pendingBugsCount: number;
  onGenerateRoadmap: (data: { examDate: string; confidence: ConfidenceAssessment }) => Promise<void>;
}

export const RoadmapFormModal: React.FC<RoadmapFormModalProps> = ({
  isOpen,
  onClose,
  examDate: initialExamDate,
  confidence: initialConfidence,
  pendingBugsCount,
  onGenerateRoadmap,
}) => {
  const [examDate, setExamDate] = useState(initialExamDate);
  const [confidence, setConfidence] = useState<ConfidenceAssessment>(initialConfidence);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStarClick = (key: keyof Omit<ConfidenceAssessment, 'notes'>, val: number) => {
    setConfidence((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onGenerateRoadmap({ examDate, confidence });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi gọi AI Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const sectionGroups: {
    groupTitle: string;
    groupSubtitle: string;
    items: { key: keyof Omit<ConfidenceAssessment, 'notes'>; label: string; desc: string }[];
  }[] = [
    {
      groupTitle: 'Mục 1: Từ vựng – Hán tự (文字・語彙 · 5 Mondai)',
      groupSubtitle: 'Đánh giá riêng nhóm Hán tự (Mondai 1–2) và nhóm Từ vựng ngữ cảnh (Mondai 3–4–5)',
      items: [
        {
          key: 'kanji',
          label: 'Từ vựng · Mondai 1 & Mondai 2 (Hán tự)',
          desc: 'Mondai 1: Cách đọc Kanji sang Hiragana (漢字読み) · Mondai 2: Chọn chữ Kanji đúng cho từ Hiragana (表記)',
        },
        {
          key: 'vocabulary',
          label: 'Từ vựng · Mondai 3, Mondai 4 & Mondai 5 (Từ vựng)',
          desc: 'Mondai 3: Điền từ ngữ cảnh (文脈規定) · Mondai 4: Tìm từ đồng nghĩa (類義) · Mondai 5: Cách dùng từ đúng trong câu (用法)',
        },
      ],
    },
    {
      groupTitle: 'Mục 2: Ngữ pháp (文法 · 3 Mondai)',
      groupSubtitle: 'Đánh giá riêng câu đơn và nhóm Sắp xếp dấu sao ★ / Đục lỗ đoạn văn',
      items: [
        {
          key: 'grammarMondai1_2',
          label: 'Ngữ pháp · Mondai 1 (Ngữ pháp câu đơn)',
          desc: 'Mondai 1: Chọn cấu trúc ngữ pháp, trợ từ, thể bị động/sai khiến/kính ngữ điền vào câu (文法形式の判断)',
        },
        {
          key: 'grammarMondai3_4_5',
          label: 'Ngữ pháp · Mondai 2 (Dấu sao ★) & Mondai 3 (Đục lỗ đoạn văn)',
          desc: 'Mondai 2: Ghép 4 mảnh câu vào vị trí dấu sao ★ (文の組み立て) · Mondai 3: Ngữ pháp theo mạch đoạn văn (文章の文法)',
        },
      ],
    },
    {
      groupTitle: 'Mục 3: Đọc hiểu (読解 · 4 Mondai)',
      groupSubtitle: 'Đánh giá nhóm đọc nhanh và nhóm phân tích sâu bài dài',
      items: [
        {
          key: 'readingShort',
          label: 'Đọc hiểu · Mondai 4 (Đoản văn) & Mondai 7 (Tìm kiếm thông tin)',
          desc: 'Mondai 4: Bài ngắn 150 chữ (Email, Thông báo) · Mondai 7: Tra cứu tờ rơi, bảng giá, lịch sự kiện (情報検索)',
        },
        {
          key: 'readingMediumLong',
          label: 'Đọc hiểu · Mondai 5 (Trung văn) & Mondai 6 (Trường văn)',
          desc: 'Mondai 5: Bài vừa 350 chữ · Mondai 6: Bài dài 550 chữ (Phân tích nguyên nhân và luận điểm tác giả)',
        },
      ],
    },
    {
      groupTitle: 'Mục 4: Nghe hiểu (聴解 · 5 Mondai)',
      groupSubtitle: 'Bao gồm toàn bộ 5 Mondai trong đề thi Nghe JLPT N3',
      items: [
        {
          key: 'listening',
          label: 'Nghe hiểu · Mondai 1, 2, 3, 4 & 5 (Toàn bộ kỹ năng Choukai)',
          desc: 'Mondai 1: Nghe nhiệm vụ · Mondai 2: Nghe điểm chính · Mondai 3: Nghe khái quát · Mondai 4: Giao tiếp tình huống · Mondai 5: Phản xạ nhanh tức thì',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pink-200 shadow-xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
              <Sparkles className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-800">
                Cấu hình Lộ trình AI (Chia rõ 4 Kỹ năng & 17 Mondai)
              </h2>
              <p className="text-xs text-stone-500">
                Đánh giá mức độ tự tin từng Mondai để AI phân bổ bài tập chính xác cho hôm nay.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-600" />
              <span>Ngày thi mục tiêu (Exam Date):</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="px-4 py-2.5 bg-pink-50/50 border border-pink-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
              <span className="text-xs text-stone-500">
                (Kỳ thi JLPT tháng 12 thường diễn ra vào Chủ Nhật đầu tiên, VD: 06/12)
              </span>
            </div>
          </div>

          {/* Grouped Confidence Ratings by the 4 JLPT Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-stone-700">
                Đánh giá mức độ tự tin theo 4 Mục & từng Mondai:
              </label>
              <span className="text-xs text-stone-500">1 sao = Rất yếu · 5 sao = Rất vững</span>
            </div>

            <div className="space-y-4">
              {sectionGroups.map((group) => (
                <div
                  key={group.groupTitle}
                  className="bg-pink-50/60 p-4 rounded-2xl border border-pink-200/70 space-y-3"
                >
                  <div className="border-b border-pink-200/60 pb-2">
                    <div className="text-xs md:text-sm font-bold text-pink-800">
                      {group.groupTitle}
                    </div>
                    <div className="text-[11px] text-stone-500">{group.groupSubtitle}</div>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((field) => {
                      const currentScore = confidence[field.key] as number;
                      return (
                        <div
                          key={field.key}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-pink-100 last:border-0 last:pb-0"
                        >
                          <div className="space-y-0.5 flex-1">
                            <div className="text-xs font-bold text-stone-900">{field.label}</div>
                            <div className="text-[11px] text-stone-600 leading-relaxed">
                              {field.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 tabular-nums">
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => handleStarClick(field.key, starVal)}
                                className="p-1 text-stone-300 hover:text-amber-400 focus:outline-none transition-colors cursor-pointer"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    starVal <= currentScore
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-stone-300'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-stone-700 ml-1.5 min-w-[24px]">
                              {currentScore}/5
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              Ghi chú cụ thể của bạn:
            </label>
            <textarea
              rows={2}
              value={confidence.notes}
              onChange={(e) => setConfidence({ ...confidence, notes: e.target.value })}
              placeholder="VD: Em rất hay bị lừa ở Ngữ pháp Mondai 2 (Sắp xếp dấu sao ★) và Đọc hiểu Mondai 5 (Trung văn)..."
              className="w-full px-4 py-2.5 bg-pink-50/50 border border-pink-200 rounded-xl text-xs md:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent placeholder:text-stone-400"
            />
          </div>

          {pendingBugsCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
              <span>
                Bug Tracker đang có <strong>{pendingBugsCount} câu sai</strong> cần làm lại. AI sẽ tự động xếp vào Mục 0 đầu lộ trình hôm nay.
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs md:text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lập lộ trình...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo Lộ Trình Hôm Nay Với AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
