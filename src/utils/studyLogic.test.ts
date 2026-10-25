import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDaysRemaining,
  calculateProgress,
  calculateNextReview,
  getBugsDueForReview,
  formatConfidenceSummary,
  stripHtmlToText,
  parseVocabBackupJson,
  parseGrammarBackupJson,
  selectPriorityTargets,
  computeKnowledgeStats,
  parseListeningDialogueTurns,
  isTimeFor19hReport,
  buildDailyProgressReport,
  BugRecord,
  ConfidenceAssessment,
} from './studyLogic';

test('calculateDaysRemaining computes days difference correctly', () => {
  const current = new Date('2026-10-25T00:00:00Z');
  const target = '2026-12-06';
  const days = calculateDaysRemaining(target, current);
  assert.equal(days, 42);
});

test('calculateProgress returns accurate percentage', () => {
  assert.equal(calculateProgress([]), 0);
  assert.equal(calculateProgress([{ completed: true }, { completed: false }]), 50);
  assert.equal(calculateProgress([{ completed: true }, { completed: true }, { completed: true }]), 100);
});

test('calculateNextReview handles correct and incorrect spaced repetition answers', () => {
  const baseTime = 1700000000000;
  const review1 = calculateNextReview(true, 1, 0, baseTime);
  assert.equal(review1.newIntervalDays, 1);
  assert.equal(review1.newReviewCount, 1);
  assert.equal(review1.resolved, false);

  const review2 = calculateNextReview(true, 1, 1, baseTime);
  assert.equal(review2.newIntervalDays, 3);
  assert.equal(review2.newReviewCount, 2);

  const review3 = calculateNextReview(true, 3, 2, baseTime);
  assert.equal(review3.newIntervalDays, 7);

  const review4 = calculateNextReview(true, 7, 3, baseTime);
  assert.equal(review4.resolved, true);

  const failedReview = calculateNextReview(false, 7, 2, baseTime);
  assert.equal(failedReview.newIntervalDays, 1);
  assert.equal(failedReview.resolved, false);
});

test('getBugsDueForReview filters only unresolved and due items', () => {
  const now = 1000000;
  const bugs: BugRecord[] = [
    {
      id: '1',
      questionText: 'Test 1',
      category: 'grammar',
      subCategory: 'Mondai 3',
      options: ['A', 'B'],
      userAnswerIndex: 0,
      correctAnswerIndex: 1,
      explanation: 'Exp',
      timestamp: now - 50000,
      nextReviewDate: now - 100,
      reviewIntervalDays: 1,
      reviewCount: 0,
      resolved: false,
    },
    {
      id: '2',
      questionText: 'Test 2',
      category: 'vocabulary',
      subCategory: 'Goi',
      options: ['A', 'B'],
      userAnswerIndex: 0,
      correctAnswerIndex: 1,
      explanation: 'Exp',
      timestamp: now,
      nextReviewDate: now + 50000,
      reviewIntervalDays: 3,
      reviewCount: 1,
      resolved: false,
    },
  ];

  const due = getBugsDueForReview(bugs, now);
  assert.equal(due.length, 1);
  assert.equal(due[0].id, '1');
});

test('formatConfidenceSummary builds descriptive Vietnamese summary', () => {
  const assessment: ConfidenceAssessment = {
    kanji: 5,
    vocabulary: 4,
    grammarMondai1_2: 3,
    grammarMondai3_4_5: 2,
    readingShort: 3,
    readingMediumLong: 1,
    listening: 3,
    notes: 'Rất sợ bài đọc dài và sắp xếp từ dấu sao',
  };

  const summary = formatConfidenceSummary(assessment);
  assert.match(summary, /Điểm mạnh: Kanji\/Hán tự, Từ vựng \(Goi\)/);
  assert.match(summary, /Điểm yếu cần ưu tiên đặc biệt: Ngữ pháp Mondai 3-4-5.*Đọc hiểu Trung & Dài văn/);
});

test('stripHtmlToText cleans rich text HTML from OnTapNguPhap', () => {
  const raw = '<div><b>Vる / Vない</b> + ようにする</div><ul><li>Cố gắng làm gì</li></ul>';
  const cleaned = stripHtmlToText(raw);
  assert.match(cleaned, /Vる \/ Vない \+ ようにする/);
  assert.match(cleaned, /• Cố gắng làm gì/);
});

test('parseVocabBackupJson and parseGrammarBackupJson parse backup structures accurately', () => {
  const vocabBackup = {
    exportTime: 1700000000000,
    vocabulary: [
      { id: 101, word: '確認', reading: 'かくにん', meaning: 'Xác nhận', level: 2, learned: true, nextReview: 1000 },
      { id: 102, word: '変更', reading: 'へんこう', meaning: 'Thay đổi', level: 6, learned: true, nextReview: 99999999 },
    ],
    reviewHistory: { '2026-10-24': [101, 102] },
  };

  const parsedV = parseVocabBackupJson(vocabBackup);
  assert.equal(parsedV.vocabulary.length, 2);
  assert.equal(parsedV.vocabulary[0].word, '確認');
  assert.equal(parsedV.vocabulary[0].level, 2);

  const grammarBackup = {
    groups: [{ id: 1, name: 'Nguyên nhân' }],
    grammars: [
      {
        id: 201,
        name: '〜おかげで',
        structure: '<b>V / Nの</b> + おかげで',
        meaning: 'Nhờ có...',
        example: '先生のおかげで合格した。',
        level: 1,
        nextReviewDate: 500,
        groupId: 1,
      },
    ],
  };

  const parsedG = parseGrammarBackupJson(grammarBackup);
  assert.equal(parsedG.grammars.length, 1);
  assert.equal(parsedG.grammars[0].name, '〜おかげで');
  assert.equal(parsedG.grammars[0].structure, 'V / Nの + おかげで');
  assert.equal(parsedG.grammars[0].groupName, 'Nguyên nhân');
});

test('selectPriorityTargets prioritizes Lv1-Lv3 and due items over mastered items', () => {
  const now = 50000;
  const vocab = [
    { id: 'v1', word: '得意', reading: 'とくい', meaning: 'Giỏi', level: 7, learned: true, nextReview: now + 100000 },
    { id: 'v2', word: '我慢', reading: 'がまん', meaning: 'Kiên nhẫn', level: 1, learned: true, nextReview: now - 100 }, // Lv1 + Due!
    { id: 'v3', word: '無視', reading: 'むし', meaning: 'Phớt lờ', level: 9, learned: true, nextReview: now - 100 }, // Ignored Lv9
    { id: 'v4', word: 'راتب', reading: 'きゅうりょう', meaning: 'Lương', level: 2, learned: true, nextReview: now + 10000 }, // Lv2
  ];
  const grammars = [
    { id: 'g1', name: '〜うちに', structure: 'Vるうちに', meaning: 'Nhân lúc', example: '', level: 6, nextReviewDate: now + 50000 },
    { id: 'g2', name: '〜にもかかわらず', structure: 'N/V + にもかかわらず', meaning: 'Mặc dù', example: '', level: 2, nextReviewDate: now - 500 },
  ];

  const selected = selectPriorityTargets(vocab, grammars, now, 2, 1);
  assert.equal(selected.priorityVocab.length, 2);
  assert.equal(selected.priorityVocab[0].word, '我慢');
  assert.equal(selected.priorityVocab[1].word, 'راتب');
  assert.equal(selected.priorityGrammar[0].name, '〜にもかかわらず');

  const stats = computeKnowledgeStats(vocab, grammars, now);
  assert.equal(stats.vocabTotal, 3);
  assert.equal(stats.vocabWeakLv1_3, 2);
  assert.equal(stats.vocabDueToday, 1);
});

test('parseListeningDialogueTurns strips speaker prefixes and classifies male/female roles', () => {
  const script = `男：山田さん、明日の会議の資料、もう【確認】しましたか。\n女：はい、スケジュールが【変更】になったので修正しています。`;
  const turns = parseListeningDialogueTurns(script);
  assert.equal(turns.length, 2);
  assert.equal(turns[0].speaker, '男');
  assert.equal(turns[0].role, 'male');
  assert.equal(turns[0].spokenText, '山田さん、明日の会議の資料、もう確認しましたか。');
  assert.equal(turns[1].speaker, '女');
  assert.equal(turns[1].role, 'female');
  assert.equal(turns[1].spokenText, 'はい、スケジュールが変更になったので修正しています。');
});

test('isTimeFor19hReport and buildDailyProgressReport evaluate daily performance and next-day adjustments', () => {
  const afternoon = new Date('2026-10-25T14:30:00');
  const evening = new Date('2026-10-25T19:05:00');
  assert.equal(isTimeFor19hReport(afternoon, null), false);
  assert.equal(isTimeFor19hReport(evening, null), true);

  const report = buildDailyProgressReport({
    studyLog: {
      date: '2026-10-25',
      studyMinutes: 65,
      completedTaskCount: 5,
      totalTaskCount: 7,
      skillStats: {
        vocabulary: { attempted: 5, correct: 5 },
        grammar: { attempted: 5, correct: 4 },
        reading: { attempted: 4, correct: 3 },
        listening: { attempted: 4, correct: 1 },
        review: { attempted: 2, correct: 2 },
      },
      bonusSessions: [
        {
          id: 'b1',
          title: 'Ôn thêm Từ đồng nghĩa',
          quizFormat: 'vocab_synonyms_usage',
          category: 'vocabulary',
          totalQuestions: 4,
          correctQuestions: 4,
          timestamp: 1000,
        },
      ],
      improvedItems: ['確認 (Lv2→Lv3)'],
      weakItems: ['〜にもかかわらず (Lv1)'],
    },
    roadmap: {
      date: '2026-10-25',
      daysRemaining: 42,
      focusMessage: 'Test',
      targetScoreGoal: 'Test',
      totalEstimatedMinutes: 120,
      tasks: [
        {
          id: 't1',
          title: 'Task 1',
          category: 'vocabulary',
          categoryLabel: 'Từ vựng',
          estimatedMinutes: 20,
          completed: true,
          priority: 'high',
        },
        {
          id: 't2',
          title: 'Task 2',
          category: 'listening',
          categoryLabel: 'Nghe hiểu',
          estimatedMinutes: 20,
          completed: false,
          priority: 'high',
        },
      ],
      tipsForToday: [],
    },
    vocabulary: [
      { id: 'v1', word: '我慢', reading: 'がまん', meaning: 'Kiên nhẫn', level: 1, learned: true, nextReview: 100 },
    ],
    grammars: [
      { id: 'g1', name: '〜にもかかわらず', structure: '', meaning: 'Mặc dù', example: '', level: 1, nextReviewDate: 100 },
    ],
    bugs: [],
    now: 2000,
  });

  assert.equal(report.overallAccuracy, 75);
  assert.ok(report.strengths.some((s) => s.includes('Từ vựng')));
  assert.ok(report.weaknesses.some((w) => w.includes('Nghe hiểu')));
  assert.ok(report.recommendedFocusFormats.includes('listening_dialogue'));
});
