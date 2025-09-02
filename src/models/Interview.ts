import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewSession extends Document {
  sessionId: string;
  problemId: number;
  problemTitle: string;
  problemDifficulty: 'Easy' | 'Medium' | 'Hard';
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  status: 'active' | 'completed' | 'incomplete';
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
  
  // Enhanced metrics for feedback
  performanceMetrics: {
    testCasesPassed: number;
    totalTestCases: number;
    successRate: number;
    timeEfficiency: number; // based on difficulty and time taken
    codeQuality: number; // based on code length, comments, structure
  };
  
  // AI feedback summary
  aiFeedback: {
    summary?: string; // 2-3 sentence overview (optional)
    strengths: string[]; // what went well
    improvements: string[]; // areas for improvement
    overallScore: number; // 0-100 score
  };
  
  // For future user authentication
  userId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSessionSchema = new Schema<IInterviewSession>({
  sessionId: { type: String, required: true, unique: true },
  problemId: { type: Number, required: true },
  problemTitle: { type: String, required: true },
  problemDifficulty: { 
    type: String, 
    required: true, 
    enum: ['Easy', 'Medium', 'Hard'] 
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'completed', 'incomplete'] 
  },
  currentCode: { type: String, required: true },
  testResults: [{
    pass: { type: Boolean, required: true },
    output: { type: String, required: true },
    input: { type: String, required: true },
    expected: { type: Schema.Types.Mixed },
    actual: { type: Schema.Types.Mixed }
  }],
  messages: [{
    id: { type: String, required: true },
    role: { type: String, required: true, enum: ['user', 'assistant'] },
    content: { type: String, required: true },
    timestamp: { type: String, required: true }
  }],
  submittedAt: { type: Date },
  aiEvaluation: { type: String },
  elapsedTime: { type: Number, required: true },
  
  performanceMetrics: {
    testCasesPassed: { type: Number, required: false, default: 0 },
    totalTestCases: { type: Number, required: false, default: 0 },
    successRate: { type: Number, required: false, default: 0 },
    timeEfficiency: { type: Number, required: false, default: 0 },
    codeQuality: { type: Number, required: false, default: 0 }
  },
  
  aiFeedback: {
    summary: { type: String, required: false, default: '' },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    overallScore: { type: Number, required: true, min: 0, max: 100 }
  },
  
  userId: { type: String }, // for future Auth0 integration
  
}, {
  timestamps: true
});

// Create indexes for better query performance
InterviewSessionSchema.index({ sessionId: 1 });
InterviewSessionSchema.index({ problemId: 1 });
InterviewSessionSchema.index({ status: 1 });
InterviewSessionSchema.index({ startTime: -1 });
InterviewSessionSchema.index({ userId: 1 }); // for future use

export default mongoose.models.InterviewSession || mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);