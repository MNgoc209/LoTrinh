import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, Modality } from '@google/genai';

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
      model: 'gemini-2.5-flash-preview-tts',
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

    const wavBase64 = pcm16ToWavBase64(inlineData.data, 24000);
    return res.json({
      success: true,
      audioDataUrl: `data:audio/wav;base64,${wavBase64}`,
    });
  } catch (error: any) {
    console.warn('Gemini TTS fallback to browser multi-turn TTS:', error?.message);
    return res.json({ success: false, fallbackToBrowser: true });
  }
});

// Helper to build instant targeted questions from user's imported Vocab & Grammar if offline/fallback
function buildDynamicFallbackQuestions(
  quizFormat: string,
  targetVocab: any[],
  targetGrammar: any[]
) {
  const vList = targetVocab.length > 0 ? targetVocab : [];
  const gList = targetGrammar.length > 0 ? targetGrammar : [];
  const questions: any[] = [];

  if (quizFormat === 'vocab_synonyms_usage' && vList.length > 0) {
    vList.slice(0, 4).forEach((v: any, idx: number) => {
      const distractors = vList
        .filter((other: any) => other.word !== v.word)
        .slice(0, 3)
        .map((o: any) => `${o.word}（${o.reading}）: ${o.meaning}`);
      while (distractors.length < 3) {
        distractors.push(`参考（さんこう）: Tham khảo phương án ${distractors.length + 1}`);
      }
      questions.push({
        id: `dyn_vocab_${Date.now()}_${idx}`,
        category: 'vocabulary',
        subCategory: 'Mondai 3-4 · Từ đồng nghĩa & Cách dùng từ trong ngữ cảnh',
        title: `Vận dụng từ vựng từ OnTapTuVung: 【${v.word}】 (Lv${v.level})`,
        questionText: `Trong kỳ thi JLPT N3, từ 【${v.word}（${v.reading}）】 được dùng với ý nghĩa và ngữ cảnh nào sau đây là chính xác nhất?`,
        options: [
          `Đúng ngữ cảnh: "${v.meaning}" — sử dụng cho 【${v.word}】`,
          distractors[0],
          distractors[1],
          distractors[2],
        ],
        correctAnswerIndex: 0,
        explanation: `Từ 【${v.word}】 đọc là 「${v.reading}」, mang nghĩa: "${v.meaning}". Hiện từ này đang ở Level ${v.level} trong kho OnTapTuVung của bạn.`,
        usedTargets: [
          {
            type: 'vocab',
            id: String(v.id),
            title: v.word,
            readingOrStructure: v.reading,
            meaning: v.meaning,
            level: v.level,
          },
        ],
      });
    });
  }

  if (quizFormat === 'grammar_mondai_3_4' && gList.length > 0) {
    gList.slice(0, 4).forEach((g: any, idx: number) => {
      const distractors = gList
        .filter((other: any) => other.name !== g.name)
        .slice(0, 3)
        .map((o: any) => `${o.name} (${o.meaning})`);
      while (distractors.length < 3) {
        distractors.push(`〜に関して (Liên quan đến...)`);
      }
      questions.push({
        id: `dyn_gram_${Date.now()}_${idx}`,
        category: 'grammar',
        subCategory: 'Mondai 3 ★ & Mondai 4 · Ngữ pháp thực chiến',
        title: `Vận dụng cấu trúc từ OnTapNguPhap: 【${g.name}】 (Lv${g.level})`,
        passage: g.example
          ? `Câu mẫu trong sổ tay của bạn:\n「${g.example}」`
          : undefined,
        questionText: `Để diễn đạt ý nghĩa "${g.meaning}" theo đúng quy tắc kết nối 「${g.structure || g.name}」, cấu trúc nào sau đây là chính xác?`,
        options: [
          `${g.name} — Cấu trúc: ${g.structure || g.name}`,
          distractors[0],
          distractors[1],
          distractors[2],
        ],
        correctAnswerIndex: 0,
        explanation: `Mẫu ngữ pháp 【${g.name}】 (Cấu trúc: ${g.structure || g.name}) mang nghĩa "${g.meaning}". ${
          g.similarText ? `\nLưu ý phân biệt: ${g.similarText}` : ''
        }`,
        usedTargets: [
          {
            type: 'grammar',
            id: String(g.id),
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

  return questions;
}

// 3. Generate Targeted Quiz Questions from OnTapTuVung & OnTapNguPhap history
app.post('/api/quiz/generate-targeted', async (req, res) => {
  try {
    const {
      quizFormat = 'reading_integrated',
      targetVocab = [],
      targetGrammar = [],
      count = 4,
    } = req.body;

    if (!ai) {
      const fallbackQs = buildDynamicFallbackQuestions(quizFormat, targetVocab, targetGrammar);
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

    let formatInstruction = '';
    if (quizFormat === 'reading_integrated') {
      formatInstruction = `
DẠNG BÀI YÊU CẦU: Bài Đọc hiểu JLPT N3 (Đoản văn & Trung văn).
- Bắt buộc viết đoạn văn tiếng Nhật ("passage" dài 160-280 chữ) tự nhiên, chuẩn phong cách đề thi JLPT N3.
- Trong đoạn văn PHẢI LỒNG GHÉP trực tiếp các từ vựng và mẫu ngữ pháp trong danh sách mục tiêu của học viên (bọc các từ/ngữ pháp mục tiêu trong dấu ngoặc 【...】 để học viên dễ nhận diện).
- Câu hỏi ("questionText") hỏi về ý kiến tác giả, nguyên nhân, hoặc nội dung khớp với đoạn văn.
- category đặt là "reading".
`;
    } else if (quizFormat === 'grammar_mondai_3_4') {
      formatInstruction = `
DẠNG BÀI YÊU CẦU: Ngữ pháp thực chiến Mondai 3 (Sắp xếp câu dấu sao ★) và Mondai 4 (Đục lỗ ngữ pháp trong đoạn văn).
- Tạo câu hỏi sắp xếp 4 mảnh ghép vào chỗ trống ＿＿＿ ＿＿＿ ★ ＿＿＿ (Mondai 3) HOẶC đoạn văn ngắn đục lỗ (Mondai 4) kiểm tra trực tiếp các cấu trúc ngữ pháp và từ vựng trong danh sách của học viên.
- Giải thích rõ trật tự câu hoàn chỉnh và lưu ý bẫy ngữ pháp tương đương (nếu có).
- category đặt là "grammar".
`;
    } else if (quizFormat === 'vocab_synonyms_usage') {
      formatInstruction = `
DẠNG BÀI YÊU CẦU: Từ vựng nâng cao JLPT N3: Mondai 3 (Tìm từ đồng nghĩa/cận nghĩa) và Mondai 4 (Cách dùng từ đúng trong câu - 用法).
- Kiểm tra trực tiếp các từ vựng trong danh sách của học viên.
- Với câu Mondai 4 (Cách dùng từ): 4 phương án là 4 câu tiếng Nhật hoàn chỉnh có chứa từ đó (1 câu dùng đúng tự nhiên, 3 câu dùng sai ngữ cảnh).
- category đặt là "vocabulary".
`;
    } else if (quizFormat === 'listening_dialogue') {
      formatInstruction = `
DẠNG BÀI YÊU CẦU: Hội thoại Nghe hiểu JLPT N3 (Choukai Mondai 1 & 2).
- Bắt buộc tạo trường "listeningScript" là đoạn hội thoại giữa 男： và 女： (4-6 lượt lời ngắn gọn, rõ ràng, mỗi lượt lời trên 1 dòng bắt đầu bằng "男：" hoặc "女：") sử dụng tự nhiên các từ vựng và cấu trúc ngữ pháp trong danh sách của học viên.
- Câu hỏi ("questionText") hỏi hành động tiếp theo của nhân vật hoặc điểm chính của cuộc hội thoại.
- category đặt là "listening".
`;
    }

    const systemPrompt = `
Bạn là chuyên gia ra đề thi JLPT N3. Học viên đang ôn tập từ vựng (từ web OnTapTuVung) và ngữ pháp (từ web OnTapNguPhap).
Hãy tạo ${count} câu hỏi trắc nghiệm mới hoàn toàn, chất lượng cao, lồng ghép trực tiếp các mục kiến thức dưới đây:

DANH SÁCH TỪ VỰNG CỦA HỌC VIÊN:
${vocabDetails || 'Không có'}

DANH SÁCH NGỮ PHÁP CỦA HỌC VIÊN:
${grammarDetails || 'Không có'}

${formatInstruction}

YÊU CẦU KỸ THUẬT:
- Mỗi câu có đúng 4 phương án (options), correctAnswerIndex từ 0 đến 3.
- Trường "usedTargets" liệt kê lại những từ vựng/ngữ pháp trong danh sách trên đã được đưa vào câu hỏi đó.
- Giải thích (explanation) chi tiết bằng tiếng Việt: dịch câu/đoạn văn, giải thích đáp án đúng và các từ mục tiêu đã dùng.
`.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Hãy sinh ${count} câu hỏi dạng ${quizFormat} lồng ghép từ vựng và ngữ pháp đã cho.`,
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
    const fallbackQs = buildDynamicFallbackQuestions(
      req.body?.quizFormat || 'vocab_synonyms_usage',
      req.body?.targetVocab || [],
      req.body?.targetGrammar || []
    );
    res.json({ success: true, fallback: true, questions: fallbackQs });
  }
});

// 4. Explain Deep-Dive API
app.post('/api/explain', async (req, res) => {
  try {
    const { questionText, selectedAnswer, correctAnswer, category } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        explanation:
          'Mẹo phân tích sâu: Hãy chú ý đối chiếu cấu trúc kết nối (trợ từ, thể động từ) trước và sau chỗ trống, đồng thời kiểm tra sắc thái câu (phàn nàn, cảm kích, hay giả định).',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `
Hãy phân tích chi tiết câu trắc nghiệm JLPT N3 sau đây cho học viên:
Câu hỏi: ${questionText}
Học viên đã chọn nhầm: ${selectedAnswer}
Đáp án chính xác là: ${correctAnswer}
Phân loại: ${category}

Yêu cầu giảng giải bằng tiếng Việt:
1. Vì sao học viên hay nhầm lẫn với đáp án đã chọn (bẫy tư duy / sắc thái khác biệt).
2. Bản chất cấu trúc ngữ pháp / từ vựng của đáp án đúng, cho thêm 2 ví dụ câu tương tự trong đề thi JLPT N3 thực tế.
3. Mẹo nhớ nhanh để không bao giờ tái phạm lỗi này.
`,
    });

    res.json({ success: true, explanation: response.text });
  } catch (error: any) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
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
