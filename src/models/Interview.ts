import mongoose from 'mongoose';

export interface IInterview {
  _id?: string;
  userId: string;
  problemTitle: string;
  problemDifficulty: 'Easy' | 'Medium' | 'Hard';
  language: string;
  code: string;
  score: {
    correctness: number;
    efficiency: number;
    codeStyle: number;
    communication: number;
    overall: number;
  };
  feedback: string;
  duration: number; // in minutes
  status: 'completed' | 'in-progress' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new mongoose.Schema<IInterview>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  problemTitle: {
    type: String,
    required: true,
  },
  problemDifficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
  },
  language: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  score: {
    correctness: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    efficiency: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    codeStyle: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    communication: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    overall: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  feedback: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['completed', 'in-progress', 'abandoned'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

// Create indexes for better query performance
InterviewSchema.index({ userId: 1, createdAt: -1 });
InterviewSchema.index({ 'score.overall': -1 });

const Interview = mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);

export default Interview;