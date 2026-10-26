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
  Trash2,
  Copy,
  Sparkles,
  ClipboardPaste,
} from 'lucide-react';
import { KnowledgeBaseData } from '../types';
import {
  parseVocabBackupJson,
  parseGrammarBackupJson,
  extractGrammarSourcesSummary,
} from '../utils/studyLogic';
import {
  pullVocabFromFirebaseByUid,
  pullGrammarFromFirebaseByUid,
  signInAndPullVocabCloud,
  signInAndPullGrammarCloud,
  inspectSharedBrowserStorage,
  pullFromSharedBrowserStorage,
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
  onToggleGrammarSource?: (sourceName: string) => void;
  onClearAllData?: () => void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({
  isOpen,
  onClose,
  knowledgeBase,
  vocabUid: initialVocabUid = '',
  grammarUid: initialGrammarUid = '',
  onUpdateKnowledgeBase,
  onToggleGrammarSource,
  onClearAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'firebase'>('backup');
  const [vocabUid, setVocabUid] = useState(initialVocabUid);
  const [grammarUid, setGrammarUid] = useState(initialGrammarUid);
  const [autoRegenerate, setAutoRegenerate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  if (!isOpen) return null;

  const sharedStorageInfo = inspectSharedBrowserStorage();

  const grammarSourcesSummary = extractGrammarSourcesSummary(
    knowledgeBase.grammars,
    knowledgeBase.grammarSources
  );
  const activeGrammarSources =
    knowledgeBase.selectedGrammarSources ?? grammarSourcesSummary.map((s) => s.name);

  const handleCopyText = (key: string, text: string) => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleInstantBrowserSync = async () => {
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const { vocabResult, grammarResult } = pullFromSharedBrowserStorage();
      if (!vocabResult && !grammarResult) {
        setError(
          'Không tìm thấy dữ liệu lưu sẵn trên domain trình duyệt hiện tại. Nếu bạn đang mở trên môi trường xem trước (khác domain mngoc209.github.io), hãy dùng "Chọn file JSON" hoặc "Dán nhanh dữ liệu" bên dưới!'
        );
        setLoading(false);
        return;
      }

      const updates: Partial<KnowledgeBaseData> = {};
      const parts: string[] = [];

      if (vocabResult && vocabResult.vocabulary.length > 0) {
        updates.vocabulary = vocabResult.vocabulary;
        updates.vocabReviewHistory = vocabResult.reviewHistory;
        updates.lastSyncedVocabAt = Date.now();
        updates.syncSourceVocab = `Đồng bộ trực tiếp trình duyệt (${vocabResult.vocabulary.length} từ)`;
        parts.push(`${vocabResult.vocabulary.length} từ vựng`);
      }

      if (grammarResult && grammarResult.grammars.length > 0) {
        updates.grammars = grammarResult.grammars;
        updates.grammarReviewHistory = grammarResult.reviewHistory;
        updates.grammarSources = grammarResult.grammarSources;
        updates.selectedGrammarSources = grammarResult.grammarSources;
        updates.lastSyncedGrammarAt = Date.now();
        updates.syncSourceGrammar = `Đồng bộ trực tiếp trình duyệt (${grammarResult.grammars.length} mẫu · ${grammarResult.grammarSources.length} nguồn)`;
        parts.push(
          `${grammarResult.grammars.length} mẫu ngữ pháp (${grammarResult.grammarSources.length} nguồn)`
        );
      }

      await onUpdateKnowledgeBase(updates, undefined, autoRegenerate);
      setStatusMessage(
        `Đã đồng bộ trực tiếp từ trình duyệt thành công: ${parts.join(' + ')}!`
      );
    } catch (err: any) {
      setError(err?.message || 'Lỗi đọc bộ nhớ trình duyệt.');
    } finally {
      setLoading(false);
    }
  };

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
          grammarSources: parsed.grammarSources,
          selectedGrammarSources: parsed.grammarSources,
          lastSyncedGrammarAt: Date.now(),
          syncSourceGrammar: `File: ${file.name} (${parsed.grammars.length} mẫu · ${parsed.grammarSources.length} nguồn)`,
        },
        undefined,
        autoRegenerate
      );

      setStatusMessage(
        `Đã nạp thành công ${parsed.grammars.length} mẫu ngữ pháp (${parsed.grammarSources.length} nguồn: ${parsed.grammarSources.join(', ')}) từ file "${file.name}".`
      );
    } catch (err: any) {
      setError(err?.message || 'Không thể đọc file Backup Ngữ pháp.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleImportPastedJson = async () => {
    const trimmed = pastedJsonText.trim();
    if (!trimmed) return;
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const json = JSON.parse(trimmed);
      const updates: Partial<KnowledgeBaseData> = {};
      const importedParts: string[] = [];

      // Check if it contains vocabulary
      if (json.vocabulary || (Array.isArray(json) && json[0]?.word)) {
        const parsedV = parseVocabBackupJson(json);
        if (parsedV.vocabulary.length > 0) {
          updates.vocabulary = parsedV.vocabulary;
          updates.vocabReviewHistory = parsedV.reviewHistory;
          updates.lastSyncedVocabAt = Date.now();
          updates.syncSourceVocab = `Dán JSON trực tiếp (${parsedV.vocabulary.length} từ)`;
          importedParts.push(`${parsedV.vocabulary.length} từ vựng`);
        }
      }

      // Check if it contains grammars
      if (json.grammars || (Array.isArray(json) && (json[0]?.name || json[0]?.structure))) {
        const parsedG = parseGrammarBackupJson(json);
        if (parsedG.grammars.length > 0) {
          updates.grammars = parsedG.grammars;
          updates.grammarReviewHistory = parsedG.reviewHistory;
          updates.grammarSources = parsedG.grammarSources;
          updates.selectedGrammarSources = parsedG.grammarSources;
          updates.lastSyncedGrammarAt = Date.now();
          updates.syncSourceGrammar = `Dán JSON trực tiếp (${parsedG.grammars.length} mẫu · ${parsedG.grammarSources.length} nguồn)`;
          importedParts.push(
            `${parsedG.grammars.length} mẫu ngữ pháp (${parsedG.grammarSources.length} nguồn)`
          );
        }
      }

      if (importedParts.length === 0) {
        throw new Error(
          'JSON vừa dán không chứa danh sách từ vựng (vocabulary) hoặc ngữ pháp (grammars) hợp lệ.'
        );
      }

      await onUpdateKnowledgeBase(updates, undefined, autoRegenerate);
      setPastedJsonText('');
      setStatusMessage(`Đã nạp thành công: ${importedParts.join(' + ')}!`);
    } catch (err: any) {
      setError(err?.message || 'Chuỗi JSON không hợp lệ.');
    } finally {
      setLoading(false);
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
      setError(err?.message || 'Lỗi kết nối Google Firebase OnTapTuVung.');
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
          grammarSources: res.grammarSources,
          selectedGrammarSources: res.grammarSources,
          lastSyncedGrammarAt: Date.now(),
          syncSourceGrammar: `Firebase Cloud (${res.email || res.uid}) · ${res.grammars.length} mẫu · ${res.grammarSources.length} nguồn`,
        },
        { grammarUid: res.uid },
        autoRegenerate
      );
      setStatusMessage(
        `Đồng bộ đám mây OnTapNguPhap thành công: ${res.grammars.length} mẫu ngữ pháp (${res.grammarSources.length} nguồn: ${res.grammarSources.join(', ')}).`
      );
    } catch (err: any) {
      setError(err?.message || 'Lỗi kết nối Google Firebase OnTapNguPhap.');
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
          grammarSources: res.grammarSources,
          selectedGrammarSources: res.grammarSources,
          lastSyncedGrammarAt: Date.now(),
          syncSourceGrammar: `Firebase UID (${grammarUid.slice(0, 8)}...) · ${res.grammars.length} mẫu · ${res.grammarSources.length} nguồn`,
        },
        { grammarUid },
        autoRegenerate
      );
      setStatusMessage(
        `Đã kéo ${res.grammars.length} mẫu ngữ pháp (${res.grammarSources.length} nguồn: ${res.grammarSources.join(', ')}) từ Firebase nguphapjlpt.`
      );
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pink-200 shadow-xl p-6 md:p-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-pink-100">
          <div className="space-y-1">
            <h2 id="sync-modal-title" className="text-xl font-bold text-slate-900">
              Đồng bộ lịch sử từ OnTapTuVung & OnTapNguPhap
            </h2>
            <p className="text-xs text-slate-500">
              Nạp danh sách từ vựng, ngữ pháp, nguồn học và mức độ thuộc lòng (Lv1–Lv8) của bạn để tạo đề thi đúng từng dạng Mondai.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ đồng bộ"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instant 1-Click Shared Browser Sync Banner (Works automatically on mngoc209.github.io) */}
        <div className="p-4 rounded-2xl bg-pink-50/80 border border-pink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-pink-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-600" />
              <span>
                Đồng bộ 1-Click trực tiếp từ Trình duyệt (Khuyên dùng trên mngoc209.github.io)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Vì <strong>OnTapTuVung</strong>, <strong>OnTapNguPhap</strong> và <strong>LoTrinh</strong> cùng chạy trên <code className="text-pink-700 font-semibold">mngoc209.github.io</code>, bạn có thể lấy thẳng toàn bộ dữ liệu trên trình duyệt mà <strong>không cần mở cửa sổ đăng nhập Google</strong>.
              {(sharedStorageInfo.hasVocabInBrowser || sharedStorageInfo.hasGrammarInBrowser) && (
                <span className="block font-semibold text-emerald-700 mt-0.5">
                  ✓ Phát hiện có sẵn {sharedStorageInfo.vocabCount} từ vựng & {sharedStorageInfo.grammarCount} mẫu ngữ pháp trong trình duyệt này!
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleInstantBrowserSync}
            className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            Đồng bộ 1-Click ngay
          </button>
        </div>

        {/* Current Sync Status Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-pink-50/50 p-4 rounded-2xl border border-pink-200/70">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
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
            <div className="text-base font-bold text-slate-900 tabular-nums">
              {knowledgeBase.vocabulary.length} từ vựng
            </div>
            <div className="text-xs text-slate-500 truncate">
              {knowledgeBase.syncSourceVocab || 'Chưa đồng bộ (Đang trống)'}
            </div>
          </div>

          <div className="space-y-1 sm:border-l sm:border-pink-200/60 sm:pl-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
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
            <div className="text-base font-bold text-slate-900 tabular-nums">
              {knowledgeBase.grammars.length} cấu trúc
            </div>
            <div className="text-xs text-slate-500 truncate">
              {knowledgeBase.syncSourceGrammar || 'Chưa đồng bộ (Đang trống)'}
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
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
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Cách 1: Nhập File Backup JSON / Dán nhanh</span>
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
                : 'text-slate-600 hover:text-slate-900'
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

        {/* Tab 1: Upload Backup JSON or Quick Paste */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vocab JSON Dropzone */}
              <div className="border border-pink-200 rounded-2xl p-5 space-y-3 bg-white">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    1. File Backup Từ Vựng
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
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
                  <h3 className="text-sm font-bold text-slate-900">
                    2. File Backup Ngữ Pháp
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Trên web <strong>OnTapNguPhap</strong>, bấm nút <strong>Xuất dữ liệu (JSON)</strong> rồi chọn file tại đây (hỗ trợ lọc chọn nguồn học).
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

            {/* Quick Paste JSON Option */}
            <div className="border border-pink-200/80 rounded-2xl p-4 bg-pink-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPasteBox((p) => !p)}
                  className="text-xs font-bold text-pink-700 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>
                    {showPasteBox
                      ? 'Ẩn khung dán JSON trực tiếp'
                      : 'Hoặc dán trực tiếp nội dung JSON từ Clipboard (Không cần lưu thành file)'}
                  </span>
                </button>
              </div>

              {showPasteBox && (
                <div className="space-y-2.5">
                  <textarea
                    rows={3}
                    value={pastedJsonText}
                    onChange={(e) => setPastedJsonText(e.target.value)}
                    placeholder='Dán nội dung file JSON Backup Từ vựng hoặc Ngữ pháp vào đây...'
                    className="w-full p-3 bg-white border border-pink-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono"
                  />
                  <button
                    type="button"
                    disabled={!pastedJsonText.trim() || loading}
                    onClick={handleImportPastedJson}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Nạp dữ liệu JSON vừa dán
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Firebase Cloud Sync */}
        {activeTab === 'firebase' && (
          <div className="space-y-4">
            {/* Exact Solution for "The requested action is invalid." */}
            <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200 text-xs text-slate-700 space-y-2.5">
              <div className="font-bold text-pink-800">
                Vì sao cửa sổ đăng nhập Google báo &ldquo;The requested action is invalid.&rdquo; và cách mở khóa trong 10 giây:
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Khi mở Popup Google, Firebase chạy trang xác thực tại <code className="text-pink-700 font-semibold">tuvungjlpt.firebaseapp.com</code> và <code className="text-pink-700 font-semibold">nguphapjlpt.firebaseapp.com</code>. Hiện tại API Key trên <strong>Google Cloud Console → APIs &amp; Services → Credentials</strong> của bạn đang bật giới hạn <em>Website restrictions (HTTP Referrers)</em> chỉ cho phép <code className="text-pink-700">mngoc209.github.io/*</code> mà chưa thêm 2 domain của chính Firebase dưới đây:
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText('tuvung_ref', 'https://tuvungjlpt.firebaseapp.com/*')
                  }
                  className="px-2.5 py-1.5 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-[11px] font-semibold text-pink-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>
                    {copiedKey === 'tuvung_ref'
                      ? 'Đã copy!'
                      : 'Copy cho Từ vựng: https://tuvungjlpt.firebaseapp.com/*'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleCopyText('nguphap_ref', 'https://nguphapjlpt.firebaseapp.com/*')
                  }
                  className="px-2.5 py-1.5 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-[11px] font-semibold text-pink-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>
                    {copiedKey === 'nguphap_ref'
                      ? 'Đã copy!'
                      : 'Copy cho Ngữ pháp: https://nguphapjlpt.firebaseapp.com/*'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Mẹo: Nếu bạn đã đăng nhập sẵn trên <strong>mngoc209.github.io</strong>, nút bên dưới sẽ tự động kế thừa phiên đăng nhập sẵn có mà không cần mở lại Popup!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vocab Firebase Card */}
              <div className="border border-pink-200 rounded-2xl p-5 space-y-4 bg-white">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">Project: tuvungjlpt</div>
                  <h3 className="text-sm font-bold text-slate-900">
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
                    className="block text-xs font-medium text-slate-600"
                  >
                    Hoặc nhập UID tài khoản:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="vocab-uid-input"
                      type="text"
                      value={vocabUid}
                      onChange={(e) => setVocabUid(e.target.value)}
                      placeholder="Nhập UID tài khoản tuvungjlpt..."
                      className="flex-1 px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                    <button
                      type="button"
                      disabled={loading || !vocabUid.trim()}
                      onClick={handlePullVocabByUid}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Tải về
                    </button>
                  </div>
                </div>
              </div>

              {/* Grammar Firebase Card */}
              <div className="border border-pink-200 rounded-2xl p-5 space-y-4 bg-white">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">Project: nguphapjlpt</div>
                  <h3 className="text-sm font-bold text-slate-900">
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
                    className="block text-xs font-medium text-slate-600"
                  >
                    Hoặc nhập UID tài khoản:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="grammar-uid-input"
                      type="text"
                      value={grammarUid}
                      onChange={(e) => setGrammarUid(e.target.value)}
                      placeholder="Nhập UID tài khoản nguphapjlpt..."
                      className="flex-1 px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                    <button
                      type="button"
                      disabled={loading || !grammarUid.trim()}
                      onClick={handlePullGrammarByUid}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Tải về
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grammar Source Selection ("Chọn nguồn Ngữ pháp đang ôn · Bỏ nguồn không học") */}
        {grammarSourcesSummary.length > 0 && onToggleGrammarSource && (
          <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-200/80 space-y-2.5">
            <div className="text-xs font-bold text-pink-800">
              Chọn nguồn Ngữ pháp đưa vào lộ trình ({activeGrammarSources.length}/{grammarSourcesSummary.length} nguồn đang bật)
            </div>
            <p className="text-[11px] text-slate-600">
              Bấm vào từng nguồn để chọn học hoặc bỏ qua (các mẫu ngữ pháp thuộc nguồn bị bỏ qua sẽ không đưa vào đề thi):
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {grammarSourcesSummary.map((src) => {
                const isSelected = activeGrammarSources.includes(src.name);
                return (
                  <button
                    key={src.name}
                    type="button"
                    onClick={() => onToggleGrammarSource(src.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-pink-600 text-white border-pink-600'
                        : 'bg-white text-slate-500 border-slate-200 line-through'
                    }`}
                  >
                    <span>{isSelected ? '✓ Đang học:' : '✕ Đã bỏ:'}</span>
                    <span className="font-bold">{src.name}</span>
                    <span className="text-[11px]">({src.totalCount} mẫu)</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Auto-update roadmap toggle & Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-pink-100">
          <label className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
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

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onClearAllData &&
              (knowledgeBase.vocabulary.length > 0 ||
                knowledgeBase.grammars.length > 0) && (
                <button
                  type="button"
                  onClick={onClearAllData}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa dữ liệu đã nạp</span>
                </button>
              )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
