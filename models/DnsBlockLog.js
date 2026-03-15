import mongoose from 'mongoose';

const DnsBlockLogSchema = new mongoose.Schema(
  {
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    domain: { type: String, required: true, trim: true, lowercase: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

DnsBlockLogSchema.index({ device: 1, createdAt: -1 });

const DnsBlockLog = mongoose.models.DnsBlockLog || mongoose.model('DnsBlockLog', DnsBlockLogSchema);
export default DnsBlockLog;
