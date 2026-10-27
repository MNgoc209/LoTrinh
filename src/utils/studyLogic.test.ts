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

test('parseGrammarBackupJson maps OnTapNguPhap sourceIds array and filters by selected sources', () => {
  const backupWithTwoSources = {
    sources: [
      { id: 10, name: 'Nguồn 1: Shinkanzen N3' },
      { id: 20, name: 'Nguồn 2: Mimikara N3' },
    ],
    grammars: [
      {
        id: 1,
        name: '〜にもかかわらず',
        structure: 'V/N + にもかかわらず',
        meaning: 'Mặc dù',
        example: '',
        level: 1,
        nextReviewDate: 500,
        sourceIds: [10],
      },
      {
        id: 2,
        name: '〜うちに',
        structure: 'Vる + うちに',
        meaning: 'Nhân lúc',
        example: '',
        level: 2,
        nextReviewDate: 500,
        sourceIds: [20],
      },
    ],
  };

  const parsed = parseGrammarBackupJson(backupWithTwoSources);
  assert.equal(parsed.grammarSources.length, 2);
  assert.deepEqual(parsed.grammarSources, ['Nguồn 1: Shinkanzen N3', 'Nguồn 2: Mimikara N3']);
  assert.equal(parsed.grammars[0].sourceName, 'Nguồn 1: Shinkanzen N3');
  assert.equal(parsed.grammars[1].sourceName, 'Nguồn 2: Mimikara N3');

  // When user selects only Source 1 and skips Source 2
  const selected = selectPriorityTargets(
    [],
    parsed.grammars,
    1000,
    5,
    5,
    ['Nguồn 1: Shinkanzen N3']
  );
  assert.equal(selected.priorityGrammar.length, 1);
  assert.equal(selected.priorityGrammar[0].name, '〜にもかかわらず');
});

import {
  generateClientTargetedQuestions,
  resolveMondaiId,
  generateDeepDiveAnalysis,
} from './jlptMondaiTaxonomy';

test('generateClientTargetedQuestions generates authentic JLPT N3 Mondai 2 Star (★) and Vocabulary Mondai 1-5 formats', () => {
  const sampleVocab = [
    { id: 'v1', word: '確認', reading: 'かくにん', meaning: 'Xác nhận', level: 1, learned: true, nextReview: 100 },
    { id: 'v2', word: '変更', reading: 'へんこう', meaning: 'Thay đổi', level: 2, learned: true, nextReview: 100 },
    { id: 'v3', word: '準備', reading: 'じゅんび', meaning: 'Chuẩn bị', level: 1, learned: true, nextReview: 100 },
    { id: 'v4', word: '連絡', reading: 'れんらく', meaning: 'Liên lạc', level: 2, learned: true, nextReview: 100 },
  ];
  const sampleGrammar = [
    {
      id: 'g1',
      name: '〜にもかかわらず',
      structure: 'V/N + にもかかわらず',
      meaning: 'Mặc dù / Bất chấp',
      example: '大雨が降っているにもかかわらず、多くの人が集まった。',
      level: 1,
      nextReviewDate: 100,
    },
    {
      id: 'g2',
      name: '〜おかげで',
      structure: 'V/Nの + おかげで',
      meaning: 'Nhờ có...',
      example: '先生が丁寧に教えてくれたおかげで、試験に合格できた。',
      level: 2,
      nextReviewDate: 100,
    },
    {
      id: 'g3',
      name: '〜うちに',
      structure: 'Vる/Vない + うちに',
      meaning: 'Nhân lúc...',
      example: '雨が降らないうちに、早く帰りましょう。',
      level: 1,
      nextReviewDate: 100,
    },
    {
      id: 'g4',
      name: '〜ようにする',
      structure: 'Vる/Vない + ようにする',
      meaning: 'Cố gắng làm...',
      example: '健康のために、毎日野菜を食べるようにしている。',
      level: 2,
      nextReviewDate: 100,
    },
  ];

  // 1. Grammar Mondai 2 (Dấu sao ★)
  const starQuestions = generateClientTargetedQuestions(
    'grammar_mondai_3_4',
    sampleVocab,
    sampleGrammar,
    'Ngữ pháp · Mondai 2 (Dấu sao ★)',
    'grammar_m2_star'
  );

  assert.ok(starQuestions.length >= 3);
  for (const q of starQuestions) {
    assert.match(q.questionText, /＿＿＿　＿＿＿　★　＿＿＿/);
    assert.equal(q.options.length, 4);
    assert.ok(q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4);
    // Options in Mondai 2 Star must be Japanese sentence fragments, never raw Vietnamese definitions
    for (const opt of q.options) {
      assert.doesNotMatch(opt, /Mặc dù|Nhờ có|Nhân lúc|Cố gắng/);
    }
    assert.match(q.explanation, /Thứ tự ghép 4 mảnh đúng/);
  }

  // 2. Vocab Mondai 1 (Cách đọc Kanji) -> options must be Hiragana readings
  const m1Questions = generateClientTargetedQuestions(
    'vocab_synonyms_usage',
    sampleVocab,
    sampleGrammar,
    'Từ vựng · Mondai 1 (Cách đọc Kanji)',
    'vocab_m1_kanji_reading'
  );
  assert.ok(m1Questions.length >= 3);
  assert.equal(m1Questions[0].options[m1Questions[0].correctAnswerIndex], 'かくにん');

  // 3. Vocab Mondai 5 (Cách dùng từ / 用法) -> options must be 4 full Japanese sentences containing the target word
  const m5Questions = generateClientTargetedQuestions(
    'vocab_synonyms_usage',
    sampleVocab,
    sampleGrammar,
    'Từ vựng · Mondai 5 (Cách dùng từ đúng)',
    'vocab_m5_usage'
  );
  assert.ok(m5Questions.length >= 3);
  for (const opt of m5Questions[0].options) {
    assert.ok(opt.includes('確認'));
  }

  // 4. resolveMondaiId accurately maps subCategory / mondaiId strings
  assert.equal(resolveMondaiId('grammar_mondai_3_4', 'grammar_m2_star', ''), 'grammar_m2_star');
  assert.equal(resolveMondaiId('grammar_mondai_3_4', undefined, 'Ngữ pháp · Mondai 2 (Dấu sao ★)'), 'grammar_m2_star');
  assert.equal(resolveMondaiId('vocab_synonyms_usage', undefined, 'Từ vựng · Mondai 5 (Cách dùng từ đúng)'), 'vocab_m5_usage');

  // 5. generateDeepDiveAnalysis provides detailed 3-part breakdown for both wrong and correct selections
  const starQ = starQuestions[0];
  const wrongIdx = (starQ.correctAnswerIndex + 1) % 4;
  const wrongAnalysis = generateDeepDiveAnalysis(starQ, wrongIdx);
  assert.match(wrongAnalysis, /1\. PHÂN TÍCH BẪY TƯ DUY/);
  assert.match(wrongAnalysis, /2\. GIẢI PHẪU 4 PHƯƠNG ÁN LỰA CHỌN/);
  assert.match(wrongAnalysis, /3\. KIẾN THỨC GỐC TỪ KHO HỌC CÁ NHÂN/);

  const rightAnalysis = generateDeepDiveAnalysis(starQ, starQ.correctAnswerIndex);
  assert.match(rightAnalysis, /1\. ĐÁNH GIÁ LỰA CHỌN CỦA BẠN \(CHÍNH XÁC ✓\)/);
});

