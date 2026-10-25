import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Loader2,
  Clock,
  Award,
} from 'lucide-react';
import { DailyProgressReport, DailyStudyLog } from '../types';

interface EveningReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyProgressReport;
  studyLog: DailyStudyLog;
  onGenerateNextDayRoadmap: (report: DailyProgressReport) => Promise<void>;
}

export const EveningReportModal: React.FC<EveningReportModalProps> = ({
  isOpen,
  onClose,
  report,
  studyLog,
  onGenerateNextDayRoadmap,
}) => {
  const [isGeneratingNextDay, setIsGeneratingNextDay] = useState(false);

  if (!isOpen) return null;

  const handleApplyToNextDay = async () => {
    setIsGeneratingNextDay(true);
    try {
      await onGenerateNextDayRoadmap(report);
      onClose();
    } finally {
      setIsGeneratingNextDay(false);
    }
  };

  const skillNameMap: Record<string, string> = {
    vocabulary: 'Từ vựng (Goi)',
    grammar: 'Ngữ pháp (Bunpou)',
    reading: 'Đọc hiểu (Dokkai)',
    listening: 'Nghe hiểu (Choukai)',
    review: 'Khắc phục Bug Tracker',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evening-report-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 border border-pink-200 shadow-xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-pink-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-700">
              <Clock className="w-3.5 h-3.5 text-pink-600" />
              <span>Báo cáo tổng kết định kỳ 19:00 · Ngày {report.date}</span>
            </div>
            <h2 id="evening-report-title" className="text-xl md:text-2xl font-bold text-stone-900">
              Đánh giá Điểm mạnh, Tiến bộ & Điểm yếu hôm nay
            </h2>
            <p className="text-xs text-stone-500">
              Tổng hợp toàn bộ nhiệm vụ chính, các bài luyện thêm ngoài lộ trình và lịch sử OnTapTuVung / OnTapNguPhap để thiết kế lộ trình ngày kế tiếp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-pink-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FFF7F8] p-4 rounded-2xl border border-pink-200/70 tabular-nums">
          <div className="space-y-1">
            <div className="text-xs text-stone-500">Độ chính xác hôm nay</div>
            <div className="text-2xl font-extrabold text-pink-600">
              {report.overallAccuracy}%
            </div>
            <div className="text-xs text-stone-600">{report.completedTasksSummary}</div>
          </div>

          <div className="space-y-1 sm:border-l sm:border-pink-200/60 sm:pl-4">
            <div className="text-xs text-stone-500">Bài ôn thêm ngoài lộ trình</div>
            <div className="text-2xl font-extrabold text-stone-900">
              {studyLog.bonusSessions.length} bài
            </div>
            <div className="text-xs text-stone-600 line-clamp-1">{report.bonusPracticeSummary}</div>
          </div>

          <div className="space-y-1 sm:border-l sm:border-pink-200/60 sm:pl-4">
            <div className="text-xs text-stone-500">Mục kiến thức tăng Level</div>
            <div className="text-2xl font-extrabold text-emerald-700">
              +{studyLog.improvedItems.length} mục
            </div>
            <div className="text-xs text-stone-600">Đồng bộ OnTapTuVung & NguPhap</div>
          </div>
        </div>

        {/* Skill Breakdown Bars */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-stone-800">
            Tỷ lệ làm đúng theo từng kỹ năng hôm nay:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
            {Object.entries(report.skillAccuracyMap).map(([skillKey, acc]) => (
              <div
                key={skillKey}
                className="p-3 rounded-xl border border-pink-100 bg-white space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700">
                    {skillNameMap[skillKey] || skillKey}
                  </span>
                  <span
                    className={`font-bold ${
                      acc >= 75
                        ? 'text-emerald-700'
                        : acc < 65
                        ? 'text-rose-600'
                        : 'text-amber-700'
                    }`}
                  >
                    {acc}%
                  </span>
                </div>
                <div className="w-full bg-pink-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      acc >= 75
                        ? 'bg-emerald-600'
                        : acc < 65
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, acc))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2 Columns: Strengths & Improvements vs Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Strengths & What Improved */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Điểm mạnh & Đã tiến bộ hôm nay</span>
            </div>
            <ul className="space-y-2 text-xs text-stone-700">
              {report.strengths.map((item, idx) => (
                <li key={`str_${idx}`} className="flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
              {report.improvements.map((item, idx) => (
                <li key={`imp_${idx}`} className="flex items-start gap-2 leading-relaxed">
                  <Award className="w-3.5 h-3.5 text-pink-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Weaknesses & Bottlenecks */}
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Còn yếu & Cần khắc phục ngày mai</span>
            </div>
            <ul className="space-y-2 text-xs text-stone-700">
              {report.weaknesses.map((item, idx) => (
                <li key={`weak_${idx}`} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next-Day Adaptive Strategy */}
        <div className="p-5 rounded-2xl border border-pink-200 bg-[#FFF7F8] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-pink-800">
            <Sparkles className="w-4 h-4 text-pink-600" />
            <span>Đề xuất điều chỉnh cho Lộ trình Ngày kế tiếp (Dựa trên lộ trình hôm nay & báo cáo 19:00):</span>
          </div>
          <ul className="space-y-1.5 text-xs text-stone-700 list-disc pl-4">
            {report.nextDayAdjustments.map((adj, idx) => (
              <li key={idx} className="leading-relaxed">
                {adj}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-pink-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Để sau
          </button>

          <button
            type="button"
            disabled={isGeneratingNextDay}
            onClick={handleApplyToNextDay}
            className="w-full sm:w-auto px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            {isGeneratingNextDay ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI đang thiết kế Lộ trình Ngày kế tiếp...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Tạo ngay Lộ trình Ngày kế tiếp từ Báo cáo 19:00 này</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
