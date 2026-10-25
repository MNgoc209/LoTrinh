/**
 * Pure utility functions for JLPT N3 study logic, date calculation, spaced repetition,
 * OnTapTuVung / OnTapNguPhap data parsing, dialogue turn parsing, and 19:00 daily progress reporting.
 */

import {
  ConfidenceAssessment,
  BugRecord,
  ImportedVocabItem,
  ImportedGrammarItem,
  TargetedReference,
  DialogueTurn,
  DailyStudyLog,
  DailyRoadmap,
  DailyProgressReport,
  QuizFormatType,
} from '../types';

export type { ConfidenceAssessment, BugRecord };

/**
 * Strips HTML tags from OnTapNguPhap rich-text fields while preserving line breaks.
 */
export function stripHtmlToText(input: unknown): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parses a Japanese listening script into individual speaker turns so TTS never reads
 * speaker labels ("男：", "女：") out loud and can differentiate male/female pitch & pauses.
 */
export function parseListeningDialogueTurns(script: string): DialogueTurn[] {
  if (!script || typeof script !== 'string') return [];

  const rawLines = script
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return rawLines.map((rawLine, index) => {
    const match = rawLine.match(/^([^：:]{1,12})[：:]\s*(.+)$/);
    let speaker = `Câu ${index + 1}`;
    let content = rawLine;
    let role: 'male' | 'female' | 'narrator' = 'narrator';

    if (match) {
      speaker = match[1].trim();
      content = match[2].trim();

      if (
        speaker.includes('男') ||
        speaker.includes('父') ||
        speaker.includes('彼') ||
        speaker.includes('夫') ||
        speaker.includes('課長') ||
        speaker.includes('部長') ||
        speaker.endsWith('A')
      ) {
        role = 'male';
      } else if (
        speaker.includes('女') ||
        speaker.includes('母') ||
        speaker.includes('彼女') ||
        speaker.includes('妻') ||
        speaker.includes('店員') ||
        speaker.endsWith('B')
      ) {
        role = 'female';
      }
    } else {
      // Alternate roles if unlabeled
      role = index % 2 === 0 ? 'male' : 'female';
    }

    // Clean brackets like 【確認】 -> 確認 so TTS reads smoothly
    const spokenText = content
      .replace(/【|】|「|」|『|』/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      speaker,
      role,
      spokenText: spokenText || content,
      rawLine,
    };
  });
}

/**
 * Parses and normalizes data from OnTapTuVung (JSON backup or Firestore document).
 */
export function parseVocabBackupJson(rawData: any): {
  vocabulary: ImportedVocabItem[];
  reviewHistory: Record<string, (string | number)[]>;
} {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Dữ liệu Từ vựng không hợp lệ.');
  }

  let rawList: any[] = [];
  if (Array.isArray(rawData)) {
    rawList = rawData;
  } else if (typeof rawData.vocabulary === 'string') {
    try {
      rawList = JSON.parse(rawData.vocabulary);
    } catch {
      rawList = [];
    }
  } else if (Array.isArray(rawData.vocabulary)) {
    rawList = rawData.vocabulary;
  } else {
    throw new Error('Không tìm thấy trường "vocabulary" trong dữ liệu Từ vựng.');
  }

  let reviewHistory: Record<string, (string | number)[]> = {};
  if (typeof rawData.reviewHistory === 'string') {
    try {
      reviewHistory = JSON.parse(rawData.reviewHistory);
    } catch {
      reviewHistory = {};
    }
  } else if (rawData.reviewHistory && typeof rawData.reviewHistory === 'object') {
    reviewHistory = rawData.reviewHistory;
  }

  const vocabulary: ImportedVocabItem[] = rawList
    .filter((item) => item && (item.word || item.reading))
    .map((item, idx) => {
      const level = Number.isFinite(Number(item.level)) ? Number(item.level) : 0;
      const nextReview = Number.isFinite(Number(item.nextReview)) ? Number(item.nextReview) : 0;
      return {
        id: String(item.id ?? `v_${idx}`),
        word: String(item.word || item.reading || '').trim(),
        reading: String(item.reading || item.word || '').trim(),
        meaning: stripHtmlToText(String(item.meaning || 'Chưa có nghĩa')),
        level: Math.max(0, Math.min(9, level)),
        learned: Boolean(item.learned || level > 0),
        nextReview,
      };
    });

  return { vocabulary, reviewHistory };
}

function parseArrayField(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Returns the list of source names associated with a grammar item.
 */
export function getGrammarItemSources(g: ImportedGrammarItem): string[] {
  if (Array.isArray(g.sourceNames) && g.sourceNames.length > 0) {
    return g.sourceNames;
  }
  if (g.sourceName && g.sourceName.trim()) {
    return g.sourceName
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return ['Chưa gán nguồn'];
}

/**
 * Filters grammar items by user-selected active grammar sources.
 * If selectedSources is undefined, all grammar items are included.
 */
export function filterGrammarsBySelectedSources(
  grammars: ImportedGrammarItem[],
  selectedSources?: string[]
): ImportedGrammarItem[] {
  if (!selectedSources) return grammars;
  const activeSet = new Set(selectedSources);
  return grammars.filter((g) => {
    const itemSources = getGrammarItemSources(g);
    return itemSources.some((src) => activeSet.has(src));
  });
}

export interface GrammarSourceSummary {
  name: string;
  totalCount: number;
  weakLv1_3Count: number;
  dueTodayCount: number;
  masteredCount: number;
}

/**
 * Extracts all available grammar sources with item counts, weak (Lv1-Lv3) counts, and due counts.
 */
export function extractGrammarSourcesSummary(
  grammars: ImportedGrammarItem[],
  declaredSources?: string[],
  now = Date.now()
): GrammarSourceSummary[] {
  const map = new Map<string, GrammarSourceSummary>();

  const ensureSource = (name: string): GrammarSourceSummary => {
    const clean = name.trim() || 'Chưa gán nguồn';
    let entry = map.get(clean);
    if (!entry) {
      entry = {
        name: clean,
        totalCount: 0,
        weakLv1_3Count: 0,
        dueTodayCount: 0,
        masteredCount: 0,
      };
      map.set(clean, entry);
    }
    return entry;
  };

  if (Array.isArray(declaredSources)) {
    declaredSources.forEach((src) => {
      if (src && src.trim()) ensureSource(src);
    });
  }

  for (const g of grammars) {
    if (g.level === 9) continue;
    const itemSources = getGrammarItemSources(g);
    const isWeak = g.level >= 1 && g.level <= 3;
    const isDue = g.level > 0 && g.nextReviewDate > 0 && g.nextReviewDate <= now;
    const isMastered = g.level >= 4 && g.level <= 8;

    for (const srcName of itemSources) {
      const entry = ensureSource(srcName);
      entry.totalCount += 1;
      if (isWeak) entry.weakLv1_3Count += 1;
      if (isDue) entry.dueTodayCount += 1;
      if (isMastered) entry.masteredCount += 1;
    }
  }

  return Array.from(map.values());
}

/**
 * Parses and normalizes data from OnTapNguPhap (JSON backup, localStorage export, or Firestore doc).
 */
export function parseGrammarBackupJson(rawData: any): {
  grammars: ImportedGrammarItem[];
  reviewHistory: Record<string, (string | number)[]>;
  grammarSources: string[];
} {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Dữ liệu Ngữ pháp không hợp lệ.');
  }

  let rawGrammars: any[] = [];
  if (Array.isArray(rawData)) {
    rawGrammars = rawData;
  } else if (typeof rawData.grammars === 'string') {
    rawGrammars = parseArrayField(rawData.grammars);
  } else if (Array.isArray(rawData.grammars)) {
    rawGrammars = rawData.grammars;
  } else if (rawData.nhg_grammars) {
    rawGrammars = parseArrayField(rawData.nhg_grammars);
  } else {
    throw new Error('Không tìm thấy trường "grammars" trong dữ liệu Ngữ pháp.');
  }

  const groups = parseArrayField(rawData.groups ?? rawData.nhg_groups);
  const contexts = parseArrayField(rawData.contexts ?? rawData.nhg_contexts);
  const sources = parseArrayField(rawData.sources ?? rawData.nhg_sources);

  const groupMap = new Map(
    groups
      .filter((g: any) => g && g.id !== undefined)
      .map((g: any) => [String(g.id), stripHtmlToText(String(g.name || '')).trim()])
  );
  const contextMap = new Map(
    contexts
      .filter((c: any) => c && c.id !== undefined)
      .map((c: any) => [String(c.id), stripHtmlToText(String(c.name || '')).trim()])
  );
  const sourceMap = new Map(
    sources
      .filter((s: any) => s && s.id !== undefined)
      .map((s: any) => [String(s.id), stripHtmlToText(String(s.name || '')).trim()])
  );

  let reviewHistory: Record<string, (string | number)[]> = {};
  if (typeof rawData.reviewHistory === 'string') {
    try {
      reviewHistory = JSON.parse(rawData.reviewHistory);
    } catch {
      reviewHistory = {};
    }
  } else if (rawData.reviewHistory && typeof rawData.reviewHistory === 'object') {
    reviewHistory = rawData.reviewHistory;
  }

  const discoveredSources = new Set<string>();
  for (const sName of sourceMap.values()) {
    if (sName) discoveredSources.add(sName);
  }

  const grammars: ImportedGrammarItem[] = rawGrammars
    .filter((g) => g && (g.name || g.structure))
    .map((g, idx) => {
      const level = Number.isFinite(Number(g.level)) ? Number(g.level) : 0;
      const nextReviewDate = Number.isFinite(Number(g.nextReviewDate))
        ? Number(g.nextReviewDate)
        : 0;

      const rawGroupIds: string[] = Array.isArray(g.groupIds)
        ? g.groupIds.map(String)
        : g.groupId !== undefined && g.groupId !== null
        ? [String(g.groupId)]
        : [];
      const resolvedGroups = rawGroupIds
        .map((id) => groupMap.get(id))
        .filter((v): v is string => Boolean(v));
      const groupName =
        resolvedGroups.length > 0
          ? resolvedGroups.join(', ')
          : g.groupName
          ? String(g.groupName)
          : undefined;

      const rawContextIds: string[] = Array.isArray(g.contextIds)
        ? g.contextIds.map(String)
        : g.contextId !== undefined && g.contextId !== null
        ? [String(g.contextId)]
        : [];
      const resolvedContexts = rawContextIds
        .map((id) => contextMap.get(id))
        .filter((v): v is string => Boolean(v));
      const contextName =
        resolvedContexts.length > 0
          ? resolvedContexts.join(', ')
          : g.contextName
          ? String(g.contextName)
          : undefined;

      const rawSourceIds: string[] = Array.isArray(g.sourceIds)
        ? g.sourceIds.map(String)
        : g.sourceId !== undefined && g.sourceId !== null
        ? [String(g.sourceId)]
        : [];
      const resolvedSources = rawSourceIds
        .map((id) => sourceMap.get(id))
        .filter((v): v is string => Boolean(v));

      let sourceNames: string[] = [];
      if (resolvedSources.length > 0) {
        sourceNames = resolvedSources;
      } else if (Array.isArray(g.sourceNames) && g.sourceNames.length > 0) {
        sourceNames = g.sourceNames.map((s: any) => String(s).trim()).filter(Boolean);
      } else if (g.sourceName && String(g.sourceName).trim()) {
        sourceNames = String(g.sourceName)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        sourceNames = ['Chưa gán nguồn'];
      }

      sourceNames.forEach((s) => discoveredSources.add(s));

      return {
        id: String(g.id ?? `g_${idx}`),
        name: stripHtmlToText(String(g.name || g.structure || '')),
        structure: stripHtmlToText(String(g.structure || '')),
        meaning: stripHtmlToText(String(g.meaning || '')),
        example: stripHtmlToText(String(g.example || '')),
        similarText: g.similarText ? stripHtmlToText(String(g.similarText)) : undefined,
        level: Math.max(0, Math.min(9, level)),
        nextReviewDate,
        groupName,
        contextName,
        sourceIds: rawSourceIds,
        sourceNames,
        sourceName: sourceNames.join(', '),
      };
    });

  return {
    grammars,
    reviewHistory,
    grammarSources: Array.from(discoveredSources),
  };
}

/**
 * Computes priority score for a single vocabulary or grammar item.
 * Higher score = higher urgency for AI quiz & daily roadmap generation.
 */
export function computeItemPriorityScore(
  level: number,
  nextReviewMs: number,
  learned: boolean,
  now = Date.now()
): number {
  if (level === 9) return -1;

  let score = 0;
  if (level >= 1 && level <= 3) {
    score += 100 + (4 - level) * 10; // Lv1 = 130, Lv2 = 120, Lv3 = 110
  } else if (level === 0) {
    score += 45;
  } else if (level >= 4 && level <= 8) {
    score += Math.max(5, 35 - level * 4);
  }

  const isDue = (learned || level > 0) && nextReviewMs > 0 && nextReviewMs <= now;
  if (isDue) {
    score += 65;
  }

  return score;
}

/**
 * Selects top priority vocabulary and grammar items for today's roadmap and AI question generation.
 */
export function selectPriorityTargets(
  vocabulary: ImportedVocabItem[],
  grammars: ImportedGrammarItem[],
  now = Date.now(),
  maxVocab = 12,
  maxGrammar = 6,
  selectedGrammarSources?: string[]
): {
  priorityVocab: ImportedVocabItem[];
  priorityGrammar: ImportedGrammarItem[];
  targetReferences: TargetedReference[];
} {
  const activeGrammars = filterGrammarsBySelectedSources(grammars, selectedGrammarSources);

  const scoredVocab = vocabulary
    .filter((v) => v.level !== 9)
    .map((v) => ({
      item: v,
      score: computeItemPriorityScore(v.level, v.nextReview, v.learned, now),
    }))
    .sort((a, b) => b.score - a.score);

  const scoredGrammar = activeGrammars
    .filter((g) => g.level !== 9)
    .map((g) => ({
      item: g,
      score: computeItemPriorityScore(g.level, g.nextReviewDate, g.level > 0, now),
    }))
    .sort((a, b) => b.score - a.score);

  const priorityVocab = scoredVocab.slice(0, maxVocab).map((x) => x.item);
  const priorityGrammar = scoredGrammar.slice(0, maxGrammar).map((x) => x.item);

  const targetReferences: TargetedReference[] = [
    ...priorityGrammar.map((g) => ({
      type: 'grammar' as const,
      id: g.id,
      title: g.name,
      readingOrStructure: g.structure || g.name,
      meaning: g.meaning,
      level: g.level,
      note: g.similarText || g.example,
    })),
    ...priorityVocab.map((v) => ({
      type: 'vocab' as const,
      id: v.id,
      title: v.word,
      readingOrStructure: v.reading,
      meaning: v.meaning,
      level: v.level,
    })),
  ];

  return { priorityVocab, priorityGrammar, targetReferences };
}

/**
 * Computes summary statistics for imported Vocabulary and Grammar collections.
 */
export interface KnowledgeSummaryStats {
  vocabTotal: number;
  vocabWeakLv1_3: number;
  vocabDueToday: number;
  vocabMasteredLv4_8: number;
  grammarTotal: number;
  grammarWeakLv1_3: number;
  grammarDueToday: number;
  grammarMasteredLv4_8: number;
}

export function computeKnowledgeStats(
  vocabulary: ImportedVocabItem[],
  grammars: ImportedGrammarItem[],
  now = Date.now(),
  selectedGrammarSources?: string[]
): KnowledgeSummaryStats {
  const activeVocab = vocabulary.filter((v) => v.level !== 9);
  const sourceFilteredGrammars = filterGrammarsBySelectedSources(
    grammars,
    selectedGrammarSources
  );
  const activeGrammar = sourceFilteredGrammars.filter((g) => g.level !== 9);

  return {
    vocabTotal: activeVocab.length,
    vocabWeakLv1_3: activeVocab.filter((v) => v.level >= 1 && v.level <= 3).length,
    vocabDueToday: activeVocab.filter(
      (v) => (v.learned || v.level > 0) && v.nextReview > 0 && v.nextReview <= now
    ).length,
    vocabMasteredLv4_8: activeVocab.filter((v) => v.level >= 4 && v.level <= 8).length,
    grammarTotal: activeGrammar.length,
    grammarWeakLv1_3: activeGrammar.filter((g) => g.level >= 1 && g.level <= 3).length,
    grammarDueToday: activeGrammar.filter(
      (g) => g.level > 0 && g.nextReviewDate > 0 && g.nextReviewDate <= now
    ).length,
    grammarMasteredLv4_8: activeGrammar.filter((g) => g.level >= 4 && g.level <= 8).length,
  };
}

/**
 * Checks whether it is >= 19:00 local time and today's 19:00 report has not been generated yet.
 */
export function isTimeFor19hReport(
  nowDate = new Date(),
  existingReportForToday?: DailyProgressReport | null
): boolean {
  const todayStr = nowDate.toISOString().split('T')[0];
  if (existingReportForToday && existingReportForToday.date === todayStr) {
    return false;
  }
  return nowDate.getHours() >= 19;
}

/**
 * Compiles the 19:00 Daily Progress Report analyzing completed tasks, extra bonus sessions,
 * strengths, improvements, weaknesses, and next-day roadmap adjustments.
 */
export function buildDailyProgressReport(params: {
  studyLog: DailyStudyLog;
  roadmap: DailyRoadmap;
  vocabulary: ImportedVocabItem[];
  grammars: ImportedGrammarItem[];
  bugs: BugRecord[];
  now?: number;
}): DailyProgressReport {
  const { studyLog, roadmap, vocabulary, grammars, bugs, now = Date.now() } = params;
  const completedCount = roadmap.tasks.filter((t) => t.completed).length;
  const totalTasks = roadmap.tasks.length;
  const bonusCount = studyLog.bonusSessions.length;

  const skillLabels: Record<string, string> = {
    vocabulary: 'Từ vựng (Goi · Mondai 1-4)',
    grammar: 'Ngữ pháp (Bunpou · Mondai 1-4)',
    reading: 'Đọc hiểu (Dokkai · Đoản/Trung văn)',
    listening: 'Nghe hiểu (Choukai · Hội thoại)',
    review: 'Ôn tập lỗi sai (Bug Tracker)',
  };

  let totalAttempted = 0;
  let totalCorrect = 0;
  const skillAccuracyMap: Record<string, number> = {};
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const key of ['vocabulary', 'grammar', 'reading', 'listening', 'review'] as const) {
    const stat = studyLog.skillStats[key] || { attempted: 0, correct: 0 };
    totalAttempted += stat.attempted;
    totalCorrect += stat.correct;
    if (stat.attempted > 0) {
      const acc = Math.round((stat.correct / stat.attempted) * 100);
      skillAccuracyMap[key] = acc;
      if (acc >= 75) {
        strengths.push(`${skillLabels[key]}: Đạt độ chính xác cao (${acc}% — ${stat.correct}/${stat.attempted} câu).`);
      } else if (acc < 65) {
        weaknesses.push(
          `${skillLabels[key]}: Tỷ lệ chính xác còn thấp (${acc}% — sai ${stat.attempted - stat.correct}/${stat.attempted} câu), cần tăng cường vào ngày mai.`
        );
      }
    }
  }

  const overallAccuracy =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 78;

  const stats = computeKnowledgeStats(vocabulary, grammars, now);
  if (strengths.length === 0) {
    strengths.push(
      `Đã duy trì kho kiến thức với ${stats.vocabMasteredLv4_8} từ vựng và ${stats.grammarMasteredLv4_8} mẫu ngữ pháp ở mức Vững (Lv4–Lv8).`
    );
  }

  const improvements: string[] =
    studyLog.improvedItems.length > 0
      ? studyLog.improvedItems.map((item) => `Đã nâng cấp mức độ thuộc lòng: ${item}`)
      : [
          `Hoàn thành ${completedCount}/${totalTasks} nhiệm vụ lộ trình chính (${studyLog.studyMinutes} phút tập trung).`,
          bonusCount > 0
            ? `Chủ động luyện thêm ${bonusCount} bài mở rộng ngoài lộ trình chính.`
            : 'Duy trì tiến độ ôn tập các mục Lv1–Lv3 đúng hạn.',
        ];

  const unresolvedBugs = bugs.filter((b) => !b.resolved);
  const weakVocab = vocabulary.filter((v) => v.level >= 1 && v.level <= 2).slice(0, 4);
  const weakGrammar = grammars.filter((g) => g.level >= 1 && g.level <= 2).slice(0, 3);

  if (weakGrammar.length > 0) {
    weaknesses.push(
      `Mẫu ngữ pháp Lv1–Lv2 còn dễ nhầm lẫn: ${weakGrammar.map((g) => `${g.name} (Lv${g.level})`).join(', ')}.`
    );
  }
  if (weakVocab.length > 0) {
    weaknesses.push(
      `Từ vựng Lv1–Lv2 cần củng cố thêm ngữ cảnh: ${weakVocab.map((v) => `${v.word} (${v.meaning})`).join(', ')}.`
    );
  }
  if (unresolvedBugs.length > 0) {
    weaknesses.push(
      `Còn ${unresolvedBugs.length} câu làm sai trong Bug Tracker cần được ép làm lại vào đầu lộ trình ngày mai.`
    );
  }

  const incompleteTasks = roadmap.tasks.filter((t) => !t.completed);
  const recommendedFocusFormats: QuizFormatType[] = [];
  const nextDayAdjustments: string[] = [];

  if (unresolvedBugs.length > 0) {
    recommendedFocusFormats.push('bug_review');
    nextDayAdjustments.push(
      `Đưa ${unresolvedBugs.length} câu sai trong Bug Tracker lên làm Nhiệm vụ số 1 của ngày mai để khóa chặt lỗ hổng.`
    );
  }

  if ((skillAccuracyMap.listening ?? 60) < 75) {
    recommendedFocusFormats.push('listening_dialogue');
    nextDayAdjustments.push(
      'Tăng thời lượng bài Nghe hội thoại Choukai (bật chế độ nghe từng câu 0.85x trước khi nghe tốc độ chuẩn 1.0x).'
    );
  }

  if ((skillAccuracyMap.grammar ?? 65) < 75 || weakGrammar.length > 0) {
    recommendedFocusFormats.push('grammar_mondai_3_4');
    nextDayAdjustments.push(
      `Tạo bài tập Mondai 3 dấu sao ★ và Mondai 4 xoay quanh ${weakGrammar.map((g) => g.name).join(', ') || 'các cấu trúc Lv1–Lv3'}.`
    );
  }

  if (incompleteTasks.length > 0) {
    nextDayAdjustments.push(
      `Chuyển tiếp ${incompleteTasks.length} nhiệm vụ chưa kịp hoàn thành hôm nay (${incompleteTasks
        .slice(0, 2)
        .map((t) => t.categoryLabel)
        .join(', ')}) sang khung ưu tiên ngày mai.`
    );
  }

  if (bonusCount > 0) {
    nextDayAdjustments.push(
      `Ghi nhận bạn đã luyện vượt chỉ tiêu ${bonusCount} bài mở rộng hôm nay — lộ trình ngày mai sẽ nâng nhẹ độ khó Đọc hiểu Trung văn.`
    );
  }

  if (recommendedFocusFormats.length === 0) {
    recommendedFocusFormats.push('reading_integrated', 'grammar_mondai_3_4');
  }

  return {
    id: `report_${studyLog.date}_${now}`,
    date: studyLog.date,
    generatedAt: now,
    overallAccuracy,
    completedTasksSummary: `Hoàn thành ${completedCount}/${totalTasks} nhiệm vụ trong lộ trình (${studyLog.studyMinutes} phút học)`,
    bonusPracticeSummary:
      bonusCount > 0
        ? `Đã ôn thêm ${bonusCount} bài ngoài lộ trình (${studyLog.bonusSessions
            .map((b) => b.title)
            .join(', ')})`
        : 'Chưa có bài ôn thêm ngoài lộ trình chính',
    strengths,
    improvements,
    weaknesses,
    nextDayAdjustments,
    recommendedFocusFormats,
    skillAccuracyMap,
  };
}

/**
 * Calculates days remaining until target exam date.
 */
export function calculateDaysRemaining(targetDateStr: string, currentDate = new Date()): number {
  if (!targetDateStr) return 30;
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return 30;

  const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffTime = targetMidnight.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0);
}

/**
 * Calculates completion percentage of task list.
 */
export function calculateProgress(tasks: { completed: boolean }[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const completedCount = tasks.filter((t) => t.completed).length;
  return Math.round((completedCount / tasks.length) * 100);
}

/**
 * Computes next review date using SuperMemo-style spaced repetition interval.
 */
export function calculateNextReview(
  isCorrect: boolean,
  currentIntervalDays: number,
  reviewCount: number,
  now = Date.now()
): { nextReviewDate: number; newIntervalDays: number; newReviewCount: number; resolved: boolean } {
  if (isCorrect) {
    let nextInterval = 1;
    if (reviewCount === 0) nextInterval = 1;
    else if (reviewCount === 1) nextInterval = 3;
    else if (reviewCount === 2) nextInterval = 7;
    else nextInterval = Math.round(currentIntervalDays * 2.2);

    const isResolved = reviewCount >= 3;
    const nextReviewDate = now + nextInterval * 24 * 60 * 60 * 1000;
    return {
      nextReviewDate,
      newIntervalDays: nextInterval,
      newReviewCount: reviewCount + 1,
      resolved: isResolved,
    };
  } else {
    const nextReviewDate = now + 1 * 24 * 60 * 60 * 1000;
    return {
      nextReviewDate,
      newIntervalDays: 1,
      newReviewCount: Math.max(0, reviewCount - 1),
      resolved: false,
    };
  }
}

/**
 * Filters bugs due for review today or overdue.
 */
export function getBugsDueForReview(bugs: BugRecord[], now = Date.now()): BugRecord[] {
  return bugs.filter((bug) => !bug.resolved && bug.nextReviewDate <= now);
}

/**
 * Summarizes weak points into actionable Vietnamese text for the prompt.
 */
export function formatConfidenceSummary(assessment: ConfidenceAssessment): string {
  const weakCategories: string[] = [];
  const strongCategories: string[] = [];

  const check = (name: string, score: number) => {
    if (score <= 2) weakCategories.push(name);
    else if (score >= 4) strongCategories.push(name);
  };

  check('Kanji/Hán tự', assessment.kanji);
  check('Từ vựng (Goi)', assessment.vocabulary);
  check('Ngữ pháp Mondai 1-2', assessment.grammarMondai1_2);
  check('Ngữ pháp Mondai 3-4-5 (Sao ngữ pháp & Đoạn văn)', assessment.grammarMondai3_4_5);
  check('Đọc hiểu ngắn', assessment.readingShort);
  check('Đọc hiểu Trung & Dài văn', assessment.readingMediumLong);
  check('Nghe hiểu (Choukai)', assessment.listening);

  let summary = '';
  if (strongCategories.length > 0) {
    summary += `Điểm mạnh: ${strongCategories.join(', ')}. `;
  }
  if (weakCategories.length > 0) {
    summary += `Điểm yếu cần ưu tiên đặc biệt: ${weakCategories.join(', ')}. `;
  }
  if (assessment.notes) {
    summary += `Ghi chú cá nhân: "${assessment.notes}".`;
  }
  return summary.trim() || 'Cần ôn tập đồng đều cả 4 kỹ năng Từ vựng, Ngữ pháp, Đọc hiểu và Nghe hiểu.';
}
