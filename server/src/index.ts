import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error.js';
import { quizRouter } from './routes/quiz.js';
import { unlockRouter } from './routes/unlock.js';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: config.corsOrigin, credentials: false }));

app.get('/health', (_req, res) => {
	res.json({ ok: true });
});

app.use('/api/unlock', unlockRouter);
app.use('/api/quiz', quizRouter);

app.use(errorHandler);

app.listen(config.port, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on http://localhost:${config.port}`);
});
