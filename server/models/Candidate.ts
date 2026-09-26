import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate extends Document {
  fullName: string;
  email: string;
  phone: string;
  resumeFilename: string;
  resumePath: string;
  fileSize: number;
  extractedTextLength: number;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  resumeFilename: { type: String, required: true },
  resumePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  extractedTextLength: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

export const Candidate = mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);
