import mongoose from 'mongoose';

const RULE_ACTIONS = ['block', 'allow'];
const RULE_TYPES = ['exact', 'suffix'];

const DnsRuleSchema = new mongoose.Schema(
  {
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', default: null, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    domain: { type: String, required: true, trim: true, lowercase: true },
    action: { type: String, enum: RULE_ACTIONS, required: true },
    type: { type: String, enum: RULE_TYPES, default: 'exact' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

DnsRuleSchema.index({ device: 1, domain: 1 });
DnsRuleSchema.index({ user: 1, domain: 1 });

const DnsRule = mongoose.models.DnsRule || mongoose.model('DnsRule', DnsRuleSchema);
export default DnsRule;
export { RULE_ACTIONS, RULE_TYPES };
