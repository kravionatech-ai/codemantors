"use client";

import React, { useState } from "react";
import { Play, RotateCcw, CheckCircle2, XCircle, Lightbulb, Check } from "lucide-react";
import confetti from "canvas-confetti";

interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

interface CodingExerciseProps {
  exercise: {
    language: string;
    instructions: string;
    starterCode: string;
    solutionCode?: string;
    hints: string[];
    testCases: TestCase[];
  };
  onComplete?: () => void;
  isCompleted?: boolean;
}

interface TestResult {
  description: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
}

export default function CodingExercisePlayer({
  exercise,
  onComplete,
  isCompleted = false,
}: CodingExerciseProps) {
  const [code, setCode] = useState(exercise.starterCode || "");
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [allPassed, setAllPassed] = useState(isCompleted);

  const handleRunTests = () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      const results: TestResult[] = [];
      let passedCount = 0;

      exercise.testCases.forEach((tc, idx) => {
        try {
          // Client-side sandboxed evaluation of pure deterministic function
          const runner = new Function(`
            ${code}
            try {
              return ${tc.input};
            } catch(e) {
              return "Error: " + e.message;
            }
          `);

          const output = runner();
          const actualStr = typeof output === "object" ? JSON.stringify(output) : String(output);
          const expectedStr = tc.expectedOutput.trim();

          const passed = actualStr === expectedStr;
          if (passed) passedCount++;

          results.push({
            description: tc.description || `Test Case ${idx + 1}`,
            input: tc.input,
            expected: expectedStr,
            actual: actualStr,
            passed,
          });
        } catch (err: any) {
          results.push({
            description: tc.description || `Test Case ${idx + 1}`,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: "Runtime Error",
            passed: false,
            error: err.message,
          });
        }
      });

      setTestResults(results);

      if (passedCount === exercise.testCases.length) {
        setAllPassed(true);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        if (onComplete) onComplete();
      } else {
        setAllPassed(false);
      }
    } catch (globalErr: any) {
      setTestResults([
        {
          description: "Compilation / Syntax",
          input: "N/A",
          expected: "Valid Syntax",
          actual: globalErr.message,
          passed: false,
          error: globalErr.message,
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(exercise.starterCode);
    setTestResults(null);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-950 border-b border-slate-800">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
            Interactive Code Practice Sandbox
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">Coding Challenge</h3>
        </div>

        <div className="flex items-center gap-2">
          {exercise.hints?.length > 0 && (
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-amber-400 text-xs font-semibold transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showHints ? "Hide Hints" : "Need Hints?"}
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Reset to starter template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Hints Dropdown */}
      {showHints && exercise.hints?.length > 0 && (
        <div className="p-4 bg-amber-950/20 border-b border-amber-500/30 text-xs text-amber-200 space-y-1.5">
          <span className="font-semibold block text-amber-400">Hints:</span>
          {exercise.hints.map((hint, i) => (
            <p key={i}>• {hint}</p>
          ))}
        </div>
      )}

      {/* Split Grid: Instructions & Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        {/* Left Column: Instructions */}
        <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/40 text-xs space-y-4">
          <div>
            <h4 className="font-bold text-white text-sm mb-2">Instructions</h4>
            <div className="text-slate-300 leading-relaxed whitespace-pre-line">
              {exercise.instructions}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <h5 className="font-semibold text-slate-200 mb-2">Sample Test Cases</h5>
            <div className="space-y-2">
              {exercise.testCases.slice(0, 2).map((tc, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[11px]">
                  <div className="text-slate-400">Input: <span className="text-blue-300">{tc.input}</span></div>
                  <div className="text-slate-400 mt-1">Expected: <span className="text-emerald-300">{tc.expectedOutput}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor & Execution */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950">
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-2">
              <span>solution.js</span>
              <span className="text-[10px] uppercase font-semibold text-blue-400">JavaScript</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-72 sm:h-80 p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs sm:text-sm text-blue-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Test Action Bar */}
          <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              {allPassed ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  All Test Cases Passed!
                </span>
              ) : (
                <span className="text-slate-400">Run code to verify your solution</span>
              )}
            </div>

            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? "Running..." : "Run Tests"}
            </button>
          </div>
        </div>
      </div>

      {/* Test Results Output Area */}
      {testResults && (
        <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Test Execution Results
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {testResults.map((tr, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  tr.passed
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                }`}
              >
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {tr.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{tr.description}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Input: {tr.input} | Expected: {tr.expected} | Actual: {tr.actual}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    tr.passed
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {tr.passed ? "Passed" : "Failed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
