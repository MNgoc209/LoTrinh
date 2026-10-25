/**
 * System Prompt và cấu hình gửi lên Gemini API để sinh lộ trình học & câu hỏi thực chiến
 * tích hợp từ lịch sử OnTapTuVung và OnTapNguPhap.
 */

import { ConfidenceAssessment, ImportedVocabItem, ImportedGrammarItem } from '../types';
import { formatConfidenceSummary } from './studyLogic';

export const JLPT_N3_ROADMAP_SYSTEM_PROMPT = `
Bạn là "JLPT N3 AI Master Coach" - chuyên gia luyện thi JLPT N3.
Học viên đã có 2 ứng dụng học flashcard riêng là OnTapTuVung và OnTapNguPhap (chia theo Level từ Lv1 đến Lv8 và lịch hẹn ôn tập nextReview).
Nhiệm vụ của bạn là nhận danh sách Từ vựng & Ngữ pháp đang yếu (Lv1-Lv3) hoặc đã đến hạn ôn tập từ 2 web đó, kết hợp với số ngày còn lại trước kỳ thi và số câu lỗi trong Bug Tracker để tạo ra "Lộ trình luyện đề chuyển hóa kiến thức trong ngày hôm nay".

QUY TẮC THIẾT KẾ LỘ TRÌNH:
1. Không lặp lại việc học thuộc lòng flashcard đơn thuần (vì học viên đã học ở 2 web kia). Hãy tạo các nhiệm vụ chế biến các từ vựng & ngữ pháp đó thành 4 dạng bài thi JLPT N3 thực chiến:
   - "reading_integrated": Bài Đọc hiểu (Đoản văn / Trung văn) lồng ghép các từ vựng và ngữ pháp Lv1-Lv3 của học viên.
   - "grammar_mondai_3_4": Ngữ pháp thực chiến Mondai 3 (sắp xếp dấu sao ★) và Mondai 4 (đục lỗ đoạn văn).
   - "vocab_synonyms_usage": Từ vựng nâng cao Mondai 3 (tìm từ đồng nghĩa) và Mondai 4 (cách dùng từ đúng ngữ cảnh).
   - "listening_dialogue": Hội thoại Nghe hiểu (Choukai) chứa các từ vựng và cấu trúc vừa ôn.
   - "bug_review": Ôn tập các câu từng làm sai trong Bug Tracker (nếu pendingBugsCount > 0).
2. Mỗi nhiệm vụ (task) PHẢI liệt kê cụ thể "targetWords" và "targetGrammars" lấy từ danh sách ưu tiên của học viên.
`.trim();

export function buildRoadmapUserPrompt(params: {
  daysRemaining: number;
  examDateStr: string;
  confidence: ConfidenceAssessment;
  pendingBugsCount: number;
  priorityVocab: ImportedVocabItem[];
  priorityGrammar: ImportedGrammarItem[];
  currentDateFormatted?: string;
}): string {
  const {
    daysRemaining,
    examDateStr,
    confidence,
    pendingBugsCount,
    priorityVocab,
    priorityGrammar,
    currentDateFormatted,
  } = params;
  const confidenceSummary = formatConfidenceSummary(confidence);

  const vocabListText =
    priorityVocab.length > 0
      ? priorityVocab
          .map((v) => `${v.word} (${v.reading}) - ${v.meaning} [Lv${v.level}]`)
          .join('; ')
      : 'Chưa đồng bộ';

  const grammarListText =
    priorityGrammar.length > 0
      ? priorityGrammar
          .map((g) => `${g.name} (${g.structure}) - ${g.meaning} [Lv${g.level}]`)
          .join('; ')
      : 'Chưa đồng bộ';

  return `
Hôm nay là: ${currentDateFormatted || new Date().toLocaleDateString('vi-VN')}
DỮ LIỆU HỌC VIÊN HIỆN TẠI:
- Ngày thi mục tiêu: ${examDateStr} (Còn lại: ${daysRemaining} ngày)
- Tóm tắt điểm mạnh / điểm yếu: ${confidenceSummary}
- Số câu sai trong Bug Tracker cần ôn: ${pendingBugsCount} câu.
- DANH SÁCH TỪ VỰNG ƯU TIÊN HÔM NAY (Lv1-Lv3 hoặc đến hạn ôn từ OnTapTuVung):
  ${vocabListText}
- DANH SÁCH NGỮ PHÁP ƯU TIÊN HÔM NAY (Lv1-Lv3 hoặc đến hạn ôn từ OnTapNguPhap):
  ${grammarListText}

Hãy tạo lộ trình luyện đề hôm nay gồm 4-5 nhiệm vụ bao phủ các dạng bài thực chiến, gắn kèm targetWords và targetGrammars từ danh sách trên.
`.trim();
}
