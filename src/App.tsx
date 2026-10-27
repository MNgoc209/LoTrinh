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
  clearAllAppStorage,
  DEFAULT_PROFILE,
  INITIAL_KNOWLEDGE_BASE,
  INITIAL_SEED_ROADMAP,
  createEmptyStudyLog,
} from './utils/storage';
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
  pullFromSharedBrowserStorage,
  pushWorkspaceToCloud,
  pullWorkspaceFromCloud,
  getDeviceLabel,
  saveCloudPairingBundle,
} from './utils/firebaseExternalSync';
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
  CrossDeviceWorkspaceSnapshot,
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
  const isPullingCloudRef = React.useRef(false);

  useEffect(() => {
    saveUserProfile(profile);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', profile.themeColor || 'sky');
    }
  }, [profile]);

  // Automatically sync from shared browser origin (mngoc209.github.io) AND Cloud Firebase on startup
  useEffect(() => {
    if (knowledgeBase.vocabulary.length === 0 && knowledgeBase.grammars.length === 0) {
      const { vocabResult, grammarResult } = pullFromSharedBrowserStorage();
      if (vocabResult || grammarResult) {
        const nextKB: KnowledgeBaseData = {
          ...knowledgeBase,
          ...(vocabResult
            ? {
                vocabulary: vocabResult.vocabulary,
                vocabReviewHistory: vocabResult.reviewHistory,
                lastSyncedVocabAt: Date.now(),
                syncSourceVocab: `Tự động đồng bộ từ trình duyệt (${vocabResult.vocabulary.length} từ)`,
              }
            : {}),
          ...(grammarResult
            ? {
                grammars: grammarResult.grammars,
                grammarReviewHistory: grammarResult.reviewHistory,
                grammarSources: grammarResult.grammarSources,
                selectedGrammarSources: grammarResult.grammarSources,
                lastSyncedGrammarAt: Date.now(),
                syncSourceGrammar: `Tự động đồng bộ từ trình duyệt (${grammarResult.grammars.length} mẫu · ${grammarResult.grammarSources.length} nguồn)`,
              }
            : {}),
        };
        setKnowledgeBase(nextKB);
        const { priorityVocab, priorityGrammar } = selectPriorityTargets(
          nextKB.vocabulary,
          nextKB.grammars,
          Date.now(),
          12,
          6,
          nextKB.selectedGrammarSources
        );
        const structuredTasks = buildStructuredDailyTasks({
          pendingBugsCount: 0,
          priorityVocab,
          priorityGrammar,
        });
        if (structuredTasks.length > 0) {
          setRoadmap((prev) => ({
            ...prev,
            focusMessage: `Đã tự động đồng bộ ${nextKB.vocabulary.length} từ vựng & ${nextKB.grammars.length} mẫu ngữ pháp từ trình duyệt của bạn!`,
            tasks: structuredTasks,
            totalEstimatedMinutes: structuredTasks.reduce((s, t) => s + t.estimatedMinutes, 0),
          }));
        }
      }
    }

    // Also silently check Firebase Cloud / Sync Room for newer cross-device workspace state
    pullWorkspaceFromCloud(profile.cloudSyncKey)
      .then(({ workspace, vocabResult, grammarResult }) => {
        if (!workspace && !vocabResult && !grammarResult) return;
        isPullingCloudRef.current = true;
        if (vocabResult || grammarResult) {
          setKnowledgeBase((prevKB) => ({
            ...prevKB,
            ...(vocabResult
              ? {
                  vocabulary: vocabResult.vocabulary,
                  vocabReviewHistory: vocabResult.reviewHistory,
                  lastSyncedVocabAt: Date.now(),
                  syncSourceVocab: `Cloud Tự Động (${vocabResult.vocabulary.length} từ)`,
                }
              : {}),
            ...(grammarResult
              ? {
                  grammars: grammarResult.grammars,
                  grammarReviewHistory: grammarResult.reviewHistory,
                  grammarSources: grammarResult.grammarSources,
                  selectedGrammarSources:
                    workspace?.selectedGrammarSources ||
                    prevKB.selectedGrammarSources ||
                    grammarResult.grammarSources,
                  lastSyncedGrammarAt: Date.now(),
                  syncSourceGrammar: `Cloud Tự Động (${grammarResult.grammars.length} mẫu · ${grammarResult.grammarSources.length} nguồn)`,
                }
              : {}),
          }));
        }

        if (
          workspace &&
          workspace.updatedAt > (profile.lastCloudSyncedAt || 0)
        ) {
          if (workspace.roadmap?.tasks?.length > 0) setRoadmap(workspace.roadmap);
          if (Array.isArray(workspace.bugs)) setBugs(workspace.bugs);
          if (workspace.studyLog) setStudyLog(workspace.studyLog);
          if (Array.isArray(workspace.dailyReports)) setDailyReports(workspace.dailyReports);
          if (workspace.knowledgeBase) {
            setKnowledgeBase((prev) => ({
              ...prev,
              ...workspace.knowledgeBase,
            }));
          }
          setProfile((prev) => ({
            ...prev,
            ...workspace.profile,
            lastCloudSyncedAt: workspace.updatedAt,
            lastSyncedDevice: workspace.deviceLabel,
          }));
        }
        setTimeout(() => {
          isPullingCloudRef.current = false;
        }, 600);
      })
      .catch(() => {
        // Ignore offline errors on startup
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Automatic debounced background push to Cloud when study progress changes
  useEffect(() => {
    if (isPullingCloudRef.current) return;
    if (
      knowledgeBase.vocabulary.length === 0 &&
      knowledgeBase.grammars.length === 0 &&
      roadmap.tasks.length === 0
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const now = Date.now();
      const snapshot: CrossDeviceWorkspaceSnapshot = {
        version: 1,
        updatedAt: now,
        deviceLabel: getDeviceLabel(),
        profile: {
          ...profile,
          lastCloudSyncedAt: now,
          lastSyncedDevice: getDeviceLabel(),
        },
        roadmap,
        bugs,
        studyLog,
        dailyReports,
        selectedGrammarSources: knowledgeBase.selectedGrammarSources,
        knowledgeBase,
      };
      pushWorkspaceToCloud(snapshot, profile.cloudSyncKey).catch(() => {
        // Ignore background push errors
      });
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap, bugs, studyLog, dailyReports, knowledgeBase.selectedGrammarSources]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const activeGrammarSources =
    knowledgeBase.selectedGrammarSources ??
    extractGrammarSourcesSummary(knowledgeBase.grammars, knowledgeBase.grammarSources).map(
      (s) => s.name
    );

  // Automatic 19:00 Daily Checkpoint Watcher (only triggers when user has synced data or completed tasks)
  useEffect(() => {
    const check19hSchedule = () => {
      if (
        knowledgeBase.vocabulary.length === 0 &&
        knowledgeBase.grammars.length === 0 &&
        roadmap.tasks.length === 0
      ) {
        return;
      }
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
        const hasStudiedToday =
          studyLog.completedTaskCount > 0 || studyLog.bonusSessions.length > 0;
        if (hasStudiedToday) {
          setIsEveningReportOpen(true);
          showToast(
            'Đã đến 19:00! Hệ thống tự động tổng hợp Báo cáo tiến độ hôm nay & gợi ý lộ trình ngày mai.'
          );
        }
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
    category?: JLPTCategory,
    mondaiId?: string
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
      mondaiId,
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
    isBonus = false,
    mondaiId?: string
  ) => {
    if (quizFormat === 'bug_review') {
      handleStartAllDueBugs();
      return;
    }

    if (vocabItems.length === 0 && grammarItems.length === 0) {
      showToast(
        'Chưa có dữ liệu từ vựng hoặc ngữ pháp! Vui lòng nạp file Backup JSON hoặc kết nối Firebase trước khi làm bài.'
      );
      setIsSyncModalOpen(true);
      return;
    }

    let generatedQuestions: QuizQuestion[] = [];
    try {
      const response = await fetch('/api/quiz/generate-targeted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizFormat,
          mondaiId,
          customTitle,
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
        customTitle,
        mondaiId
      );
    }

    if (generatedQuestions.length === 0) {
      showToast(
        'Cần nạp dữ liệu tương ứng (Từ vựng hoặc Ngữ pháp) từ OnTapTuVung / OnTapNguPhap để tạo dạng đề này.'
      );
      setIsSyncModalOpen(true);
      return;
    }

    setActiveQuiz({
      title: customTitle,
      questions: generatedQuestions,
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
      Boolean(task.isBonusTask),
      task.mondaiId
    );
  };

  const handleQuickStartFormat = async (
    format: QuizFormatType,
    title: string,
    isBonus = false,
    mondaiId?: string
  ) => {
    const { priorityVocab, priorityGrammar } = selectPriorityTargets(
      knowledgeBase.vocabulary,
      knowledgeBase.grammars,
      Date.now(),
      12,
      6,
      activeGrammarSources
    );
    await handleStartTargetedQuiz(
      format,
      priorityVocab,
      priorityGrammar,
      title,
      undefined,
      isBonus,
      mondaiId
    );
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
    if (priorityVocab.length > 0 || priorityGrammar.length > 0 || dueBugs.length > 0) {
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
        focusMessage:
          structuredTasks.length === 0
            ? 'Chưa có dữ liệu từ vựng hoặc ngữ pháp. Hãy bấm "Đồng bộ dữ liệu" để nạp file Backup JSON hoặc kết nối Cloud Firebase từ OnTapTuVung & OnTapNguPhap.'
            : previousReport
            ? `Lộ trình thích ứng dựa trên Báo cáo 19:00 (${previousReport.date}): Chia rõ 4 Mục (Từ vựng, Ngữ pháp, Đọc hiểu, Nghe hiểu) với từng Mondai cụ thể.`
            : `Chiến dịch ${daysRemaining} ngày trước kỳ thi: Phân bổ ${priorityVocab.length} từ vựng & ${priorityGrammar.length} ngữ pháp Lv1–Lv3 (${selectedSources.length} nguồn đang bật) vào 4 Mục với từng Mondai rõ ràng.`,
        targetScoreGoal:
          structuredTasks.length === 0
            ? 'Nạp dữ liệu cá nhân để bắt đầu'
            : 'Hoàn thành đầy đủ các Mondai trọng tâm của 4 kỹ năng & Tổng kết lúc 19:00',
        totalEstimatedMinutes: structuredTasks.reduce((s, t) => s + t.estimatedMinutes, 0),
        tasks: structuredTasks,
        basedOnReportDate: previousReport?.date,
        tipsForToday:
          structuredTasks.length === 0
            ? []
            : [
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
    showToast('Đã cập nhật lộ trình theo cấu hình mới!');
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

  const handleClearAllData = () => {
    clearAllAppStorage();
    setKnowledgeBase(INITIAL_KNOWLEDGE_BASE);
    setRoadmap({
      ...INITIAL_SEED_ROADMAP,
      daysRemaining: calculateDaysRemaining(DEFAULT_PROFILE.examDate),
    });
    setBugs([]);
    setStudyLog(createEmptyStudyLog());
    setDailyReports([]);
    setProfile(DEFAULT_PROFILE);
    showToast('Đã xóa toàn bộ dữ liệu tạm và đưa ứng dụng về trạng thái trống.');
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

  const handleToggleThemeColor = () => {
    const nextTheme = (profile.themeColor || 'sky') === 'sky' ? 'sakura' : 'sky';
    setProfile((prev) => ({
      ...prev,
      themeColor: nextTheme,
    }));
    showToast(
      nextTheme === 'sky'
        ? 'Đã chuyển sang tông màu Xanh dịu (#BEDEFF).'
        : 'Đã chuyển sang tông màu Hồng phấn nhạt dịu mắt.'
    );
  };

  const handlePushWorkspaceToCloud = async (customSyncKey?: string): Promise<string> => {
    const now = Date.now();
    const deviceLabel = getDeviceLabel();
    const roomKey = (customSyncKey ?? profile.cloudSyncKey ?? 'mngoc209').trim();
    saveCloudPairingBundle({ syncRoomKey: roomKey });

    const nextProfile: UserProfile = {
      ...profile,
      cloudSyncKey: roomKey,
      lastCloudSyncedAt: now,
      lastSyncedDevice: deviceLabel,
    };
    setProfile(nextProfile);

    const snapshot: CrossDeviceWorkspaceSnapshot = {
      version: 1,
      updatedAt: now,
      deviceLabel,
      profile: nextProfile,
      roadmap,
      bugs,
      studyLog,
      dailyReports,
      selectedGrammarSources: knowledgeBase.selectedGrammarSources,
      knowledgeBase,
    };

    const res = await pushWorkspaceToCloud(snapshot, roomKey);
    if (res.channels.length > 0) {
      return `Đã đẩy toàn bộ tiến độ (${deviceLabel}) lên: ${res.channels.join(' + ')}!`;
    }
    return `Đã lưu trạng thái đồng bộ của ${deviceLabel}. Bạn cũng có thể bấm "Copy Gói Đồng Bộ Toàn Bộ" bên dưới để gửi sang thiết bị thứ 2!`;
  };

  const handlePullWorkspaceFromCloud = async (customSyncKey?: string): Promise<string> => {
    const roomKey = (customSyncKey ?? profile.cloudSyncKey ?? 'mngoc209').trim();
    saveCloudPairingBundle({ syncRoomKey: roomKey });

    const { workspace, vocabResult, grammarResult, sources } =
      await pullWorkspaceFromCloud(roomKey);

    if (!workspace && !vocabResult && !grammarResult) {
      throw new Error(
        `Chưa tìm thấy dữ liệu đồng bộ cho mã "${roomKey}". Hãy bấm "Đẩy lên Đám mây (Push)" trên thiết bị đã có dữ liệu trước, hoặc dùng nút "Copy Gói Đồng Bộ Toàn Bộ" bên dưới!`
      );
    }

    isPullingCloudRef.current = true;
    let nextKB: KnowledgeBaseData = { ...knowledgeBase };

    if (vocabResult && vocabResult.vocabulary.length > 0) {
      nextKB = {
        ...nextKB,
        vocabulary: vocabResult.vocabulary,
        vocabReviewHistory: vocabResult.reviewHistory,
        lastSyncedVocabAt: Date.now(),
        syncSourceVocab: `Cloud Liên Thiết Bị (${vocabResult.vocabulary.length} từ)`,
      };
    }

    if (grammarResult && grammarResult.grammars.length > 0) {
      nextKB = {
        ...nextKB,
        grammars: grammarResult.grammars,
        grammarReviewHistory: grammarResult.reviewHistory,
        grammarSources: grammarResult.grammarSources,
        selectedGrammarSources:
          workspace?.selectedGrammarSources ||
          nextKB.selectedGrammarSources ||
          grammarResult.grammarSources,
        lastSyncedGrammarAt: Date.now(),
        syncSourceGrammar: `Cloud Liên Thiết Bị (${grammarResult.grammars.length} mẫu · ${grammarResult.grammarSources.length} nguồn)`,
      };
    }

    if (workspace?.knowledgeBase) {
      if (
        workspace.knowledgeBase.vocabulary?.length &&
        nextKB.vocabulary.length === 0
      ) {
        nextKB.vocabulary = workspace.knowledgeBase.vocabulary;
        nextKB.vocabReviewHistory = workspace.knowledgeBase.vocabReviewHistory || {};
        nextKB.syncSourceVocab =
          workspace.knowledgeBase.syncSourceVocab ||
          `Đồng bộ từ ${workspace.deviceLabel}`;
      }
      if (
        workspace.knowledgeBase.grammars?.length &&
        nextKB.grammars.length === 0
      ) {
        nextKB.grammars = workspace.knowledgeBase.grammars;
        nextKB.grammarReviewHistory =
          workspace.knowledgeBase.grammarReviewHistory || {};
        nextKB.grammarSources = workspace.knowledgeBase.grammarSources;
        nextKB.selectedGrammarSources =
          workspace.selectedGrammarSources ||
          workspace.knowledgeBase.selectedGrammarSources;
        nextKB.syncSourceGrammar =
          workspace.knowledgeBase.syncSourceGrammar ||
          `Đồng bộ từ ${workspace.deviceLabel}`;
      }
    }

    setKnowledgeBase(nextKB);

    if (workspace) {
      if (workspace.roadmap) setRoadmap(workspace.roadmap);
      if (Array.isArray(workspace.bugs)) setBugs(workspace.bugs);
      if (workspace.studyLog) setStudyLog(workspace.studyLog);
      if (Array.isArray(workspace.dailyReports)) setDailyReports(workspace.dailyReports);
      setProfile((prev) => ({
        ...prev,
        ...workspace.profile,
        cloudSyncKey: roomKey,
        lastCloudSyncedAt: workspace.updatedAt || Date.now(),
        lastSyncedDevice: workspace.deviceLabel,
      }));
    } else {
      // Regenerate roadmap from pulled Vocab & Grammar if no workspace snapshot existed yet
      await handleGenerateRoadmapWithKB(profile.examDate, profile.confidence, nextKB);
    }

    setTimeout(() => {
      isPullingCloudRef.current = false;
    }, 600);

    return `Đã đồng bộ thành công về thiết bị này từ: ${sources.join(' · ')}!`;
  };

  const handleExportFullSnapshotJson = (): string => {
    const now = Date.now();
    const snapshot: CrossDeviceWorkspaceSnapshot = {
      version: 1,
      updatedAt: now,
      deviceLabel: getDeviceLabel(),
      profile: {
        ...profile,
        lastCloudSyncedAt: now,
        lastSyncedDevice: getDeviceLabel(),
      },
      roadmap,
      bugs,
      studyLog,
      dailyReports,
      selectedGrammarSources: knowledgeBase.selectedGrammarSources,
      knowledgeBase,
    };
    return JSON.stringify(snapshot);
  };

  const handleImportFullSnapshotJson = (rawJson: string) => {
    const parsed: CrossDeviceWorkspaceSnapshot = JSON.parse(rawJson);
    isPullingCloudRef.current = true;
    if (parsed.knowledgeBase) {
      setKnowledgeBase(parsed.knowledgeBase);
    }
    if (parsed.roadmap) setRoadmap(parsed.roadmap);
    if (Array.isArray(parsed.bugs)) setBugs(parsed.bugs);
    if (parsed.studyLog) setStudyLog(parsed.studyLog);
    if (Array.isArray(parsed.dailyReports)) setDailyReports(parsed.dailyReports);
    if (parsed.profile) {
      setProfile({
        ...parsed.profile,
        lastCloudSyncedAt: Date.now(),
        lastSyncedDevice: parsed.deviceLabel || 'Thiết bị khác',
      });
    }
    setTimeout(() => {
      isPullingCloudRef.current = false;
    }, 600);
    showToast(
      `Đã đồng bộ toàn bộ tiến độ từ "${parsed.deviceLabel || 'Thiết bị khác'}" sang máy này!`
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-slate-800 flex flex-col selection:bg-pink-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs md:text-sm font-semibold shadow-lg flex items-center gap-2"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
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
        themeColor={profile.themeColor || 'sky'}
        onToggleThemeColor={handleToggleThemeColor}
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
        cloudSyncKey={profile.cloudSyncKey}
        lastCloudSyncedAt={profile.lastCloudSyncedAt}
        lastSyncedDevice={profile.lastSyncedDevice}
        onUpdateKnowledgeBase={handleUpdateKnowledgeBase}
        onPushWorkspaceToCloud={handlePushWorkspaceToCloud}
        onPullWorkspaceFromCloud={handlePullWorkspaceFromCloud}
        onExportFullSnapshotJson={handleExportFullSnapshotJson}
        onImportFullSnapshotJson={handleImportFullSnapshotJson}
        onToggleGrammarSource={handleToggleGrammarSource}
        onClearAllData={handleClearAllData}
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
