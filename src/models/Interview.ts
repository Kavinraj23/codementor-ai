import mongoose from 'mongoose';

export interface Interview {
  id: string;
  problemId: number;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  status: 'active' | 'completed' | 'abandoned';
  testResults: Array<{
    pass: boolean;
    output: string;
    input: string;
    expected: unknown;
    actual: unknown;
  }>;
  code: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  submittedAt?: Date;
  aiEvaluation?: string;
}

export interface InterviewSession {
  id: string;
  problemId: number;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  status: 'active' | 'completed' | 'abandoned';
  currentCode: string;
  testResults: Array<{
    pass: boolean;
    output: string;
    input: string;
    expected: unknown;
    actual: unknown;
  }>;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  submittedAt?: Date;
  aiEvaluation?: string;
  elapsedTime: number; // in seconds
}

const InterviewSchema = new mongoose.Schema<Interview>({
  problemId: {
    type: Number,
    required: true,
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: false,
  },
  duration: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active',
  },
  testResults: [{
    pass: {
      type: Boolean,
      required: true,
    },
    output: {
      type: String,
      required: true,
    },
    input: {
      type: String,
      required: true,
    },
    expected: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    actual: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  }],
  code: {
    type: String,
    required: true,
  },
  messages: [{
    id: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant'],
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: String,
      required: true,
    },
  }],
  submittedAt: {
    type: Date,
    required: false,
  },
  aiEvaluation: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

// Create indexes for better query performance
InterviewSchema.index({ problemId: 1, createdAt: -1 });
InterviewSchema.index({ status: 1, startTime: -1 });

const Interview = mongoose.models.Interview || mongoose.model<Interview>('Interview', InterviewSchema);

export default Interview;