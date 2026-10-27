import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import {
  generateClientTargetedQuestions,
  resolveMondaiId,
} from './src/utils/jlptMondaiTaxonomy.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to wrap raw PCM 16-bit 24kHz mono into a standard playable WAV buffer
function pcm16ToWavBase64(pcmBase64: string, sampleRate = 24000): string {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  wavHeader.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]).toString('base64');
}

function buildFallbackRoadmap(params: {
  daysRemaining: number;
  pendingBugsCount: number;
  priorityVocab: any[];
  priorityGrammar: any[];
  studyIntensity?: string;
  previousReport?: any;
}) {
  const {
    daysRemaining,
    pendingBugsCount,
    priorityVocab = [],
    priorityGrammar = [],
    studyIntensity = 'intensive',
    previousReport,
  } = params;

  const vocabLabels = priorityVocab.slice(0, 8).map((v: any) => `${v.word} (Lv${v.level})`);
  const grammarLabels = priorityGrammar.slice(0, 5).map((g: any) => `${g.name} (Lv${g.level})`);

  if (pendingBugsCount === 0 && vocabLabels.length === 0 && grammarLabels.length === 0) {
    return {
      focusMessage:
        'Chưa có dữ liệu từ vựng hoặc ngữ pháp. Hãy bấm "Đồng bộ dữ liệu" để nạp file Backup JSON hoặc kết nối Cloud Firebase từ OnTapTuVung & OnTapNguPhap.',
      targetScoreGoal: 'Nạp dữ liệu cá nhân để tạo lộ trình học',
      totalEstimatedMinutes: 0,
      tasks: [],
      tipsForToday: [],
    };
  }

  const tasks: any[] = [];
  if (pendingBugsCount > 0) {
    tasks.push({
      id: `task_${Date.now()}_bugs`,
      title: `Chặng 1: Khởi động Spaced Repetition — Xử lý ${pendingBugsCount} câu sai trong Bug Tracker`,
      category: 'review',
      categoryLabel: 'Khắc phục lỗi sai',
      quizFormat: 'bug_review',
      estimatedMinutes: 15,
      questionCount: pendingBugsCount,
      targetMondai: 'Spaced Repetition Queue',
      reason: previousReport
        ? 'Theo Báo cáo 19:00: Cần khóa chặt các câu sai tồn đọng trước khi sang bài mới'
        : 'Xử lý triệt để các câu từng chọn sai để không mất điểm đáng tiếc',
      targetWords: vocabLabels.slice(0, 2),
      targetGrammars: grammarLabels.slice(0, 1),
      completed: false,
      priority: 'high',
    });
  }

  tasks.push(
    {
      id: `task_${Date.now()}_vocab_1`,
      title: 'Chặng 2: Từ vựng thực chiến — Tìm từ đồng nghĩa (Mondai 3) & Cách dùng từ (Mondai 4)',
      category: 'vocabulary',
      categoryLabel: 'Từ vựng Mondai 3-4',
      quizFormat: 'vocab_synonyms_usage',
      estimatedMinutes: 20,
      questionCount: 5,
      targetMondai: 'Từ đồng nghĩa & Ngữ cảnh (用法)',
      reason: 'Kiểm tra sắc thái sử dụng thực tế của các từ Lv1–Lv3 từ OnTapTuVung',
      targetWords: vocabLabels.slice(0, 5),
      targetGrammars: [],
      completed: false,
      priority: 'high',
    },
    {
      id: `task_${Date.now()}_grammar_star`,
      title: 'Chặng 3: Ngữ pháp thực chiến — Luyện 5 câu Sắp xếp dấu sao ★ (Mondai 3)',
      category: 'grammar',
      categoryLabel: 'Ngữ pháp Mondai 3 ★',
      quizFormat: 'grammar_mondai_3_4',
      estimatedMinutes: 25,
      questionCount: 5,
      targetMondai: 'Bunpou Mondai 3 ★',
      reason: 'Chuyển hóa các mẫu câu trong OnTapNguPhap thành phản xạ ghép cụm từ dấu sao',
      targetWords: vocabLabels.slice(2, 5),
      targetGrammars: grammarLabels.slice(0, 3),
      completed: false,
      priority: 'high',
    },
    {
      id: `task_${Date.now()}_grammar_cloze`,
      title: 'Chặng 4: Ngữ pháp trong đoạn văn — Đục lỗ mạch văn & Liên từ (Mondai 4)',
      category: 'grammar',
      categoryLabel: 'Ngữ pháp Mondai 4',
      quizFormat: 'grammar_mondai_3_4',
      estimatedMinutes: 20,
      questionCount: 4,
      targetMondai: 'Bunpou Mondai 4',
      reason: 'Vận dụng cấu trúc ngữ pháp vào mạch văn dài',
      targetWords: vocabLabels.slice(3, 6),
      targetGrammars: grammarLabels.slice(2, 5),
      completed: false,
      priority: 'medium',
    },
    {
      id: `task_${Date.now()}_reading_short`,
      title: 'Chặng 5: Đọc hiểu Đoản văn phản xạ nhanh (Dokkai Mondai 4) lồng ghép từ đã học',
      category: 'reading',
      categoryLabel: 'Đọc hiểu Đoản văn',
      quizFormat: 'reading_integrated',
      estimatedMinutes: 20,
      questionCount: 4,
      targetMondai: 'Dokkai Đoản văn · Tích hợp lịch sử',
      reason: 'Đặt các từ vựng và cấu trúc Lv1–Lv3 của bạn vào đoạn văn 180 chữ để rèn tốc độ đọc',
      targetWords: vocabLabels.slice(0, 4),
      targetGrammars: grammarLabels.slice(0, 2),
      completed: false,
      priority: 'high',
    },
    {
      id: `task_${Date.now()}_reading_medium`,
      title: 'Chặng 6: Đọc hiểu Trung văn phân tích luận điểm tác giả (Dokkai Mondai 5)',
      category: 'reading',
      categoryLabel: 'Đọc hiểu Trung văn',
      quizFormat: 'reading_integrated',
      estimatedMinutes: 25,
      questionCount: 4,
      targetMondai: 'Dokkai Trung văn (280–350 chữ)',
      reason: 'Nâng cao khả năng suy luận ý tác giả qua các mẫu câu nghịch đảo vừa ôn',
      targetWords: vocabLabels.slice(2, 6),
      targetGrammars: grammarLabels.slice(1, 4),
      completed: false,
      priority: 'high',
    },
    {
      id: `task_${Date.now()}_listening`,
      title: 'Chặng 7: Hội thoại Nghe hiểu Choukai phân vai Nam/Nữ — Nghe từng câu & Bắt từ khóa',
      category: 'listening',
      categoryLabel: 'Nghe hiểu Choukai',
      quizFormat: 'listening_dialogue',
      estimatedMinutes: 20,
      questionCount: 4,
      targetMondai: 'Choukai Mondai 1 & 2 (Có tách câu & tốc độ 0.7x–1.0x)',
      reason: previousReport
        ? 'Theo Báo cáo 19:00: Tăng cường luyện nghe hội thoại có tách từng lượt lời Nam/Nữ'
        : 'Rèn phản xạ bắt từ khóa trong hội thoại tốc độ điều chỉnh',
      targetWords: vocabLabels.slice(0, 3),
      targetGrammars: grammarLabels.slice(0, 2),
      completed: false,
      priority: 'high',
    }
  );

  if (studyIntensity === 'overdrive') {
    tasks.push({
      id: `task_${Date.now()}_listening_extra`,
      title: 'Chặng 8 (Tăng cường): Tổng duyệt Phản xạ Nghe & Từ vựng tốc độ cao',
      category: 'listening',
      categoryLabel: 'Choukai Tăng cường',
      quizFormat: 'listening_dialogue',
      estimatedMinutes: 20,
      questionCount: 4,
      targetMondai: 'Choukai Mondai 4 · Phản xạ nhanh',
      reason: 'Chế độ Cấp tốc (Overdrive): Đẩy mạnh phản xạ nghe hiểu cuối ngày',
      targetWords: vocabLabels.slice(3, 7),
      targetGrammars: grammarLabels.slice(1, 3),
      completed: false,
      priority: 'medium',
    });
  }

  return {
    focusMessage: previousReport
      ? `Lộ trình thích ứng dựa trên Báo cáo 19:00 (${previousReport.date}): Tập trung khắc phục điểm yếu và chuyển hóa ${vocabLabels.length} từ vựng + ${grammarLabels.length} ngữ pháp Lv1–Lv3 qua ${tasks.length} chặng thực chiến.`
      : `Chiến dịch ${daysRemaining} ngày trước kỳ thi: Chuyển hóa ${vocabLabels.length} từ vựng & ${grammarLabels.length} ngữ pháp mục tiêu (Lv1–Lv3 / Đến hạn) từ 2 web của bạn thành ${tasks.length} chặng đề thực chiến!`,
    targetScoreGoal: `Hoàn thành ${tasks.length} chặng (${tasks.reduce(
      (sum, t) => sum + t.estimatedMinutes,
      0
    )} phút) & Đánh giá tiến độ lúc 19:00`,
    totalEstimatedMinutes: tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0),
    tasks,
    basedOnReportDate: previousReport?.date,
    tipsForToday: [
      'Ở bài Nghe Choukai: Bạn có thể bấm nghe riêng từng câu thoại của Nam (男) hoặc Nữ (女) ở tốc độ 0.7x trước khi nghe toàn bài ở 1.0x.',
      'Sau khi hoàn thành các chặng chính, bạn có thể bấm chọn "Luyện thêm ngoài lộ trình" bên dưới — mọi bài làm thêm đều được tính vào Báo cáo 19:00.',
    ],
  };
}

// 1. Generate Daily Roadmap API (Supports Adaptive Next-Day Generation from 19:00 Report)
app.post('/api/roadmap/generate', async (req, res) => {
  try {
    const {
      daysRemaining = 42,
      examDateStr = '2026-12-06',
      confidence,
      pendingBugsCount = 0,
      personalNotes,
      priorityVocab = [],
      priorityGrammar = [],
      studyIntensity = 'intensive',
      previousReport = null,
    } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        fallback: true,
        roadmap: buildFallbackRoadmap({
          daysRemaining,
          pendingBugsCount,
          priorityVocab,
          priorityGrammar,
          studyIntensity,
          previousReport,
        }),
      });
    }

    const vocabPromptList = priorityVocab
      .slice(0, 12)
      .map((v: any) => `${v.word} (${v.reading}: ${v.meaning}) [Lv${v.level}]`)
      .join('; ');

    const grammarPromptList = priorityGrammar
      .slice(0, 8)
      .map((g: any) => `${g.name} (Cấu trúc: ${g.structure} | Nghĩa: ${g.meaning}) [Lv${g.level}]`)
      .join('; ');

    const targetTaskCount =
      studyIntensity === 'overdrive' ? 8 : studyIntensity === 'standard' ? 6 : 7;

    const reportContext = previousReport
      ? `
BÁO CÁO TIẾN ĐỘ 19:00 NGÀY HÔM QUA (${previousReport.date}):
- Độ chính xác tổng: ${previousReport.overallAccuracy}%
- Điểm mạnh đã tiến bộ: ${(previousReport.strengths || []).join(' | ')}
- Điểm yếu cần khắc phục gấp hôm nay: ${(previousReport.weaknesses || []).join(' | ')}
- Đề xuất điều chỉnh từ báo cáo 19:00: ${(previousReport.nextDayAdjustments || []).join(' | ')}
`
      : 'Chưa có báo cáo 19:00 hôm qua.';

    const systemInstruction = `
Bạn là "JLPT N3 AI Master Coach". Học viên có 2 web học từ vựng (OnTapTuVung) và ngữ pháp (OnTapNguPhap) riêng.
Hãy tạo lộ trình học đầy đủ gồm ${targetTaskCount} chặng nhiệm vụ (tasks) cho RIÊNG HÔM NAY dựa trên:
- Số ngày còn lại tới kỳ thi (${daysRemaining} ngày).
- Danh sách Từ vựng yếu (Lv1-Lv3) / đến hạn ôn từ OnTapTuVung.
- Danh sách Ngữ pháp yếu (Lv1-Lv3) / đến hạn ôn từ OnTapNguPhap.
- Số câu sai trong Bug Tracker (${pendingBugsCount} câu).
- Báo cáo đánh giá 19:00 của ngày trước đó (nếu có) để tăng cường phần còn yếu và kế thừa các bài luyện thêm.

BẮT BUỘC tạo đủ ${targetTaskCount} tasks phân bổ sâu vào các dạng thực chiến:
1. "bug_review" (category: "review"): Khởi động xử lý lỗi sai trong Bug Tracker.
2. "vocab_synonyms_usage" (category: "vocabulary"): Từ vựng nâng cao Mondai 3 (từ đồng nghĩa) & Mondai 4 (cách dùng từ đúng ngữ cảnh).
3. "grammar_mondai_3_4" (category: "grammar"): Chặng riêng cho Mondai 3 dấu sao ★ và Chặng riêng cho Mondai 4 đục lỗ đoạn văn.
4. "reading_integrated" (category: "reading"): Chặng riêng cho Đọc hiểu Đoản văn và Chặng riêng cho Đọc hiểu Trung văn lồng ghép từ/ngữ pháp đã học.
5. "listening_dialogue" (category: "listening"): Hội thoại Nghe hiểu phân vai Nam/Nữ chứa các từ vựng và cấu trúc vừa ôn.

Mỗi task phải điền mảng "targetWords" và "targetGrammars" trích từ dữ liệu học viên.
`.trim();

    const userPrompt = `
- Ngày thi: ${examDateStr} (Còn ${daysRemaining} ngày)
- Ghi chú học viên: "${personalNotes || confidence?.notes || ''}"
- Số câu lỗi Bug Tracker: ${pendingBugsCount}
- Từ vựng ưu tiên hôm nay (Lv1-Lv3 / Đến hạn): ${vocabPromptList || 'Chưa có'}
- Ngữ pháp ưu tiên hôm nay (Lv1-Lv3 / Đến hạn): ${grammarPromptList || 'Chưa có'}
${reportContext}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusMessage: { type: Type.STRING },
            targetScoreGoal: { type: Type.STRING },
            totalEstimatedMinutes: { type: Type.INTEGER },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  categoryLabel: { type: Type.STRING },
                  quizFormat: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                  questionCount: { type: Type.INTEGER },
                  targetMondai: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  targetWords: { type: Type.ARRAY, items: { type: Type.STRING } },
                  targetGrammars: { type: Type.ARRAY, items: { type: Type.STRING } },
                  priority: { type: Type.STRING },
                },
                required: [
                  'id',
                  'title',
                  'category',
                  'categoryLabel',
                  'quizFormat',
                  'estimatedMinutes',
                  'priority',
                ],
              },
            },
            tipsForToday: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['focusMessage', 'targetScoreGoal', 'totalEstimatedMinutes', 'tasks', 'tipsForToday'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.tasks && Array.isArray(parsed.tasks)) {
      parsed.tasks = parsed.tasks.map((t: any, idx: number) => ({
        ...t,
        id: t.id || `task_${Date.now()}_${idx}`,
        completed: false,
      }));
    }
    if (previousReport?.date) {
      parsed.basedOnReportDate = previousReport.date;
    }

    res.json({ success: true, roadmap: parsed });
  } catch (error: any) {
    console.error('Error generating roadmap:', error);
    res.json({
      success: true,
      fallback: true,
      roadmap: buildFallbackRoadmap({
        daysRemaining: req.body?.daysRemaining || 42,
        pendingBugsCount: req.body?.pendingBugsCount || 0,
        priorityVocab: req.body?.priorityVocab || [],
        priorityGrammar: req.body?.priorityGrammar || [],
        studyIntensity: req.body?.studyIntensity || 'intensive',
        previousReport: req.body?.previousReport || null,
      }),
    });
  }
});

// 2. Multi-Speaker Neural Japanese TTS Endpoint for Listening Comprehension
app.post('/api/tts/listening', async (req, res) => {
  try {
    const { script = '', speed = 1.0 } = req.body;
    if (!script || !ai) {
      return res.json({ success: false, fallbackToBrowser: true });
    }

    // Format script for multi-speaker Male (男) and Female (女)
    const normalizedLines = String(script)
      .split(/\r?\n/)
      .map((line) => line.replace(/【|】/g, '').trim())
      .filter(Boolean)
      .map((line, idx) => {
        if (line.startsWith('男：') || line.startsWith('男:')) {
          return `Male: ${line.replace(/^男[：:]\s*/, '')}`;
        }
        if (line.startsWith('女：') || line.startsWith('女:')) {
          return `Female: ${line.replace(/^女[：:]\s*/, '')}`;
        }
        return `${idx % 2 === 0 ? 'Male' : 'Female'}: ${line}`;
      })
      .join('\n');

    const paceNote =
      speed < 0.85
        ? 'Speak clearly, slowly, and distinctly for a JLPT N3 Japanese learner, with natural pauses between sentences.'
        : 'Speak naturally and clearly at standard JLPT N3 listening exam pace.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [{ parts: [{ text: `${paceNote}\n${normalizedLines}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Male',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
              },
              {
                speaker: 'Female',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
              },
            ],
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) {
      return res.json({ success: false, fallbackToBrowser: true });
    }

    const rawBytes = Buffer.from(inlineData.data, 'base64');
    const isAlreadyWav =
      rawBytes.length > 4 && rawBytes.subarray(0, 4).toString('ascii') === 'RIFF';
    const wavBase64 = isAlreadyWav
      ? inlineData.data
      : pcm16ToWavBase64(inlineData.data, 24000);
    return res.json({
      success: true,
      audioDataUrl: `data:audio/wav;base64,${wavBase64}`,
    });
  } catch (error: any) {
    console.warn('Gemini TTS fallback to browser multi-turn TTS:', error?.message);
    return res.json({ success: false, fallbackToBrowser: true });
  }
});

// 3. Generate Targeted Quiz Questions from OnTapTuVung & OnTapNguPhap history (Supports all 17 Mondai)
app.post('/api/quiz/generate-targeted', async (req, res) => {
  try {
    const {
      quizFormat = 'reading_integrated',
      mondaiId,
      customTitle = '',
      targetVocab = [],
      targetGrammar = [],
      count = 4,
    } = req.body;

    const resolvedMondai = resolveMondaiId(quizFormat, mondaiId, customTitle);

    if (!ai) {
      const fallbackQs = generateClientTargetedQuestions(
        quizFormat,
        targetVocab,
        targetGrammar,
        customTitle,
        resolvedMondai
      );
      return res.json({ success: true, fallback: true, questions: fallbackQs });
    }

    const vocabDetails = targetVocab
      .slice(0, 10)
      .map((v: any) => `- Từ: ${v.word} (${v.reading}) | Nghĩa: ${v.meaning} | Level hiện tại: Lv${v.level}`)
      .join('\n');

    const grammarDetails = targetGrammar
      .slice(0, 6)
      .map(
        (g: any) =>
          `- Ngữ pháp: ${g.name} | Cấu trúc: ${g.structure} | Nghĩa: ${g.meaning} | Ví dụ gốc: ${g.example || ''} | Phân biệt: ${g.similarText || ''} | Level: Lv${g.level}`
      )
      .join('\n');

    const mondaiInstructionsMap: Record<string, string> = {
      vocab_m1_kanji_reading: `
DẠNG BÀI BẮT BUỘC: Từ vựng · Mondai 1 — Cách đọc Hán tự (漢字読み).
- Tạo câu văn tiếng Nhật hoàn chỉnh có từ Hán tự mục tiêu đặt trong ngoặc 【Từ_Kanji】.
- 4 phương án (options) PHẢI hoàn toàn bằng chữ Hiragana (1 đáp án đúng + 3 đáp án nhiễu bẫy trường âm, âm ngắt っ, âm đục). TUYỆT ĐỐI KHÔNG kèm nghĩa tiếng Việt trong options.
- category đặt là "vocabulary".`,
      vocab_m2_orthography: `
DẠNG BÀI BẮT BUỘC: Từ vựng · Mondai 2 — Nhận diện chữ Hán (表記).
- Tạo câu văn tiếng Nhật hoàn chỉnh có từ mục tiêu viết bằng Hiragana trong ngoặc 【từ_hiragana】.
- 4 phương án (options) là 4 cách viết chữ Hán (Kanji) gần giống nhau. TUYỆT ĐỐI KHÔNG kèm nghĩa tiếng Việt trong options.
- category đặt là "vocabulary".`,
      vocab_m3_context: `
DẠNG BÀI BẮT BUỘC: Từ vựng · Mondai 3 — Điền từ vào chỗ trống theo ngữ cảnh câu (文脈規定).
- Tạo câu văn tiếng Nhật hoàn chỉnh có chỗ trống （　　　） phù hợp với từ mục tiêu.
- 4 phương án (options) là 4 từ vựng tiếng Nhật (không kèm nghĩa tiếng Việt trong options).
- category đặt là "vocabulary".`,
      vocab_m4_synonyms: `
DẠNG BÀI BẮT BUỘC: Từ vựng · Mondai 4 — Tìm từ / cụm từ gần nghĩa nhất (言い換え類義).
- Tạo câu văn tiếng Nhật có từ mục tiêu trong ngoặc 【　】.
- 4 phương án (options) là 4 từ hoặc cách diễn đạt bằng tiếng Nhật (1 phương án đồng nghĩa/gần nghĩa nhất, 3 phương án nhiễu).
- category đặt là "vocabulary".`,
      vocab_m5_usage: `
DẠNG BÀI BẮT BUỘC: Từ vựng · Mondai 5 — Cách dùng từ đúng trong câu (用法).
- questionText chỉ nêu từ mục tiêu: "次のことばの使い方として最もよいものを、1・2・3・4から一つ選びなさい。\\n\\n【 Từ_vựng（Cách_đọc）】"
- 4 phương án (options) BẮT BUỘC là 4 câu tiếng Nhật hoàn chỉnh đều có chứa từ đó (1 câu dùng đúng ngữ cảnh tự nhiên, 3 câu dùng sai kết hợp từ).
- category đặt là "vocabulary".`,
      grammar_m1_sentence: `
DẠNG BÀI BẮT BUỘC: Ngữ pháp · Mondai 1 — Chọn cấu trúc ngữ pháp trong câu đơn (文の文法 1).
- Tạo câu văn tiếng Nhật hoàn chỉnh có chỗ trống （　　　） kiểm tra cấu trúc ngữ pháp mục tiêu.
- 4 phương án (options) là 4 mẫu ngữ pháp bằng tiếng Nhật (TUYỆT ĐỐI KHÔNG chép nghĩa tiếng Việt vào options).
- category đặt là "grammar".`,
      grammar_m2_star: `
DẠNG BÀI BẮT BUỘC: Ngữ pháp · Mondai 2 (Dấu sao ★) — Sắp xếp câu (文の組み立て).
- BẮT BUỘC tạo câu tiếng Nhật có đúng 4 chỗ trống: "＿＿＿　＿＿＿　★　＿＿＿" (trong đó vị trí thứ 3 là ngôi sao ★).
- 4 phương án (options) BẮT BUỘC là 4 mảnh ghép câu bằng tiếng Nhật để lắp vào 4 chỗ trống đó (TUYỆT ĐỐI KHÔNG đưa tên ngữ pháp kèm giải thích tiếng Việt vào options!).
- correctAnswerIndex là vị trí của mảnh ghép nằm ở dấu ★ sau khi sắp xếp đúng.
- Trong phần explanation, ghi rõ thứ tự ghép đúng [Mảnh A] → [Mảnh B] → 【Mảnh C (★)】 → [Mảnh D] và câu hoàn chỉnh.
- category đặt là "grammar".`,
      grammar_m3_cloze: `
DẠNG BÀI BẮT BUỘC: Ngữ pháp · Mondai 3 — Ngữ pháp đục lỗ trong đoạn văn (文章の文法).
- Trường "passage" là một đoạn văn tiếng Nhật hoàn chỉnh (3–5 câu) có vị trí đục lỗ 【 1 】.
- 4 phương án (options) là 4 cấu trúc ngữ pháp / liên từ bằng tiếng Nhật.
- category đặt là "grammar".`,
      reading_m4_short: `
DẠNG BÀI BẮT BUỘC: Đọc hiểu · Mondai 4 — Đoản văn ngắn (~160–200 chữ: Email, Thông báo nội bộ).
- Trường "passage" là một email hoặc thông báo tiếng Nhật tự nhiên có lồng ghép từ vựng/ngữ pháp mục tiêu.
- questionText và 4 options viết bằng tiếng Nhật chuẩn đề thi JLPT N3.
- category đặt là "reading".`,
      reading_m5_medium: `
DẠNG BÀI BẮT BUỘC: Đọc hiểu · Mondai 5 — Trung văn (~320–350 chữ: Phân tích lý do & Ý tác giả).
- Trường "passage" là bài viết 2–3 đoạn bằng tiếng Nhật lồng ghép từ/ngữ pháp mục tiêu.
- questionText và 4 options viết bằng tiếng Nhật hỏi lý do hoặc ý chính của tác giả.
- category đặt là "reading".`,
      reading_m6_long: `
DẠNG BÀI BẮT BUỘC: Đọc hiểu · Mondai 6 — Trường văn (~450–550 chữ: Bài luận sâu).
- Trường "passage" là bài luận 3 đoạn bằng tiếng Nhật lồng ghép từ/ngữ pháp mục tiêu.
- questionText và 4 options viết bằng tiếng Nhật hỏi thông điệp trọng tâm toàn bài.
- category đặt là "reading".`,
      reading_m7_info_search: `
DẠNG BÀI BẮT BUỘC: Đọc hiểu · Mondai 7 — Tìm kiếm thông tin (情報検索).
- Trường "passage" là tờ rơi thông báo sự kiện / bảng giá / điều kiện đăng ký bằng tiếng Nhật có chứa từ/ngữ pháp mục tiêu.
- questionText đưa ra tình huống 1 nhân vật cụ thể và hỏi phương án phù hợp nhất trong 4 options bằng tiếng Nhật.
- category đặt là "reading".`,
      listening_m1_task: `
DẠNG BÀI BẮT BUỘC: Nghe hiểu · Mondai 1 — Nghe hiểu nhiệm vụ (課題理解).
- Trường "listeningScript" là hội thoại 4 lượt lời giữa 男： và 女： có sử dụng từ/ngữ pháp mục tiêu.
- questionText hỏi nhân vật sẽ làm gì đầu tiên tiếp theo (このあとまず何をしますか) với 4 options bằng tiếng Nhật.
- category đặt là "listening".`,
      listening_m2_point: `
DẠNG BÀI BẮT BUỘC: Nghe hiểu · Mondai 2 — Nghe hiểu điểm chính (ポイント理解).
- Trường "listeningScript" là hội thoại giữa 男： và 女： có sử dụng từ/ngữ pháp mục tiêu.
- questionText hỏi lý do / chi tiết chính với 4 options bằng tiếng Nhật.
- category đặt là "listening".`,
      listening_m3_summary: `
DẠNG BÀI BẮT BUỘC: Nghe hiểu · Mondai 3 — Nghe hiểu khái quát (概要理解).
- Trường "listeningScript" là đoạn nói chuyện có sử dụng từ/ngữ pháp mục tiêu.
- questionText hỏi chủ đề chính hoặc thông điệp người nói muốn truyền đạt với 4 options bằng tiếng Nhật.
- category đặt là "listening".`,
      listening_m4_expression: `
DẠNG BÀI BẮT BUỘC: Nghe hiểu · Mondai 4 — Biểu hiện giao tiếp tình huống (発話表現).
- Trường "listeningScript" nêu tình huống giao tiếp chứa từ/ngữ pháp mục tiêu.
- 4 options là 4 câu thoại tiếng Nhật tự nhiên để chọn câu nói phù hợp nhất.
- category đặt là "listening".`,
      listening_m5_quick_response: `
DẠNG BÀI BẮT BUỘC: Nghe hiểu · Mondai 5 — Phản xạ nhanh tức thì (即時応答).
- Trường "listeningScript" là 1 câu phát ngôn ngắn của 男： hoặc 女： có chứa từ/ngữ pháp mục tiêu.
- 4 options là 4 câu đáp trả ngắn bằng tiếng Nhật (1 câu đáp tự nhiên, 3 câu lệch ngữ cảnh).
- category đặt là "listening".`,
    };

    const formatInstruction =
      mondaiInstructionsMap[resolvedMondai] ||
      mondaiInstructionsMap.grammar_m2_star;

    const systemPrompt = `
Bạn là chuyên gia ra đề thi JLPT N3. Học viên đang ôn tập từ vựng (từ web OnTapTuVung) và ngữ pháp (từ web OnTapNguPhap).
Hãy tạo ${count} câu hỏi trắc nghiệm mới hoàn toàn, ĐÚNG CHUẨN ĐỊNH DẠNG ĐỀ THI THẬT JLPT N3 (tuyệt đối không tạo câu hỏi kiểu flashcard hỏi nghĩa tiếng Việt trực tiếp, mà phải đặt từ/ngữ pháp vào câu văn tiếng Nhật đúng chuẩn Mondai yêu cầu):

DANH SÁCH TỪ VỰNG CỦA HỌC VIÊN:
${vocabDetails || 'Không có'}

DANH SÁCH NGỮ PHÁP CỦA HỌC VIÊN:
${grammarDetails || 'Không có'}

${formatInstruction}

YÊU CẦU KỸ THUẬT:
- Mỗi câu có đúng 4 phương án (options) bằng tiếng Nhật chuẩn đề thi JLPT N3, correctAnswerIndex phân bổ ngẫu nhiên từ 0 đến 3.
- Trường "usedTargets" liệt kê lại những từ vựng/ngữ pháp trong danh sách trên đã được đưa vào câu hỏi đó.
- Giải thích (explanation) chi tiết bằng tiếng Việt: dịch câu/đoạn văn, giải thích đáp án đúng và các từ mục tiêu đã dùng.
`.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Hãy sinh ${count} câu hỏi chuẩn đề thi JLPT N3 cho dạng ${resolvedMondai} (${customTitle}) lồng ghép từ vựng và ngữ pháp đã cho.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              subCategory: { type: Type.STRING },
              title: { type: Type.STRING },
              passage: { type: Type.STRING },
              listeningScript: { type: Type.STRING },
              questionText: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              usedTargets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    readingOrStructure: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    level: { type: Type.INTEGER },
                    note: { type: Type.STRING },
                  },
                  required: ['type', 'id', 'title', 'readingOrStructure', 'meaning', 'level'],
                },
              },
            },
            required: [
              'id',
              'category',
              'subCategory',
              'title',
              'questionText',
              'options',
              'correctAnswerIndex',
              'explanation',
            ],
          },
        },
      },
    });

    const questions = JSON.parse(response.text || '[]');
    res.json({ success: true, questions });
  } catch (error: any) {
    console.error('Error generating targeted quiz:', error);
    const fallbackQs = generateClientTargetedQuestions(
      req.body?.quizFormat || 'vocab_synonyms_usage',
      req.body?.targetVocab || [],
      req.body?.targetGrammar || [],
      req.body?.customTitle || '',
      req.body?.mondaiId
    );
    res.json({ success: true, fallback: true, questions: fallbackQs });
  }
});

// 4. Explain Deep-Dive API (with rich question-specific fallback)
app.post('/api/explain', async (req, res) => {
  const {
    questionText = '',
    selectedAnswer = '',
    correctAnswer = '',
    category = '',
    question,
    selectedOptionIndex = 0,
  } = req.body || {};

  const fallbackQuestionObj = question || {
    category: 'grammar',
    subCategory: category,
    questionText,
    options: [selectedAnswer, correctAnswer].filter(Boolean),
    correctAnswerIndex: 1,
    explanation: '',
    usedTargets: [],
  };

  try {
    if (!ai) {
      return res.json({
        success: true,
        explanation: generateDeepDiveAnalysis(
          fallbackQuestionObj,
          typeof selectedOptionIndex === 'number' ? selectedOptionIndex : 0
        ),
      });
    }

    const allOptionsText = Array.isArray(question?.options)
      ? question.options
          .map((opt: string, idx: number) => `${idx + 1}. ${opt}`)
          .join('\n')
      : '';

    const targetsText = Array.isArray(question?.usedTargets)
      ? question.usedTargets
          .map(
            (t: any) =>
              `- ${t.title} (${t.readingOrStructure}): ${t.meaning} [Lv${t.level}]`
          )
          .join('\n')
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `
Hãy phân tích chuyên sâu câu trắc nghiệm JLPT N3 sau đây cho học viên:
- Dạng bài: ${category}
- Câu hỏi: ${questionText}
${question?.passage ? `- Đoạn văn: ${question.passage}\n` : ''}${
        question?.listeningScript ? `- Kịch bản nghe: ${question.listeningScript}\n` : ''
      }${allOptionsText ? `- 4 phương án:\n${allOptionsText}\n` : ''}- Học viên đã chọn: ${selectedAnswer}
- Đáp án chính xác là: ${correctAnswer}
${targetsText ? `- Kiến thức gốc từ kho học của học viên:\n${targetsText}\n` : ''}
Yêu cầu giảng giải rõ ràng, súc tích bằng tiếng Việt:
1. Phân tích lựa chọn của học viên so với đáp án đúng (chỉ rõ bẫy tư duy / khác biệt ngữ pháp hoặc từ vựng).
2. Giải thích ngắn gọn từng phương án 1, 2, 3, 4.
3. Bản chất cấu trúc ngữ pháp / từ vựng của đáp án đúng, kèm 2 câu ví dụ tương tự trong đề thi JLPT N3 và mẹo nhận diện nhanh trong 5 giây.
`,
    });

    res.json({
      success: true,
      explanation:
        response.text ||
        generateDeepDiveAnalysis(
          fallbackQuestionObj,
          typeof selectedOptionIndex === 'number' ? selectedOptionIndex : 0
        ),
    });
  } catch (error: any) {
    console.warn('Gemini /api/explain fallback to structured analyzer:', error?.message);
    res.json({
      success: true,
      explanation: generateDeepDiveAnalysis(
        fallbackQuestionObj,
        typeof selectedOptionIndex === 'number' ? selectedOptionIndex : 0
      ),
    });
  }
});

// 5. Cross-Device Workspace Sync Store (/api/sync/workspace)
const SYNC_STORE_FILE = path.resolve(__dirname, '.aistudio_sync_store.json');
const memorySyncStore = new Map<string, any>();

function readDiskSyncStore(): Record<string, any> {
  try {
    if (fs.existsSync(SYNC_STORE_FILE)) {
      return JSON.parse(fs.readFileSync(SYNC_STORE_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return {};
}

function writeDiskSyncStore(storeObj: Record<string, any>): void {
  try {
    fs.writeFileSync(SYNC_STORE_FILE, JSON.stringify(storeObj), 'utf-8');
  } catch {
    // ignore
  }
}

app.get('/api/sync/workspace', (req, res) => {
  const syncKey = String(req.query.syncKey || '')
    .trim()
    .toLowerCase();
  if (!syncKey) {
    return res.status(400).json({ success: false, error: 'Thiếu mã phòng đồng bộ (syncKey).' });
  }
  const diskData = readDiskSyncStore();
  const snapshot = memorySyncStore.get(syncKey) || diskData[syncKey] || null;
  return res.json({
    success: Boolean(snapshot),
    snapshot,
  });
});

app.post('/api/sync/workspace', (req, res) => {
  const syncKey = String(req.body?.syncKey || '')
    .trim()
    .toLowerCase();
  const snapshot = req.body?.snapshot;
  if (!syncKey || !snapshot) {
    return res.status(400).json({ success: false, error: 'Thiếu mã phòng đồng bộ hoặc dữ liệu.' });
  }
  memorySyncStore.set(syncKey, snapshot);
  const diskData = readDiskSyncStore();
  diskData[syncKey] = snapshot;
  writeDiskSyncStore(diskData);
  return res.json({
    success: true,
    updatedAt: snapshot.updatedAt || Date.now(),
  });
});

async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[JLPT N3 AI Tracker] Server running on http://localhost:${PORT}`);
  });
}

setupServer();
