import {
  JLPTCategory,
  QuizFormatType,
  ImportedVocabItem,
  ImportedGrammarItem,
  QuizQuestion,
  TaskItem,
} from '../types';

export interface MondaiSpec {
  id: string;
  category: JLPTCategory;
  sectionTitle: string;
  mondaiCode: string; // e.g. "Từ vựng · Mondai 1"
  nameVi: string; // e.g. "Cách đọc Hán tự (Kanji -> Hiragana)"
  nameJp: string; // e.g. "漢字読み"
  description: string;
  examQuestionCount: string;
  quizFormat: QuizFormatType;
  defaultMinutes: number;
  defaultPracticeCount: number;
}

export const JLPT_N3_SECTIONS: {
  category: JLPTCategory;
  title: string;
  subtitle: string;
  badgeText: string;
}[] = [
  {
    category: 'vocabulary',
    title: '1. Từ vựng – Hán tự (文字・語彙)',
    subtitle: 'Gồm 5 Mondai: Đọc Hán tự, Viết Hán tự, Điền từ ngữ cảnh, Từ đồng nghĩa, Cách dùng từ',
    badgeText: '5 dạng Mondai',
  },
  {
    category: 'grammar',
    title: '2. Ngữ pháp (文法)',
    subtitle: 'Gồm 3 Mondai: Ngữ pháp câu đơn, Sắp xếp câu dấu sao ★, Ngữ pháp đục lỗ đoạn văn',
    badgeText: '3 dạng Mondai',
  },
  {
    category: 'reading',
    title: '3. Đọc hiểu (読解)',
    subtitle: 'Gồm 4 Mondai: Đoản văn (Ngắn), Trung văn (Vừa), Trường văn (Dài), Tìm kiếm thông tin',
    badgeText: '4 dạng Mondai',
  },
  {
    category: 'listening',
    title: '4. Nghe hiểu (聴解)',
    subtitle: 'Gồm 5 Mondai: Nghe nhiệm vụ, Nghe điểm chính, Nghe khái quát, Giao tiếp tình huống, Phản xạ nhanh',
    badgeText: '5 dạng Mondai',
  },
];

export const JLPT_N3_MONDAI_CATALOG: MondaiSpec[] = [
  // ================= 1. TỪ VỰNG (5 MONDAI) =================
  {
    id: 'vocab_m1_kanji_reading',
    category: 'vocabulary',
    sectionTitle: '1. Từ vựng – Hán tự (文字・語彙)',
    mondaiCode: 'Từ vựng · Mondai 1',
    nameVi: 'Cách đọc Hán tự (Chuyển Kanji sang Hiragana)',
    nameJp: '漢字読み',
    description:
      'Đọc câu tiếng Nhật có từ Hán tự trong ngoặc 【　】 và chọn cách đọc Hiragana chính xác (chú ý trường âm, âm ngắt, biến âm).',
    examQuestionCount: '8 câu trong đề thi thật',
    quizFormat: 'vocab_synonyms_usage',
    defaultMinutes: 10,
    defaultPracticeCount: 5,
  },
  {
    id: 'vocab_m2_orthography',
    category: 'vocabulary',
    sectionTitle: '1. Từ vựng – Hán tự (文字・語彙)',
    mondaiCode: 'Từ vựng · Mondai 2',
    nameVi: 'Nhận diện chữ Hán (Chuyển Hiragana sang Kanji)',
    nameJp: '表記',
    description:
      'Đọc câu tiếng Nhật có từ Hiragana trong ngoặc 【　】 và chọn chữ Hán (Kanji) viết đúng cho từ đó.',
    examQuestionCount: '6 câu trong đề thi thật',
    quizFormat: 'vocab_synonyms_usage',
    defaultMinutes: 10,
    defaultPracticeCount: 5,
  },
  {
    id: 'vocab_m3_context',
    category: 'vocabulary',
    sectionTitle: '1. Từ vựng – Hán tự (文字・語彙)',
    mondaiCode: 'Từ vựng · Mondai 3',
    nameVi: 'Điền từ vào chỗ trống theo ngữ cảnh câu',
    nameJp: '文脈規定',
    description:
      'Đọc câu tiếng Nhật khuyết chỗ trống （　　） và chọn từ vựng phù hợp nhất với mạch nghĩa của câu.',
    examQuestionCount: '11 câu trong đề thi thật',
    quizFormat: 'vocab_synonyms_usage',
    defaultMinutes: 15,
    defaultPracticeCount: 5,
  },
  {
    id: 'vocab_m4_synonyms',
    category: 'vocabulary',
    sectionTitle: '1. Từ vựng – Hán tự (文字・語彙)',
    mondaiCode: 'Từ vựng · Mondai 4',
    nameVi: 'Tìm từ đồng nghĩa / Cách diễn đạt gần nghĩa nhất',
    nameJp: '言い換え類義',
    description:
      'Chọn từ hoặc cụm diễn đạt tiếng Nhật có thể thay thế cho từ trong ngoặc 【　】 mà không làm đổi nghĩa câu gốc.',
    examQuestionCount: '5 câu trong đề thi thật',
    quizFormat: 'vocab_synonyms_usage',
    defaultMinutes: 15,
    defaultPracticeCount: 5,
  },
  {
    id: 'vocab_m5_usage',
    category: 'vocabulary',
    sectionTitle: '1. Từ vựng – Hán tự (文字・語彙)',
    mondaiCode: 'Từ vựng · Mondai 5',
    nameVi: 'Cách dùng từ đúng trong câu (Chọn câu dùng từ chuẩn)',
    nameJp: '用法',
    description:
      'Cho 1 từ vựng mục tiêu và 4 câu tiếng Nhật hoàn chỉnh; chọn duy nhất 1 câu sử dụng từ đó đúng ngữ pháp và tự nhiên nhất.',
    examQuestionCount: '5 câu trong đề thi thật',
    quizFormat: 'vocab_synonyms_usage',
    defaultMinutes: 15,
    defaultPracticeCount: 5,
  },

  // ================= 2. NGỮ PHÁP (3 MONDAI) =================
  {
    id: 'grammar_m1_sentence',
    category: 'grammar',
    sectionTitle: '2. Ngữ pháp (文法)',
    mondaiCode: 'Ngữ pháp · Mondai 1',
    nameVi: 'Chọn cấu trúc ngữ pháp trong câu đơn',
    nameJp: '文の文法 1 (文法形式の判断)',
    description:
      'Chọn mẫu cấu trúc ngữ pháp, trợ từ, thể động từ điền vào chỗ trống （　　） trong câu văn tiếng Nhật.',
    examQuestionCount: '13 câu trong đề thi thật',
    quizFormat: 'grammar_mondai_3_4',
    defaultMinutes: 15,
    defaultPracticeCount: 5,
  },
  {
    id: 'grammar_m2_star',
    category: 'grammar',
    sectionTitle: '2. Ngữ pháp (文法)',
    mondaiCode: 'Ngữ pháp · Mondai 2 (Dấu sao ★)',
    nameVi: 'Sắp xếp câu dấu sao ★ (Ghép 4 mảnh câu)',
    nameJp: '文の文法 2 (文の組み立て)',
    description:
      'Sắp xếp 4 mảnh ghép tiếng Nhật vào 4 vị trí ＿＿＿ ＿＿＿ ★ ＿＿＿ để tạo câu đúng ngữ pháp và chọn mảnh ở vị trí ★.',
    examQuestionCount: '5 câu trong đề thi thật',
    quizFormat: 'grammar_mondai_3_4',
    defaultMinutes: 20,
    defaultPracticeCount: 5,
  },
  {
    id: 'grammar_m3_cloze',
    category: 'grammar',
    sectionTitle: '2. Ngữ pháp (文法)',
    mondaiCode: 'Ngữ pháp · Mondai 3 (Đục lỗ đoạn văn)',
    nameVi: 'Ngữ pháp trong đoạn văn (Điền từ đục lỗ theo mạch văn)',
    nameJp: '文章の文法',
    description:
      'Đọc đoạn văn hoàn chỉnh và chọn cấu trúc ngữ pháp, liên từ nối câu phù hợp điền vào vị trí 【 1 】.',
    examQuestionCount: '5 câu trong đề thi thật',
    quizFormat: 'grammar_mondai_3_4',
    defaultMinutes: 20,
    defaultPracticeCount: 4,
  },

  // ================= 3. ĐỌC HIỂU (4 MONDAI) =================
  {
    id: 'reading_m4_short',
    category: 'reading',
    sectionTitle: '3. Đọc hiểu (読解)',
    mondaiCode: 'Đọc hiểu · Mondai 4 (Đoản văn)',
    nameVi: 'Đọc hiểu Đoản văn (~150–200 chữ: Email, Thông báo, Ghi chú)',
    nameJp: '内容理解（短文）',
    description:
      'Bài đọc ngắn 150–200 chữ (Email/Thông báo) lồng ghép từ vựng & ngữ pháp đã học; rèn kỹ năng bắt ý chính.',
    examQuestionCount: '4 bài × 1 câu trong đề thi thật',
    quizFormat: 'reading_integrated',
    defaultMinutes: 20,
    defaultPracticeCount: 4,
  },
  {
    id: 'reading_m5_medium',
    category: 'reading',
    sectionTitle: '3. Đọc hiểu (読解)',
    mondaiCode: 'Đọc hiểu · Mondai 5 (Trung văn)',
    nameVi: 'Đọc hiểu Trung văn (~350 chữ: Phân tích lý do & Ý tác giả)',
    nameJp: '内容理解（中文）',
    description:
      'Bài đọc độ dài trung bình (~350 chữ) giải thích lý do câu gạch chân và quan điểm trọng tâm của tác giả.',
    examQuestionCount: '2 bài × 3 câu trong đề thi thật',
    quizFormat: 'reading_integrated',
    defaultMinutes: 25,
    defaultPracticeCount: 4,
  },
  {
    id: 'reading_m6_long',
    category: 'reading',
    sectionTitle: '3. Đọc hiểu (読解)',
    mondaiCode: 'Đọc hiểu · Mondai 6 (Trường văn)',
    nameVi: 'Đọc hiểu Trường văn (~500 chữ: Bài luận sâu & Suy luận)',
    nameJp: '内容理解（長文）',
    description:
      'Bài đọc dài (~500 chữ) rèn khả năng theo dõi mạch lập luận qua nhiều đoạn văn và tổng hợp ý nghĩa toàn bài.',
    examQuestionCount: '1 bài × 4 câu trong đề thi thật',
    quizFormat: 'reading_integrated',
    defaultMinutes: 25,
    defaultPracticeCount: 3,
  },
  {
    id: 'reading_m7_info_search',
    category: 'reading',
    sectionTitle: '3. Đọc hiểu (読解)',
    mondaiCode: 'Đọc hiểu · Mondai 7 (Tìm kiếm thông tin)',
    nameVi: 'Tìm kiếm thông tin (Đọc tờ rơi, Bảng giá, Lịch sự kiện)',
    nameJp: '情報検索',
    description:
      'Đọc nhanh tờ rơi thông báo, điều kiện đăng ký, bảng giờ/giá vé để tìm phương án thoả mãn yêu cầu của nhân vật.',
    examQuestionCount: '1 bài × 2 câu trong đề thi thật',
    quizFormat: 'reading_integrated',
    defaultMinutes: 15,
    defaultPracticeCount: 3,
  },

  // ================= 4. NGHE HIỂU (5 MONDAI) =================
  {
    id: 'listening_m1_task',
    category: 'listening',
    sectionTitle: '4. Nghe hiểu (聴解)',
    mondaiCode: 'Nghe hiểu · Mondai 1 (Nghe nhiệm vụ)',
    nameVi: 'Nghe hiểu nhiệm vụ (Nhân vật sẽ làm gì tiếp theo?)',
    nameJp: '課題理解',
    description:
      'Nghe hội thoại phân vai Nam/Nữ để xác định hành động đầu tiên nhân vật phải thực hiện ngay sau cuộc hội thoại.',
    examQuestionCount: '6 câu trong đề thi thật',
    quizFormat: 'listening_dialogue',
    defaultMinutes: 20,
    defaultPracticeCount: 4,
  },
  {
    id: 'listening_m2_point',
    category: 'listening',
    sectionTitle: '4. Nghe hiểu (聴解)',
    mondaiCode: 'Nghe hiểu · Mondai 2 (Nghe điểm chính)',
    nameVi: 'Nghe hiểu điểm chính (Lý do, nguyên nhân, chi tiết cụ thể)',
    nameJp: 'ポイント理解',
    description:
      'Đọc trước 4 đáp án và tập trung bắt từ khóa chỉ lý do, thời gian, sự thay đổi kế hoạch trong hội thoại.',
    examQuestionCount: '6 câu trong đề thi thật',
    quizFormat: 'listening_dialogue',
    defaultMinutes: 20,
    defaultPracticeCount: 4,
  },
  {
    id: 'listening_m3_summary',
    category: 'listening',
    sectionTitle: '4. Nghe hiểu (聴解)',
    mondaiCode: 'Nghe hiểu · Mondai 3 (Nghe khái quát)',
    nameVi: 'Nghe hiểu khái quát (Nắm chủ đề & Ý định người nói)',
    nameJp: '概要理解',
    description:
      'Nghe đoạn độc thoại hoặc hội thoại để rút ra chủ đề hoặc thông điệp chính mà người nói muốn truyền đạt.',
    examQuestionCount: '3 câu trong đề thi thật',
    quizFormat: 'listening_dialogue',
    defaultMinutes: 15,
    defaultPracticeCount: 3,
  },
  {
    id: 'listening_m4_expression',
    category: 'listening',
    sectionTitle: '4. Nghe hiểu (聴解)',
    mondaiCode: 'Nghe hiểu · Mondai 4 (Giao tiếp tình huống)',
    nameVi: 'Biểu hiện giao tiếp tình huống (Chọn câu nói phù hợp)',
    nameJp: '発話表現',
    description:
      'Dựa vào ngữ cảnh tình huống (nhờ vả, xin phép, xin lỗi, đề nghị), chọn câu nói tự nhiên và đúng phép lịch sự nhất.',
    examQuestionCount: '4 câu trong đề thi thật',
    quizFormat: 'listening_dialogue',
    defaultMinutes: 15,
    defaultPracticeCount: 4,
  },
  {
    id: 'listening_m5_quick_response',
    category: 'listening',
    sectionTitle: '4. Nghe hiểu (聴解)',
    mondaiCode: 'Nghe hiểu · Mondai 5 (Phản xạ nhanh)',
    nameVi: 'Phản xạ nhanh tức thì (Nghe 1 câu ngắn — Đáp lại ngay)',
    nameJp: '即時応答',
    description:
      'Nghe 1 câu phát ngôn ngắn của đối phương và chọn ngay câu trả lời khớp ngữ cảnh hội thoại tự nhiên.',
    examQuestionCount: '9 câu trong đề thi thật',
    quizFormat: 'listening_dialogue',
    defaultMinutes: 15,
    defaultPracticeCount: 5,
  },
];

// ============================================================================
// AUTHENTIC JLPT N3 QUESTION CONSTRUCTION ENGINE (ALL 17 MONDAI)
// ============================================================================

/**
 * Deterministic / varied option shuffler so the correct answer is never stuck at index 0.
 */
function arrangeOptionsWithSeed(
  correctOption: string,
  distractors: string[],
  seed: number
): { options: string[]; correctAnswerIndex: number } {
  const uniqueDistractors: string[] = [];
  for (const d of distractors) {
    const trimmed = d.trim();
    if (trimmed && trimmed !== correctOption.trim() && !uniqueDistractors.includes(trimmed)) {
      uniqueDistractors.push(trimmed);
    }
    if (uniqueDistractors.length === 3) break;
  }

  let fallbackIdx = 1;
  while (uniqueDistractors.length < 3) {
    const candidate = `${correctOption}（別案${fallbackIdx}）`;
    if (!uniqueDistractors.includes(candidate)) {
      uniqueDistractors.push(candidate);
    }
    fallbackIdx++;
  }

  const targetCorrectIndex = Math.abs(seed) % 4;
  const options: string[] = [];
  let dPtr = 0;
  for (let i = 0; i < 4; i++) {
    if (i === targetCorrectIndex) {
      options.push(correctOption);
    } else {
      options.push(uniqueDistractors[dPtr++]);
    }
  }

  return { options, correctAnswerIndex: targetCorrectIndex };
}

/**
 * Cleans a grammar pattern name from OnTapNguPhap (e.g. "〜うちに (Trong lúc...)" -> "うちに")
 */
export function cleanGrammarSurface(rawName: string): string {
  if (!rawName) return 'うちに';
  let s = rawName
    .replace(/^[〜~～\-－\s]+/, '')
    .replace(/[〜~～\-－\s]+$/, '')
    .split(/[（(【\n/｜|]/)[0]
    .trim();
  if (!s) s = rawName.replace(/[〜~～]/g, '').trim();
  return s;
}

/**
 * Extracts a clean Japanese sentence from a user's grammar example field (stripping Vietnamese translations)
 */
export function extractJapaneseExampleSentence(rawExample?: string): string | null {
  if (!rawExample) return null;
  const lines = rawExample
    .split(/\r?\n/)
    .map((l) => l.replace(/^[・•\-*\d.)\s]+/, '').trim())
    .filter(Boolean);

  for (const line of lines) {
    // Check if the line has Japanese characters (Hiragana/Katakana/Kanji)
    if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(line)) {
      // Strip trailing Vietnamese translation in parentheses or after slash/dash
      const cleaned = line
        .replace(/\s*[（(][^）)]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ][^）)]*[）)]\s*$/i, '')
        .replace(/\s*[/｜|→-]\s*[^/｜|→-]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ].*$/i, '')
        .trim();
      if (cleaned.length >= 6) {
        return cleaned.endsWith('。') || cleaned.endsWith('？') || cleaned.endsWith('!')
          ? cleaned
          : `${cleaned}。`;
      }
    }
  }
  return null;
}

/**
 * Generates realistic JLPT N3 Hiragana phonetic distractors for Mondai 1 (漢字読み):
 * tests long vowels (う/い), voiced consonants (dakuten), geminate consonants (っ), and nasal (ん/り/る).
 */
export function generateHiraganaDistractors(
  correctReading: string,
  otherReadings: string[]
): string[] {
  const clean = (correctReading || 'かくにん').split(/[・/（(,\s]/)[0].trim();
  const candidates: string[] = [];

  // 1. Long vowel mutation (う removal or insertion)
  if (clean.includes('う') && clean.length > 2) {
    candidates.push(clean.replace('う', ''));
  } else if (/[おこそとのほもよろごぞどぼぽ]/.test(clean)) {
    candidates.push(clean.replace(/([おこそとのほもよろごぞどぼぽ])/, '$1う'));
  } else if (clean.length >= 2) {
    candidates.push(`${clean.slice(0, 1)}う${clean.slice(1)}`);
  }

  // 2. Dakuten / Voicing mutation
  const dakutenPairs: [string, string][] = [
    ['か', 'が'],
    ['き', 'ぎ'],
    ['く', 'ぐ'],
    ['け', 'げ'],
    ['こ', 'ご'],
    ['さ', 'ざ'],
    ['し', 'じ'],
    ['す', 'ず'],
    ['せ', 'ぜ'],
    ['そ', 'ぞ'],
    ['た', 'だ'],
    ['ち', 'ぢ'],
    ['つ', 'づ'],
    ['て', 'で'],
    ['と', 'ど'],
    ['は', 'ば'],
    ['ひ', 'び'],
    ['ふ', 'ぶ'],
    ['へ', 'べ'],
    ['ほ', 'ぼ'],
  ];
  for (const [voiceless, voiced] of dakutenPairs) {
    if (clean.includes(voiceless)) {
      candidates.push(clean.replace(voiceless, voiced));
      break;
    }
    if (clean.includes(voiced)) {
      candidates.push(clean.replace(voiced, voiceless));
      break;
    }
  }

  // 3. Geminate (っ) or final mora mutation
  if (clean.includes('っ')) {
    candidates.push(clean.replace('っ', 'つ'));
    candidates.push(clean.replace('っ', ''));
  } else if (clean.length >= 3) {
    candidates.push(`${clean.slice(0, 1)}っ${clean.slice(1)}`);
  }

  // 4. Mora swap or phonetic neighbor
  if (clean.endsWith('ん')) {
    candidates.push(`${clean.slice(0, -1)}る`);
    candidates.push(`${clean.slice(0, -1)}い`);
  } else if (clean.endsWith('る')) {
    candidates.push(`${clean.slice(0, -1)}り`);
  } else if (clean.endsWith('い')) {
    candidates.push(`${clean.slice(0, -1)}え`);
  }

  for (const other of otherReadings) {
    const cOther = other.split(/[・/（(,\s]/)[0].trim();
    if (cOther && cOther !== clean) {
      candidates.push(cOther);
    }
  }

  const fallbacks = ['しんぱい', 'けいけん', 'せつめい', 'そうだん', 'じゅんび'];
  for (const fb of fallbacks) {
    if (fb !== clean) candidates.push(fb);
  }

  return Array.from(new Set(candidates.filter((c) => c && c !== clean))).slice(0, 3);
}

/**
 * Generates plausible Kanji orthography distractors for Mondai 2 (表記)
 */
export function generateKanjiDistractors(
  correctWord: string,
  otherWords: string[]
): string[] {
  const clean = correctWord.trim();
  const similarKanjiMap: Record<string, string[]> = {
    確: ['格', '覚', '核'],
    認: ['忍', '任', '信'],
    A: ['B'],
    現: ['見', '視', '規'],
    実: ['定', '完', '宝'],
    相: ['想', '箱', '向'],
    談: ['淡', '語', '説'],
    準: ['進', '集', '唯'],
    備: ['傭', '修', '保'],
    経: ['軽', '径', '継'],
    験: ['険', '検', '倹'],
    説: ['設', '税', '鋭'],
    明: ['名', '命', '盟'],
    連: ['運', '違', '遠'],
    絡: ['落', '路', '格'],
    変: ['恋', '湾', '蛮'],
    化: ['花', '貨', '課'],
    加: ['架', '賀', '嘉'],
    参加: ['参賀', '山加', '賛加'],
  };

  const candidates: string[] = [];

  // Mutate individual characters if in map
  const chars = Array.from(clean);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const replacements = similarKanjiMap[ch];
    if (replacements) {
      for (const rep of replacements) {
        const copy = [...chars];
        copy[i] = rep;
        candidates.push(copy.join(''));
      }
    }
  }

  // Combine first/last Kanji with characters from other words in deck
  const otherKanjiWords = otherWords
    .map((w) => w.trim())
    .filter((w) => w && w !== clean && /[\u4e00-\u9faf]/.test(w));

  if (chars.length >= 2 && otherKanjiWords.length > 0) {
    for (const ow of otherKanjiWords) {
      const oChars = Array.from(ow);
      if (oChars.length >= 1) {
        candidates.push(`${chars[0]}${oChars[oChars.length - 1]}`);
        candidates.push(`${oChars[0]}${chars[chars.length - 1]}`);
      }
    }
  }

  for (const ow of otherKanjiWords) {
    candidates.push(ow);
  }

  const genericKanji = ['確信', '格認', '表現', '記録', '整理', '選択'];
  for (const gk of genericKanji) {
    if (gk !== clean) candidates.push(gk);
  }

  return Array.from(new Set(candidates.filter((c) => c && c !== clean))).slice(0, 3);
}

/**
 * Builds an authentic JLPT N3 Japanese context sentence for a vocabulary item
 */
function buildVocabContextSentence(
  v: ImportedVocabItem,
  idx: number,
  displayTarget: string
): string {
  const templates = [
    `会議の前に、もう一度この計画の${displayTarget}について確かめておきましょう。`,
    `先輩から仕事の${displayTarget}に関して、とても役に立つアドバイスをもらった。`,
    `将来のために、今から少しずつ${displayTarget}を意識して行動することが大切だ。`,
    `昨日のニュースでも、最近の${displayTarget}についての問題が取り上げられていた。`,
    `新しいプロジェクトを成功させるには、事前の${displayTarget}が欠かせないと言われている。`,
  ];
  return templates[idx % templates.length];
}

/**
 * Builds an authentic JLPT N3 Grammar Mondai 2 Star ★ (文の組み立て) puzzle:
 * Prefix + ＿＿＿ ＿＿＿ ★ ＿＿＿ + Suffix with 4 Japanese sentence fragments!
 */
export function buildGrammarStarPuzzle(
  g: ImportedGrammarItem,
  pairedVocab: ImportedVocabItem | undefined,
  idx: number
): {
  sentenceWithStarBlanks: string;
  fragmentsInCorrectOrder: [string, string, string, string];
  fullCorrectSentence: string;
  options: string[];
  correctAnswerIndex: number;
} {
  const cleanG = cleanGrammarSurface(g.name);
  const vWord = pairedVocab ? pairedVocab.word : '準備';

  // Try to see if the user's grammar item has a long Japanese example sentence containing cleanG
  const jpEx = extractJapaneseExampleSentence(g.example);
  if (jpEx && jpEx.includes(cleanG)) {
    const pos = jpEx.indexOf(cleanG);
    const before = jpEx.slice(0, pos).trim();
    const after = jpEx
      .slice(pos + cleanG.length)
      .replace(/^[、,\s]+/, '')
      .replace(/[。？!]+$/, '')
      .trim();

    // Split before/after around particles if possible
    const beforeTokens = before
      .split(/(?<=[はがをにへでとからまでよりの、])/)
      .map((s) => s.trim())
      .filter(Boolean);
    const afterTokens = after
      .split(/(?<=[はがをにへでとからまでよりの、])/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (beforeTokens.length >= 2 && afterTokens.length >= 2) {
      const prefix = beforeTokens.slice(0, -1).join('');
      const frag1 = beforeTokens[beforeTokens.length - 1];
      const frag2 = cleanG;
      const frag3Star = afterTokens[0];
      const frag4 = afterTokens.slice(1, 2).join('');
      const suffix = afterTokens.slice(2).join('') + '。';

      const fourFrags: [string, string, string, string] = [
        frag1,
        frag2,
        frag3Star,
        frag4,
      ];
      // Ensure all 4 fragments are distinct and non-empty
      if (new Set(fourFrags).size === 4 && fourFrags.every((f) => f.length > 0)) {
        const sentenceWithStarBlanks = `${prefix ? `${prefix} ` : ''}＿＿＿　＿＿＿　★　＿＿＿ ${suffix}`;
        const fullCorrectSentence = `${prefix}${frag1}${frag2}${frag3Star}${frag4}${suffix}`;
        const arranged = arrangeOptionsWithSeed(
          frag3Star,
          [frag1, frag2, frag4],
          idx + 1
        );
        return {
          sentenceWithStarBlanks,
          fragmentsInCorrectOrder: fourFrags,
          fullCorrectSentence,
          options: arranged.options,
          correctAnswerIndex: arranged.correctAnswerIndex,
        };
      }
    }
  }

  // Structured grammatical templates that test placing the 4 Japanese chunks in the exact N3 order
  const puzzleTemplates: {
    prefix: string;
    frags: [string, string, string, string];
    suffix: string;
  }[] = [
    {
      prefix: '今回の試験では、',
      frags: [`しっかり${vWord}を`, '進めておいた', cleanG, '落ち着いて問題を'],
      suffix: '解くことができた。',
    },
    {
      prefix: '大事な会議なので、',
      frags: ['事前に資料の', `${vWord}を済ませた`, cleanG, '早めに会場へ'],
      suffix: '向かうことにした。',
    },
    {
      prefix: '先輩のアドバイスに',
      frags: ['従って毎日の', `${vWord}を続けた`, cleanG, '少しずつ成果が'],
      suffix: '出るようになってきた。',
    },
    {
      prefix: '来週の発表に向けて、',
      frags: ['必要なデータの', `${vWord}が終わった`, cleanG, 'もう一度内容を'],
      suffix: '見直しておこう。',
    },
    {
      prefix: '実際に自分で',
      frags: [`${vWord}の計画を`, '立ててみた', cleanG, '思っていた以上に時間が'],
      suffix: 'かかることがわかった。',
    },
  ];

  const chosen = puzzleTemplates[idx % puzzleTemplates.length];
  const frag3Star = chosen.frags[2]; // The 3rd blank is the ★ position!
  const otherThree = [chosen.frags[0], chosen.frags[1], chosen.frags[3]];
  const arranged = arrangeOptionsWithSeed(frag3Star, otherThree, idx + 2);

  return {
    sentenceWithStarBlanks: `${chosen.prefix} ＿＿＿　＿＿＿　★　＿＿＿ ${chosen.suffix}`,
    fragmentsInCorrectOrder: chosen.frags,
    fullCorrectSentence: `${chosen.prefix}${chosen.frags.join('')}${chosen.suffix}`,
    options: arranged.options,
    correctAnswerIndex: arranged.correctAnswerIndex,
  };
}

/**
 * Infers a specific Mondai ID when only quizFormat or customTitle is passed
 */
export function resolveMondaiId(
  quizFormat: QuizFormatType,
  mondaiId?: string,
  customTitle = ''
): string {
  if (mondaiId && JLPT_N3_MONDAI_CATALOG.some((m) => m.id === mondaiId)) {
    return mondaiId;
  }
  const titleLower = customTitle.toLowerCase();
  if (titleLower.includes('dấu sao') || titleLower.includes('★') || titleLower.includes('文の組み立て')) {
    return 'grammar_m2_star';
  }
  if (titleLower.includes('đục lỗ') || titleLower.includes('đoạn văn') || titleLower.includes('文章の文法')) {
    return 'grammar_m3_cloze';
  }
  if (titleLower.includes('câu đơn') || titleLower.includes('文の文法 1')) {
    return 'grammar_m1_sentence';
  }
  if (titleLower.includes('漢字読み') || titleLower.includes('đọc hán tự') || titleLower.includes('kanji sang hiragana')) {
    return 'vocab_m1_kanji_reading';
  }
  if (titleLower.includes('表記') || titleLower.includes('nhận diện chữ hán') || titleLower.includes('hiragana sang kanji')) {
    return 'vocab_m2_orthography';
  }
  if (titleLower.includes('文脈規定') || titleLower.includes('điền từ vào chỗ trống')) {
    return 'vocab_m3_context';
  }
  if (titleLower.includes('言い換え') || titleLower.includes('đồng nghĩa')) {
    return 'vocab_m4_synonyms';
  }
  if (titleLower.includes('用法') || titleLower.includes('cách dùng từ')) {
    return 'vocab_m5_usage';
  }
  if (titleLower.includes('情報検索') || titleLower.includes('tìm kiếm thông tin')) {
    return 'reading_m7_info_search';
  }
  if (titleLower.includes('長文') || titleLower.includes('trường văn')) {
    return 'reading_m6_long';
  }
  if (titleLower.includes('中文') || titleLower.includes('trung văn')) {
    return 'reading_m5_medium';
  }
  if (titleLower.includes('短文') || titleLower.includes('đoản văn')) {
    return 'reading_m4_short';
  }
  if (titleLower.includes('即時応答') || titleLower.includes('phản xạ nhanh')) {
    return 'listening_m5_quick_response';
  }
  if (titleLower.includes('発話表現') || titleLower.includes('giao tiếp tình huống')) {
    return 'listening_m4_expression';
  }
  if (titleLower.includes('概要理解') || titleLower.includes('nghe khái quát')) {
    return 'listening_m3_summary';
  }
  if (titleLower.includes('ポイント理解') || titleLower.includes('điểm chính')) {
    return 'listening_m2_point';
  }
  if (titleLower.includes('課題理解') || titleLower.includes('nghe nhiệm vụ')) {
    return 'listening_m1_task';
  }

  switch (quizFormat) {
    case 'vocab_synonyms_usage':
      return 'vocab_mixed';
    case 'grammar_mondai_3_4':
      return 'grammar_mixed';
    case 'reading_integrated':
      return 'reading_mixed';
    case 'listening_dialogue':
      return 'listening_mixed';
    default:
      return 'vocab_mixed';
  }
}

/**
 * Generates authentic JLPT N3 exam questions for any of the 17 Mondai using the learner's
 * synced vocabulary (OnTapTuVung) and grammar (OnTapNguPhap).
 * Never dumps raw Vietnamese dictionary definitions into answer choices.
 */
export function generateClientTargetedQuestions(
  quizFormat: QuizFormatType,
  targetVocab: ImportedVocabItem[],
  targetGrammar: ImportedGrammarItem[],
  customTitle = '',
  explicitMondaiId?: string
): QuizQuestion[] {
  const vList = targetVocab.length > 0 ? targetVocab : [];
  const gList = targetGrammar.length > 0 ? targetGrammar : [];
  if (vList.length === 0 && gList.length === 0) return [];

  const resolvedMondai = resolveMondaiId(quizFormat, explicitMondaiId, customTitle);
  const questions: QuizQuestion[] = [];

  // Helper to build a single Vocabulary Mondai question (M1..M5)
  const buildSingleVocabQuestion = (
    mId: string,
    v: ImportedVocabItem,
    idx: number
  ): QuizQuestion => {
    const others = vList.filter((o) => o.id !== v.id);
    const otherReadings = others.map((o) => o.reading);
    const otherWords = others.map((o) => o.word);

    if (mId === 'vocab_m1_kanji_reading') {
      const sentence = buildVocabContextSentence(v, idx, `【${v.word}】`);
      const distractors = generateHiraganaDistractors(v.reading, otherReadings);
      const cleanReading = v.reading.split(/[・/（(,\s]/)[0].trim() || v.reading;
      const arranged = arrangeOptionsWithSeed(cleanReading, distractors, idx + 1);

      return {
        id: `vocab_m1_${Date.now()}_${idx}`,
        category: 'vocabulary',
        subCategory: 'Từ vựng · Mondai 1 — Cách đọc Hán tự (漢字読み)',
        title: `Mondai 1 (漢字読み): Chọn cách đọc Hiragana cho từ trong ngoặc 【${v.word}】`,
        questionText: `次の文の【　】のことばの読み方として最もよいものを、1・2・3・4から一つ選びなさい。\n\n「${sentence}」`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng: 「${cleanReading}」.\n• Từ vựng mục tiêu: 【${v.word}】（${v.reading}） — Nghĩa: "${v.meaning}" (Đang ở Lv${v.level} trong OnTapTuVung).\n• Lưu ý phân biệt chính xác trường âm, âm ngắt (っ) và âm đục khi làm Mondai 1.`,
        usedTargets: [
          {
            type: 'vocab',
            id: v.id,
            title: v.word,
            readingOrStructure: v.reading,
            meaning: v.meaning,
            level: v.level,
          },
        ],
      };
    }

    if (mId === 'vocab_m2_orthography') {
      const cleanReading = v.reading.split(/[・/（(,\s]/)[0].trim() || v.reading;
      const sentence = buildVocabContextSentence(v, idx, `【${cleanReading}】`);
      const distractors = generateKanjiDistractors(v.word, otherWords);
      const arranged = arrangeOptionsWithSeed(v.word, distractors, idx + 2);

      return {
        id: `vocab_m2_${Date.now()}_${idx}`,
        category: 'vocabulary',
        subCategory: 'Từ vựng · Mondai 2 — Nhận diện chữ Hán (表記)',
        title: `Mondai 2 (表記): Chọn chữ Hán đúng cho từ 【${cleanReading}】`,
        questionText: `次の文の【　】のことばを漢字で書くとき、最もよいものを1・2・3・4から一つ選びなさい。\n\n「${sentence}」`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng: 【${v.word}】（${v.reading}） — Nghĩa: "${v.meaning}".\n• Trong Mondai 2 (表記), đề thi thường bẫy các chữ Hán đồng âm hoặc có bộ thủ gần giống nhau.`,
        usedTargets: [
          {
            type: 'vocab',
            id: v.id,
            title: v.word,
            readingOrStructure: v.reading,
            meaning: v.meaning,
            level: v.level,
          },
        ],
      };
    }

    if (mId === 'vocab_m3_context') {
      const sentence = buildVocabContextSentence(v, idx, '（　　　）');
      const distractorWords = [
        others[0] ? `${others[0].word}（${others[0].reading}）` : '延期（えんき）',
        others[1] ? `${others[1].word}（${others[1].reading}）` : '省略（しょうりゃく）',
        others[2] ? `${others[2].word}（${others[2].reading}）` : '交換（こうかん）',
      ];
      const correctLabel = `${v.word}（${v.reading}）`;
      const arranged = arrangeOptionsWithSeed(correctLabel, distractorWords, idx + 3);

      return {
        id: `vocab_m3_${Date.now()}_${idx}`,
        category: 'vocabulary',
        subCategory: 'Từ vựng · Mondai 3 — Điền từ vào ngữ cảnh câu (文脈規定)',
        title: `Mondai 3 (文脈規定): Chọn từ điền vào chỗ trống （　　　）`,
        questionText: `次の文の（　　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n「${sentence}」`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng: 【${v.word}（${v.reading}）】 — Nghĩa: "${v.meaning}".\n• Câu hoàn chỉnh: 「${buildVocabContextSentence(v, idx, v.word)}」`,
        usedTargets: [
          {
            type: 'vocab',
            id: v.id,
            title: v.word,
            readingOrStructure: v.reading,
            meaning: v.meaning,
            level: v.level,
          },
        ],
      };
    }

    if (mId === 'vocab_m4_synonyms') {
      const sentence = buildVocabContextSentence(v, idx, `【${v.word}】`);
      // Authentic Japanese paraphrase expressions testing recognition in context
      const correctJpParaphrase = `「${v.reading}」本来の意味（${v.meaning}）に当たる表現`;
      const distractorParaphrases = [
        others[0]
          ? `${others[0].word}（${others[0].reading}）に関する表現`
          : '予定を急にやめてしまうこと',
        others[1]
          ? `${others[1].word}（${others[1].reading}）に関する表現`
          : '最初からやり直すこと',
        others[2]
          ? `${others[2].word}（${others[2].reading}）に関する表現`
          : '他の人にすべて任せること',
      ];
      const arranged = arrangeOptionsWithSeed(
        correctJpParaphrase,
        distractorParaphrases,
        idx + 4
      );

      return {
        id: `vocab_m4_${Date.now()}_${idx}`,
        category: 'vocabulary',
        subCategory: 'Từ vựng · Mondai 4 — Tìm từ / cách diễn đạt gần nghĩa (言い換え類義)',
        title: `Mondai 4 (言い換え類義): Chọn cách diễn đạt gần nghĩa nhất với 【${v.word}】`,
        questionText: `次の文の【　】のことばに意味が最も近いものを、1・2・3・4から一つ選びなさい。\n\n「${sentence}」`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng là phương án tương ứng với nghĩa cốt lõi của 【${v.word}（${v.reading}）】: "${v.meaning}".`,
        usedTargets: [
          {
            type: 'vocab',
            id: v.id,
            title: v.word,
            readingOrStructure: v.reading,
            meaning: v.meaning,
            level: v.level,
          },
        ],
      };
    }

    // Default / vocab_m5_usage: 4 complete Japanese sentences all containing 【v.word】!
    const correctUsageSentence = buildVocabContextSentence(v, idx, `【${v.word}】`);
    const wrongUsageSentences = [
      `毎朝、温かいパンに【${v.word}】をたっぷり塗って食べています。`,
      `昨日の午後は空がとても【${v.word}】だったので、傘を持って出かけた。`,
      `駅前のスーパーで新鮮な【${v.word}】を３本買って冷蔵庫に入れた。`,
    ];
    const arranged = arrangeOptionsWithSeed(
      correctUsageSentence,
      wrongUsageSentences,
      idx + 1
    );

    return {
      id: `vocab_m5_${Date.now()}_${idx}`,
      category: 'vocabulary',
      subCategory: 'Từ vựng · Mondai 5 — Cách dùng từ đúng trong câu (用法)',
      title: `Mondai 5 (用法): Chọn câu sử dụng từ 【${v.word}】 tự nhiên và chính xác nhất`,
      questionText: `次のことばの使い方として最もよいものを、1・2・3・4から一つ選びなさい。\n\n【 ${v.word}（${v.reading}）】`,
      options: arranged.options,
      correctAnswerIndex: arranged.correctAnswerIndex,
      explanation: `Đáp án đúng: 「${correctUsageSentence}」\n• Từ 【${v.word}（${v.reading}）】 mang nghĩa "${v.meaning}".\n• 3 câu còn lại dùng sai ngữ cảnh kết hợp từ (dùng như thức ăn phết lên bánh mì, tính từ chỉ thời tiết, hoặc đồ vật đếm bằng 本).`,
      usedTargets: [
        {
          type: 'vocab',
          id: v.id,
          title: v.word,
          readingOrStructure: v.reading,
          meaning: v.meaning,
          level: v.level,
        },
      ],
    };
  };

  // Helper to build a single Grammar Mondai question (M1, M2 Star ★, M3 Cloze)
  const buildSingleGrammarQuestion = (
    mId: string,
    g: ImportedGrammarItem,
    idx: number
  ): QuizQuestion => {
    const cleanG = cleanGrammarSurface(g.name);
    const others = gList.filter((o) => o.id !== g.id);
    const otherCleanForms = others.map((o) => cleanGrammarSurface(o.name)).filter((s) => s !== cleanG);
    const fallbackGrammarDistractors = ['に関して', 'にもかかわらず', 'おかげで', 'ついでに', 'ばかりに'];
    const distractorForms = [...otherCleanForms, ...fallbackGrammarDistractors].filter(
      (f) => f !== cleanG
    );
    const pairedVocab = vList[idx % Math.max(1, vList.length)];

    // MONDAI 2: SẮP XẾP CÂU DẤU SAO ★ (文の組み立て)
    if (mId === 'grammar_m2_star') {
      const starPuzzle = buildGrammarStarPuzzle(g, pairedVocab, idx);
      const [f1, f2, f3Star, f4] = starPuzzle.fragmentsInCorrectOrder;

      return {
        id: `grammar_m2_star_${Date.now()}_${idx}`,
        category: 'grammar',
        subCategory: 'Ngữ pháp · Mondai 2 (Dấu sao ★) — Sắp xếp câu (文の組み立て)',
        title: `Mondai 2 (文の組み立て · Dấu sao ★): Ghép 4 mảnh câu và chọn từ ở vị trí ★`,
        questionText: `次の文の ★ に入る最もよいものを、1・2・3・4から一つ選びなさい。\n\n${starPuzzle.sentenceWithStarBlanks}`,
        options: starPuzzle.options,
        correctAnswerIndex: starPuzzle.correctAnswerIndex,
        explanation: [
          `★ Mảnh nằm ở vị trí ngôi sao ★ là: 「${f3Star}」`,
          `• Thứ tự ghép 4 mảnh đúng: [${f1}] → [${f2}] → 【${f3Star} (★)】 → [${f4}]`,
          `• Câu hoàn chỉnh: 「${starPuzzle.fullCorrectSentence}」`,
          `• Cấu trúc trọng tâm từ OnTapNguPhap: 【${g.name}】 (Cách kết nối: ${g.structure || cleanG}) — Nghĩa: "${g.meaning}".`,
          g.similarText ? `• Lưu ý phân biệt: ${g.similarText}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        usedTargets: [
          {
            type: 'grammar',
            id: g.id,
            title: g.name,
            readingOrStructure: g.structure || cleanG,
            meaning: g.meaning,
            level: g.level,
            note: g.similarText || g.example,
          },
          ...(pairedVocab
            ? [
                {
                  type: 'vocab' as const,
                  id: pairedVocab.id,
                  title: pairedVocab.word,
                  readingOrStructure: pairedVocab.reading,
                  meaning: pairedVocab.meaning,
                  level: pairedVocab.level,
                },
              ]
            : []),
        ],
      };
    }

    // MONDAI 3: NGỮ PHÁP ĐỤC LỖ ĐOẠN VĂN (文章の文法)
    if (mId === 'grammar_m3_cloze') {
      const jpEx = extractJapaneseExampleSentence(g.example);
      const clozeTargetSentence =
        jpEx && jpEx.includes(cleanG)
          ? jpEx.replace(cleanG, '【 1 】')
          : `しっかり準備を続けた【 1 】、本番の試験でも落ち着いて実力を発揮することができました。`;

      const passageLines = [
        `先日、会社の先輩と一緒に新しい企画の発表会に参加しました。`,
        pairedVocab
          ? `最初は「${pairedVocab.word}（${pairedVocab.reading}）」について不安もありましたが、毎日少しずつ練習を重ねました。`
          : `最初はうまくできるか不安もありましたが、毎日少しずつ練習を重ねました。`,
        clozeTargetSentence,
      ].join('\n');

      const arranged = arrangeOptionsWithSeed(cleanG, distractorForms, idx + 3);

      return {
        id: `grammar_m3_cloze_${Date.now()}_${idx}`,
        category: 'grammar',
        subCategory: 'Ngữ pháp · Mondai 3 — Ngữ pháp đục lỗ trong đoạn văn (文章の文法)',
        title: `Mondai 3 (文章の文法): Chọn cấu trúc điền vào chỗ trống 【 1 】 trong đoạn văn`,
        passage: passageLines,
        questionText: `次の文章を読んで、文章全体の流れに合うように【 1 】に入れる最もよいものを、1・2・3・4から一つ選びなさい。`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: [
          `Đáp án đúng cho vị trí 【 1 】: 「${cleanG}」`,
          `• Cấu trúc ngữ pháp: 【${g.name}】 (${g.structure || cleanG}) — Nghĩa: "${g.meaning}".`,
          g.example ? `• Câu gốc trong sổ tay OnTapNguPhap: 「${g.example}」` : '',
          g.similarText ? `• Lưu ý phân biệt: ${g.similarText}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        usedTargets: [
          {
            type: 'grammar',
            id: g.id,
            title: g.name,
            readingOrStructure: g.structure || cleanG,
            meaning: g.meaning,
            level: g.level,
            note: g.similarText || g.example,
          },
        ],
      };
    }

    // MONDAI 1: CHỌN CẤU TRÚC NGỮ PHÁP CÂU ĐƠN (文の文法 1)
    const jpEx = extractJapaneseExampleSentence(g.example);
    const clozeSentence =
      jpEx && jpEx.includes(cleanG)
        ? jpEx.replace(cleanG, '（　　　）')
        : `大事な予定を忘れないように、前もってメモを取っておいた（　　　）、当日はスムーズに進んだ。`;

    const arranged = arrangeOptionsWithSeed(cleanG, distractorForms, idx + 1);

    return {
      id: `grammar_m1_${Date.now()}_${idx}`,
      category: 'grammar',
      subCategory: 'Ngữ pháp · Mondai 1 — Chọn cấu trúc ngữ pháp câu đơn (文の文法 1)',
      title: `Mondai 1 (文の文法 1): Chọn cấu trúc ngữ pháp điền vào （　　　）`,
      questionText: `次の文の（　　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n「${clozeSentence}」`,
      options: arranged.options,
      correctAnswerIndex: arranged.correctAnswerIndex,
      explanation: [
        `Đáp án đúng: 「${cleanG}」`,
        `• Mẫu ngữ pháp: 【${g.name}】 (Quy tắc kết nối: ${g.structure || cleanG}) — Nghĩa: "${g.meaning}".`,
        g.example ? `• Ví dụ trong sổ tay: ${g.example}` : '',
        g.similarText ? `• Phân biệt ngữ pháp tương tự: ${g.similarText}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      usedTargets: [
        {
          type: 'grammar',
          id: g.id,
          title: g.name,
          readingOrStructure: g.structure || cleanG,
          meaning: g.meaning,
          level: g.level,
          note: g.similarText || g.example,
        },
      ],
    };
  };

  // Helper to build Reading Mondai (M4 Short, M5 Medium, M6 Long, M7 Info Search)
  const buildSingleReadingQuestion = (mId: string, idx: number): QuizQuestion => {
    const v = vList[idx % Math.max(1, vList.length)];
    const g = gList[idx % Math.max(1, gList.length)];
    const cleanG = g ? cleanGrammarSurface(g.name) : 'うちに';
    const vWord = v ? v.word : '確認';
    const vReading = v ? v.reading : 'かくにん';
    const vMeaning = v ? v.meaning : 'xác nhận';

    const usedTargets = [
      ...(v
        ? [
            {
              type: 'vocab' as const,
              id: v.id,
              title: v.word,
              readingOrStructure: v.reading,
              meaning: v.meaning,
              level: v.level,
            },
          ]
        : []),
      ...(g
        ? [
            {
              type: 'grammar' as const,
              id: g.id,
              title: g.name,
              readingOrStructure: g.structure || cleanG,
              meaning: g.meaning,
              level: g.level,
              note: g.similarText || g.example,
            },
          ]
        : []),
    ];

    if (mId === 'reading_m7_info_search') {
      const passage = [
        `【市民図書館・週末セミナーのご案内】`,
        `来月より、社会人や学生向けに「効率的な学習と【${vWord}】の方法」についての特別講座を開きます。`,
        `--------------------------------------------`,
        `■ Aコース（土曜・午前 10:00〜12:00）：参加費 1,000円（学生は無料）`,
        `■ Bコース（土曜・午後 14:00〜16:00）：参加費 1,500円（資料代込み）`,
        `■ Cコース（日曜・午前 10:00〜12:00）：オンライン開催・参加費 800円`,
        `--------------------------------------------`,
        `※ご注意：定員になり次第終了するため、希望される方は今週金曜日の17時までにウェブサイトから申し込んでください（${cleanG}）。`,
      ].join('\n');

      const correctOpt = '金曜日の17時までにウェブサイトからAコースに申し込めば、無料で参加できる。';
      const distractors = [
        '土曜日の当日に直接図書館へ行けば、無料でAコースに参加できる。',
        '大学生であっても、Aコースに参加する場合は1,000円を支払わなければならない。',
        '土曜日の午後に図書館で対面の講座を受けたい場合は、Cコースを選ぶとよい。',
      ];
      const arranged = arrangeOptionsWithSeed(correctOpt, distractors, idx + 1);

      return {
        id: `reading_m7_${Date.now()}_${idx}`,
        category: 'reading',
        subCategory: 'Đọc hiểu · Mondai 7 — Tìm kiếm thông tin (情報検索)',
        title: `Mondai 7 (情報検索): Tra cứu thông báo sự kiện có chứa 【${vWord}】`,
        passage,
        questionText: `大学生のナムさんは、土曜日の午前に図書館で講座を受けたいと考えています。この案内によると、ナムさんはどうすればよいですか。`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng: 「${correctOpt}」\n• Theo bảng thông tin: Aコース diễn ra vào sáng thứ Bảy (土曜・午前), miễn phí cho sinh viên (学生は無料), và cần đăng ký qua website trước 17:00 thứ Sáu.\n• Từ/ngữ pháp ôn tập trong bài: 【${vWord}（${vReading}）】 (${vMeaning})${g ? ` · 【${g.name}】 (${g.meaning})` : ''}.`,
        usedTargets,
      };
    }

    if (mId === 'reading_m6_long') {
      const passage = [
        `新しいスキルや外国語を身につけようとするとき、最初から完璧を目指しすぎて途中で疲れてしまう人は少なくない。特に忙しい毎日の中では、一度にたくさんのことを覚えようとしても、なかなか記憶に定着しないことが多い。`,
        `そこで大切になるのが、自分の現在のレベルに合わせて毎日の【${vWord}】を少しずつ積み重ねていくことだ。${
          g?.example ? `例えば、「${extractJapaneseExampleSentence(g.example) || ''}」という姿勢も重要である。` : ''
        }`,
        `つまり、短期間で無理をするよりも、自分が弱い部分を把握し、忘れない${cleanG}反復練習を続けることこそが、最終的に大きな成果へとつながるのである。`,
      ].join('\n\n');

      const correctOpt = '無理に一度で完璧を目指すより、弱点を把握して少しずつ継続することが大切だ。';
      const distractors = [
        '新しいスキルを身につけるには、毎日長時間まとめて勉強するしかない。',
        '自分の苦手な部分は後回しにして、得意な分野だけを練習したほうがよい。',
        '時間が足りないときは、復習をせずに新しい教材を次々と買うべきだ。',
      ];
      const arranged = arrangeOptionsWithSeed(correctOpt, distractors, idx + 2);

      return {
        id: `reading_m6_${Date.now()}_${idx}`,
        category: 'reading',
        subCategory: 'Đọc hiểu · Mondai 6 — Trường văn nghị luận (内容理解・長文)',
        title: `Mondai 6 (長文): Phân tích luận điểm tác giả (Tích hợp 【${vWord}】${g ? ` & 【${g.name}】` : ''})`,
        passage,
        questionText: `この文章で筆者が最も言いたいことは何か。`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng: 「${correctOpt}」\n• Đoạn cuối (つまり...) tóm tắt luận điểm chính của tác giả: Thay vì ép bản thân hoàn hảo ngay lập tức, việc nắm rõ điểm yếu và duy trì 【${vWord}】 (${vMeaning}) cùng cấu trúc 【${cleanG}】 là chìa khóa dẫn đến thành quả.`,
        usedTargets,
      };
    }

    if (mId === 'reading_m5_medium') {
      const passage = [
        `最近、仕事や勉強の予定をスマートフォンのアプリで管理する人が増えている。いつでも手軽に予定を見られるのは便利だが、ただ記録しただけで安心してしまうケースも多いという。`,
        `そのため、本当に大切な予定や課題については、記録するだけでなく、毎朝もう一度【${vWord}】を行って優先順位を整理することが重要だ。${
          g ? `そうした習慣を身につける（${cleanG}）、急な変更があっても慌てずに対応できるようになる。` : ''
        }`,
      ].join('\n\n');

      const correctOpt = '記録しただけで満足せず、毎朝見直して優先順位を整理するため。';
      const distractors = [
        'スマートフォンのアプリは使い方が難しくて時間がかかるため。',
        '予定を紙の手帳に書くと、すぐに紛失してしまう恐れがあるため。',
        '一度決めたスケジュールは、どんな理由があっても変更できないため。',
      ];
      const arranged = arrangeOptionsWithSeed(correctOpt, distractors, idx + 3);

      return {
        id: `reading_m5_${Date.now()}_${idx}`,
        category: 'reading',
        subCategory: 'Đọc hiểu · Mondai 5 — Trung văn phân tích lý do (内容理解・中文)',
        title: `Mondai 5 (中文): Đọc hiểu Trung văn tích hợp 【${vWord}】`,
        passage,
        questionText: `筆者が「毎朝もう一度【${vWord}】を行って優先順位を整理することが重要だ」と述べているのはなぜか。`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng: 「${correctOpt}」\n• Bài đọc chỉ rõ: Nhiều người chỉ ghi lịch vào app rồi chủ quan, nên việc thực hiện 【${vWord}（${vReading}）】 (${vMeaning}) mỗi sáng giúp sắp xếp thứ tự ưu tiên và chủ động ứng phó khi có thay đổi.`,
        usedTargets,
      };
    }

    // Default / reading_m4_short: Workplace Email / Notice (~160 chars)
    const passage = [
      `宛先：営業部のみなさん`,
      `件名：来週の会議資料の【${vWord}】について`,
      ``,
      `お疲れ様です。山本です。`,
      `来週月曜日の午前10時から行われる企画会議の資料ができましたので、添付ファイルでお送りします。`,
      `会議が始まる（${cleanG}）、各自で内容の【${vWord}】をお願いします。もし修正が必要な点があれば、金曜日の午後3時までに山本までご連絡ください。`,
    ].join('\n');

    const correctOpt = '添付された会議資料の内容を見て、修正点があれば金曜日の午後3時までに連絡する。';
    const distractors = [
      '来週月曜日の会議までに、各自で新しい企画資料を一から作成して持参する。',
      '修正点があるかどうかに関係なく、全員が今日中に山本さんへ電話をかける。',
      '来週の会議が中止になったため、資料を印刷して別の部署へ配る。',
    ];
    const arranged = arrangeOptionsWithSeed(correctOpt, distractors, idx + 1);

    return {
      id: `reading_m4_${Date.now()}_${idx}`,
      category: 'reading',
      subCategory: 'Đọc hiểu · Mondai 4 — Đoản văn Email / Thông báo (内容理解・短文)',
      title: `Mondai 4 (短文): Đọc Email nội bộ chứa 【${vWord}】${g ? ` & 【${g.name}】` : ''}`,
      passage,
      questionText: `このメールを読んだ営業部の人は、まず何をしなければなりませんか。`,
      options: arranged.options,
      correctAnswerIndex: arranged.correctAnswerIndex,
      explanation: `Đáp án đúng: 「${correctOpt}」\n• Trong email, anh Yamamoto yêu cầu mọi người thực hiện 【${vWord}（${vReading}）】 (${vMeaning}) đối với tài liệu đính kèm trước khi cuộc họp bắt đầu, và báo lại trước 15:00 thứ Sáu nếu cần chỉnh sửa.`,
      usedTargets,
    };
  };

  // Helper to build Listening Mondai (M1..M5)
  const buildSingleListeningQuestion = (mId: string, idx: number): QuizQuestion => {
    const v = vList[idx % Math.max(1, vList.length)];
    const g = gList[idx % Math.max(1, gList.length)];
    const cleanG = g ? cleanGrammarSurface(g.name) : 'うちに';
    const vWord = v ? v.word : '確認';
    const vReading = v ? v.reading : 'かくにん';
    const vMeaning = v ? v.meaning : 'xác nhận';

    const usedTargets = [
      ...(v
        ? [
            {
              type: 'vocab' as const,
              id: v.id,
              title: v.word,
              readingOrStructure: v.reading,
              meaning: v.meaning,
              level: v.level,
            },
          ]
        : []),
      ...(g
        ? [
            {
              type: 'grammar' as const,
              id: g.id,
              title: g.name,
              readingOrStructure: g.structure || cleanG,
              meaning: g.meaning,
              level: g.level,
            },
          ]
        : []),
    ];

    // MONDAI 5: PHẢN XẠ NHANH TỨC THÌ (即時応答)
    if (mId === 'listening_m5_quick_response') {
      const script = `女：ねえ、明日の発表の【${vWord}】、今の${cleanG}一緒にしておかない？`;
      const correctReply = '男：うん、そうだね。今すぐ資料を見直そう。';
      const wrongReplies = [
        '男：ええ、昨日はとてもいい天気でしたね。',
        '男：いいえ、発表は先週もう終わりましたよ。',
        '男：すみません、その本はまだ読んでいません。',
      ];
      const arranged = arrangeOptionsWithSeed(correctReply, wrongReplies, idx + 1);

      return {
        id: `listening_m5_${Date.now()}_${idx}`,
        category: 'listening',
        subCategory: 'Nghe hiểu · Mondai 5 — Phản xạ nhanh tức thì (即時応答)',
        title: `Mondai 5 (即時応答): Nghe 1 câu ngắn chứa 【${vWord}】 và chọn câu đáp lại ngay`,
        listeningScript: script,
        questionText: `女性の言葉に対する返事として、最もよいものを1・2・3・4から一つ選びなさい。`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng: 「${correctReply}」\n• Người nữ rủ làm 【${vWord}（${vReading}）】 (${vMeaning}) cho buổi thuyết trình ngày mai nhân lúc này (${cleanG}). Câu trả lời tự nhiên nhất là đồng ý kiểm tra lại tài liệu ngay.`,
        usedTargets,
      };
    }

    // MONDAI 4: BIỂU HIỆN GIAO TIẾP TÌNH HUỐNG (発話表現)
    if (mId === 'listening_m4_expression') {
      const script = [
        `男：先輩に作成した書類の【${vWord}】をお願いしたいとき、何と言いますか。`,
        `女：すみません、お忙しいところ恐れ入りますが、こちらの書類を見ていただけないでしょうか。`,
      ].join('\n');

      const correctExpr = 'お忙しいところすみませんが、こちらの書類の【' + vWord + '】をお願いできますか。';
      const wrongExprs = [
        'この書類を今すぐ【' + vWord + '】してくださいませんか。私が手伝ってあげます。',
        'こちらの書類はもう【' + vWord + '】しなくてもかまいませんよ。',
        '先輩、私の書類を勝手に【' + vWord + '】しないでください。',
      ];
      const arranged = arrangeOptionsWithSeed(correctExpr, wrongExprs, idx + 2);

      return {
        id: `listening_m4_${Date.now()}_${idx}`,
        category: 'listening',
        subCategory: 'Nghe hiểu · Mondai 4 — Biểu hiện giao tiếp tình huống (発話表現)',
        title: `Mondai 4 (発話表現): Chọn câu giao tiếp lịch sự khi nhờ 【${vWord}】`,
        listeningScript: script,
        questionText: `先輩に書類の【${vWord}】を頼みたいとき、最も適切な言い方はどれですか。`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng: 「${correctExpr}」\n• Khi nhờ cấp trên/tiền bối thực hiện 【${vWord}（${vReading}）】 (${vMeaning}), cần dùng mẫu câu xin phép lịch sự 「〜をお願いできますか / 〜ていただけませんか」.`,
        usedTargets,
      };
    }

    // MONDAI 3: NGHE HIỂU KHÁI QUÁT (概要理解)
    if (mId === 'listening_m3_summary') {
      const script = [
        `女：みなさん、こんにちは。今日は毎日の勉強で大切な【${vWord}】の習慣についてお話しします。`,
        `男：新しい言葉を覚えるだけでなく、忘れない${cleanG}何度も復習することが大切なんですね。`,
        `女：はい、その通りです。少しの時間でも毎日続けることで、自信がついてきますよ。`,
      ].join('\n');

      const correctTheme = '学んだことを定着させるための毎日の復習と習慣の大切さ';
      const wrongThemes = [
        '試験の当日に会場へ持っていくべき持ち物のリスト',
        '新しい辞書や文房具を安く購入するための方法',
        '留学先でアルバイトを探すときの面接の注意点',
      ];
      const arranged = arrangeOptionsWithSeed(correctTheme, wrongThemes, idx + 3);

      return {
        id: `listening_m3_${Date.now()}_${idx}`,
        category: 'listening',
        subCategory: 'Nghe hiểu · Mondai 3 — Nghe hiểu khái quát (概要理解)',
        title: `Mondai 3 (概要理解): Nắm chủ đề chính của đoạn hội thoại chứa 【${vWord}】`,
        listeningScript: script,
        questionText: `女の人が一番伝えたいテーマは何ですか。`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng: 「${correctTheme}」\n• Nội dung xoay quanh tầm quan trọng của thói quen 【${vWord}（${vReading}）】 (${vMeaning}) và ôn tập đều đặn mỗi ngày.`,
        usedTargets,
      };
    }

    // MONDAI 2: NGHE HIỂU ĐIỂM CHÍNH (ポイント理解)
    if (mId === 'listening_m2_point') {
      const script = [
        `女：田中さん、今日の午後の打ち合わせですが、開始時間が3時から4時に変わりましたよ。`,
        `男：えっ、そうなんですか。どうして時間が変わったんですか。`,
        `女：会議室の予約の【${vWord}】に時間がかかってしまって、前の会議が長引いているそうなんです。`,
        `男：わかりました。じゃあ、4時までに資料を準備しておきますね。`,
      ].join('\n');

      const correctReason = `会議室の予約の【${vWord}】に時間がかかり、前の会議が長引いているから。`;
      const wrongReasons = [
        '田中さんが会議の資料をまだ作り終わっていないから。',
        '電車の遅延で部長が会社にまだ到着していないから。',
        'パソコンが故障してプロジェクターが使えなくなったから。',
      ];
      const arranged = arrangeOptionsWithSeed(correctReason, wrongReasons, idx + 2);

      return {
        id: `listening_m2_${Date.now()}_${idx}`,
        category: 'listening',
        subCategory: 'Nghe hiểu · Mondai 2 — Nghe hiểu điểm chính / Lý do (ポイント理解)',
        title: `Mondai 2 (ポイント理解): Nghe lý do thay đổi lịch họp (Tích hợp 【${vWord}】)`,
        listeningScript: script,
        questionText: `今日の打ち合わせの開始時間が変わった理由は何ですか。`,
        options: arranged.options,
        correctAnswerIndex: arranged.correctAnswerIndex,
        explanation: `Đáp án đúng: 「${correctReason}」\n• Lượt lời thứ 3 của người nữ nêu rõ nguyên nhân do việc 【${vWord}（${vReading}）】 (${vMeaning}) đặt phòng họp mất thời gian và cuộc họp trước bị kéo dài.`,
        usedTargets,
      };
    }

    // Default / MONDAI 1: NGHE HIỂU NHIỆM VỤ (課題理解)
    const script = [
      `男：佐藤さん、来週のセミナーの準備、手伝ってくれてありがとう。`,
      `女：いいえ。あのう、これからまず何をしましょうか。会場の椅子を並べましょうか。`,
      `男：椅子は後でみんなで並べるから、忘れない${cleanG}、まず参加者リストの【${vWord}】をお願いできる？`,
      `女：はい、わかりました。すぐにパソコンでリストを見てみますね。`,
    ].join('\n');

    const correctAction = `パソコンで参加者リストの【${vWord}】をする。`;
    const wrongActions = [
      'セミナー会場の椅子を一人で先に並べる。',
      '参加者にセミナー中止のメールを送る。',
      '新しいパソコンを買いに近くの店へ行く。',
    ];
    const arranged = arrangeOptionsWithSeed(correctAction, wrongActions, idx + 1);

    return {
      id: `listening_m1_${Date.now()}_${idx}`,
      category: 'listening',
      subCategory: 'Nghe hiểu · Mondai 1 — Nghe hiểu nhiệm vụ tiếp theo (課題理解)',
      title: `Mondai 1 (課題理解): Nhân vật nữ sẽ làm gì đầu tiên? (Tích hợp 【${vWord}】)`,
      listeningScript: script,
      questionText: `女の人は、このあとまず何をしますか。`,
      options: arranged.options,
      correctAnswerIndex: arranged.correctAnswerIndex,
      explanation: `Đáp án đúng: 「${correctAction}」\n• Người nam dặn: Ghế sẽ xếp sau, trước tiên hãy làm 【${vWord}（${vReading}）】 (${vMeaning}) danh sách người tham gia nhân lúc chưa quên (${cleanG}).`,
      usedTargets,
    };
  };

  // Dispatch based on exact Mondai ID or mixed section format
  if (resolvedMondai.startsWith('vocab_')) {
    const items = vList.length > 0 ? vList.slice(0, 5) : [];
    const vocabMondaiCycle = [
      'vocab_m1_kanji_reading',
      'vocab_m2_orthography',
      'vocab_m3_context',
      'vocab_m4_synonyms',
      'vocab_m5_usage',
    ];
    items.forEach((v, idx) => {
      const mId =
        resolvedMondai === 'vocab_mixed'
          ? vocabMondaiCycle[idx % vocabMondaiCycle.length]
          : resolvedMondai;
      questions.push(buildSingleVocabQuestion(mId, v, idx));
    });
    return questions;
  }

  if (resolvedMondai.startsWith('grammar_')) {
    const items = gList.length > 0 ? gList.slice(0, 5) : [];
    const grammarMondaiCycle = [
      'grammar_m1_sentence',
      'grammar_m2_star',
      'grammar_m3_cloze',
    ];
    items.forEach((g, idx) => {
      const mId =
        resolvedMondai === 'grammar_mixed'
          ? grammarMondaiCycle[idx % grammarMondaiCycle.length]
          : resolvedMondai;
      questions.push(buildSingleGrammarQuestion(mId, g, idx));
    });
    return questions;
  }

  if (resolvedMondai.startsWith('reading_')) {
    const count = Math.min(4, Math.max(vList.length, gList.length, 1));
    const readingMondaiCycle = [
      'reading_m4_short',
      'reading_m5_medium',
      'reading_m6_long',
      'reading_m7_info_search',
    ];
    for (let idx = 0; idx < count; idx++) {
      const mId =
        resolvedMondai === 'reading_mixed'
          ? readingMondaiCycle[idx % readingMondaiCycle.length]
          : resolvedMondai;
      questions.push(buildSingleReadingQuestion(mId, idx));
    }
    return questions;
  }

  if (resolvedMondai.startsWith('listening_')) {
    const count = Math.min(4, Math.max(vList.length, gList.length, 1));
    const listeningMondaiCycle = [
      'listening_m1_task',
      'listening_m2_point',
      'listening_m3_summary',
      'listening_m4_expression',
      'listening_m5_quick_response',
    ];
    for (let idx = 0; idx < count; idx++) {
      const mId =
        resolvedMondai === 'listening_mixed'
          ? listeningMondaiCycle[idx % listeningMondaiCycle.length]
          : resolvedMondai;
      questions.push(buildSingleListeningQuestion(mId, idx));
    }
    return questions;
  }

  return questions;
}

/**
 * Builds the Daily Tasks grouped clearly by the 4 JLPT N3 Sections ONLY when the user
 * has actual imported vocabulary, grammar, or due bugs.
 * Every task carries an explicit `mondaiId` so clicking it launches that exact JLPT Mondai format!
 */
export function buildStructuredDailyTasks(params: {
  pendingBugsCount: number;
  priorityVocab: ImportedVocabItem[];
  priorityGrammar: ImportedGrammarItem[];
}): TaskItem[] {
  const { pendingBugsCount, priorityVocab, priorityGrammar } = params;
  if (
    pendingBugsCount === 0 &&
    priorityVocab.length === 0 &&
    priorityGrammar.length === 0
  ) {
    return [];
  }

  const vocabLabels = priorityVocab.slice(0, 8).map((v) => `${v.word} (Lv${v.level})`);
  const grammarLabels = priorityGrammar.slice(0, 6).map((g) => `${g.name} (Lv${g.level})`);

  const tasks: TaskItem[] = [];

  if (pendingBugsCount > 0) {
    tasks.push({
      id: 'task_review_bugs',
      title: `Ôn tập Spaced Repetition: Xử lý ${pendingBugsCount} câu làm sai đến hạn trong Bug Tracker`,
      category: 'review',
      categoryLabel: '0. Khắc phục lỗi sai (Bug Tracker)',
      quizFormat: 'bug_review',
      estimatedMinutes: 15,
      questionCount: pendingBugsCount,
      targetMondai: 'Spaced Repetition · Các câu từng chọn sai',
      reason: 'Khóa chặt lỗ hổng kiến thức từ hôm trước trước khi luyện sang các Mondai mới',
      targetWords: vocabLabels.slice(0, 2),
      targetGrammars: grammarLabels.slice(0, 1),
      completed: false,
      priority: 'high',
    });
  }

  // 1. TỪ VỰNG (Only when user has synced vocabulary)
  if (priorityVocab.length > 0) {
    tasks.push(
      {
        id: 'task_vocab_m1',
        mondaiId: 'vocab_m1_kanji_reading',
        title: 'Từ vựng · Mondai 1: Cách đọc Hán tự trong câu (漢字読み · Kanji → Hiragana)',
        category: 'vocabulary',
        categoryLabel: 'Từ vựng · Mondai 1 (漢字読み)',
        quizFormat: 'vocab_synonyms_usage',
        estimatedMinutes: 10,
        questionCount: Math.min(5, priorityVocab.length),
        targetMondai: 'Mondai 1: Chọn cách đọc Hiragana đúng cho từ Kanji trong câu',
        reason: 'Kiểm tra chính xác trường âm, âm ngắt và âm đục của các từ Lv1–Lv3 trong OnTapTuVung',
        targetWords: vocabLabels.slice(0, 4),
        targetGrammars: [],
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_vocab_m5',
        mondaiId: 'vocab_m5_usage',
        title: 'Từ vựng · Mondai 5: Cách dùng từ đúng trong câu tiếng Nhật (用法)',
        category: 'vocabulary',
        categoryLabel: 'Từ vựng · Mondai 5 (用法)',
        quizFormat: 'vocab_synonyms_usage',
        estimatedMinutes: 15,
        questionCount: Math.min(5, priorityVocab.length),
        targetMondai: 'Mondai 5: Chọn 1 trong 4 câu tiếng Nhật dùng từ đúng ngữ cảnh',
        reason: 'Vận dụng từ vựng OnTapTuVung vào câu văn thực tế, tránh bẫy dịch nghĩa từng chữ',
        targetWords:
          vocabLabels.slice(2, 7).length > 0 ? vocabLabels.slice(2, 7) : vocabLabels.slice(0, 4),
        targetGrammars: [],
        completed: false,
        priority: 'high',
      }
    );
  }

  // 2. NGỮ PHÁP (Only when user has synced grammar)
  if (priorityGrammar.length > 0) {
    tasks.push(
      {
        id: 'task_grammar_m1',
        mondaiId: 'grammar_m1_sentence',
        title: 'Ngữ pháp · Mondai 1: Chọn cấu trúc ngữ pháp trong câu đơn (文の文法 1)',
        category: 'grammar',
        categoryLabel: 'Ngữ pháp · Mondai 1',
        quizFormat: 'grammar_mondai_3_4',
        estimatedMinutes: 15,
        questionCount: Math.min(5, priorityGrammar.length),
        targetMondai: 'Mondai 1: Điền mẫu ngữ pháp đúng vào chỗ trống （　　） trong câu tiếng Nhật',
        reason: 'Nắm vững quy tắc chia thể kết nối trước và sau các mẫu câu Lv1–Lv3 trong OnTapNguPhap',
        targetWords: vocabLabels.slice(0, 2),
        targetGrammars: grammarLabels.slice(0, 3),
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_grammar_m2_star',
        mondaiId: 'grammar_m2_star',
        title: 'Ngữ pháp · Mondai 2 (Dấu sao ★): Sắp xếp 4 mảnh ghép câu (文の組み立て)',
        category: 'grammar',
        categoryLabel: 'Ngữ pháp · Mondai 2 (Dấu sao ★)',
        quizFormat: 'grammar_mondai_3_4',
        estimatedMinutes: 20,
        questionCount: Math.min(5, priorityGrammar.length),
        targetMondai: 'Mondai 2: Ghép 4 mảnh câu tiếng Nhật vào ＿＿＿ ＿＿＿ ★ ＿＿＿',
        reason: 'Rèn kỹ năng lắp ghép cụm từ đúng chuẩn bài thi dấu sao ★ JLPT N3',
        targetWords: vocabLabels.slice(1, 3),
        targetGrammars: grammarLabels.slice(0, 3),
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_grammar_m3_cloze',
        mondaiId: 'grammar_m3_cloze',
        title: 'Ngữ pháp · Mondai 3: Ngữ pháp đục lỗ trong đoạn văn (文章の文法)',
        category: 'grammar',
        categoryLabel: 'Ngữ pháp · Mondai 3 (Đoạn văn)',
        quizFormat: 'grammar_mondai_3_4',
        estimatedMinutes: 15,
        questionCount: Math.min(4, priorityGrammar.length),
        targetMondai: 'Mondai 3: Điền cấu trúc ngữ pháp vào vị trí 【 1 】 trong đoạn văn',
        reason: 'Kết nối các cấu trúc ngữ pháp của bạn vào mạch đoạn văn hoàn chỉnh',
        targetWords: vocabLabels.slice(3, 5),
        targetGrammars:
          grammarLabels.slice(2, 5).length > 0 ? grammarLabels.slice(2, 5) : grammarLabels.slice(0, 3),
        completed: false,
        priority: 'medium',
      }
    );
  }

  // 3. ĐỌC HIỂU & 4. NGHE HIỂU (When user has synced either vocabulary or grammar)
  if (priorityVocab.length > 0 || priorityGrammar.length > 0) {
    tasks.push(
      {
        id: 'task_reading_m4',
        mondaiId: 'reading_m4_short',
        title: 'Đọc hiểu · Mondai 4: Đoản văn ngắn (~180 chữ: Email & Thông báo nội bộ)',
        category: 'reading',
        categoryLabel: 'Đọc hiểu · Mondai 4 (Đoản văn)',
        quizFormat: 'reading_integrated',
        estimatedMinutes: 20,
        questionCount: 4,
        targetMondai: 'Mondai 4 (内容理解・短文): Đọc Email/Thông báo tiếng Nhật lồng ghép từ đã học',
        reason: 'Rèn tốc độ đọc lướt bắt ý chính trong 2 phút/bài với từ vựng và ngữ pháp vừa ôn',
        targetWords: vocabLabels.slice(0, 4),
        targetGrammars: grammarLabels.slice(0, 2),
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_reading_m5',
        mondaiId: 'reading_m5_medium',
        title: 'Đọc hiểu · Mondai 5: Trung văn (~350 chữ: Phân tích lý do & Ý tác giả)',
        category: 'reading',
        categoryLabel: 'Đọc hiểu · Mondai 5 (Trung văn)',
        quizFormat: 'reading_integrated',
        estimatedMinutes: 20,
        questionCount: 4,
        targetMondai: 'Mondai 5 (内容理解・中文): Phân tích câu gạch chân và quan điểm tác giả',
        reason: 'Phân tích đoạn văn tiếng Nhật lồng ghép các cấu trúc ngữ pháp của bạn',
        targetWords:
          vocabLabels.slice(2, 6).length > 0 ? vocabLabels.slice(2, 6) : vocabLabels.slice(0, 3),
        targetGrammars:
          grammarLabels.slice(1, 4).length > 0 ? grammarLabels.slice(1, 4) : grammarLabels.slice(0, 2),
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_listening_m1',
        mondaiId: 'listening_m1_task',
        title: 'Nghe hiểu · Mondai 1: Nghe hiểu nhiệm vụ (課題理解 · Làm gì tiếp theo?)',
        category: 'listening',
        categoryLabel: 'Nghe hiểu · Mondai 1 (課題理解)',
        quizFormat: 'listening_dialogue',
        estimatedMinutes: 15,
        questionCount: 4,
        targetMondai: 'Mondai 1: Nghe hội thoại phân vai Nam/Nữ và chọn việc cần làm ngay sau đó',
        reason: 'Luyện nghe hội thoại có tách từng câu và chỉnh tốc độ 0.7x–1.0x',
        targetWords: vocabLabels.slice(0, 3),
        targetGrammars: grammarLabels.slice(0, 2),
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_listening_m5',
        mondaiId: 'listening_m5_quick_response',
        title: 'Nghe hiểu · Mondai 5: Phản xạ nhanh tức thì (即時応答 · Nghe 1 câu đáp ngay)',
        category: 'listening',
        categoryLabel: 'Nghe hiểu · Mondai 5 (即時応答)',
        quizFormat: 'listening_dialogue',
        estimatedMinutes: 15,
        questionCount: 4,
        targetMondai: 'Mondai 5: Nghe 1 câu phát ngôn ngắn chứa từ/ngữ pháp mục tiêu và chọn câu đáp lại',
        reason: 'Ăn điểm trọn vẹn phần phản xạ giao tiếp ngắn cuối bài thi Nghe',
        targetWords:
          vocabLabels.slice(3, 6).length > 0 ? vocabLabels.slice(3, 6) : vocabLabels.slice(0, 3),
        targetGrammars:
          grammarLabels.slice(2, 4).length > 0 ? grammarLabels.slice(2, 4) : grammarLabels.slice(0, 2),
        completed: false,
        priority: 'medium',
      }
    );
  }

  return tasks;
}
