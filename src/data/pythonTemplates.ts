export interface PythonTemplate {
  problemId: number;
  functionSignature: string;
  starterCode: string;
  imports?: string[];
}

export const PYTHON_TEMPLATES: Record<number, PythonTemplate> = {
  1: {
    problemId: 1,
    functionSignature: "def twoSum(self, nums: List[int], target: int) -> List[int]:",
    starterCode: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        """
        Given an array of integers nums and an integer target, 
        return indices of the two numbers such that they add up to target.
        
        Args:
            nums: List of integers
            target: Target sum
            
        Returns:
            List of two indices that add up to target
        """
        # Your solution here
        pass`,
    imports: ["from typing import List"]
  },
  2: {
    problemId: 2,
    functionSignature: "def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:",
    starterCode: `# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        """
        Add two numbers represented as linked lists.
        
        Args:
            l1: First linked list representing a number in reverse order
            l2: Second linked list representing a number in reverse order
            
        Returns:
            Sum as a linked list in reverse order
        """
        # Your solution here
        pass`,
    imports: ["from typing import Optional"]
  },
  3: {
    problemId: 3,
    functionSignature: "def lengthOfLongestSubstring(self, s: str) -> int:",
    starterCode: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        """
        Find the length of the longest substring without repeating characters.
        
        Args:
            s: Input string
            
        Returns:
            Length of longest substring without repeating characters
        """
        # Your solution here
        pass`
  },
  4: {
    problemId: 4,
    functionSignature: "def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:",
    starterCode: `class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        """
        Find the median of two sorted arrays.
        
        Args:
            nums1: First sorted array
            nums2: Second sorted array
            
        Returns:
            Median of the two sorted arrays
        """
        # Your solution here
        pass`,
    imports: ["from typing import List"]
  },
  5: {
    problemId: 5,
    functionSignature: "def longestPalindrome(self, s: str) -> str:",
    starterCode: `class Solution:
    def longestPalindrome(self, s: str) -> str:
        """
        Find the longest palindromic substring.
        
        Args:
            s: Input string
            
        Returns:
            Longest palindromic substring
        """
        # Your solution here
        pass`
  },
  20: {
    problemId: 20,
    functionSignature: "def isValid(self, s: str) -> bool:",
    starterCode: `class Solution:
    def isValid(self, s: str) -> bool:
        """
        Determine if the input string of brackets is valid.
        
        Args:
            s: String containing brackets '()', '{}', '[]'
            
        Returns:
            True if brackets are properly matched, False otherwise
        """
        # Your solution here
        pass`
  },
  121: {
    problemId: 121,
    functionSignature: "def maxProfit(self, prices: List[int]) -> int:",
    starterCode: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        """
        Find the maximum profit from buying and selling stock once.
        
        Args:
            prices: Array of stock prices by day
            
        Returns:
            Maximum profit possible
        """
        # Your solution here
        pass`,
    imports: ["from typing import List"]
  },
  226: {
    problemId: 226,
    functionSignature: "def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:",
    starterCode: `# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        """
        Invert a binary tree.
        
        Args:
            root: Root of the binary tree
            
        Returns:
            Root of the inverted binary tree
        """
        # Your solution here
        pass`,
    imports: ["from typing import Optional"]
  }
};

export function getPythonTemplate(problemId: number): PythonTemplate {
  const template = PYTHON_TEMPLATES[problemId];
  
  if (template) {
    return template;
  }
  
  // Default template for problems without specific templates
  return {
    problemId,
    functionSignature: "def solution(self):",
    starterCode: `class Solution:
    def solution(self):
        """
        Solve the problem.
        
        Your solution implementation goes here.
        """
        # Your solution here
        pass`,
    imports: []
  };
}

export function getFullPythonCode(problemId: number): string {
  const template = getPythonTemplate(problemId);
  const imports = template.imports ? template.imports.join('\n') + '\n\n' : '';
  
  return imports + template.starterCode;
}