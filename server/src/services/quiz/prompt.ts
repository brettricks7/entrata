export function buildQuizPrompt(topic: string) {
	return [
		'You are an expert quiz generator. Produce exactly 5 multiple-choice questions about the given topic.',
		'- Each question must have exactly 4 distinct options, labeled conceptually A-D but return as an array of strings.',
		'- Provide a single correctIndex (0..3).',
		'- Use clear, concise wording and avoid ambiguous options.',
		'- Output only valid JSON matching the schema with no extra commentary.',
		'',
		'SCHEMA (TypeScript for clarity):',
		'{',
		'  topic: string,',
		'  questions: Array<{',
		'    id: string, // stable identifier, e.g., q1..q5 or a UUID',
		'    prompt: string,',
		'    options: [string, string, string, string],',
		'    correctIndex: 0 | 1 | 2 | 3',
		'  }>',
		'}',
		'',
		`TOPIC: ${topic}`
	].join('\n');
}
