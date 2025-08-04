export interface TestCase {
  input: Record<string, unknown>;
  expectedOutput: unknown;
  explanation?: string;
}

export interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string[];
  description: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  testCases: TestCase[];
  hints?: string[];
  followUp?: string[];
  companies?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
}

export const LEETCODE_PROBLEMS: Problem[] = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    category: ["Array", "Hash Table"],
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]"
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]"
      }
    ],
    testCases: [
      {
        input: { nums: [2, 7, 11, 15], target: 9 },
        expectedOutput: [0, 1]
      },
      {
        input: { nums: [3, 2, 4], target: 6 },
        expectedOutput: [1, 2]
      },
      {
        input: { nums: [3, 3], target: 6 },
        expectedOutput: [0, 1]
      },
      {
        input: { nums: [-1, -2, -3, -4, -5], target: -8 },
        expectedOutput: [2, 4]
      }
    ],
    hints: [
      "A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it's best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations.",
      "So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter. Can we change our array somehow so that this search becomes faster?",
      "The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?"
    ],
    companies: ["Amazon", "Google", "Apple", "Microsoft", "Facebook"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: 2,
    title: "Add Two Numbers",
    difficulty: "Medium",
    category: ["Linked List", "Math", "Recursion"],
    description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.`,
    constraints: [
      "The number of nodes in each linked list is in the range [1, 100].",
      "0 <= Node.val <= 9",
      "It is guaranteed that the list represents a number that does not have leading zeros."
    ],
    examples: [
      {
        input: "l1 = [2,4,3], l2 = [5,6,4]",
        output: "[7,0,8]",
        explanation: "342 + 465 = 807."
      },
      {
        input: "l1 = [0], l2 = [0]",
        output: "[0]"
      },
      {
        input: "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]",
        output: "[8,9,9,9,0,0,0,1]"
      }
    ],
    testCases: [
      {
        input: { l1: [2, 4, 3], l2: [5, 6, 4] },
        expectedOutput: [7, 0, 8]
      },
      {
        input: { l1: [0], l2: [0] },
        expectedOutput: [0]
      },
      {
        input: { l1: [9, 9, 9, 9, 9, 9, 9], l2: [9, 9, 9, 9] },
        expectedOutput: [8, 9, 9, 9, 0, 0, 0, 1]
      }
    ],
    hints: [
      "Think about how you would add two numbers on paper. You start from the least significant digit.",
      "Keep track of the carry using a variable and simulate digits-by-digits sum starting from the head of list, which contains the least-significant digit.",
      "Take care of the case when one list is longer than the other.",
      "Take care of the case when there is a carry at the end of the computation."
    ],
    companies: ["Amazon", "Microsoft", "Apple", "Google"],
    timeComplexity: "O(max(m, n))",
    spaceComplexity: "O(max(m, n))"
  },
  {
    id: 3,
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: ["Hash Table", "String", "Sliding Window"],
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        input: 's = "bbbbb"',
        output: "1",
        explanation: 'The answer is "b", with the length of 1.'
      },
      {
        input: 's = "pwwkew"',
        output: "3",
        explanation: 'The answer is "wke", with the length of 3. Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.'
      }
    ],
    testCases: [
      {
        input: { s: "abcabcbb" },
        expectedOutput: 3
      },
      {
        input: { s: "bbbbb" },
        expectedOutput: 1
      },
      {
        input: { s: "pwwkew" },
        expectedOutput: 3
      },
      {
        input: { s: "" },
        expectedOutput: 0
      },
      {
        input: { s: "dvdf" },
        expectedOutput: 3
      }
    ],
    hints: [
      "Use the sliding window technique.",
      "Use a hash set to store the characters in the current window [i, j) (j = i initially). Then we slide the index j to the right. If it is not in the HashSet, we slide j further. Doing so until s[j] is already in the HashSet.",
      "At this point, we have the maximum size substring without duplicate characters start with index i."
    ],
    companies: ["Amazon", "Bloomberg", "Yelp", "Adobe"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(min(m, n))"
  },
  {
    id: 4,
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    category: ["Array", "Binary Search", "Divide and Conquer"],
    description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 <= m <= 1000",
      "0 <= n <= 1000",
      "1 <= m + n <= 2000",
      "-10^6 <= nums1[i], nums2[i] <= 10^6"
    ],
    examples: [
      {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.00000",
        explanation: "merged array = [1,2,3] and median is 2."
      },
      {
        input: "nums1 = [1,2], nums2 = [3,4]",
        output: "2.50000",
        explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5."
      }
    ],
    testCases: [
      {
        input: { nums1: [1, 3], nums2: [2] },
        expectedOutput: 2.0
      },
      {
        input: { nums1: [1, 2], nums2: [3, 4] },
        expectedOutput: 2.5
      },
      {
        input: { nums1: [0, 0], nums2: [0, 0] },
        expectedOutput: 0.0
      },
      {
        input: { nums1: [], nums2: [1] },
        expectedOutput: 1.0
      }
    ],
    hints: [
      "To solve this problem, we need to understand \"What is the use of median\". In statistics, the median is used for dividing a set into two equal length subsets, that one subset is always greater than the other.",
      "If we understand the use of median for dividing, we are very close to the answer.",
      "First let's cut A into two parts at a random position i: left_A[0, i-1] | right_A[i, m-1]. Similarly, cut B into two parts at a random position j: left_B[0, j-1] | right_B[j, n-1].",
      "Put left_A and left_B into one set, and put right_A and right_B into another set. Let's name them left_part and right_part."
    ],
    companies: ["Google", "Amazon", "Microsoft", "Apple"],
    timeComplexity: "O(log(min(m, n)))",
    spaceComplexity: "O(1)"
  },
  {
    id: 5,
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    category: ["String", "Dynamic Programming"],
    description: `Given a string s, return the longest palindromic substring in s.`,
    constraints: [
      "1 <= s.length <= 1000",
      "s consist of only digits and English letters."
    ],
    examples: [
      {
        input: 's = "babad"',
        output: '"bab"',
        explanation: '"aba" is also a valid answer.'
      },
      {
        input: 's = "cbbd"',
        output: '"bb"'
      }
    ],
    testCases: [
      {
        input: { s: "babad" },
        expectedOutput: "bab" // or "aba"
      },
      {
        input: { s: "cbbd" },
        expectedOutput: "bb"
      },
      {
        input: { s: "a" },
        expectedOutput: "a"
      },
      {
        input: { s: "ac" },
        expectedOutput: "a" // or "c"
      }
    ],
    hints: [
      "How can we reuse a previously computed palindrome to compute a larger palindrome?",
      "If \"aba\" is a palindrome, is \"xabax\" a palindrome? Similarly is \"xabay\" a palindrome?",
      "Complexity based hint: If we use brute force and check whether for every start and end position a substring is a palindrome we have O(n^2) start - end pairs and O(n) palindromic checks. Can we reduce the time for palindromic checks to O(1) by reusing some previous computation."
    ],
    companies: ["Amazon", "Microsoft", "Adobe", "Google"],
    timeComplexity: "O(n^2)",
    spaceComplexity: "O(1)"
  },
  {
    id: 20,
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: ["String", "Stack"],
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    examples: [
      {
        input: 's = "()"',
        output: "true"
      },
      {
        input: 's = "()[]{}"',
        output: "true"
      },
      {
        input: 's = "(]"',
        output: "false"
      }
    ],
    testCases: [
      {
        input: { s: "()" },
        expectedOutput: true
      },
      {
        input: { s: "()[]{}" },
        expectedOutput: true
      },
      {
        input: { s: "(]" },
        expectedOutput: false
      },
      {
        input: { s: "([)]" },
        expectedOutput: false
      },
      {
        input: { s: "{[]}" },
        expectedOutput: true
      }
    ],
    hints: [
      "Use a stack of characters.",
      "When you encounter an opening bracket, push it to the top of the stack.",
      "When you encounter a closing bracket, check if the top of the stack was the opening for it. If yes, pop it from the stack. Otherwise, return false."
    ],
    companies: ["Google", "Amazon", "Microsoft", "Facebook"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: 121,
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    category: ["Array", "Dynamic Programming"],
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4"
    ],
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."
      },
      {
        input: "prices = [7,6,4,3,1]",
        output: "0",
        explanation: "In this case, no transactions are done and the max profit = 0."
      }
    ],
    testCases: [
      {
        input: { prices: [7, 1, 5, 3, 6, 4] },
        expectedOutput: 5
      },
      {
        input: { prices: [7, 6, 4, 3, 1] },
        expectedOutput: 0
      },
      {
        input: { prices: [1, 2, 3, 4, 5] },
        expectedOutput: 4
      },
      {
        input: { prices: [2, 4, 1] },
        expectedOutput: 2
      }
    ],
    hints: [
      "Keep track of the minimum price so far as you iterate through the array.",
      "For each price, calculate the profit if you sell at that price (current price - minimum price so far).",
      "Keep track of the maximum profit seen so far."
    ],
    companies: ["Amazon", "Google", "Facebook", "Microsoft"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)"
  },
  {
    id: 226,
    title: "Invert Binary Tree",
    difficulty: "Easy",
    category: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree"],
    description: `Given the root of a binary tree, invert the tree, and return its root.`,
    constraints: [
      "The number of nodes in the tree is in the range [0, 100].",
      "-100 <= Node.val <= 100"
    ],
    examples: [
      {
        input: "root = [4,2,7,1,3,6,9]",
        output: "[4,7,2,9,6,3,1]"
      },
      {
        input: "root = [2,1,3]",
        output: "[2,3,1]"
      },
      {
        input: "root = []",
        output: "[]"
      }
    ],
    testCases: [
      {
        input: { root: [4, 2, 7, 1, 3, 6, 9] },
        expectedOutput: [4, 7, 2, 9, 6, 3, 1]
      },
      {
        input: { root: [2, 1, 3] },
        expectedOutput: [2, 3, 1]
      },
      {
        input: { root: [] },
        expectedOutput: []
      }
    ],
    hints: [
      "Think recursively! For each node, swap its left and right children, then recursively invert the left and right subtrees.",
      "You can also solve this iteratively using a queue (BFS) or stack (DFS)."
    ],
    followUp: [
      "This problem was inspired by this original tweet by Max Howell: 'Google: 90% of our engineers use the software you wrote (Homebrew), but you can't invert a binary tree on a whiteboard so f*** off.'"
    ],
    companies: ["Google", "Amazon", "Microsoft", "Apple"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(h)"
  }
];

export function getRandomProblem(): Problem {
  const randomIndex = Math.floor(Math.random() * LEETCODE_PROBLEMS.length);
  return LEETCODE_PROBLEMS[randomIndex];
}

export function getProblemById(id: number): Problem | undefined {
  return LEETCODE_PROBLEMS.find(problem => problem.id === id);
}

export function getProblemByTitle(title: string): Problem | undefined {
  return LEETCODE_PROBLEMS.find(problem => 
    problem.title.toLowerCase().includes(title.toLowerCase())
  );
}

export function getProblemsByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): Problem[] {
  return LEETCODE_PROBLEMS.filter(problem => problem.difficulty === difficulty);
}

export function getProblemsByCategory(category: string): Problem[] {
  return LEETCODE_PROBLEMS.filter(problem =>
    problem.category.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
  );
}