import type { Quiz } from '../api';

type Props = {
  quiz: Quiz;
  answers: Record<string, number | null>;
  score: number;
  onReset: () => void;
};

export function Results({ quiz, answers, score, onReset }: Props) {
  return (
    <div>
      <h2>Results</h2>
      <p>
        Score: <strong>{score}</strong> / {quiz.questions.length}
      </p>
      <ol className="list">
        {quiz.questions.map((q) => {
          const userIdx = answers[q.id];
          const isCorrect = userIdx === q.correctIndex;
          return (
            <li key={q.id} className="question">
              <div className="question-title">{q.prompt}</div>
              <div>
                Your answer: {userIdx != null ? `${String.fromCharCode(65 + userIdx)}. ${q.options[userIdx]}` : '—'}
                {userIdx != null && (
                  <span className={`answer-note ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? ' Correct' : ' Incorrect'}
                  </span>
                )}
              </div>
              {!isCorrect && (
                <div>
                  Correct answer: {String.fromCharCode(65 + q.correctIndex)}. {q.options[q.correctIndex]}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <button className="btn" onClick={onReset}>Create another quiz</button>
    </div>
  );
}
