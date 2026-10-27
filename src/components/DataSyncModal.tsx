import React, { useState, useEffect } from 'react';
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
  Smartphone,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { KnowledgeBaseData, CrossDeviceWorkspaceSnapshot } from '../types';
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
  generateDevicePairingCode,
  applyDevicePairingCode,
  getDeviceLabel,
  discoverAllFirebaseSessions,
} from '../utils/firebaseExternalSync';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBase: KnowledgeBaseData;
  vocabUid?: string;
  grammarUid?: string;
  cloudSyncKey?: string;
  lastCloudSyncedAt?: number;
  lastSyncedDevice?: string;
  onUpdateKnowledgeBase: (
    updated: Partial<KnowledgeBaseData>,
    uids?: { vocabUid?: string; grammarUid?: string },
    regenerateRoadmap?: boolean
  ) => Promise<void>;
  onPushWorkspaceToCloud?: (customSyncKey?: string) => Promise<string>;
  onPullWorkspaceFromCloud?: (customSyncKey?: string) => Promise<string>;
  onExportFullSnapshotJson?: () => string;
  onImportFullSnapshotJson?: (rawJson: string) => void;
  onToggleGrammarSource?: (sourceName: string) => void;
  onClearAllData?: () => void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({
  isOpen,
  onClose,
  knowledgeBase,
  vocabUid: initialVocabUid = '',
  grammarUid: initialGrammarUid = '',
  cloudSyncKey: initialCloudSyncKey = '',
  lastCloudSyncedAt,
  lastSyncedDevice,
  onUpdateKnowledgeBase,
  onPushWorkspaceToCloud,
  onPullWorkspaceFromCloud,
  onExportFullSnapshotJson,
  onImportFullSnapshotJson,
  onToggleGrammarSource,
  onClearAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'devices' | 'backup' | 'firebase'>('devices');
  const [vocabUid, setVocabUid] = useState(initialVocabUid);
  const [grammarUid, setGrammarUid] = useState(initialGrammarUid);
  const [syncRoomKey, setSyncRoomKey] = useState(initialCloudSyncKey || 'mngoc209');
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [generatedPairingCode, setGeneratedPairingCode] = useState<string | null>(null);
  const [hasFirebaseCloudSession, setHasFirebaseCloudSession] = useState(false);

  const [autoRegenerate, setAutoRegenerate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    discoverAllFirebaseSessions().then((bundle) => {
      setHasFirebaseCloudSession(Boolean(bundle.vocab || bundle.grammar));
      if (bundle.vocab?.uid && !vocabUid) setVocabUid(bundle.vocab.uid);
      if (bundle.grammar?.uid && !grammarUid) setGrammarUid(bundle.grammar.uid);
      if (bundle.syncRoomKey && !initialCloudSyncKey) setSyncRoomKey(bundle.syncRoomKey);
    });
    generateDevicePairingCode(syncRoomKey).then((code) => {
      setGeneratedPairingCode(code);
    });
  }, [isOpen, vocabUid, grammarUid, initialCloudSyncKey, syncRoomKey]);

  if (!isOpen) return null;

  const sharedStorageInfo = inspectSharedBrowserStorage();
  const currentDevice = getDeviceLabel();

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
          'Không tìm thấy dữ liệu lưu sẵn trên trình duyệt hiện tại. Nếu bạn đang mở trên thiết bị mới (Điện thoại / Máy tính khác), hãy dùng tab "Đồng bộ giữa các thiết bị" bên dưới!'
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

  const handlePushCrossDevice = async () => {
    if (!onPushWorkspaceToCloud) return;
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const msg = await onPushWorkspaceToCloud(syncRoomKey.trim());
      const code = await generateDevicePairingCode(syncRoomKey.trim());
      setGeneratedPairingCode(code);
      setStatusMessage(msg);
    } catch (err: any) {
      setError(err?.message || 'Không thể đẩy dữ liệu lên đám mây.');
    } finally {
      setLoading(false);
    }
  };

  const handlePullCrossDevice = async () => {
    if (!onPullWorkspaceFromCloud) return;
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const msg = await onPullWorkspaceFromCloud(syncRoomKey.trim());
      setStatusMessage(msg);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu đồng bộ về thiết bị này.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPairingOrSnapshot = async () => {
    const raw = pairingCodeInput.trim();
    if (!raw) return;
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      // Case 1: LTN3-... Firebase Cloud Pairing Code
      if (raw.startsWith('LTN3-')) {
        const bundle = applyDevicePairingCode(raw);
        setHasFirebaseCloudSession(Boolean(bundle.vocab || bundle.grammar));
        if (bundle.syncRoomKey) setSyncRoomKey(bundle.syncRoomKey);
        if (onPullWorkspaceFromCloud) {
          const msg = await onPullWorkspaceFromCloud(bundle.syncRoomKey || syncRoomKey);
          setStatusMessage(
            `Đã liên kết đám mây thành công! ${msg} Từ giờ thiết bị này sẽ tự động đồng bộ 2 chiều.`
          );
        } else {
          setStatusMessage('Đã lưu Mã Liên Kết Thiết Bị Đám Mây thành công!');
        }
        setPairingCodeInput('');
        setLoading(false);
        return;
      }

      // Case 2: Full Workspace Snapshot JSON (or Vocab/Grammar JSON)
      const parsedJson = JSON.parse(raw);
      if (
        parsedJson &&
        parsedJson.roadmap &&
        parsedJson.profile &&
        onImportFullSnapshotJson
      ) {
        onImportFullSnapshotJson(raw);
        setPairingCodeInput('');
        setStatusMessage(
          `Đã đồng bộ trọn vẹn toàn bộ Lộ trình, Kho Từ/Ngữ pháp, Bug Tracker và Báo cáo 19:00 từ thiết bị "${parsedJson.deviceLabel || 'Máy tính'}"!`
        );
        setLoading(false);
        return;
      }

      throw new Error(
        'Mã vừa nhập không đúng định dạng Mã Liên Kết (LTN3-...) hoặc Gói Đồng Bộ Thiết Bị.'
      );
    } catch (err: any) {
      setError(
        err?.message ||
          'Mã liên kết không hợp lệ. Hãy copy đúng Mã Liên Kết (LTN3-...) hoặc Gói Chuyển Thiết Bị từ thiết bị kia.'
      );
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
      if (json && json.roadmap && json.profile && onImportFullSnapshotJson) {
        onImportFullSnapshotJson(trimmed);
        setPastedJsonText('');
        setStatusMessage('Đã khôi phục toàn bộ dữ liệu thiết bị thành công!');
        setLoading(false);
        return;
      }

      const updates: Partial<KnowledgeBaseData> = {};
      const importedParts: string[] = [];

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
      setHasFirebaseCloudSession(true);
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
      const code = await generateDevicePairingCode(syncRoomKey);
      setGeneratedPairingCode(code);
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
      setHasFirebaseCloudSession(true);
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
      const code = await generateDevicePairingCode(syncRoomKey);
      setGeneratedPairingCode(code);
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

  const handleDownloadFullWorkspaceFile = () => {
    if (!onExportFullSnapshotJson) return;
    const jsonStr = onExportFullSnapshotJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoTrinh_N3_Sync_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Đã tải xuống file Gói Đồng Bộ Toàn Thiết Bị (.json)!');
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
              Đồng bộ Liên Thiết Bị & Kho Từ Vựng / Ngữ Pháp
            </h2>
            <p className="text-xs text-slate-500">
              Đồng bộ Lộ trình hôm nay, Bug Tracker, Báo cáo 19:00 và dữ liệu OnTapTuVung / OnTapNguPhap giữa Máy tính & Điện thoại.
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

        {/* Instant 1-Click Shared Browser Sync Banner */}
        <div className="p-4 rounded-2xl bg-pink-50/80 border border-pink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-pink-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-700" />
              <span>
                Đồng bộ 1-Click từ Trình duyệt (Trên mngoc209.github.io)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Lấy thẳng dữ liệu <strong>OnTapTuVung</strong> & <strong>OnTapNguPhap</strong> đang lưu trên cùng trình duyệt mà không cần mở cửa sổ đăng nhập Google.
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
            className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
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
                className="inline-flex items-center gap-1 text-pink-700 hover:underline font-medium"
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
                className="inline-flex items-center gap-1 text-pink-700 hover:underline font-medium"
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

        {/* 3-Tab Mode Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 p-1 bg-pink-50 border border-pink-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('devices');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'devices'
                ? 'bg-white text-pink-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>1. Đồng bộ giữa các thiết bị</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('backup');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white text-pink-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Nhập File JSON / Dán nhanh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('firebase');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'firebase'
                ? 'bg-white text-pink-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>3. Cloud Firebase gốc</span>
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

        {/* TAB 1: Cross-Device Sync (Máy tính ↔ Điện thoại) */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-pink-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-pink-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-pink-700" />
                    <span>Đồng bộ đám mây 2 chiều (Máy tính ↔ Điện thoại)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thiết bị hiện tại: <strong>{currentDevice}</strong>
                    {lastCloudSyncedAt
                      ? ` · Đồng bộ gần nhất lúc ${new Date(lastCloudSyncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}${lastSyncedDevice ? ` (${lastSyncedDevice})` : ''}`
                      : ' · Tự động lưu tiến độ Lộ trình, Bug Tracker & Báo cáo 19:00'}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    hasFirebaseCloudSession
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-pink-50 text-pink-800 border border-pink-200'
                  }`}
                >
                  {hasFirebaseCloudSession
                    ? '🟢 Đã kết nối Cloud Firebase'
                    : '☁️ Chế độ Phòng Đồng Bộ'}
                </span>
              </div>

              {/* Sync Room Key + Push / Pull Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5 space-y-1.5">
                  <label
                    htmlFor="sync-room-key-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Mã đồng bộ cá nhân (Đặt giống nhau trên 2 máy):
                  </label>
                  <input
                    id="sync-room-key-input"
                    type="text"
                    value={syncRoomKey}
                    onChange={(e) => setSyncRoomKey(e.target.value)}
                    placeholder="VD: mngoc209"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div className="md:col-span-7 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handlePushCrossDevice}
                    className="py-2.5 px-3 bg-pink-600 hover:bg-pink-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Đẩy lên Đám mây (Push)</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handlePullCrossDevice}
                    className="py-2.5 px-3 bg-white hover:bg-pink-50 text-pink-800 border border-pink-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Tải về máy này (Pull)</span>
                  </button>
                </div>
              </div>

              {/* One-Click Device Pairing / Snapshot Transfer */}
              <div className="pt-3 border-t border-pink-100 space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  Chuyển nhanh sang Điện thoại / Máy tính mới (Không cần đăng nhập lại Google):
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {generatedPairingCode && (
                    <button
                      type="button"
                      onClick={() => handleCopyText('pairing_code', generatedPairingCode)}
                      className="px-3 py-2 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl text-xs font-semibold text-pink-900 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>
                        {copiedKey === 'pairing_code'
                          ? '✓ Đã copy Mã Liên Kết Đám Mây!'
                          : 'Copy Mã Liên Kết Đám Mây (LTN3-...)'}
                      </span>
                    </button>
                  )}

                  {onExportFullSnapshotJson && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText('full_snapshot', onExportFullSnapshotJson())
                      }
                      className="px-3 py-2 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl text-xs font-semibold text-pink-900 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>
                        {copiedKey === 'full_snapshot'
                          ? '✓ Đã copy Gói Đồng Bộ Toàn Bộ!'
                          : 'Copy Gói Đồng Bộ Toàn Bộ (Lộ trình + Từ + Ngữ pháp)'}
                      </span>
                    </button>
                  )}

                  {onExportFullSnapshotJson && (
                    <button
                      type="button"
                      onClick={handleDownloadFullWorkspaceFile}
                      className="px-3 py-2 bg-white hover:bg-pink-50 border border-pink-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải file đồng bộ (.json)</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <label
                    htmlFor="pairing-paste-input"
                    className="block text-[11px] font-medium text-slate-600"
                  >
                    Trên thiết bị thứ 2 (Điện thoại / Máy tính khác), dán <strong>Mã Liên Kết (LTN3-...)</strong> hoặc <strong>Gói Đồng Bộ</strong> vào ô dưới đây để đồng bộ ngay:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="pairing-paste-input"
                      type="text"
                      value={pairingCodeInput}
                      onChange={(e) => setPairingCodeInput(e.target.value)}
                      placeholder="Dán mã LTN3-... hoặc Gói Đồng Bộ từ thiết bị kia vào đây..."
                      className="flex-1 px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono"
                    />
                    <button
                      type="button"
                      disabled={!pairingCodeInput.trim() || loading}
                      onClick={handleApplyPairingOrSnapshot}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      Liên kết & Đồng bộ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Upload Backup JSON or Quick Paste */}
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

                <label className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
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

                <label className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
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
                  className="text-xs font-bold text-pink-800 hover:underline flex items-center gap-1.5 cursor-pointer"
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
                    placeholder="Dán nội dung file JSON Backup Từ vựng, Ngữ pháp hoặc Gói Đồng Bộ vào đây..."
                    className="w-full p-3 bg-white border border-pink-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono"
                  />
                  <button
                    type="button"
                    disabled={!pastedJsonText.trim() || loading}
                    onClick={handleImportPastedJson}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Nạp dữ liệu JSON vừa dán
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Firebase Cloud Sync */}
        {activeTab === 'firebase' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200 text-xs text-slate-700 space-y-2.5">
              <div className="font-bold text-pink-900">
                Mẹo kết nối Cloud Firebase không cần mở Popup Google:
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Hệ thống sẽ tự động dùng lại phiên đăng nhập Google có sẵn của <strong>OnTapTuVung</strong> và <strong>OnTapNguPhap</strong> trên trình duyệt của bạn. Nếu cần mở Popup Google mới, hãy đảm bảo API Key trên Google Cloud Console đã thêm 2 domain xác thực dưới đây:
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText('tuvung_ref', 'https://tuvungjlpt.firebaseapp.com/*')
                  }
                  className="px-2.5 py-1.5 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-[11px] font-semibold text-pink-800 flex items-center gap-1.5 cursor-pointer"
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
                  className="px-2.5 py-1.5 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-[11px] font-semibold text-pink-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>
                    {copiedKey === 'nguphap_ref'
                      ? 'Đã copy!'
                      : 'Copy cho Ngữ pháp: https://nguphapjlpt.firebaseapp.com/*'}
                  </span>
                </button>
              </div>
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
                  className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>Kết nối & Tải Từ vựng Cloud</span>
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
                  className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>Kết nối & Tải Ngữ pháp Cloud</span>
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
            <div className="text-xs font-bold text-pink-900">
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
                        ? 'bg-pink-600 border-pink-400'
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
              className="w-4 h-4 rounded accent-sky-600"
            />
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-pink-700" />
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
