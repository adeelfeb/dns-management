import mongoose from 'mongoose';

const PLATFORMS = ['windows', 'linux', 'android', 'ios', 'mac'];

const DeviceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    platform: { type: String, enum: PLATFORMS, required: true },
    token: { type: String, required: true, unique: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Device = mongoose.models.Device || mongoose.model('Device', DeviceSchema);
export default Device;
export { PLATFORMS };
