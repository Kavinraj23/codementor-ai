import mongoose from 'mongoose';

export interface ISession extends mongoose.Document {
  userEmail: string;
  problemPrompt: string;
  chatHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  finalCode: string;
  scores: {
    correctness: number;
    efficiency: number;
    style: number;
    communication: number;
    overall: number;
  };
  feedback: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new mongoose.Schema<ISession>(
  {
    userEmail: {
      type: String,
      required: true,
      index: true, // For faster queries by user
    },
    problemPrompt: {
      type: String,
      required: true,
    },
    chatHistory: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    finalCode: {
      type: String,
      default: '',
    },
    scores: {
      correctness: {
        type: Number,
        min: 0,
        max: 100, // Updated to 100
        default: 0,
      },
      efficiency: {
        type: Number,
        min: 0,
        max: 100, // Updated to 100
        default: 0,
      },
      style: {
        type: Number,
        min: 0,
        max: 100, // Updated to 100
        default: 0,
      },
      communication: {
        type: Number,
        min: 0,
        max: 100, // Updated to 100
        default: 0,
      },
      overall: {
        type: Number,
        min: 0,
        max: 100, // Updated to 100
        default: 0,
      },
    },
    feedback: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for efficient user-based queries with date sorting
SessionSchema.index({ userEmail: 1, createdAt: -1 });

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema); 