import type { Quiz } from '../api';

type Props = {
  quiz: Quiz;
  answers: Record<string, number | null>;
  onSelect: (questionId: string, choice: number) => void;
  onSubmit: () => void;
};

export function QuizForm({ quiz, answers, onSelect, onSubmit }: Props) {
  const allAnswered = quiz.questions.every((q) => answers[q.id] !== null);
  return (
    <div>
      <h2>Topic: {quiz.topic}</h2>
      <ol className="list">
        {quiz.questions.map((q) => (
          <li key={q.id} className="question">
            <div className="question-title">{q.prompt}</div>
            <div>
              {q.options.map((opt, idx) => (
                <label key={idx} className="option">
                  <input
                    type="radio"
                    name={q.id}
                    value={idx}
                    checked={answers[q.id] === idx}
                    onChange={() => onSelect(q.id, idx)}
                  />
                  {String.fromCharCode(65 + idx)}. {opt}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button className="btn" onClick={onSubmit} disabled={!allAnswered}>
        Submit
      </button>
    </div>
  );
}
