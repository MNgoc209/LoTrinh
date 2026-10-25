/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyDashboard } from './components/DailyDashboard';
import { QuizInterface } from './components/QuizInterface';
import { BugTracker } from './components/BugTracker';
import { RoadmapFormModal } from './components/RoadmapFormModal';
import { DataSyncModal } from './components/DataSyncModal';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { EveningReportModal } from './components/EveningReportModal';
import { Navbar, NavTab } from './components/Navbar';
import {
  loadUserProfile,
  saveUserProfile,
  loadRoadmap,
  saveRoadmap,
  loadBugRecords,
  saveBugRecords,
  loadKnowledgeBase,
  saveKnowledgeBase,
  loadTodayStudyLog,
  saveTodayStudyLog,
  loadDailyReports,
  saveDailyReports,
  addBugRecord,
} from './utils/storage';
import { SAMPLE_JLPT_N3_QUESTIONS } from './data/sampleQuestions';
import {
  calculateDaysRemaining,
  calculateNextReview,
  getBugsDueForReview,
  selectPriorityTargets,
  computeKnowledgeStats,
  buildDailyProgressReport,
  isTimeFor19hReport,
  extractGrammarSourcesSummary,
  filterGrammarsBySelectedSources,
} from './utils/studyLogic';
import {
  generateClientTargetedQuestions,
  buildStructuredDailyTasks,
} from './utils/jlptMondaiTaxonomy';
import {
  DailyRoadmap,
  UserProfile,
  BugRecord,
  QuizQuestion,
  TaskItem,
  ConfidenceAssessment,
  KnowledgeBaseData,
  QuizFormatType,
  ImportedVocabItem,
  ImportedGrammarItem,
  DailyStudyLog,
  DailyProgressReport,
  JLPTCategory,
} from './types';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseData>(() =>
    loadKnowledgeBase()
  );
  const [roadmap, setRoadmap] = useState<DailyRoadmap>(() => {
    const rm = loadRoadmap();
    const days = calculateDaysRemaining(profile.examDate);
    return { ...rm, daysRemaining: days };
  });
  const [bugs, setBugs] = useState<BugRecord[]>(() => loadBugRecords());
  const [studyLog, setStudyLog] = useState<DailyStudyLog>(() => loadTodayStudyLog());
  const [dailyReports, setDailyReports] = useState<DailyProgressReport[]>(() =>
    loadDailyReports()
  );

  const [currentTab, setCurrentTab] = useState<NavTab | 'quiz'>('dashboard');
  const [activeQuiz, setActiveQuiz] = useState<{
    title: string;
    questions: QuizQuestion[];
    taskId?: string;
    quizFormat?: QuizFormatType;
    isBonus?: boolean;
  } | null>(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isEveningReportOpen, setIsEveningReportOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<DailyProgressReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    saveUserProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveRoadmap(roadmap);
  }, [roadmap]);

  useEffect(() => {
    saveBugRecords(bugs);
  }, [bugs]);

  useEffect(() => {
    saveKnowledgeBase(knowledgeBase);
  }, [knowledgeBase]);

  useEffect(() => {
    saveTodayStudyLog(studyLog);
  }, [studyLog]);

  useEffect(() => {
    saveDailyReports(dailyReports);
  }, [dailyReports]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const activeGrammarSources =
    knowledgeBase.selectedGrammarSources ??
    extractGrammarSourcesSummary(knowledgeBase.grammars, knowledgeBase.grammarSources).map(
      (s) => s.name
    );

  // Automatic 19:00 Daily Checkpoint Watcher
  useEffect(() => {
    const check19hSchedule = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const existingTodayReport =
        dailyReports.find((r) => r.date === todayStr) || null;

      if (isTimeFor19hReport(new Date(), existingTodayReport)) {
        const compiled = buildDailyProgressReport({
          studyLog,
          roadmap,
          vocabulary: knowledgeBase.vocabulary,
          grammars: filterGrammarsBySelectedSources(
            knowledgeBase.grammars,
            activeGrammarSources
          ),
          bugs,
        });
        setActiveReport(compiled);
        setDailyReports((prev) => [
          compiled,
          ...prev.filter((r) => r.date !== compiled.date),
        ]);
        setIsEveningReportOpen(true);
        showToast(
          'Đã đến 19:00! Hệ thống tự động tổng hợp Báo cáo tiến độ hôm nay & gợi ý lộ trình ngày mai.'
        );
      }
    };

    check19hSchedule();
    const timer = setInterval(check19hSchedule, 60000);
    return () => clearInterval(timer);
  }, [dailyReports, studyLog, roadmap, knowledgeBase, bugs, activeGrammarSources]);

  const dueBugs = getBugsDueForReview(bugs);
  const stats = computeKnowledgeStats(
    knowledgeBase.vocabulary,
    knowledgeBase.grammars,
    Date.now(),
    activeGrammarSources
  );
  const weakItemsCount = stats.vocabWeakLv1_3 + stats.grammarWeakLv1_3;

  const handleOpenEveningReport = () => {
    const compiled = buildDailyProgressReport({
      studyLog,
      roadmap,
      vocabulary: knowledgeBase.vocabulary,
      grammars: filterGrammarsBySelectedSources(
        knowledgeBase.grammars,
        activeGrammarSources
      ),
      bugs,
    });
    setActiveReport(compiled);
    setDailyReports((prev) => [
      compiled,
      ...prev.filter((r) => r.date !== compiled.date),
    ]);
    setIsEveningReportOpen(true);
  };

  const handleToggleTask = (taskId: string) => {
    setRoadmap((prev) => {
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      const completedCount = updatedTasks.filter((t) => t.completed).length;
      setStudyLog((prevLog) => ({
        ...prevLog,
        completedTaskCount: completedCount,
        totalTaskCount: updatedTasks.length,
      }));
      return { ...prev, tasks: updatedTasks };
    });
  };

  const handleAddExtraTaskToRoadmap = (
    format: QuizFormatType,
    title: string,
    categoryLabel: string,
    targetMondai?: string,
    category?: JLPTCategory
  ) => {
    const { priorityVocab, priorityGrammar } = selectPriorityTargets(
      knowledgeBase.vocabulary,
      knowledgeBase.grammars,
      Date.now(),
      12,
      6,
      activeGrammarSources
    );
    const categoryMap: Record<QuizFormatType, JLPTCategory> = {
      reading_integrated: 'reading',
      grammar_mondai_3_4: 'grammar',
      vocab_synonyms_usage: 'vocabulary',
      listening_dialogue: 'listening',
      bug_review: 'review',
    };

    const newTask: TaskItem = {
      id: `task_bonus_${Date.now()}`,
      title,
      category: category || categoryMap[format] || 'grammar',
      categoryLabel,
      quizFormat: format,
      estimatedMinutes: 15,
      questionCount: 5,
      targetMondai: targetMondai || 'Chặng mở rộng theo Mondai',
      reason: 'Bạn chủ động ghim dạng Mondai này vào lộ trình hôm nay để rèn sâu',
      targetWords: priorityVocab.slice(0, 3).map((v) => `${v.word} (Lv${v.level})`),
      targetGrammars: priorityGrammar.slice(0, 2).map((g) => `${g.name} (Lv${g.level})`),
      completed: false,
      priority: 'medium',
      isBonusTask: true,
    };

    setRoadmap((prev) => ({
      ...prev,
      totalEstimatedMinutes: prev.totalEstimatedMinutes + 15,
      tasks: [...prev.tasks, newTask],
    }));

    showToast(`Đã thêm "${title}" vào danh sách nhiệm vụ hôm nay!`);
  };

  const handleStartTargetedQuiz = async (
    quizFormat: QuizFormatType,
    vocabItems: ImportedVocabItem[],
    grammarItems: ImportedGrammarItem[],
    customTitle: string,
    taskId?: string,
    isBonus = false
  ) => {
    if (quizFormat === 'bug_review') {
      handleStartAllDueBugs();
      return;
    }

    let generatedQuestions: QuizQuestion[] = [];
    try {
      const response = await fetch('/api/quiz/generate-targeted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizFormat,
          targetVocab: vocabItems.slice(0, 8),
          targetGrammar: grammarItems.slice(0, 5),
          count: 4,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          generatedQuestions = data.questions;
        }
      }
    } catch {
      // Static GitHub Pages or offline mode — fallback to client-side generator below
    }

    if (generatedQuestions.length === 0) {
      generatedQuestions = generateClientTargetedQuestions(
        quizFormat,
        vocabItems,
        grammarItems,
        customTitle
      );
    }

    const categoryMap: Record<QuizFormatType, string> = {
      reading_integrated: 'reading',
      grammar_mondai_3_4: 'grammar',
      vocab_synonyms_usage: 'vocabulary',
      listening_dialogue: 'listening',
      bug_review: 'review',
    };

    const targetCategory = categoryMap[quizFormat] || 'grammar';
    const curatedSampleMatches = SAMPLE_JLPT_N3_QUESTIONS.filter(
      (q) => q.category === targetCategory
    );

    const combinedQuestions =
      generatedQuestions.length >= 2
        ? generatedQuestions
        : [...curatedSampleMatches, ...generatedQuestions];

    setActiveQuiz({
      title: customTitle,
      questions:
        combinedQuestions.length > 0
          ? combinedQuestions
          : SAMPLE_JLPT_N3_QUESTIONS.slice(0, 4),
      taskId,
      quizFormat,
      isBonus,
    });
    setCurrentTab('quiz');
  };

  const handleStartTaskQuiz = async (task: TaskItem) => {
    if (task.category === 'review' || task.quizFormat === 'bug_review') {
      const itemsToReview = dueBugs.length > 0 ? dueBugs : bugs.slice(0, 5);
      if (itemsToReview.length > 0) {
        const questionsForQuiz: QuizQuestion[] = itemsToReview.map((b) => ({
          id: `review_${b.id}`,
          sourceBugId: b.id,
          category: b.category,
          subCategory: b.subCategory,
          title: `Ôn tập câu sai: ${b.subCategory}`,
          passage: b.passage,
          listeningScript: b.listeningScript,
          questionText: b.questionText,
          options: b.options,
          correctAnswerIndex: b.correctAnswerIndex,
          explanation: b.explanation,
          usedTargets: b.usedTargets,
        }));
        setActiveQuiz({
          title: task.title,
          questions: questionsForQuiz,
          taskId: task.id,
          quizFormat: 'bug_review',
          isBonus: Boolean(task.isBonusTask),
        });
        setCurrentTab('quiz');
        return;
      }
    }

    const { priorityVocab, priorityGrammar } = selectPriorityTargets(
      knowledgeBase.vocabulary,
      knowledgeBase.grammars,
      Date.now(),
      12,
      6,
      activeGrammarSources
    );

    const inferredFormat: QuizFormatType =
      task.quizFormat ||
      (task.category === 'reading'
        ? 'reading_integrated'
        : task.category === 'grammar'
        ? 'grammar_mondai_3_4'
        : task.category === 'listening'
        ? 'listening_dialogue'
        : 'vocab_synonyms_usage');

    await handleStartTargetedQuiz(
      inferredFormat,
      priorityVocab,
      priorityGrammar,
      task.title,
      task.id,
      Boolean(task.isBonusTask)
    );
  };

  const handleQuickStartFormat = async (
    format: QuizFormatType,
    title: string,
    isBonus = false
  ) => {
    const { priorityVocab, priorityGrammar } = selectPriorityTargets(
      knowledgeBase.vocabulary,
      knowledgeBase.grammars,
      Date.now(),
      12,
      6,
      activeGrammarSources
    );
    await handleStartTargetedQuiz(format, priorityVocab, priorityGrammar, title, undefined, isBonus);
  };

  const handleStartAllDueBugs = () => {
    const list = dueBugs.length > 0 ? dueBugs : bugs.slice(0, 5);
    if (list.length === 0) {
      showToast('Bug Tracker hiện không có câu hỏi nào để ôn tập!');
      return;
    }
    const questions: QuizQuestion[] = list.map((b) => ({
      id: `review_${b.id}`,
      sourceBugId: b.id,
      category: b.category,
      subCategory: b.subCategory,
      title: `Ôn tập Spaced Repetition: ${b.subCategory}`,
      passage: b.passage,
      listeningScript: b.listeningScript,
      questionText: b.questionText,
      options: b.options,
      correctAnswerIndex: b.correctAnswerIndex,
      explanation: b.explanation,
      usedTargets: b.usedTargets,
    }));

    setActiveQuiz({
      title: 'Spaced Repetition: Ôn tập các câu sai trong Bug Tracker',
      questions,
      quizFormat: 'bug_review',
    });
    setCurrentTab('quiz');
  };

  const handleStartSpacedRepetitionQuiz = (questions: QuizQuestion[]) => {
    setActiveQuiz({
      title: 'Luyện lại câu sai từ Bug Tracker',
      questions,
      quizFormat: 'bug_review',
    });
    setCurrentTab('quiz');
  };

  const handleFinishQuiz = (results: {
    total: number;
    correctCount: number;
    newBugsCount: number;
    categoryBreakdown: Record<string, { attempted: number; correct: number }>;
    improvedTargets: string[];
    failedTargets: string[];
  }) => {
    if (activeQuiz?.taskId) {
      const taskObj = roadmap.tasks.find((t) => t.id === activeQuiz.taskId);
      if (taskObj && !taskObj.completed) {
        handleToggleTask(activeQuiz.taskId);
      }
    }

    setProfile((prev) => ({
      ...prev,
      todayStudyMinutes: prev.todayStudyMinutes + 15,
    }));

    setStudyLog((prevLog) => {
      const updatedSkills = { ...prevLog.skillStats };
      for (const [cat, stat] of Object.entries(results.categoryBreakdown)) {
        const key = (cat as JLPTCategory) || 'grammar';
        const existing = updatedSkills[key] || { attempted: 0, correct: 0 };
        updatedSkills[key] = {
          attempted: existing.attempted + stat.attempted,
          correct: existing.correct + stat.correct,
        };
      }

      const nextBonusSessions = activeQuiz?.isBonus
        ? [
            ...prevLog.bonusSessions,
            {
              id: `bonus_${Date.now()}`,
              title: activeQuiz.title,
              quizFormat: activeQuiz.quizFormat || 'reading_integrated',
              category: 'reading' as JLPTCategory,
              totalQuestions: results.total,
              correctQuestions: results.correctCount,
              timestamp: Date.now(),
            },
          ]
        : prevLog.bonusSessions;

      return {
        ...prevLog,
        studyMinutes: prevLog.studyMinutes + 15,
        skillStats: updatedSkills,
        bonusSessions: nextBonusSessions,
        improvedItems: Array.from(
          new Set([...prevLog.improvedItems, ...results.improvedTargets])
        ),
        weakItems: Array.from(
          new Set([...prevLog.weakItems, ...results.failedTargets])
        ),
      };
    });

    showToast(
      `Hoàn thành bài luyện tập! Đúng ${results.correctCount}/${results.total} câu. Đã ghi nhận vào Báo cáo 19:00.`
    );
    setActiveQuiz(null);
    setCurrentTab('dashboard');
  };

  const handleLogBug = (
    bugData: Omit<
      BugRecord,
      'id' | 'timestamp' | 'nextReviewDate' | 'reviewIntervalDays' | 'reviewCount' | 'resolved'
    >
  ) => {
    addBugRecord(bugData);
    setBugs(loadBugRecords());
  };

  const handleUpdateBugReview = (bugId: string, isCorrect: boolean) => {
    setBugs((prevBugs) =>
      prevBugs.map((bug) => {
        if (bug.id === bugId) {
          const nextState = calculateNextReview(
            isCorrect,
            bug.reviewIntervalDays,
            bug.reviewCount
          );
          return {
            ...bug,
            nextReviewDate: nextState.nextReviewDate,
            reviewIntervalDays: nextState.newIntervalDays,
            reviewCount: nextState.newReviewCount,
            resolved: nextState.resolved,
          };
        }
        return bug;
      })
    );
  };

  const handleDeleteBug = (bugId: string) => {
    const updated = bugs.filter((b) => b.id !== bugId);
    setBugs(updated);
    showToast('Đã xóa câu khỏi Bug Tracker.');
  };

  const handleToggleResolveBug = (bugId: string) => {
    const updated = bugs.map((b) => (b.id === bugId ? { ...b, resolved: !b.resolved } : b));
    setBugs(updated);
  };

  const handleGenerateRoadmapWithKB = async (
    examDate: string,
    confidence: ConfidenceAssessment,
    kbToUse: KnowledgeBaseData,
    previousReport?: DailyProgressReport | null
  ) => {
    const daysRemaining = calculateDaysRemaining(examDate);
    const allSources = extractGrammarSourcesSummary(
      kbToUse.grammars,
      kbToUse.grammarSources
    ).map((s) => s.name);
    const selectedSources = kbToUse.selectedGrammarSources ?? allSources;

    const { priorityVocab, priorityGrammar } = selectPriorityTargets(
      kbToUse.vocabulary,
      kbToUse.grammars,
      Date.now(),
      12,
      6,
      selectedSources
    );

    let generatedRoadmap: DailyRoadmap | null = null;
    try {
      const response = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daysRemaining,
          examDateStr: examDate,
          confidence,
          pendingBugsCount: dueBugs.length,
          personalNotes: confidence.notes,
          priorityVocab,
          priorityGrammar,
          studyIntensity: profile.studyIntensity || 'intensive',
          previousReport: previousReport || dailyReports[0] || null,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.roadmap) {
          generatedRoadmap = {
            ...resData.roadmap,
            date: new Date().toISOString().split('T')[0],
            daysRemaining,
          };
        }
      }
    } catch {
      // Static GitHub Pages fallback
    }

    if (!generatedRoadmap) {
      const structuredTasks = buildStructuredDailyTasks({
        pendingBugsCount: dueBugs.length,
        priorityVocab,
        priorityGrammar,
      });
      generatedRoadmap = {
        date: new Date().toISOString().split('T')[0],
        daysRemaining,
        focusMessage: previousReport
          ? `Lộ trình thích ứng dựa trên Báo cáo 19:00 (${previousReport.date}): Chia rõ 4 Mục (Từ vựng, Ngữ pháp, Đọc hiểu, Nghe hiểu) với từng Mondai cụ thể.`
          : `Chiến dịch ${daysRemaining} ngày trước kỳ thi: Phân bổ ${priorityVocab.length} từ vựng & ${priorityGrammar.length} ngữ pháp Lv1–Lv3 (${selectedSources.length} nguồn đang bật) vào 4 Mục với từng Mondai rõ ràng.`,
        targetScoreGoal: 'Hoàn thành đầy đủ các Mondai trọng tâm của 4 kỹ năng & Tổng kết lúc 19:00',
        totalEstimatedMinutes: structuredTasks.reduce((s, t) => s + t.estimatedMinutes, 0),
        tasks: structuredTasks,
        basedOnReportDate: previousReport?.date,
        tipsForToday: [
          'Mỗi mục đã được tách rõ theo đúng cấu trúc Mondai của đề thi thật JLPT N3.',
          'Vào lúc 19:00, hệ thống sẽ tổng hợp Báo cáo tiến độ để tạo lộ trình thích ứng cho ngày kế tiếp.',
        ],
      };
    }

    setRoadmap(generatedRoadmap);
    setProfile((prev) => ({
      ...prev,
      examDate,
      confidence,
    }));
  };

  const handleGenerateRoadmap = async (data: {
    examDate: string;
    confidence: ConfidenceAssessment;
  }) => {
    await handleGenerateRoadmapWithKB(data.examDate, data.confidence, knowledgeBase);
    showToast('Đã cập nhật lộ trình chia rõ 4 Kỹ năng & từng Mondai cụ thể!');
  };

  const handleGenerateNextDayFromReport = async (report: DailyProgressReport) => {
    await handleGenerateRoadmapWithKB(
      profile.examDate,
      profile.confidence,
      knowledgeBase,
      report
    );
    showToast(
      `Đã tạo Lộ trình Ngày kế tiếp dựa trên Báo cáo 19:00 (${report.date})!`
    );
  };

  const handleUpdateKnowledgeBase = async (
    updated: Partial<KnowledgeBaseData>,
    uids?: { vocabUid?: string; grammarUid?: string },
    regenerateRoadmap = true
  ) => {
    const nextKB: KnowledgeBaseData = {
      ...knowledgeBase,
      ...updated,
    };
    setKnowledgeBase(nextKB);

    if (uids) {
      setProfile((prev) => ({
        ...prev,
        vocabFirebaseUid: uids.vocabUid ?? prev.vocabFirebaseUid,
        grammarFirebaseUid: uids.grammarUid ?? prev.grammarFirebaseUid,
      }));
    }

    if (regenerateRoadmap) {
      await handleGenerateRoadmapWithKB(profile.examDate, profile.confidence, nextKB);
    }
  };

  const applyGrammarSourcesUpdate = (nextSelectedSources: string[], msg: string) => {
    const nextKB: KnowledgeBaseData = {
      ...knowledgeBase,
      selectedGrammarSources: nextSelectedSources,
    };
    setKnowledgeBase(nextKB);

    const { priorityVocab, priorityGrammar } = selectPriorityTargets(
      nextKB.vocabulary,
      nextKB.grammars,
      Date.now(),
      12,
      6,
      nextSelectedSources
    );
    const updatedTasks = buildStructuredDailyTasks({
      pendingBugsCount: dueBugs.length,
      priorityVocab,
      priorityGrammar,
    }).map((t) => {
      const prevTask = roadmap.tasks.find((pt) => pt.id === t.id);
      return prevTask ? { ...t, completed: prevTask.completed } : t;
    });

    setRoadmap((prev) => ({
      ...prev,
      tasks: updatedTasks,
      totalEstimatedMinutes: updatedTasks.reduce((s, t) => s + t.estimatedMinutes, 0),
    }));
    showToast(msg);
  };

  const handleToggleGrammarSource = (sourceName: string) => {
    const allSources = extractGrammarSourcesSummary(
      knowledgeBase.grammars,
      knowledgeBase.grammarSources
    ).map((s) => s.name);
    const currentSelected = knowledgeBase.selectedGrammarSources ?? allSources;
    const isCurrentlySelected = currentSelected.includes(sourceName);

    const nextSelected = isCurrentlySelected
      ? currentSelected.filter((s) => s !== sourceName)
      : [...currentSelected, sourceName];

    applyGrammarSourcesUpdate(
      nextSelected,
      isCurrentlySelected
        ? `Đã bỏ nguồn "${sourceName}" khỏi lộ trình ôn tập.`
        : `Đã đưa nguồn "${sourceName}" vào lộ trình ôn tập.`
    );
  };

  const handleSelectAllGrammarSources = () => {
    const allSources = extractGrammarSourcesSummary(
      knowledgeBase.grammars,
      knowledgeBase.grammarSources
    ).map((s) => s.name);
    applyGrammarSourcesUpdate(
      allSources,
      `Đã bật lại toàn bộ ${allSources.length} nguồn ngữ pháp!`
    );
  };

  const handleChangeVocabLevel = (id: string, newLevel: number) => {
    setKnowledgeBase((prev) => ({
      ...prev,
      vocabulary: prev.vocabulary.map((v) => (v.id === id ? { ...v, level: newLevel } : v)),
    }));
    showToast(`Đã cập nhật Level từ vựng sang Lv${newLevel}.`);
  };

  const handleChangeGrammarLevel = (id: string, newLevel: number) => {
    setKnowledgeBase((prev) => ({
      ...prev,
      grammars: prev.grammars.map((g) => (g.id === id ? { ...g, level: newLevel } : g)),
    }));
    showToast(`Đã cập nhật Level ngữ pháp sang Lv${newLevel}.`);
  };

  return (
    <div className="min-h-screen bg-[#FFF7F8] text-stone-800 flex flex-col selection:bg-pink-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-stone-900 text-white text-xs md:text-sm font-semibold shadow-lg flex items-center gap-2"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setActiveQuiz(null);
          setCurrentTab(tab);
        }}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        pendingBugsCount={dueBugs.length}
        weakItemsCount={weakItemsCount}
      />

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto w-full">
        {currentTab === 'dashboard' && (
          <DailyDashboard
            roadmap={roadmap}
            profile={profile}
            knowledgeBase={knowledgeBase}
            studyLog={studyLog}
            pendingBugsCount={dueBugs.length}
            onToggleTask={handleToggleTask}
            onStartTaskQuiz={handleStartTaskQuiz}
            onOpenRoadmapConfig={() => setIsConfigModalOpen(true)}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onOpenKnowledgeHub={() => setCurrentTab('knowledge')}
            onOpenBugTracker={() => setCurrentTab('bugs')}
            onOpenEveningReport={handleOpenEveningReport}
            onStartAllDueBugs={handleStartAllDueBugs}
            onQuickStartFormat={handleQuickStartFormat}
            onAddExtraTaskToRoadmap={handleAddExtraTaskToRoadmap}
            onToggleGrammarSource={handleToggleGrammarSource}
            onSelectAllGrammarSources={handleSelectAllGrammarSources}
          />
        )}

        {currentTab === 'knowledge' && (
          <KnowledgeBaseView
            knowledgeBase={knowledgeBase}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onStartTargetedQuiz={(format, vItems, gItems, title) =>
              handleStartTargetedQuiz(format, vItems, gItems, title)
            }
            onChangeVocabLevel={handleChangeVocabLevel}
            onChangeGrammarLevel={handleChangeGrammarLevel}
            onToggleGrammarSource={handleToggleGrammarSource}
            onSelectAllGrammarSources={handleSelectAllGrammarSources}
          />
        )}

        {currentTab === 'bugs' && (
          <BugTracker
            bugs={bugs}
            onStartSpacedRepetitionQuiz={handleStartSpacedRepetitionQuiz}
            onDeleteBug={handleDeleteBug}
            onToggleResolveBug={handleToggleResolveBug}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'quiz' && activeQuiz && (
          <QuizInterface
            quizTitle={activeQuiz.title}
            questions={activeQuiz.questions}
            onFinishQuiz={handleFinishQuiz}
            onExit={() => {
              setActiveQuiz(null);
              setCurrentTab('dashboard');
            }}
            onLogBug={handleLogBug}
            onUpdateBugReview={handleUpdateBugReview}
          />
        )}
      </main>

      {/* Modals */}
      <RoadmapFormModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        examDate={profile.examDate}
        confidence={profile.confidence}
        pendingBugsCount={dueBugs.length}
        onGenerateRoadmap={handleGenerateRoadmap}
      />

      <DataSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        knowledgeBase={knowledgeBase}
        vocabUid={profile.vocabFirebaseUid}
        grammarUid={profile.grammarFirebaseUid}
        onUpdateKnowledgeBase={handleUpdateKnowledgeBase}
        onToggleGrammarSource={handleToggleGrammarSource}
      />

      {activeReport && (
        <EveningReportModal
          isOpen={isEveningReportOpen}
          onClose={() => setIsEveningReportOpen(false)}
          report={activeReport}
          studyLog={studyLog}
          onGenerateNextDayRoadmap={handleGenerateNextDayFromReport}
        />
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-pink-200/60 py-5 text-center text-xs text-stone-500 bg-white/50">
        JLPT N3 AI Tracker · Tích hợp lịch sử học từ OnTapTuVung & OnTapNguPhap · Chia rõ 4 Kỹ năng & 17 Mondai
      </footer>
    </div>
  );
}
