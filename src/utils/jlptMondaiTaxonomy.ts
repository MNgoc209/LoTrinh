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
    description: 'Chọn cách đọc Hiragana chính xác cho từ Hán tự gạch chân trong câu (chú ý trường âm, âm ngắt, biến âm).',
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
    description: 'Chọn chữ Hán (Kanji) viết đúng cho từ Hiragana gạch chân, phân biệt các chữ Hán có bộ thủ gần giống nhau.',
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
    description: 'Chọn danh từ, động từ, tính từ, phó từ hoặc từ láy phù hợp nhất với mạch nghĩa của câu.',
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
    nameVi: 'Tìm từ đồng nghĩa / Câu gần nghĩa nhất',
    nameJp: '言い換え類義',
    description: 'Chọn từ hoặc cụm từ có thể thay thế cho từ gạch chân mà không làm đổi nghĩa câu gốc.',
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
    description: 'Cho 1 từ vựng mục tiêu và 4 câu văn; chọn duy nhất 1 câu sử dụng từ đó đúng ngữ pháp và tự nhiên nhất.',
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
    description: 'Chọn mẫu cấu trúc ngữ pháp, trợ từ, thể động từ (bị động, sai khiến, kính ngữ) điền vào chỗ trống.',
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
    description: 'Sắp xếp 4 mảnh ghép vào 4 vị trí ＿＿＿ ＿＿＿ ★ ＿＿＿ để tạo câu đúng ngữ pháp và chọn từ ở vị trí ngôi sao ★.',
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
    description: 'Đọc đoạn văn hoàn chỉnh và chọn liên từ nối câu, đại từ chỉ thị (この/その), đuôi câu phù hợp với ngữ cảnh.',
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
    description: 'Bài đọc ngắn 150–200 chữ lồng ghép từ vựng & ngữ pháp đã học; rèn kỹ năng bắt ý chính trong 2 phút/bài.',
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
    description: 'Bài đọc độ dài trung bình (~350 chữ) giải thích lý do phần gạch chân và quan điểm trọng tâm của tác giả.',
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
    nameVi: 'Đọc hiểu Trường văn (~550 chữ: Bài luận sâu & Suy luận)',
    nameJp: '内容理解（長文）',
    description: 'Bài đọc dài (~550 chữ) rèn khả năng theo dõi mạch lập luận qua nhiều đoạn văn và tổng hợp ý nghĩa toàn bài.',
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
    description: 'Đọc nhanh tờ rơi thông báo, điều kiện đăng ký, bảng giờ/giá vé để tìm phương án thoả mãn yêu cầu của nhân vật.',
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
    description: 'Nghe hội thoại phân vai Nam/Nữ để xác định hành động đầu tiên nhân vật phải thực hiện ngay sau cuộc gọi/hội thoại.',
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
    description: 'Đọc trước 4 đáp án và tập trung bắt từ khóa chỉ lý do, thời gian, sự thay đổi kế hoạch trong hội thoại.',
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
    description: 'Không có câu hỏi in trước; nghe đoạn độc thoại hoặc hội thoại để rút ra thông điệp chính của người nói.',
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
    description: 'Dựa vào ngữ cảnh tình huống (nhờ vả, xin phép, xin lỗi, đề nghị), chọn câu nói tự nhiên và đúng phép lịch sự nhất.',
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
    description: 'Nghe 1 câu phát ngôn ngắn của đối phương và chọn ngay câu trả lời khớp ngữ cảnh hội thoại tự nhiên.',
    examQuestionCount: '9 câu trong đề thi thật',
    quizFormat: 'listening_dialogue',
    defaultMinutes: 15,
    defaultPracticeCount: 5,
  },
];

/**
 * Generates JLPT N3 practice questions directly in the browser ONLY from the user's
 * synced OnTapTuVung & OnTapNguPhap items (zero hardcoded sample data).
 */
export function generateClientTargetedQuestions(
  quizFormat: QuizFormatType,
  targetVocab: ImportedVocabItem[],
  targetGrammar: ImportedGrammarItem[],
  _customTitle = ''
): QuizQuestion[] {
  const vList = targetVocab.length > 0 ? targetVocab : [];
  const gList = targetGrammar.length > 0 ? targetGrammar : [];
  if (vList.length === 0 && gList.length === 0) return [];

  const questions: QuizQuestion[] = [];

  if (quizFormat === 'vocab_synonyms_usage' && vList.length > 0) {
    vList.slice(0, 5).forEach((v, idx) => {
      const others = vList.filter((o) => o.id !== v.id);
      const getOther = (i: number) =>
        others[i % Math.max(1, others.length)] || {
          word: `${v.word} (${i + 1})`,
          reading: `${v.reading}`,
          meaning: `Phương án khác ${i + 1}`,
        };

      if (idx % 3 === 0) {
        questions.push({
          id: `client_vocab_m1_${Date.now()}_${idx}`,
          category: 'vocabulary',
          subCategory: 'Từ vựng · Mondai 1 — Cách đọc Hán tự (漢字読み)',
          title: `Mondai 1 (Cách đọc Hán tự) từ OnTapTuVung: 【${v.word}】 (Lv${v.level})`,
          questionText: `Từ 【${v.word}】（nghĩa: "${v.meaning}"）có cách đọc Hiragana chính xác là gì?`,
          options: [
            v.reading,
            getOther(0).reading,
            getOther(1).reading,
            getOther(2).reading,
          ],
          correctAnswerIndex: 0,
          explanation: `【${v.word}】 đọc là 「${v.reading}」, mang nghĩa: "${v.meaning}" (Level hiện tại trong OnTapTuVung: Lv${v.level}).`,
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
        });
      } else if (idx % 3 === 1) {
        questions.push({
          id: `client_vocab_m4_${Date.now()}_${idx}`,
          category: 'vocabulary',
          subCategory: 'Từ vựng · Mondai 3 & 4 — Ngữ cảnh & Từ đồng nghĩa (文脈規定・類義)',
          title: `Mondai 3 & 4 (Ngữ cảnh & Đồng nghĩa) từ OnTapTuVung: 【${v.word}】 (Lv${v.level})`,
          questionText: `Khi muốn diễn đạt ý nghĩa "${v.meaning}" trong bài thi JLPT N3, từ vựng nào sau đây trong kho của bạn là chính xác nhất?`,
          options: [
            `${v.word}（${v.reading}）`,
            `${getOther(0).word}（${getOther(0).reading}）`,
            `${getOther(1).word}（${getOther(1).reading}）`,
            `${getOther(2).word}（${getOther(2).reading}）`,
          ],
          correctAnswerIndex: 0,
          explanation: `Đáp án đúng là 【${v.word}（${v.reading}）】 với nghĩa "${v.meaning}".`,
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
        });
      } else {
        questions.push({
          id: `client_vocab_m5_${Date.now()}_${idx}`,
          category: 'vocabulary',
          subCategory: 'Từ vựng · Mondai 5 — Cách dùng từ đúng trong câu (用法)',
          title: `Mondai 5 (Cách dùng từ 用法) từ OnTapTuVung: 【${v.word}】 (Lv${v.level})`,
          questionText: `Từ 【${v.word}（${v.reading}）】 được sử dụng đúng sắc thái ("${v.meaning}") trong trường hợp nào dưới đây?`,
          options: [
            `Sử dụng 【${v.word}】 khi diễn tả: "${v.meaning}"`,
            `Sử dụng 【${v.word}】 để thay thế cho nghĩa "${getOther(0).meaning}"`,
            `Sử dụng 【${v.word}】 để thay thế cho nghĩa "${getOther(1).meaning}"`,
            `Sử dụng 【${v.word}】 để thay thế cho nghĩa "${getOther(2).meaning}"`,
          ],
          correctAnswerIndex: 0,
          explanation: `Trong Mondai 5 (用法), bạn cần nắm chắc sắc thái cốt lõi của 【${v.word}（${v.reading}）】 là "${v.meaning}".`,
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
        });
      }
    });
  }

  if (quizFormat === 'grammar_mondai_3_4' && gList.length > 0) {
    gList.slice(0, 5).forEach((g, idx) => {
      const others = gList.filter((o) => o.id !== g.id);
      const getOtherG = (i: number) =>
        others[i % Math.max(1, others.length)] || {
          name: `Cấu trúc khác ${i + 1}`,
          structure: '',
          meaning: `Nghĩa khác ${i + 1}`,
        };

      const subCat =
        idx % 3 === 0
          ? 'Ngữ pháp · Mondai 1 — Chọn cấu trúc ngữ pháp câu đơn'
          : idx % 3 === 1
          ? 'Ngữ pháp · Mondai 2 — Sắp xếp câu dấu sao ★ (文の組み立て)'
          : 'Ngữ pháp · Mondai 3 — Ngữ pháp đục lỗ đoạn văn (文章の文法)';

      questions.push({
        id: `client_gram_${Date.now()}_${idx}`,
        category: 'grammar',
        subCategory: subCat,
        title: `${subCat}: 【${g.name}】 (Lv${g.level})`,
        passage: g.example ? `Câu văn thực tế trong sổ tay OnTapNguPhap:\n「${g.example}」` : undefined,
        questionText: `Để diễn đạt ý nghĩa "${g.meaning}" theo đúng quy tắc kết nối 「${
          g.structure || g.name
        }」, cấu trúc nào sau đây là chính xác?`,
        options: [
          `${g.name} （Cấu trúc: ${g.structure || g.name}）`,
          `${getOtherG(0).name} （${getOtherG(0).meaning}）`,
          `${getOtherG(1).name} （${getOtherG(1).meaning}）`,
          `${getOtherG(2).name} （${getOtherG(2).meaning}）`,
        ],
        correctAnswerIndex: 0,
        explanation: `Mẫu ngữ pháp 【${g.name}】 (Cấu trúc: ${g.structure || g.name}) mang nghĩa: "${
          g.meaning
        }".${g.similarText ? `\nLưu ý phân biệt: ${g.similarText}` : ''}`,
        usedTargets: [
          {
            type: 'grammar',
            id: g.id,
            title: g.name,
            readingOrStructure: g.structure || g.name,
            meaning: g.meaning,
            level: g.level,
            note: g.similarText || g.example,
          },
        ],
      });
    });
  }

  if (quizFormat === 'reading_integrated') {
    const itemsToRead = gList.slice(0, 3);
    if (itemsToRead.length > 0) {
      itemsToRead.forEach((g, idx) => {
        const pairedVocab = vList[idx % Math.max(1, vList.length)];
        const others = gList.filter((o) => o.id !== g.id);
        const getOtherG = (i: number) =>
          others[i % Math.max(1, others.length)] || {
            name: `Phương án ${i + 1}`,
            meaning: `Ý nghĩa khác ${i + 1}`,
          };

        const passageText = g.example
          ? `${g.example}\n${pairedVocab ? `（Từ vựng kết hợp: 【${pairedVocab.word}（${pairedVocab.reading}）】 — ${pairedVocab.meaning}）` : ''}`
          : `Trong bài đọc có sử dụng cấu trúc 【${g.name}】（${g.structure || g.name}）${
              pairedVocab ? ` kết hợp cùng từ vựng 【${pairedVocab.word}（${pairedVocab.reading}）】` : ''
            }.`;

        questions.push({
          id: `client_read_${Date.now()}_${idx}`,
          category: 'reading',
          subCategory: 'Đọc hiểu · Mondai 4 & 5 — Phân tích câu văn chứa ngữ pháp & từ vựng đã học',
          title: `Đọc hiểu tích hợp: 【${g.name}】${pairedVocab ? ` · 【${pairedVocab.word}】` : ''}`,
          passage: passageText,
          questionText: `Trong đoạn trích trên, cấu trúc 【${g.name}】 truyền tải ý nghĩa trọng tâm nào của người viết?`,
          options: [
            `${g.meaning} (${g.structure || g.name})`,
            getOtherG(0).meaning,
            getOtherG(1).meaning,
            getOtherG(2).meaning,
          ],
          correctAnswerIndex: 0,
          explanation: `Cấu trúc 【${g.name}】 mang nghĩa "${g.meaning}".${
            g.example ? `\nVí dụ gốc: ${g.example}` : ''
          }`,
          usedTargets: [
            {
              type: 'grammar',
              id: g.id,
              title: g.name,
              readingOrStructure: g.structure || g.name,
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
        });
      });
    } else if (vList.length > 0) {
      vList.slice(0, 3).forEach((v, idx) => {
        const others = vList.filter((o) => o.id !== v.id);
        const getOther = (i: number) =>
          others[i % Math.max(1, others.length)] || {
            word: `Phương án ${i + 1}`,
            meaning: `Nghĩa khác ${i + 1}`,
          };

        questions.push({
          id: `client_read_v_${Date.now()}_${idx}`,
          category: 'reading',
          subCategory: 'Đọc hiểu · Mondai 4 — Nắm bắt từ khóa trong văn bản',
          title: `Đọc hiểu từ khóa OnTapTuVung: 【${v.word}】 (Lv${v.level})`,
          passage: `Từ khóa xuất hiện trong văn bản: 【${v.word}】（${v.reading}）`,
          questionText: `Khi gặp từ khóa 【${v.word}（${v.reading}）】 trong bài Đọc hiểu JLPT N3, bạn cần hiểu nghĩa của từ này là gì?`,
          options: [
            v.meaning,
            getOther(0).meaning,
            getOther(1).meaning,
            getOther(2).meaning,
          ],
          correctAnswerIndex: 0,
          explanation: `【${v.word}（${v.reading}）】 có nghĩa là "${v.meaning}".`,
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
        });
      });
    }
  }

  if (quizFormat === 'listening_dialogue') {
    if (vList.length > 0) {
      vList.slice(0, 3).forEach((v, idx) => {
        const pairedG = gList[idx % Math.max(1, gList.length)];
        const others = vList.filter((o) => o.id !== v.id);
        const getOther = (i: number) =>
          others[i % Math.max(1, others.length)] || {
            word: `Từ khác ${i + 1}`,
            meaning: `Nghĩa khác ${i + 1}`,
          };

        const scriptLines = [
          `女：すみません、この「${v.word}」という言葉はどういう意味ですか。`,
          `男：ああ、「${v.reading}」と読みますよ。${pairedG?.example ? `例えば、「${pairedG.example}」のように使います。` : ''}`,
        ].join('\n');

        questions.push({
          id: `client_listen_${Date.now()}_${idx}`,
          category: 'listening',
          subCategory: 'Nghe hiểu · Mondai 1 & 2 — Nghe từ khóa & mẫu câu đã học',
          title: `Nghe hội thoại chứa từ 【${v.word}】 (Lv${v.level})`,
          listeningScript: scriptLines,
          questionText: `Từ 【${v.word}（${v.reading}）】 được nhắc đến trong đoạn hội thoại mang ý nghĩa nào?`,
          options: [
            `${v.meaning} （${v.word} / ${v.reading}）`,
            getOther(0).meaning,
            getOther(1).meaning,
            getOther(2).meaning,
          ],
          correctAnswerIndex: 0,
          explanation: `Trong đoạn hội thoại, từ 【${v.word}】 đọc là 「${v.reading}」, có nghĩa là "${v.meaning}".`,
          usedTargets: [
            {
              type: 'vocab',
              id: v.id,
              title: v.word,
              readingOrStructure: v.reading,
              meaning: v.meaning,
              level: v.level,
            },
            ...(pairedG
              ? [
                  {
                    type: 'grammar' as const,
                    id: pairedG.id,
                    title: pairedG.name,
                    readingOrStructure: pairedG.structure || pairedG.name,
                    meaning: pairedG.meaning,
                    level: pairedG.level,
                  },
                ]
              : []),
          ],
        });
      });
    } else if (gList.length > 0) {
      gList.slice(0, 3).forEach((g, idx) => {
        const others = gList.filter((o) => o.id !== g.id);
        const getOtherG = (i: number) =>
          others[i % Math.max(1, others.length)] || {
            name: `Cấu trúc khác ${i + 1}`,
            meaning: `Nghĩa khác ${i + 1}`,
          };

        const scriptLines = [
          `女：${g.example || `${g.name}を使った文を練習しましょう。`}`,
          `男：なるほど、「${g.name}」という表現ですね。`,
        ].join('\n');

        questions.push({
          id: `client_listen_g_${Date.now()}_${idx}`,
          category: 'listening',
          subCategory: 'Nghe hiểu · Mondai 4 & 5 — Nghe biểu hiện ngữ pháp trong hội thoại',
          title: `Nghe hội thoại chứa cấu trúc 【${g.name}】 (Lv${g.level})`,
          listeningScript: scriptLines,
          questionText: `Cấu trúc 【${g.name}】 xuất hiện trong lượt lời trên diễn đạt ý nghĩa gì?`,
          options: [
            g.meaning,
            getOtherG(0).meaning,
            getOtherG(1).meaning,
            getOtherG(2).meaning,
          ],
          correctAnswerIndex: 0,
          explanation: `Cấu trúc 【${g.name}】 mang nghĩa: "${g.meaning}".`,
          usedTargets: [
            {
              type: 'grammar',
              id: g.id,
              title: g.name,
              readingOrStructure: g.structure || g.name,
              meaning: g.meaning,
              level: g.level,
              note: g.similarText || g.example,
            },
          ],
        });
      });
    }
  }

  return questions;
}

/**
 * Builds the Daily Tasks grouped clearly by the 4 JLPT N3 Sections ONLY when the user
 * has actual imported vocabulary, grammar, or due bugs. Returns [] if no data is synced yet.
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
        id: 'task_vocab_m1_m2',
        title: 'Từ vựng Mondai 1 & Mondai 2: Cách đọc Hán tự (漢字読み) & Chọn chữ Hán đúng (表記)',
        category: 'vocabulary',
        categoryLabel: 'Từ vựng · Mondai 1 & 2',
        quizFormat: 'vocab_synonyms_usage',
        estimatedMinutes: 15,
        questionCount: Math.min(5, priorityVocab.length),
        targetMondai: 'Mondai 1 (Đọc Kanji -> Hiragana) & Mondai 2 (Hiragana -> Kanji)',
        reason: 'Kiểm tra chính xác trường âm, âm ngắt và mặt chữ Hán của các từ Lv1–Lv3 trong OnTapTuVung',
        targetWords: vocabLabels.slice(0, 4),
        targetGrammars: [],
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_vocab_m3_m4_m5',
        title: 'Từ vựng Mondai 3, 4 & 5: Điền từ ngữ cảnh (文脈規定), Từ đồng nghĩa (類義) & Cách dùng từ (用法)',
        category: 'vocabulary',
        categoryLabel: 'Từ vựng · Mondai 3, 4 & 5',
        quizFormat: 'vocab_synonyms_usage',
        estimatedMinutes: 20,
        questionCount: Math.min(5, priorityVocab.length),
        targetMondai: 'Mondai 3 (Điền từ), Mondai 4 (Đồng nghĩa) & Mondai 5 (Cách dùng từ 用法)',
        reason: 'Vận dụng từ vựng OnTapTuVung vào câu thực tế và phân biệt các từ gần nghĩa',
        targetWords: vocabLabels.slice(2, 7).length > 0 ? vocabLabels.slice(2, 7) : vocabLabels.slice(0, 4),
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
        id: 'task_grammar_m1_m2',
        title: 'Ngữ pháp Mondai 1 & Mondai 2: Ngữ pháp câu đơn & Sắp xếp câu dấu sao ★ (文の組み立て)',
        category: 'grammar',
        categoryLabel: 'Ngữ pháp · Mondai 1 & 2 (Dấu sao ★)',
        quizFormat: 'grammar_mondai_3_4',
        estimatedMinutes: 25,
        questionCount: Math.min(5, priorityGrammar.length),
        targetMondai: 'Mondai 1 (Chọn cấu trúc câu đơn) & Mondai 2 (Ghép 4 mảnh vào vị trí ★)',
        reason: 'Rèn kỹ năng bắt khung kết nối cho các mẫu câu Lv1–Lv3 trong OnTapNguPhap',
        targetWords: vocabLabels.slice(0, 2),
        targetGrammars: grammarLabels.slice(0, 3),
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_grammar_m3',
        title: 'Ngữ pháp Mondai 3: Ngữ pháp đục lỗ trong đoạn văn (文章の文法)',
        category: 'grammar',
        categoryLabel: 'Ngữ pháp · Mondai 3 (Đoạn văn)',
        quizFormat: 'grammar_mondai_3_4',
        estimatedMinutes: 20,
        questionCount: Math.min(4, priorityGrammar.length),
        targetMondai: 'Mondai 3 (Điền liên từ, chỉ thị từ & mẫu câu theo mạch đoạn văn)',
        reason: 'Kết nối các cấu trúc ngữ pháp của bạn vào đoạn văn hoàn chỉnh',
        targetWords: vocabLabels.slice(3, 5),
        targetGrammars: grammarLabels.slice(2, 5).length > 0 ? grammarLabels.slice(2, 5) : grammarLabels.slice(0, 3),
        completed: false,
        priority: 'medium',
      }
    );
  }

  // 3. ĐỌC HIỂU & 4. NGHE HIỂU (When user has synced either vocabulary or grammar)
  if (priorityVocab.length > 0 || priorityGrammar.length > 0) {
    tasks.push(
      {
        id: 'task_reading_m4_m7',
        title: 'Đọc hiểu Mondai 4 & Mondai 7: Đoản văn ngắn (150–200 chữ) & Tìm kiếm thông tin (情報検索)',
        category: 'reading',
        categoryLabel: 'Đọc hiểu · Mondai 4 & 7',
        quizFormat: 'reading_integrated',
        estimatedMinutes: 20,
        questionCount: 4,
        targetMondai: 'Mondai 4 (Đoản văn Email/Thông báo) & Mondai 7 (Tra cứu tờ rơi/Bảng biểu)',
        reason: 'Rèn tốc độ đọc lướt bắt từ khóa trong 2 phút/bài với các từ vựng và ngữ pháp vừa ôn',
        targetWords: vocabLabels.slice(0, 4),
        targetGrammars: grammarLabels.slice(0, 2),
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_reading_m5_m6',
        title: 'Đọc hiểu Mondai 5 & Mondai 6: Trung văn (350 chữ) & Trường văn phân tích ý tác giả',
        category: 'reading',
        categoryLabel: 'Đọc hiểu · Mondai 5 & 6',
        quizFormat: 'reading_integrated',
        estimatedMinutes: 25,
        questionCount: 4,
        targetMondai: 'Mondai 5 (Trung văn 350 chữ) & Mondai 6 (Trường văn 550 chữ)',
        reason: 'Phân tích câu văn dài lồng ghép các cấu trúc ngữ pháp của bạn để tìm luận điểm tác giả',
        targetWords: vocabLabels.slice(2, 6).length > 0 ? vocabLabels.slice(2, 6) : vocabLabels.slice(0, 3),
        targetGrammars: grammarLabels.slice(1, 4).length > 0 ? grammarLabels.slice(1, 4) : grammarLabels.slice(0, 2),
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_listening_m1_m2_m3',
        title: 'Nghe hiểu Mondai 1, 2 & 3: Nghe nhiệm vụ (課題理解), Điểm chính (ポイント) & Khái quát (概要)',
        category: 'listening',
        categoryLabel: 'Nghe hiểu · Mondai 1, 2 & 3',
        quizFormat: 'listening_dialogue',
        estimatedMinutes: 20,
        questionCount: 4,
        targetMondai: 'Mondai 1 (Làm gì tiếp theo), Mondai 2 (Lý do/Chi tiết) & Mondai 3 (Ý chính)',
        reason: 'Luyện nghe hội thoại phân vai Nam/Nữ có tách câu và chỉnh tốc độ 0.7x–1.0x',
        targetWords: vocabLabels.slice(0, 3),
        targetGrammars: grammarLabels.slice(0, 2),
        completed: false,
        priority: 'high',
      },
      {
        id: 'task_listening_m4_m5',
        title: 'Nghe hiểu Mondai 4 & Mondai 5: Biểu hiện giao tiếp tình huống (発話表現) & Phản xạ nhanh (即時応答)',
        category: 'listening',
        categoryLabel: 'Nghe hiểu · Mondai 4 & 5',
        quizFormat: 'listening_dialogue',
        estimatedMinutes: 15,
        questionCount: 4,
        targetMondai: 'Mondai 4 (Câu nói theo tình huống) & Mondai 5 (Nghe 1 câu — Đáp lại ngay)',
        reason: 'Ăn điểm trọn vẹn phần phản xạ giao tiếp ngắn cuối bài thi Nghe',
        targetWords: vocabLabels.slice(3, 6).length > 0 ? vocabLabels.slice(3, 6) : vocabLabels.slice(0, 3),
        targetGrammars: grammarLabels.slice(2, 4).length > 0 ? grammarLabels.slice(2, 4) : grammarLabels.slice(0, 2),
        completed: false,
        priority: 'medium',
      }
    );
  }

  return tasks;
}
