import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  id: string;
  title: string;
  location: string;
  experienceLevel: string;
  roleOverview: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  education: string;
  whatWeLookFor: string;
  rawText: string;
  active: boolean;
  createdAt: Date;
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  location: { type: String, required: true },
  experienceLevel: { type: String, required: true },
  roleOverview: { type: String, required: true },
  responsibilities: [{ type: String }],
  requiredSkills: [{ type: String }],
  preferredSkills: [{ type: String }],
  education: { type: String, required: true },
  whatWeLookFor: { type: String, required: true },
  rawText: { type: String, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

export const Job: mongoose.Model<IJob> = (mongoose.models.Job as mongoose.Model<IJob>) || mongoose.model<IJob>('Job', JobSchema);
