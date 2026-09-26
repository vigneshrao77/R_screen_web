import mongoose, { Schema, Document } from 'mongoose';
import { ICandidate } from './Candidate.js';

export interface IScreening extends Document {
  candidateId: mongoose.Types.ObjectId;
  candidate?: ICandidate; // Populated field
  jobId: mongoose.Types.ObjectId;
  jobTitle: string;
  status: 'pending' | 'extracting' | 'n8n_triggered' | 'ai_evaluating' | 'completed' | 'failed';
  statusMessage?: string;
  error?: string | null;
  retryCount: number;
  result: any | null;
  n8nExecution: any | null;
  recruiterId: mongoose.Types.ObjectId;
  recruiterEmail: string;
  createdAt: Date;
  completedAt?: Date | null;
}

const ScreeningSchema = new Schema<IScreening>({
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  jobTitle: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'extracting', 'n8n_triggered', 'ai_evaluating', 'completed', 'failed'],
    default: 'pending' 
  },
  statusMessage: { type: String },
  error: { type: String, default: null },
  retryCount: { type: Number, default: 0 },
  result: { type: Schema.Types.Mixed, default: null },
  n8nExecution: { type: Schema.Types.Mixed, default: null },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recruiterEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
}, {
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      ret.candidateId = ret.candidateId.toString();
      ret.jobId = ret.jobId.toString();
      ret.recruiterId = ret.recruiterId.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Virtual populate for candidate
ScreeningSchema.virtual('candidate', {
  ref: 'Candidate',
  localField: 'candidateId',
  foreignField: '_id',
  justOne: true
});

ScreeningSchema.set('toObject', { virtuals: true });
ScreeningSchema.set('toJSON', { virtuals: true });

export const Screening = mongoose.models.Screening || mongoose.model<IScreening>('Screening', ScreeningSchema);
