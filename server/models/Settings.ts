import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  n8nWebhookUrl: string;
  n8nEnabled: boolean;
  geminiModel: string;
  companyName: string;
  defaultJobId: string;
}

const SettingsSchema = new Schema<ISettings>({
  n8nWebhookUrl: { type: String, default: '' },
  n8nEnabled: { type: Boolean, default: false },
  geminiModel: { type: String, default: 'gemini-3.8-flash' },
  companyName: { type: String, default: 'Apex Human Capital Systems' },
  defaultJobId: { type: String, default: '' }
}, {
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
    }
  }
});

export const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
