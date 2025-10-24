export type Question = {
	id: string;
	prompt: string;
	options: [string, string, string, string];
	correctIndex: 0 | 1 | 2 | 3;
};

export type Quiz = {
	topic: string;
	questions: Question[];
};
