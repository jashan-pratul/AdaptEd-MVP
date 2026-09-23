'use client';

import { useState, type ReactNode } from 'react';
import {
  Brain,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Target,
  BookOpen,
  Activity,
  ShieldCheck,
  Send,
  Trophy,
  AlertTriangle,
} from 'lucide-react';

import type { Analysis, LearnerAttempt } from '../lib/schema';

type Attempt = LearnerAttempt & {
  analysis?: Analysis;
};

const demo = {
  concept: 'Photosynthesis',
  question: 'Why is sunlight important in photosynthesis?',
  answer:
    'Plants need sunlight because it gives them food directly. The sunlight becomes glucose for the plant.',
};

export default function Home() {
  const [concept, setConcept] = useState(demo.concept);
  const [question, setQuestion] = useState(demo.question);
  const [answer, setAnswer] = useState(demo.answer);

  const [reassessmentAnswer, setReassessmentAnswer] = useState('');

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // 0 = initial question
  // 1 = reassessment 1
  // 2 = reassessment 2
  // 3 = reassessment 3
  const [round, setRound] = useState(0);

  const [loading, setLoading] = useState(false);
  const [mastery, setMastery] = useState(42);
  const [error, setError] = useState('');

  async function callEngine(
    concept: string,
    currentQuestion: string,
    currentAnswer: string,
    currentRound: number,
    history: Attempt[]
  ) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concept,
          question: currentQuestion,
          answer: currentAnswer,
          round: currentRound,
          // Only learner inputs are included in the next prompt. Passing the
          // exact current answer makes each reassessment response drive the
          // following diagnosis instead of replaying a stale session.
          history: history.map(({ round, question, answer }) => ({
            round,
            question,
            answer,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      const result = data as Analysis;

      // Save latest AI analysis
      setAnalysis(result);

      // Save this attempt to session history
      setAttempts((previous) => [
        ...previous,
        {
          round: currentRound,
          question: currentQuestion,
          answer: currentAnswer,
          analysis: result,
        },
      ]);

      // Update current round
      setRound(currentRound);

      // Prototype mastery indicator
      if (result.masteryStatus === 'mastered') {
        setMastery(100);
      } else {
        setMastery(
          Math.min(94, 42 + (currentRound + 1) * 18)
        );
      }

      // Clear reassessment box for the next response
      if (
        result.masteryStatus !== 'mastered' &&
        currentRound < 3
      ) {
        setReassessmentAnswer('');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  function analyzeInitial() {
    if (
      !concept.trim() ||
      !question.trim() ||
      !answer.trim()
    ) {
      setError(
        'Fill in the concept, question and learner answer first.'
      );
      return;
    }

    // Start a completely new learning session
    setAttempts([]);
    setAnalysis(null);
    setRound(0);
    setMastery(42);
    setReassessmentAnswer('');
    setError('');

    callEngine(concept, question, answer, 0, []);
  }

  function submitReassessment() {
    if (!analysis) {
      setError('Run the initial analysis first.');
      return;
    }

    if (!reassessmentAnswer.trim()) {
      setError(
        'Enter the learner response to the reassessment question first.'
      );
      return;
    }

    // Stop after mastery or 3 reassessment rounds
    if (
      analysis.masteryStatus === 'mastered' ||
      round >= 3
    ) {
      return;
    }

    /*
      IMPORTANT:

      The AI generates a NEW question in:
      analysis.checkQuestion

      That question becomes the next learning step.

      So the loop is:

      Answer
        ↓
      Diagnose
        ↓
      Adapt explanation
        ↓
      Generate NEW question
        ↓
      Learner answers NEW question
        ↓
      Diagnose again
    */

    callEngine(
      concept,
      analysis.nextQuestion,
      reassessmentAnswer,
      round + 1,
      attempts
    );
  }

  function reset() {
    setAnalysis(null);
    setAttempts([]);
    setRound(0);
    setReassessmentAnswer('');
    setAnswer('');
    setMastery(42);
    setError('');
  }

  const canReassess =
    !!analysis &&
    analysis.masteryStatus !== 'mastered' &&
    round < 3;

  const reassessmentNumber =
    Math.min(round + 1, 3);

  return (
    <main className="min-h-screen bg-[#07111f] text-white">

      {/* HEADER */}
      <header className="border-b border-white/10 sticky top-0 z-20 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient flex items-center justify-center">
              <Brain className="text-slate-950" />
            </div>

            <div>
              <div className="font-bold tracking-tight">
                AdaptEd
              </div>

              <div className="text-xs text-slate-400">
                Error-Aware Adaptive Learning
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
              ● AI engine ready
            </span>

            <span className="hidden sm:block text-slate-500">
              IP_PS-31 · Team 9
            </span>
          </div>

        </div>
      </header>


      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="max-w-4xl">

          <div className="text-cyan-300 text-sm font-semibold uppercase tracking-[.18em]">
            From wrong answer → right explanation → mastery
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-3">
            The system doesn't just see that a learner is wrong.
            <br />

            <span className="text-cyan-300">
              It asks why — then adapts.
            </span>
          </h1>

          <p className="text-slate-400 mt-5 text-lg max-w-3xl">
            Give the system any concept, question and learner
            response. It analyzes the error, changes how the
            concept is taught, generates a targeted reassessment,
            and can iterate up to three rounds.
          </p>

        </div>
      </section>


      {/* MAIN WORKSPACE */}
      <section className="max-w-7xl mx-auto px-6 pb-12">

        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-6">

          {/* LEFT — LEARNER INPUT */}
          <div className="glass rounded-3xl p-6">

            <div className="flex items-center justify-between mb-5">

              <div>
                <h2 className="font-bold text-xl">
                  Learner workspace
                </h2>

                <p className="text-sm text-slate-500">
                  Start with any concept
                </p>
              </div>

              <BookOpen className="text-cyan-300" />

            </div>


            {/* CONCEPT */}
            <label className="text-xs text-slate-400">
              CONCEPT
            </label>

            <input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full mt-2 mb-4 rounded-xl bg-slate-950/70 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="e.g. Fractions, Newton's Laws, Python loops"
            />


            {/* QUESTION */}
            <label className="text-xs text-slate-400">
              QUESTION
            </label>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="w-full mt-2 mb-4 rounded-xl bg-slate-950/70 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Enter the question the learner was asked"
            />


            {/* INITIAL ANSWER */}
            <label className="text-xs text-slate-400">
              LEARNER RESPONSE
            </label>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="w-full mt-2 rounded-xl bg-slate-950/70 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Enter the learner's answer"
            />


            {/* BUTTONS */}
            <div className="mt-5 flex gap-3">

              <button
                onClick={analyzeInitial}
                disabled={loading}
                className="gradient text-slate-950 font-bold px-5 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50"
              >
                {loading
                  ? 'Analyzing…'
                  : 'Analyze learner answer'}

                <ArrowRight size={18} />
              </button>


              <button
                onClick={reset}
                className="px-4 py-3 rounded-xl border border-white/10 text-slate-300"
                title="Reset session"
              >
                <RotateCcw size={18} />
              </button>

            </div>


            {/* ERROR */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 text-red-200 px-4 py-3 text-sm">
                {error}
              </div>
            )}

          </div>


          {/* RIGHT — AI ENGINE */}
          <div className="glass rounded-3xl p-6 min-h-[500px]">

            <div className="flex items-center justify-between mb-5">

              <div>
                <h2 className="font-bold text-xl">
                  AI diagnosis engine
                </h2>

                <p className="text-sm text-slate-500">
                  Diagnose → Adapt → Reassess → Repeat
                </p>
              </div>

              <Sparkles className="text-violet-300" />

            </div>


            {/* EMPTY STATE */}
            {!analysis ? (

              <div className="h-[400px] flex flex-col items-center justify-center text-center text-slate-500">

                <Activity
                  size={42}
                  className="mb-4 text-slate-700"
                />

                <p className="font-semibold text-slate-300">
                  Waiting for learner response
                </p>

                <p className="text-sm mt-2 max-w-sm">
                  Enter any concept, question and learner
                  answer, then run the adaptive engine.
                </p>

              </div>

            ) : (

              <div className="space-y-4">


                {/* ROUND HEADER */}
                <div className="flex items-center justify-between">

                  <span className="text-xs font-semibold tracking-widest text-cyan-300">
                    ADAPTIVE ROUND {Math.min(round + 1, 4)}
                  </span>

                  <span className="text-xs text-slate-500">
                    {analysis.masteryStatus === 'mastered'
                      ? 'Session complete'
                      : `${Math.min(round, 3)} / 3 reassessments used`}
                  </span>

                </div>


                {/* DIFFICULTY + CONFIDENCE */}
                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-2xl bg-red-400/10 border border-red-400/20 p-4">

                    <div className="text-xs text-red-300">
                      DETECTED DIFFICULTY
                    </div>

                    <div className="font-bold mt-1">
                      {analysis.difficultyType}
                    </div>

                  </div>


                  <div className="rounded-2xl bg-cyan-400/10 border border-cyan-400/20 p-4">

                    <div className="text-xs text-cyan-300">
                      CONFIDENCE
                    </div>

                    <div className="font-bold mt-1">
                      {analysis.confidence}%
                    </div>

                  </div>

                </div>


                {/* DIAGNOSIS */}
                <div>

                  <div className="text-xs text-slate-500 mb-1">
                    DIAGNOSIS
                  </div>

                  <p className="text-slate-200">
                    {analysis.diagnosis}
                  </p>

                </div>


                {/* STRATEGY */}
                <div>

                  <div className="text-xs text-slate-500 mb-1">
                    PEDAGOGICAL STRATEGY
                  </div>

                  <p className="text-slate-200">
                    {analysis.strategy}
                  </p>

                </div>


                {/* ADAPTED EXPLANATION */}
                <div className="rounded-2xl bg-violet-400/10 border border-violet-400/20 p-4">

                  <div className="text-xs text-violet-300">
                    NEW REPRESENTATION
                  </div>

                  <div className="font-bold mt-1 mb-2">
                    {analysis.representation}
                  </div>

                  <p className="text-slate-200 leading-relaxed">
                    {analysis.adaptedExplanation}
                  </p>

                </div>


                {/* MASTERY */}
                {analysis.masteryStatus === 'mastered' ? (

                  <div className="rounded-2xl bg-emerald-400/10 border border-emerald-400/20 p-5">

                    <div className="flex items-center gap-2 text-emerald-300 font-bold">

                      <Trophy size={19} />

                      MASTERY REACHED

                    </div>

                    <p className="mt-2 text-slate-200">
                      The latest response provides sufficient
                      evidence of understanding for this prototype.
                      The adaptive session ends here.
                    </p>

                  </div>

                ) : (

                  <>


                    {/* NEXT QUESTION */}
                    <div className="rounded-2xl bg-emerald-400/10 border border-emerald-400/20 p-4">

                      <div className="flex items-center gap-2 text-emerald-300 font-semibold">

                        <CheckCircle2 size={17} />

                        REASSESSMENT {reassessmentNumber} / 3

                      </div>

                      <p className="mt-2 text-slate-200 font-medium">
                        {analysis.nextQuestion}
                      </p>

                    </div>


                    {/* ANSWER BOX */}
                    {canReassess ? (

                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">

                        <label className="text-xs text-slate-400">
                          LEARNER RESPONSE TO REASSESSMENT
                        </label>

                        <textarea
                          value={reassessmentAnswer}
                          onChange={(e) =>
                            setReassessmentAnswer(e.target.value)
                          }
                          rows={4}
                          className="w-full mt-2 rounded-xl bg-slate-950/70 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400"
                          placeholder="Let the learner answer the new question here…"
                        />


                        <button
                          onClick={submitReassessment}
                          disabled={loading}
                          className="mt-3 gradient text-slate-950 font-bold px-5 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50"
                        >

                          {loading
                            ? 'Analyzing…'
                            : 'Submit reassessment'}

                          <Send size={17} />

                        </button>

                      </div>

                    ) : (

                      <div className="rounded-2xl bg-amber-400/10 border border-amber-400/20 p-4">

                        <div className="flex items-center gap-2 text-amber-300 font-semibold">

                          <AlertTriangle size={17} />

                          ADDITIONAL SUPPORT MAY BE NEEDED

                        </div>

                        <p className="mt-2 text-slate-200">
                          Three adaptive rounds have been used
                          without sufficient evidence of mastery.
                          The prototype stops here and recommends
                          educator support.
                        </p>

                      </div>

                    )}

                  </>

                )}


                {/* WHY */}
                <div className="text-xs text-slate-500">

                  Why it changed:{' '}

                  <span className="text-slate-300">
                    {analysis.whyItChanged}
                  </span>

                </div>

              </div>

            )}

          </div>

        </div>

      </section>


      {/* METRICS */}
      <section className="max-w-7xl mx-auto px-6 pb-16">

        <div className="grid md:grid-cols-4 gap-4">

          <Metric
            icon={<Target />}
            label="Learner mastery"
            value={`${mastery}%`}
            note="prototype estimate"
          />

          <Metric
            icon={<Activity />}
            label="Adaptation loop"
            value="Active"
            note="error → strategy → representation"
          />

          <Metric
            icon={<ShieldCheck />}
            label="Teacher control"
            value="Human-in-loop"
            note="AI suggests; educator decides"
          />

          <Metric
            icon={<Sparkles />}
            label="MVP representations"
            value="3"
            note="text · visual · example"
          />

        </div>


        <div className="mt-8 text-center text-xs text-slate-600">
          Research prototype · Not a diagnostic tool ·
          AI output should be reviewed by educators
        </div>

      </section>

    </main>
  );
}


/* METRIC CARD */

function Metric({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">

      <div className="text-cyan-300 mb-3">
        {icon}
      </div>

      <div className="text-2xl font-black">
        {value}
      </div>

      <div className="text-sm font-semibold mt-1">
        {label}
      </div>

      <div className="text-xs text-slate-500 mt-1">
        {note}
      </div>

    </div>
  );
}
