interface LeetCodeProblem {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tags: string[];
    hints: string[];
    acceptance: string;
    examples: Array<{input: string, output: string}>;
    constraints: string[];
    isPremium: boolean;
}

export class LeetCodeAPI {
    private baseUrl = '/api/leetcode';

    async getProblem(problemId: string): Promise<LeetCodeProblem> {
        const response = await fetch(`${this.baseUrl}/problem/${problemId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch problem: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Raw API Response: ', data);
        return data;
    }
}