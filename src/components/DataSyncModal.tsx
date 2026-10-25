import React, { useState } from 'react';
import {
  X,
  Upload,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { KnowledgeBaseData } from '../types';
import { parseVocabBackupJson, parseGrammarBackupJson } from '../utils/studyLogic';
import {
  pullVocabFromFirebaseByUid,
  pullGrammarFromFirebaseByUid,
  signInAndPullVocabCloud,
  signInAndPullGrammarCloud,
} from '../utils/firebaseExternalSync';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBase: KnowledgeBaseData;
  vocabUid?: string;
  grammarUid?: string;
  onUpdateKnowledgeBase: (
    updated: Partial<KnowledgeBaseData>,
    uids?: { vocabUid?: string; grammarUid?: string },
    regenerateRoadmap?: boolean
  ) => Promise<void>;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({
  isOpen,
  onClose,
  knowledgeBase,
  vocabUid: initialVocabUid = '',
  grammarUid: initialGrammarUid = '',
  onUpdateKnowledgeBase,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'firebase'>('backup');
  const [vocabUid, setVocabUid] = useState(initialVocabUid);
  const [grammarUid, setGrammarUid] = useState(initialGrammarUid);
  const [autoRegenerate, setAutoRegenerate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVocabFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = parseVocabBackupJson(json);

      await onUpdateKnowledgeBase(
        {
          vocabulary: parsed.vocabulary,
          vocabReviewHistory: parsed.reviewHistory,
          lastSyncedVocabAt: Date.now(),
          syncSourceVocab: `File: ${file.name} (${parsed.vocabulary.length} từ)`,
        },
        undefined,
        autoRegenerate
      );

      setStatusMessage(
        `Đã nạp thành công ${parsed.vocabulary.length} từ vựng từ file "${file.name}".`
      );
    } catch (err: any) {
      setError(err?.message || 'Không thể đọc file Backup Từ vựng.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleGrammarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = parseGrammarBackupJson(json);

      await onUpdateKnowledgeBase(
        {
          grammars: parsed.grammars,
          grammarReviewHistory: parsed.reviewHistory,
          lastSyncedGrammarAt: Date.now(),
          syncSourceGrammar: `File: ${file.name} (${parsed.grammars.length} mẫu)`,
        },
        undefined,
        autoRegenerate
      );

      setStatusMessage(
        `Đã nạp thành công ${parsed.grammars.length} mẫu ngữ pháp từ file "${file.name}".`
      );
    } catch (err: any) {
      setError(err?.message || 'Không thể đọc file Backup Ngữ pháp.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleGoogleSignInVocab = async () => {
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const res = await signInAndPullVocabCloud();
      setVocabUid(res.uid);
      await onUpdateKnowledgeBase(
        {
          vocabulary: res.vocabulary,
          vocabReviewHistory: res.reviewHistory,
          lastSyncedVocabAt: Date.now(),
          syncSourceVocab: `Firebase Cloud (${res.email || res.uid}) · ${res.vocabulary.length} từ`,
        },
        { vocabUid: res.uid },
        autoRegenerate
      );
      setStatusMessage(
        `Đồng bộ đám mây OnTapTuVung thành công: ${res.vocabulary.length} từ vựng.`
      );
    } catch (err: any) {
      setError(
        `Lưu ý kết nối Popup Google (${err?.code || 'Auth'}): Nếu domain xem trước chưa được thêm vào Authorized Domains của Firebase, bạn có thể nhập trực tiếp UID ở ô bên dưới hoặc dùng tab Nhập File Backup JSON.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInGrammar = async () => {
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const res = await signInAndPullGrammarCloud();
      setGrammarUid(res.uid);
      await onUpdateKnowledgeBase(
        {
          grammars: res.grammars,
          grammarReviewHistory: res.reviewHistory,
          lastSyncedGrammarAt: Date.now(),
          syncSourceGrammar: `Firebase Cloud (${res.email || res.uid}) · ${res.grammars.length} mẫu`,
        },
        { grammarUid: res.uid },
        autoRegenerate
      );
      setStatusMessage(
        `Đồng bộ đám mây OnTapNguPhap thành công: ${res.grammars.length} mẫu ngữ pháp.`
      );
    } catch (err: any) {
      setError(
        `Lưu ý kết nối Popup Google (${err?.code || 'Auth'}): Nếu domain xem trước chưa được thêm vào Authorized Domains của Firebase, bạn có thể nhập trực tiếp UID ở ô bên dưới hoặc dùng tab Nhập File Backup JSON.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePullVocabByUid = async () => {
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const res = await pullVocabFromFirebaseByUid(vocabUid);
      await onUpdateKnowledgeBase(
        {
          vocabulary: res.vocabulary,
          vocabReviewHistory: res.reviewHistory,
          lastSyncedVocabAt: Date.now(),
          syncSourceVocab: `Firebase UID (${vocabUid.slice(0, 8)}...) · ${res.vocabulary.length} từ`,
        },
        { vocabUid },
        autoRegenerate
      );
      setStatusMessage(`Đã kéo ${res.vocabulary.length} từ vựng từ Firebase tuvungjlpt.`);
    } catch (err: any) {
      setError(err?.message || 'Lỗi tải dữ liệu Từ vựng từ Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const handlePullGrammarByUid = async () => {
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const res = await pullGrammarFromFirebaseByUid(grammarUid);
      await onUpdateKnowledgeBase(
        {
          grammars: res.grammars,
          grammarReviewHistory: res.reviewHistory,
          lastSyncedGrammarAt: Date.now(),
          syncSourceGrammar: `Firebase UID (${grammarUid.slice(0, 8)}...) · ${res.grammars.length} mẫu`,
        },
        { grammarUid },
        autoRegenerate
      );
      setStatusMessage(`Đã kéo ${res.grammars.length} mẫu ngữ pháp từ Firebase nguphapjlpt.`);
    } catch (err: any) {
      setError(err?.message || 'Lỗi tải dữ liệu Ngữ pháp từ Firebase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pink-200 shadow-xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-pink-100">
          <div className="space-y-1">
            <h2 id="sync-modal-title" className="text-xl font-bold text-stone-900">
              Đồng bộ lịch sử từ OnTapTuVung & OnTapNguPhap
            </h2>
            <p className="text-xs text-stone-500">
              Nạp danh sách từ vựng, ngữ pháp và mức độ thuộc lòng (Lv1–Lv8) để AI tạo lộ trình và đề thi thực chiến.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ đồng bộ"
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Sync Status Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FFF7F8] p-4 rounded-2xl border border-pink-200/70">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Kho Từ Vựng (OnTapTuVung)</span>
              <a
                href="https://mngoc209.github.io/OnTapTuVung/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-pink-600 hover:underline font-medium"
              >
                <span>Mở web</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-base font-bold text-stone-900 tabular-nums">
              {knowledgeBase.vocabulary.length} từ vựng
            </div>
            <div className="text-xs text-stone-500 truncate">
              {knowledgeBase.syncSourceVocab || 'Chưa đồng bộ'}
            </div>
          </div>

          <div className="space-y-1 sm:border-l sm:border-pink-200/60 sm:pl-4">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Kho Ngữ Pháp (OnTapNguPhap)</span>
              <a
                href="https://mngoc209.github.io/OnTapNguPhap/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-pink-600 hover:underline font-medium"
              >
                <span>Mở web</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-base font-bold text-stone-900 tabular-nums">
              {knowledgeBase.grammars.length} cấu trúc
            </div>
            <div className="text-xs text-stone-500 truncate">
              {knowledgeBase.syncSourceGrammar || 'Chưa đồng bộ'}
            </div>
          </div>
        </div>

        {/* Mode Switcher (Interactive Segmented Control) */}
        <div className="flex items-center gap-1 p-1 bg-pink-50 border border-pink-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('backup');
              setError(null);
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white text-pink-700 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Cách 1: Nhập File Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('firebase');
              setError(null);
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'firebase'
                ? 'bg-white text-pink-700 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Cách 2: Kết nối Cloud Firebase</span>
          </button>
        </div>

        {/* Status / Error Alerts */}
        {statusMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Tab 1: Upload Backup JSON */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vocab JSON Dropzone */}
              <div className="border border-pink-200 rounded-2xl p-5 space-y-3 bg-white">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-stone-900">
                    1. File Backup Từ Vựng
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Trên web <strong>OnTapTuVung</strong>, bấm nút <strong>Xuất Backup</strong> để tải file <code className="text-pink-700">TuVung_Backup_...json</code> rồi chọn tại đây.
                  </p>
                </div>

                <label className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Chọn file JSON Từ vựng</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleVocabFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Grammar JSON Dropzone */}
              <div className="border border-pink-200 rounded-2xl p-5 space-y-3 bg-white">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-stone-900">
                    2. File Backup Ngữ Pháp
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Tải file JSON chứa <code className="text-pink-700">grammars</code>, <code className="text-pink-700">groups</code>, <code className="text-pink-700">reviewHistory</code> từ web <strong>OnTapNguPhap</strong>.
                  </p>
                </div>

                <label className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Chọn file JSON Ngữ pháp</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleGrammarFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Firebase Cloud Sync */}
        {activeTab === 'firebase' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vocab Firebase Card */}
              <div className="border border-pink-200 rounded-2xl p-5 space-y-4 bg-white">
                <div className="space-y-1">
                  <div className="text-xs text-stone-500">Project: tuvungjlpt</div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Cloud Từ Vựng (OnTapTuVung)
                  </h3>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignInVocab}
                  className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>Đăng nhập Google & Tải Từ vựng</span>
                </button>

                <div className="pt-3 border-t border-pink-100 space-y-2">
                  <label
                    htmlFor="vocab-uid-input"
                    className="block text-xs font-medium text-stone-600"
                  >
                    Hoặc tải trực tiếp bằng Firebase UID:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="vocab-uid-input"
                      type="text"
                      value={vocabUid}
                      onChange={(e) => setVocabUid(e.target.value)}
                      placeholder="Nhập UID tài khoản tuvungjlpt..."
                      className="flex-1 px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                    <button
                      type="button"
                      disabled={loading || !vocabUid.trim()}
                      onClick={handlePullVocabByUid}
                      className="px-3 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Tải về
                    </button>
                  </div>
                </div>
              </div>

              {/* Grammar Firebase Card */}
              <div className="border border-pink-200 rounded-2xl p-5 space-y-4 bg-white">
                <div className="space-y-1">
                  <div className="text-xs text-stone-500">Project: nguphapjlpt</div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Cloud Ngữ Pháp (OnTapNguPhap)
                  </h3>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignInGrammar}
                  className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>Đăng nhập Google & Tải Ngữ pháp</span>
                </button>

                <div className="pt-3 border-t border-pink-100 space-y-2">
                  <label
                    htmlFor="grammar-uid-input"
                    className="block text-xs font-medium text-stone-600"
                  >
                    Hoặc tải trực tiếp bằng Firebase UID:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="grammar-uid-input"
                      type="text"
                      value={grammarUid}
                      onChange={(e) => setGrammarUid(e.target.value)}
                      placeholder="Nhập UID tài khoản nguphapjlpt..."
                      className="flex-1 px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                    <button
                      type="button"
                      disabled={loading || !grammarUid.trim()}
                      onClick={handlePullGrammarByUid}
                      className="px-3 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Tải về
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-update roadmap toggle & Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-pink-100">
          <label className="inline-flex items-center gap-2.5 text-xs font-medium text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRegenerate}
              onChange={(e) => setAutoRegenerate(e.target.checked)}
              className="w-4 h-4 rounded accent-pink-600"
            />
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-pink-600" />
              Tự động cập nhật lại Lộ trình hôm nay ngay khi nạp dữ liệu mới
            </span>
          </label>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-end sm:self-auto"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
