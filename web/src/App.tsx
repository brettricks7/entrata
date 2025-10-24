import { useMemo, useState } from 'react';
import { generateQuiz, type Quiz, getUnlockStatus, relock, unlock } from './api';
import { QuizForm } from './components/QuizForm';
import { Results } from './components/Results';

export function App() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const score = useMemo(() => {
    if (!quiz || !submitted) return 0;
    return quiz.questions.reduce((acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0), 0);
  }, [quiz, submitted, answers]);

  async function ensureUnlocked(): Promise<boolean> {
    try {
      const s = await getUnlockStatus();
      if (s.unlocked) {
        setUnlocked(true);
        return true;
      }
      const pw = window.prompt('Enter unlock password for API key');
      if (!pw) return false;
      await unlock(pw);
      setUnlocked(true);
      return true;
    } catch (e: any) {
      setError(e?.message || 'Unlock failed');
      return false;
    }
  }

  async function onGenerate() {
    setError(null);
    setSubmitted(false);
    setAnswers({});
    setQuiz(null);
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    const ok = await ensureUnlocked();
    if (!ok) return;
    setLoading(true);
    try {
      const q = await generateQuiz(topic.trim());
      const init: Record<string, number | null> = {};
      q.questions.forEach((qq) => (init[qq.id] = null));
      setAnswers(init);
      setQuiz(q);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  }

  function onSelect(questionId: string, choice: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }));
  }

  function onSubmit() {
    setSubmitted(true);
  }

  function onReset() {
    setSubmitted(false);
    setQuiz(null);
    setAnswers({});
  }

  async function onLock() {
    setError(null);
    try {
      await relock();
      setUnlocked(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to lock');
    }
  }

  return (
    <div className="container">
      <h1>
        SMART <small>(Skills Measurement And Recall Toolkit)</small>
      </h1>
      <div className="row">
        <input
          className="text-input"
          placeholder="Enter a topic (e.g., Photosynthesis)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button className="btn" onClick={onGenerate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>
      <div className="row">
        <button className="btn" onClick={onLock} disabled={!unlocked}>Lock</button>
        <span className="hint">Status: {unlocked ? 'Unlocked' : 'Locked'}</span>
      </div>
      {error && <div className="error">{error}</div>}
      {!quiz && <p className="hint">Enter a topic and click Generate to create a 5-question multiple-choice quiz.</p>}
      {quiz && !submitted && (
        <QuizForm quiz={quiz} answers={answers} onSelect={onSelect} onSubmit={onSubmit} />
      )}
      {quiz && submitted && (
        <Results quiz={quiz} answers={answers} score={score} onReset={onReset} />
      )}

      {loading && (
        <div className="overlay">
          <div className="loading-box">
            <div className="spinner" />
            <div>Generating quiz…</div>
          </div>
        </div>
      )}
    </div>
  );
}
