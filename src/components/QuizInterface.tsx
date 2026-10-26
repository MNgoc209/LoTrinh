import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Volume2,
  Square,
  Eye,
  EyeOff,
  Loader2,
  Trophy,
  Play,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, BugRecord, DialogueTurn } from '../types';
import { parseListeningDialogueTurns } from '../utils/studyLogic';

interface QuizInterfaceProps {
  quizTitle: string;
  questions: QuizQuestion[];
  onFinishQuiz: (results: {
    total: number;
    correctCount: number;
    newBugsCount: number;
    categoryBreakdown: Record<string, { attempted: number; correct: number }>;
    improvedTargets: string[];
    failedTargets: string[];
  }) => void;
  onExit: () => void;
  onLogBug: (
    bugData: Omit<
      BugRecord,
      'id' | 'timestamp' | 'nextReviewDate' | 'reviewIntervalDays' | 'reviewCount' | 'resolved'
    >
  ) => void;
  onUpdateBugReview?: (bugId: string, isCorrect: boolean) => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({
  quizTitle,
  questions,
  onFinishQuiz,
  onExit,
  onLogBug,
  onUpdateBugReview,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [newBugsLogged, setNewBugsLogged] = useState(0);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAiExplain, setLoadingAiExplain] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Track per-category accuracy and target mastery for the 19:00 Daily Progress Report
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    Record<string, { attempted: number; correct: number }>
  >({});
  const [improvedTargets, setImprovedTargets] = useState<string[]>([]);
  const [failedTargets, setFailedTargets] = useState<string[]>([]);

  // Upgraded Choukai Listening Studio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number | null>(null);
  const [speechRate, setSpeechRate] = useState<0.7 | 0.85 | 1.0>(0.85);
  const [showListeningScript, setShowListeningScript] = useState(true);
  const [loadingNeuralAudio, setLoadingNeuralAudio] = useState(false);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const cancelSequenceRef = useRef<boolean>(false);

  const currentQ = questions[currentIndex];
  const dialogueTurns: DialogueTurn[] = currentQ?.listeningScript
    ? parseListeningDialogueTurns(currentQ.listeningScript)
    : [];

  const stopAllAudio = () => {
    cancelSequenceRef.current = true;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setActiveTurnIndex(null);
    setLoadingNeuralAudio(false);
  };

  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setAiExplanation(null);
    stopAllAudio();
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  // Speaks a single turn cleanly without reading "男：" or "女：" out loud
  const speakSingleTurn = (turn: DialogueTurn, index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    stopAllAudio();
    cancelSequenceRef.current = false;

    const utterance = new SpeechSynthesisUtterance(turn.spokenText);
    utterance.lang = 'ja-JP';
    utterance.rate = speechRate;
    utterance.pitch = turn.role === 'male' ? 0.84 : turn.role === 'female' ? 1.18 : 1.0;

    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.includes('ja'));
    if (voices.length > 1) {
      utterance.voice = turn.role === 'male' ? voices[0] : voices[voices.length - 1];
    } else if (voices.length === 1) {
      utterance.voice = voices[0];
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveTurnIndex(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveTurnIndex(null);
    };

    setIsSpeaking(true);
    setActiveTurnIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  // Speaks all dialogue turns sequentially with natural pauses and speaker pitch differentiation
  const speakAllTurnsSequentially = (turns: DialogueTurn[]) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || turns.length === 0) {
      return;
    }

    stopAllAudio();
    cancelSequenceRef.current = false;
    setIsSpeaking(true);

    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.includes('ja'));

    const playTurnAt = (idx: number) => {
      if (cancelSequenceRef.current || idx >= turns.length) {
        setIsSpeaking(false);
        setActiveTurnIndex(null);
        return;
      }

      const turn = turns[idx];
      setActiveTurnIndex(idx);

      const utterance = new SpeechSynthesisUtterance(turn.spokenText);
      utterance.lang = 'ja-JP';
      utterance.rate = speechRate;
      utterance.pitch = turn.role === 'male' ? 0.84 : turn.role === 'female' ? 1.18 : 1.0;

      if (voices.length > 1) {
        utterance.voice = turn.role === 'male' ? voices[0] : voices[voices.length - 1];
      } else if (voices.length === 1) {
        utterance.voice = voices[0];
      }

      utterance.onend = () => {
        if (cancelSequenceRef.current) return;
        // Natural 550ms pause between speakers so the learner can process each sentence
        setTimeout(() => {
          if (!cancelSequenceRef.current) {
            playTurnAt(idx + 1);
          }
        }, 550);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setActiveTurnIndex(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    playTurnAt(0);
  };

  const handleToggleFullDialogue = async () => {
    if (isSpeaking || loadingNeuralAudio) {
      stopAllAudio();
      return;
    }

    if (dialogueTurns.length === 0 && currentQ?.listeningScript) {
      speakSingleTurn(
        {
          speaker: 'Hội thoại',
          role: 'narrator',
          spokenText: currentQ.listeningScript,
          rawLine: currentQ.listeningScript,
        },
        0
      );
      return;
    }

    // Play turn-by-turn immediately with visual line highlighting & speaker pitch differentiation
    speakAllTurnsSequentially(dialogueTurns);
  };

  const handlePlayNeuralMultiSpeaker = async () => {
    if (!currentQ?.listeningScript) return;
    if (isSpeaking || loadingNeuralAudio) {
      stopAllAudio();
      return;
    }

    setLoadingNeuralAudio(true);
    try {
      const res = await fetch('/api/tts/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: currentQ.listeningScript,
          speed: speechRate,
        }),
      });
      const data = await res.json();
      if (data.success && data.audioDataUrl) {
        const audio = new Audio(data.audioDataUrl);
        audio.playbackRate = speechRate;
        audioPlayerRef.current = audio;
        setIsSpeaking(true);
        setLoadingNeuralAudio(false);
        audio.onended = () => {
          setIsSpeaking(false);
          setActiveTurnIndex(null);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setLoadingNeuralAudio(false);
          speakAllTurnsSequentially(dialogueTurns);
        };
        await audio.play();
        return;
      }
    } catch {
      // Fallback to multi-turn browser speech synthesis
    }
    setLoadingNeuralAudio(false);
    speakAllTurnsSequentially(dialogueTurns);
  };

  if (!currentQ || isFinished) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-pink-200/80 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-pink-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stone-900">Hoàn thành bài luyện tập!</h2>
          <p className="text-sm text-stone-600">{quizTitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-pink-100 tabular-nums">
          <div className="space-y-1">
            <div className="text-xs text-stone-500">Số câu trả lời đúng</div>
            <div className="text-2xl font-extrabold text-emerald-700">
              {correctCount} / {questions.length}
            </div>
          </div>
          <div className="space-y-1 border-l border-pink-100">
            <div className="text-xs text-stone-500">Ghi vào Bug Tracker</div>
            <div className="text-2xl font-extrabold text-rose-600">{newBugsLogged} câu</div>
          </div>
        </div>

        <p className="text-xs text-stone-500">
          Kết quả bài làm này đã được ghi nhận vào <strong>Nhật ký học tập hôm nay</strong> để tổng hợp trong <strong>Báo cáo 19:00</strong>.
        </p>

        <button
          type="button"
          onClick={() =>
            onFinishQuiz({
              total: questions.length,
              correctCount,
              newBugsCount: newBugsLogged,
              categoryBreakdown,
              improvedTargets,
              failedTargets,
            })
          }
          className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
        >
          Lưu kết quả & Quay về Lịch học hôm nay
        </button>
      </div>
    );
  }

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    setShowListeningScript(true);

    const isCorrect = idx === currentQ.correctAnswerIndex;
    const catKey = currentQ.category || 'grammar';

    setCategoryBreakdown((prev) => {
      const prevCat = prev[catKey] || { attempted: 0, correct: 0 };
      return {
        ...prev,
        [catKey]: {
          attempted: prevCat.attempted + 1,
          correct: prevCat.correct + (isCorrect ? 1 : 0),
        },
      };
    });

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      if (currentQ.usedTargets && currentQ.usedTargets.length > 0) {
        const gained = currentQ.usedTargets.map(
          (t) => `${t.title} (Lv${t.level}→Lv${Math.min(8, t.level + 1)})`
        );
        setImprovedTargets((prev) => Array.from(new Set([...prev, ...gained])));
      }
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#B998A0', '#87606A', '#D1BBC0', '#9E7882'],
      });
      if (currentQ.sourceBugId && onUpdateBugReview) {
        onUpdateBugReview(currentQ.sourceBugId, true);
      }
    } else {
      setNewBugsLogged((prev) => prev + 1);
      if (currentQ.usedTargets && currentQ.usedTargets.length > 0) {
        const missed = currentQ.usedTargets.map((t) => `${t.title} (Lv${t.level})`);
        setFailedTargets((prev) => Array.from(new Set([...prev, ...missed])));
      }
      onLogBug({
        questionText: currentQ.questionText,
        category: currentQ.category,
        subCategory: currentQ.subCategory,
        passage: currentQ.passage,
        listeningScript: currentQ.listeningScript,
        options: currentQ.options,
        userAnswerIndex: idx,
        correctAnswerIndex: currentQ.correctAnswerIndex,
        explanation: currentQ.explanation,
        usedTargets: currentQ.usedTargets,
      });

      if (currentQ.sourceBugId && onUpdateBugReview) {
        onUpdateBugReview(currentQ.sourceBugId, false);
      }
    }
  };

  const handleDeepExplainWithAI = async () => {
    if (!currentQ || selectedOption === null) return;
    setLoadingAiExplain(true);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQ.questionText,
          selectedAnswer: currentQ.options[selectedOption],
          correctAnswer: currentQ.options[currentQ.correctAnswerIndex],
          category: `${currentQ.category} - ${currentQ.subCategory}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.explanation) {
        setAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error('Error fetching AI explanation', err);
    } finally {
      setLoadingAiExplain(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Quiz Header */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-pink-200/80 tabular-nums">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-pink-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát ra</span>
        </button>

        <div className="text-center">
          <div className="text-xs font-bold text-stone-800">{quizTitle}</div>
          <div className="text-xs text-stone-500">
            Câu {currentIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="text-xs font-bold text-pink-700">Đúng: {correctCount}</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-pink-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-pink-600 h-full transition-transform duration-300 origin-left"
          style={{ transform: `scaleX(${(currentIndex + 1) / questions.length})` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-pink-200/80 space-y-6">
        {/* Unboxed Metadata Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-3 text-xs text-stone-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-pink-700">
              {currentQ.subCategory || currentQ.category}
            </span>
            {currentQ.sourceBugId && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-semibold">
                  Spaced Repetition (Câu từ Bug Tracker)
                </span>
              </>
            )}
          </div>
          {currentQ.usedTargets && currentQ.usedTargets.length > 0 && (
            <span className="text-stone-500 font-['Noto_Sans_JP','Plus_Jakarta_Sans',sans-serif]">
              Tích hợp:{' '}
              {currentQ.usedTargets.map((t) => `${t.title} (Lv${t.level})`).join(' · ')}
            </span>
          )}
        </div>

        {/* Reading Passage (if present) */}
        {currentQ.passage && (
          <div className="bg-[#FAF7F7] p-5 rounded-2xl border border-pink-200/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-800">
              <BookOpen className="w-4 h-4 text-pink-600" />
              <span>Đoạn văn Đọc hiểu JLPT N3 (Lồng ghép từ & ngữ pháp đang ôn):</span>
            </div>
            <p className="text-sm md:text-base leading-relaxed text-stone-900 whitespace-pre-line font-['Noto_Sans_JP',sans-serif]">
              {currentQ.passage}
            </p>
          </div>
        )}

        {/* UPGRADED Choukai Listening Studio (Multi-Speaker, Speed Controls, Turn-by-Turn Replay) */}
        {currentQ.listeningScript && (
          <div className="bg-[#FAF7F7] p-5 rounded-2xl border border-pink-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-200/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-bold text-pink-800">
                  <Volume2 className="w-4 h-4 text-pink-600" />
                  <span>Phòng Nghe Choukai Phân Vai (Đã lọc nhãn 男/女 & ngắt nghỉ tự nhiên)</span>
                </div>
                <p className="text-xs text-stone-500">
                  Bấm nghe toàn bài hoặc bấm vào từng câu thoại bên dưới để nghe chậm từng câu rõ ràng.
                </p>
              </div>

              {/* Speed Selector: 0.7x | 0.85x | 1.0x */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-pink-200 shrink-0 tabular-nums">
                {(
                  [
                    { rate: 0.7, label: '0.7x Chậm' },
                    { rate: 0.85, label: '0.85x Vừa' },
                    { rate: 1.0, label: '1.0x Thi' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.rate}
                    type="button"
                    onClick={() => setSpeechRate(item.rate)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      speechRate === item.rate
                        ? 'bg-pink-600 text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar: Play Turn-by-Turn, Gemini Neural Voice, Show/Hide Script */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleFullDialogue}
                  className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {isSpeaking ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Dừng phát</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe hội thoại phân vai ({speechRate}x)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePlayNeuralMultiSpeaker}
                  disabled={loadingNeuralAudio}
                  className="px-3 py-2 bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {loadingNeuralAudio ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tạo giọng AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                      <span>Giọng AI Đa nhân vật (Nam/Nữ)</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowListeningScript((prev) => !prev)}
                className="px-3 py-2 bg-white border border-pink-200 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
              >
                {showListeningScript ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ẩn lời thoại để luyện phản xạ</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Hiện lời thoại & Nghe từng câu</span>
                  </>
                )}
              </button>
            </div>

            {/* Keyword Hints Bar (Always visible so listening is never overwhelming) */}
            {currentQ.usedTargets && currentQ.usedTargets.length > 0 && (
              <div className="bg-white/90 px-3.5 py-2.5 rounded-xl border border-pink-100 text-xs text-stone-600 font-['Noto_Sans_JP','Plus_Jakarta_Sans',sans-serif]">
                <span className="font-bold text-pink-800">Từ khóa xuất hiện trong băng: </span>
                {currentQ.usedTargets
                  .map((t) => `${t.title} (${t.readingOrStructure}: ${t.meaning})`)
                  .join(' · ')}
              </div>
            )}

            {/* Interactive Turn-by-Turn Dialogue List */}
            {showListeningScript ? (
              <div className="space-y-2 pt-1">
                {dialogueTurns.map((turn, idx) => {
                  const isCurrentTurn = activeTurnIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                        isCurrentTurn
                          ? 'bg-pink-100/80 border-pink-400'
                          : 'bg-white border-pink-100 hover:border-pink-200'
                      }`}
                    >
                      <div className="space-y-0.5 flex-1 font-['Noto_Sans_JP',sans-serif]">
                        <div className="text-xs font-bold text-pink-700">
                          {turn.speaker}
                          {turn.role === 'male'
                            ? ' (Giọng Nam)'
                            : turn.role === 'female'
                            ? ' (Giọng Nữ)'
                            : ''}
                        </div>
                        <p className="text-sm md:text-base text-stone-900 leading-relaxed">
                          {turn.spokenText}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => speakSingleTurn(turn, idx)}
                        className="px-2.5 py-1.5 bg-[#FAF7F7] hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Nghe câu {idx + 1}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 px-4 bg-white/70 rounded-xl text-center space-y-2 border border-pink-100">
                <div className="text-xs font-medium text-stone-600">
                  Lời thoại đang ẩn. Bạn vẫn có thể bấm nút bên dưới để nghe lẻ từng câu:
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {dialogueTurns.map((turn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => speakSingleTurn(turn, idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        activeTurnIndex === idx
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-white text-pink-700 border-pink-200 hover:bg-pink-50'
                      }`}
                    >
                      Nghe lượt {idx + 1} ({turn.speaker})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question Prompt */}
        <div className="space-y-1">
          <div className="text-xs text-stone-500 font-medium">{currentQ.title}</div>
          <h3 className="text-lg md:text-xl font-bold text-stone-900 leading-relaxed font-['Noto_Sans_JP',sans-serif]">
            {currentQ.questionText}
          </h3>
        </div>

        {/* 4 Options */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          {currentQ.options.map((opt, idx) => {
            let optionStyle =
              'border-stone-200 hover:border-pink-400 hover:bg-pink-50/30 text-stone-800 bg-white';
            let indicator = null;

            if (isAnswered) {
              if (idx === currentQ.correctAnswerIndex) {
                optionStyle = 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-semibold';
                indicator = (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đúng</span>
                  </span>
                );
              } else if (idx === selectedOption) {
                optionStyle = 'border-rose-500 bg-rose-50 text-rose-950';
                indicator = (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 shrink-0">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Đã chọn sai</span>
                  </span>
                );
              } else {
                optionStyle = 'border-stone-200 text-stone-400 opacity-60 bg-white';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`p-4 rounded-2xl border text-left text-sm md:text-base transition-colors flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center text-xs font-bold tabular-nums shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-['Noto_Sans_JP',sans-serif]">{opt}</span>
                </div>
                {indicator}
              </button>
            );
          })}
        </div>

        {/* Feedback & Referenced Knowledge Drawer */}
        {isAnswered && (
          <div className="pt-5 border-t border-pink-100 space-y-4 animate-fadeIn">
            {selectedOption !== currentQ.correctAnswerIndex ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Đã tự động lưu câu này vào <strong>Bug Tracker</strong> và cập nhật vào <strong>Báo cáo 19:00</strong> để lên lịch làm lại.
                </span>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chính xác! Tiến bộ của bạn đã được cộng vào Báo cáo 19:00 hôm nay.</span>
              </div>
            )}

            {/* Explanation */}
            <div className="bg-[#FAF7F7] p-4 rounded-2xl border border-pink-200/70 space-y-2">
              <div className="text-xs font-bold text-pink-800 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Giải thích chi tiết:</span>
              </div>
              <p className="text-xs md:text-sm text-stone-800 leading-relaxed whitespace-pre-line font-['Noto_Sans_JP','Plus_Jakarta_Sans',sans-serif]">
                {currentQ.explanation}
              </p>
            </div>

            {/* Matched Vocabulary & Grammar Cards from User's History */}
            {currentQ.usedTargets && currentQ.usedTargets.length > 0 && (
              <div className="p-4 rounded-2xl border border-pink-200/70 bg-white space-y-3">
                <div className="text-xs font-bold text-stone-800">
                  Kiến thức gốc trích từ OnTapTuVung & OnTapNguPhap của bạn:
                </div>
                <div className="divide-y divide-pink-100 text-xs">
                  {currentQ.usedTargets.map((target, idx) => (
                    <div key={`${target.id}_${idx}`} className="py-2 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <span className="font-bold text-stone-900 font-['Noto_Sans_JP',sans-serif] text-sm">
                            {target.title}
                          </span>{' '}
                          <span className="text-pink-700 font-medium font-['Noto_Sans_JP',sans-serif]">
                            [{target.readingOrStructure}]
                          </span>{' '}
                          <span className="text-stone-700">— {target.meaning}</span>
                        </div>
                        <span className="text-stone-500 tabular-nums">
                          {target.type === 'grammar' ? 'OnTapNguPhap' : 'OnTapTuVung'} · Lv{target.level}
                        </span>
                      </div>
                      {target.note && (
                        <div className="text-stone-500">Ghi chú: {target.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deep Explain with Gemini AI */}
            {!aiExplanation ? (
              <button
                type="button"
                onClick={handleDeepExplainWithAI}
                disabled={loadingAiExplain}
                className="w-full py-2.5 px-4 bg-white hover:bg-pink-50 border border-pink-200 text-pink-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {loadingAiExplain ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini AI đang phân tích sâu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                    <span>Hỏi Gemini phân tích sâu bẫy đề & ví dụ tương tự</span>
                  </>
                )}
              </button>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-pink-200 text-xs md:text-sm text-stone-800 leading-relaxed whitespace-pre-line space-y-1.5">
                <div className="text-xs font-bold text-pink-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Phân tích chuyên sâu từ Gemini AI:</span>
                </div>
                <div>{aiExplanation}</div>
              </div>
            )}

            {/* Next Question CTA */}
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>
                {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả bài làm'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
