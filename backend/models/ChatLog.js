const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestInfo: {
    name: String,
    email: String,
    phone: String
  },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    tokens: Number
  }],
  language: { type: String, default: 'en' },
  appointmentBooked: { type: Boolean, default: false },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  totalTokensUsed: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, { timestamps: true });

chatLogSchema.index({ tenant: 1, sessionId: 1 });
chatLogSchema.index({ tenant: 1, createdAt: 1 });

module.exports = mongoose.model('ChatLog', chatLogSchema);
