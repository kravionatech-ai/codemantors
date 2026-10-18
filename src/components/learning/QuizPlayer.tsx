"use client";

import React, { useState, useEffect } from "react";
import {
  Timer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";

interface QuizOption {
  index: number;
  text: string;
}

interface QuizQuestion {
  _id?: string;
  questionText: string;
  codeSnippet?: string;
  type: string;
  points: number;
  options: QuizOption[];
}

interface QuizData {
  _id: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingPercentage: number;
  maxAttempts: number;
  questions: QuizQuestion[];
}

interface QuizPlayerProps {
  quiz: QuizData;
  onQuizComplete?: () => void;
  onNextLesson?: () => void;
}

export default function QuizPlayer({ quiz, onQuizComplete, onNextLesson }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  // Timer countdown
  useEffect(() => {
    if (quiz.timeLimitMinutes <= 0 || results) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz.timeLimitMinutes, results]);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isMultipleChoice = currentQuestion?.type === "multiple_choice";

  const handleSelectOption = (optionIndex: number) => {
    if (results) return; // Locked once submitted

    setSelectedAnswers((prev) => {
      const currentSelected = prev[currentQuestionIndex] || [];
      if (isMultipleChoice) {
        if (currentSelected.includes(optionIndex)) {
          return { ...prev, [currentQuestionIndex]: currentSelected.filter((i) => i !== optionIndex) };
        } else {
          return { ...prev, [currentQuestionIndex]: [...currentSelected, optionIndex] };
        }
      } else {
        return { ...prev, [currentQuestionIndex]: [optionIndex] };
      }
    });
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.keys(selectedAnswers).map((qIdx) => ({
        questionIndex: parseInt(qIdx),
        selectedOptionIndices: selectedAnswers[parseInt(qIdx)],
      }));

      const res = await fetch(`/api/quizzes/${quiz._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: formattedAnswers,
          timeSpentSeconds: quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 - timeLeft : 60,
        }),
      });

      const data = await res.json();
      if (data.success && data.results) {
        setResults(data.results);
        if (data.results.passed) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          if (onQuizComplete) onQuizComplete();
        }
      }
    } catch (err) {
      console.error("Quiz submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResults(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 : 0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // If results submitted, show detailed evaluation report
  if (results) {
    return (
      <div className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 shadow-2xl">
        {/* Results Banner */}
        <div
          className={`p-6 rounded-2xl border text-center ${
            results.passed
              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
              : "bg-rose-950/20 border-rose-500/30 text-rose-400"
          }`}
        >
          {results.passed ? (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Quiz Passed! Congratulations!</h2>
              <p className="text-xs text-slate-300 mt-1">
                You scored {results.scorePercentage}% (Passing score: {results.passingPercentage}%)
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center mb-3">
                <XCircle className="w-8 h-8 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Quiz Not Passed</h2>
              <p className="text-xs text-slate-300 mt-1">
                You scored {results.scorePercentage}%. You need at least {results.passingPercentage}% to pass this assessment.
              </p>
            </div>
          )}
        </div>

        {/* Detailed Review Breakdown */}
        <div className="mt-8 space-y-6">
          <h3 className="text-base font-bold text-white">Question Review & Explanations</h3>
          {results.questionReview.map((qr: any, idx: number) => (
            <div
              key={idx}
              className={`p-5 rounded-xl border ${
                qr.isCorrect ? "bg-slate-950/60 border-emerald-500/30" : "bg-slate-950/60 border-rose-500/30"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-400">Question {idx + 1}</span>
                <span className={qr.isCorrect ? "text-emerald-400" : "text-rose-400"}>
                  {qr.isCorrect ? `+${qr.pointsAwarded} Point` : "0 Points"}
                </span>
              </div>

              <p className="font-semibold text-slate-100 text-sm mb-3">{qr.questionText}</p>

              {qr.codeSnippet && (
                <pre className="my-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto">
                  <code>{qr.codeSnippet}</code>
                </pre>
              )}

              <div className="space-y-2 mt-3">
                {qr.options.map((opt: any, optIdx: number) => {
                  let optStyle = "border-slate-800 bg-slate-900/40 text-slate-300";
                  if (opt.isCorrect) {
                    optStyle = "border-emerald-500/50 bg-emerald-950/20 text-emerald-300 font-medium";
                  } else if (opt.isSelected && !opt.isCorrect) {
                    optStyle = "border-rose-500/50 bg-rose-950/20 text-rose-300";
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`flex items-center justify-between p-3 rounded-lg border text-xs ${optStyle}`}
                    >
                      <span>{opt.text}</span>
                      {opt.isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {opt.isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {qr.explanation && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  <span className="font-semibold text-blue-400 block mb-0.5">Explanation:</span>
                  {qr.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retake Quiz
          </button>

          {onNextLesson && (
            <button
              onClick={onNextLesson}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
            >
              Continue to Next Lesson
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 shadow-2xl">
      {/* Quiz Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-blue-400">
            Interactive Assessment
          </span>
          <h2 className="text-xl font-bold text-white mt-1">{quiz.title}</h2>
        </div>

        {quiz.timeLimitMinutes > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-semibold text-amber-400">
            <Timer className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Question Counter Tabs */}
      <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
        {quiz.questions.map((_, idx) => {
          const isAnswered = selectedAnswers[idx] && selectedAnswers[idx].length > 0;
          const isCurrent = currentQuestionIndex === idx;

          return (
            <button
              key={idx}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                isCurrent
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : isAnswered
                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question Box */}
      <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] uppercase font-semibold text-slate-300">
            {currentQuestion?.type?.replace("_", " ")}
          </span>
        </div>

        <p className="text-base font-semibold text-slate-100 leading-snug">
          {currentQuestion?.questionText}
        </p>

        {currentQuestion?.codeSnippet && (
          <pre className="my-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-blue-200 overflow-x-auto">
            <code>{currentQuestion.codeSnippet}</code>
          </pre>
        )}

        {/* Options */}
        <div className="mt-5 space-y-2.5">
          {currentQuestion?.options.map((option) => {
            const isSelected = (selectedAnswers[currentQuestionIndex] || []).includes(option.index);

            return (
              <button
                key={option.index}
                onClick={() => handleSelectOption(option.index)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10"
                    : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                <span>{option.text}</span>
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-slate-700 bg-slate-800"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Navigation Bottom Bar */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-40 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Previous
        </button>

        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            Next
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Scoring answers...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit Assessment
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
