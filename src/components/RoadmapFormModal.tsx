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

  const ratingFields: { key: keyof Omit<ConfidenceAssessment, 'notes'>; label: string; desc: string }[] = [
    { key: 'kanji', label: '1. Kanji (Hán tự)', desc: 'Cách đọc Hán tự, tìm Hán tự đúng' },
    { key: 'vocabulary', label: '2. Từ vựng (Goi)', desc: 'Từ đồng nghĩa, cách dùng từ trong câu' },
    { key: 'grammarMondai1_2', label: '3. Ngữ pháp Mondai 1 & 2', desc: 'Chọn hình thức ngữ pháp, cấu trúc câu' },
    {
      key: 'grammarMondai3_4_5',
      label: '4. Ngữ pháp Mondai 3-4-5 (Dấu sao ★ & Đoạn văn)',
      desc: 'Sắp xếp trật tự từ có dấu sao, ngữ pháp trong bài văn',
    },
    { key: 'readingShort', label: '5. Đọc hiểu Đoản văn (Ngắn)', desc: 'Nội dung ngắn, thông báo, chỉ dẫn' },
    {
      key: 'readingMediumLong',
      label: '6. Đọc hiểu Trung & Trường văn (Vừa & Dài)',
      desc: 'Tìm ý kiến tác giả, phân tích lý do, tổng hợp thông tin',
    },
    { key: 'listening', label: '7. Nghe hiểu (Choukai)', desc: 'Nắm bắt ý chính, phản xạ hội thoại tức thì' },
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
              <h2 className="text-xl font-bold text-stone-800">Cấu hình Lộ trình AI</h2>
              <p className="text-xs text-stone-500">
                Đánh giá mức độ tự tin để Gemini AI tính toán bài tập trọng tâm cho hôm nay.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
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

          {/* Confidence Ratings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-stone-700">
                Đánh giá mức độ tự tin từng phần:
              </label>
              <span className="text-xs text-stone-400">1 sao = Rất yếu, 5 sao = Rất vững</span>
            </div>

            <div className="space-y-3 bg-pink-50/40 p-4 rounded-2xl border border-pink-100">
              {ratingFields.map((field) => {
                const currentScore = confidence[field.key] as number;
                return (
                  <div
                    key={field.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-pink-100/60 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-800">{field.label}</div>
                      <div className="text-[11px] text-stone-500">{field.desc}</div>
                    </div>
                    {/* Star selector */}
                    <div className="flex items-center gap-1 mt-1 sm:mt-0">
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
                      <span className="text-xs font-bold text-stone-600 ml-1.5 min-w-[20px]">
                        {currentScore}/5
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personal Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              Ghi chú cụ thể của bạn (Ví dụ: "Kanji vững, Yếu Mondai 3-4-5 và Đọc hiểu"):
            </label>
            <textarea
              rows={2}
              value={confidence.notes}
              onChange={(e) => setConfidence({ ...confidence, notes: e.target.value })}
              placeholder="VD: Em rất hay bị lừa ở dạng sắp xếp câu dấu sao và đọc đoạn văn dài..."
              className="w-full px-4 py-2.5 bg-pink-50/50 border border-pink-200 rounded-xl text-xs md:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent placeholder:text-stone-400"
            />
          </div>

          {/* Spaced Repetition notice */}
          {pendingBugsCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
              <span>
                💡 Bug Tracker đang có <strong>{pendingBugsCount} câu sai</strong> cần làm lại. AI sẽ tự động xếp vào lộ trình hôm nay.
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
              className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-pink-200 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini AI đang lập lộ trình...</span>
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
