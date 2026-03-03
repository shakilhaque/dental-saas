const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'view', 'status_change'],
    required: true
  },
  resource: { type: String, required: true }, // e.g., 'Patient', 'Appointment'
  resourceId: mongoose.Schema.Types.ObjectId,
  description: String,
  changes: mongoose.Schema.Types.Mixed, // before/after
  ipAddress: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failure'], default: 'success' }
}, { timestamps: true });

auditLogSchema.index({ tenant: 1, createdAt: -1 });
auditLogSchema.index({ tenant: 1, user: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
