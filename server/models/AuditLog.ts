import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  id: string;
  timestamp: Date;
  recruiterEmail: string;
  action: string;
  entityType: 'screening' | 'candidate' | 'job' | 'auth' | 'settings';
  entityId: string;
  details: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  timestamp: { type: Date, default: Date.now },
  recruiterEmail: { type: String, required: true },
  action: { type: String, required: true },
  entityType: { 
    type: String, 
    enum: ['screening', 'candidate', 'job', 'auth', 'settings'],
    required: true 
  },
  entityId: { type: String, default: '' },
  details: { type: String, required: true }
}, {
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

export const AuditLog: mongoose.Model<IAuditLog> = (mongoose.models.AuditLog as mongoose.Model<IAuditLog>) || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
